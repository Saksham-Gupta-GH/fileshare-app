# Anonymous Fileshare Platform

A MERN stack application for anonymous text and file sharing in temporary rooms.

## Features
- Create temporary rooms (expire in 30 minutes).
- Join existing rooms via code.
- Anonymous real-time chat.
- File sharing (support for PDFs, images, etc.).
- Google-like clean interface.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS.
- **Backend**: Node.js, Express, Socket.io, Multer.
- **Database**: MongoDB (with TTL for expiration).

## Setup & Run Locally

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Environment Setup**
   - Go to `server/.env` and update `MONGODB_URI` with your connection string.
   - Default is `mongodb://localhost:27017/fileshare`.

3. **Run Application**
   ```bash
   npm start
   ```
   - Client: http://localhost:5173
   - Server: http://localhost:5001

## Deployment Guide

### Frontend (Vercel)
1. Push to GitHub.
2. Import project in Vercel.
3. Set Root Directory to `client`.
4. Deploy.

### Backend (Oracle Cloud)
1. Provision a VM instance.
2. Install Node.js and Git.
3. Clone repository.
4. Navigate to `server` directory.
5. Create `.env` file with `MONGODB_URI` and `PORT`.
6. Use PM2 to run the server:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "fileshare-server"
   ```
7. Open the port (default 5001) in Oracle Cloud Security List.
