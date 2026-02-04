# Anonymous FileShare & Chat

A MERN stack application for anonymous temporary rooms where users can chat and share files. Rooms expire automatically after 30 minutes.

## Features
- **Anonymous Chat**: Join rooms without login.
- **Custom Usernames**: Optional ability to change your display name.
- **File Sharing**: Share files/PDFs in real-time.
- **Auto-Expiry**: Rooms and data deleted after 30 minutes.
- **Responsive UI**: Built with React Bootstrap.

## Tech Stack
- **Frontend**: React, Vite, Bootstrap, Socket.io-client
- **Backend**: Node.js, Express, Socket.io, MongoDB (Mongoose), Multer, Cloudinary
- **Deployment**: Vercel (Frontend), Render/Oracle (Backend)

---

## 🚀 Deployment Guide (Choose One)

### Option 1: The Easy Way (Render + Vercel)
**No Linux knowledge required. Free.**

#### 1. File Storage Setup (Cloudinary)
Since Render (and most free hosts) delete your files when the server restarts, you need **Cloudinary** for file uploads.
1. Sign up at [Cloudinary](https://cloudinary.com/) (Free Plan).
2. Go to your Dashboard and copy:
   - `Cloud Name`
   - `API Key`
   - `API Secret`

#### 2. Deploy Backend (Render)
1. Push your code to GitHub.
2. Sign up at [Render.com](https://render.com/).
3. Click **New +** > **Web Service**.
4. Connect your GitHub repo.
5. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
6. **Environment Variables** (Add these):
   - `MONGODB_URI`: Your MongoDB connection string.
   - `CLOUDINARY_CLOUD_NAME`: (from step 1)
   - `CLOUDINARY_API_KEY`: (from step 1)
   - `CLOUDINARY_API_SECRET`: (from step 1)
7. Click **Deploy Web Service**.
8. Copy your Backend URL (e.g., `https://fileshare-backend.onrender.com`).

#### 3. Deploy Frontend (Vercel)
1. Sign up at [Vercel](https://vercel.com/).
2. Import your GitHub repo.
3. **Environment Variables**:
   - `VITE_API_URL`: Your Render Backend URL (e.g., `https://fileshare-backend.onrender.com`)
4. Click **Deploy**.

---

### Option 2: The "Pro" Way (Oracle Cloud VM)
**Run your own VPS. More control, slightly more complex.**

1. **Create VM**: Launch an Ubuntu VM on Oracle Cloud.
2. **Open Port**: Allow TCP traffic on port `5001`.
3. **Setup**:
   - SSH into VM.
   - Run `setup-oracle-vm.sh`.
   - Clone repo and `npm install` in `server`.
   - Create `.env` with `PORT=5001` and `MONGODB_URI`.
   - Run `pm2 start ecosystem.config.js`.
4. **Deploy Frontend**: Same as above (Vercel), but set `VITE_API_URL` to `http://YOUR_VM_IP:5001`.

---

## Local Development
1. Clone repo.
2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```
3. Create `.env` in `server/` (see `.env.example`).
4. Start dev servers:
   ```bash
   # Terminal 1 (Server)
   cd server && npm run dev

   # Terminal 2 (Client)
   cd client && npm run dev
   ```
