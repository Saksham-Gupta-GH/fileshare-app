const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Sanitize filename to avoid issues
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fileshare')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

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
  const fileData = {
    url: `/uploads/${req.file.filename}`,
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
