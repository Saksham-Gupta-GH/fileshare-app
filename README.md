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
- **Backend**: Node.js, Express, Socket.io, MongoDB (Mongoose), Multer
- **Deployment**: Vercel (Frontend), Oracle Cloud (Backend)

---

## 🚀 Deployment Guide (24/7 Live)

### Prerequisites
- GitHub Account: [Saksham-Gupta-GH](https://github.com/Saksham-Gupta-GH)
- Oracle Cloud Account (for Backend VM)
- Vercel Account (for Frontend)
- MongoDB Connection String (Atlas)

### Step 1: Push to GitHub
1. Create a new repository on GitHub named `fileshare-app` (or similar).
2. Run the following commands in your local terminal:
   ```bash
   git remote add origin https://github.com/Saksham-Gupta-GH/fileshare-app.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy Backend (Oracle Cloud)
1. **Create a VM Instance**:
   - Log in to Oracle Cloud Console.
   - Create a Compute Instance (Ubuntu 22.04 or 20.04).
   - Save your SSH key.
   - **Important**: In the VCN Security List, add an Ingress Rule to allow TCP traffic on port `5001`.

2. **Connect to VM**:
   ```bash
   ssh -i /path/to/your/key.key ubuntu@YOUR_VM_PUBLIC_IP
   ```

3. **Setup Server**:
   - Copy the contents of `setup-oracle-vm.sh` from this repo or run the commands manually.
   - Clone your repo:
     ```bash
     git clone https://github.com/Saksham-Gupta-GH/fileshare-app.git
     cd fileshare-app/server
     npm install
     ```

4. **Configure Environment**:
   - Create a `.env` file:
     ```bash
     nano .env
     ```
   - Paste your MongoDB URI and Port:
     ```
     PORT=5001
     MONGODB_URI=your_mongodb_connection_string_here
     ```
   - Save and exit (`Ctrl+X`, `Y`, `Enter`).

5. **Start with PM2 (24/7)**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```
   - Your backend is now live at `http://YOUR_VM_PUBLIC_IP:5001`.

### Step 3: Deploy Frontend (Vercel)
1. **Configure Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com).
   - Click **Add New > Project**.
   - Import your `fileshare-app` repository.

2. **Environment Variables**:
   - In the Vercel project settings, add a new Environment Variable:
     - **Name**: `VITE_API_URL`
     - **Value**: `http://YOUR_VM_PUBLIC_IP:5001` (Replace with your Oracle VM IP)
     
     *Note: If you later add a custom domain with SSL to your backend, change this to `https://...`.*

3. **Deploy**:
   - Click **Deploy**.
   - Vercel will build your React app and provide a live URL (e.g., `https://fileshare-app.vercel.app`).

### Step 4: Final Check
- Open your Vercel URL.
- Try creating a room. If it connects, your socket server is working!

---

## Local Development
1. Clone repo.
2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```
3. Start dev server:
   ```bash
   npm start
   ```
