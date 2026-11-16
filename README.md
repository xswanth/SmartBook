# SmartBook

Online appointment booking system built with React, Node.js/Express, and Supabase.

## Setup & Run

1. **Clone the repository**
   git clone https://github.com/xswanth/SmartBook.git
   cd SmartBook

2. **Start the Backend (Terminal 1)**
   cd server
   npm install
   Create a `.env` file inside `server/` with the keys shared with you:
   PORT=5000
   SUPABASE_URL=https://yiewntxydsvzayeaunup.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   Run the server:
   npx nodemon server.js

3. **Start the Frontend (Terminal 2)**
   cd client
   npm install
   npm run dev

4. **Open in Browser**
   Go to http://localhost:5173
