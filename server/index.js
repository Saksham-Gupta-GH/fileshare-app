const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const Room = require('./models/Room');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all for now
    methods: ['GET', 'POST']
  }
});

// Cleanup endpoint for cron-job.org: deletes expired rooms and associated files
app.get('/cleanup', async (req, res) => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  try {
    const expiredRooms = await Room.find({ createdAt: { $lt: thirtyMinutesAgo } });
    for (const room of expiredRooms) {
      for (const msg of room.messages) {
        if (msg.type === 'file' && msg.content) {
          try {
            if (isCloudStorage && msg.content.includes('/fileshare-uploads/')) {
              const urlParts = msg.content.split('/');
              const filename = urlParts[urlParts.length - 1];
              const publicId = `fileshare-uploads/${filename.replace(/\.[^/.]+$/, '')}`;
              await cloudinary.uploader.destroy(publicId);
            } else {
              const filePath = path.join(__dirname, 'uploads', path.basename(msg.content));
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
          } catch (e) {
            // swallow deletion errors, continue
          }
        }
      }
      await Room.deleteOne({ _id: room._id });
    }
    res.json({ cleaned: expiredRooms.length });
  } catch (e) {
    res.status(500).json({ error: 'cleanup failed' });
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React Frontend (Production)
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      !req.path.startsWith('/api') &&
      !req.path.startsWith('/uploads')
    ) {
      return res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
    next();
  });
}

// Storage Configuration
let storage;
let isCloudStorage = false;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  // Cloudinary Storage (for Render/Heroku/Vercel)
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const ext = path.extname(file.originalname).slice(1).toLowerCase();
      const isImage = file.mimetype && file.mimetype.startsWith('image/');
      return {
        folder: 'fileshare-uploads',
        resource_type: isImage ? 'image' : 'raw',
        use_filename: true,
        unique_filename: false,
        format: isImage ? undefined : ext
      };
    },
  });
  isCloudStorage = true;
  console.log('Using Cloudinary Storage');
} else {
  // Local Disk Storage (for Development/VPS)
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
      // Sanitize filename to avoid issues
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
  console.log('Using Local Disk Storage');
}

const upload = multer({ storage });

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fileshare')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Keep-Alive Endpoint (for cron-job.org or similar)
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Routes
// Create Room
app.post('/api/create-room', async (req, res) => {
  try {
    // Generate 6-char random ID
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = new Room({ roomId });
    await room.save();
    res.json({ roomId });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Check Room / Get History
app.get('/api/room/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found or expired' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload File
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Determine URL based on storage type
  let fileUrl;
  if (isCloudStorage) {
    fileUrl = req.file.path || req.file.secure_url;
  } else {
    fileUrl = `/uploads/${req.file.filename}`; // Local static path
  }

  const fileData = {
    url: fileUrl,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size
  };
  res.json(fileData);
});

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', async (data) => {
    // data: { roomId, type, content, senderId, senderName, ... }
    const { roomId, type, content, originalName, mimeType, size, senderId, senderName } = data;
    
    try {
      const room = await Room.findOne({ roomId });
      if (room) {
        const message = {
          type,
          content, // Text or File URL
          originalName,
          mimeType,
          size,
          senderId,
          senderName,
          createdAt: new Date()
        };
        room.messages.push(message);
        await room.save();
        
        // Broadcast to room
        io.to(roomId).emit('receive-message', message);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// No fallback when build doesn't exist; API routes above handle responses

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
