# SmartBook

A website to book and manage appointments online.

## How to Run This Project on Your Computer

**Before you start:** Make sure **Node.js** and **Git** are installed on your laptop.

### Step 1: Download the Project
Open your terminal (or Command Prompt / VS Code Terminal) and run these two commands:
git clone https://github.com/xswanth/SmartBook.git
cd SmartBook

### Step 2: Start the Backend (Server)
1. Go into the server folder and install required packages:
   cd server
   npm install

2. Inside the `server` folder, create a new file named `.env` and paste the secret keys sent to you on WhatsApp/chat:
   PORT=5000
   SUPABASE_URL=https://yiewntxydsvzayeaunup.supabase.co
   SUPABASE_ANON_KEY=paste_key_here
   SUPABASE_SERVICE_ROLE_KEY=paste_key_here

3. Start the server (keep this terminal open):
   npx nodemon server.js

### Step 3: Start the Frontend (Website)
1. Open a **second** terminal window, go to the main `SmartBook` folder, then run:
   cd client
   npm install
   npm run dev

2. Hold `Ctrl` and click the `http://localhost:5173` link shown in the terminal (or open it in your browser).
