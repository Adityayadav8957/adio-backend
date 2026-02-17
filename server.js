const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes/index');

dotenv.config();

const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Start Cron Jobs (Daily Cache)
const cronService = require('./services/cronService');
cronService.initCron();

// Start Server
app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║     Music App Server (Node.js MVC)    ║`);
    console.log(`╚════════════════════════════════════════╝`);
    console.log(`\n→ Node.js API: http://localhost:${PORT}`);
});
