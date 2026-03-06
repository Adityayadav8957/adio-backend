const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes/index');
const { execSync } = require('child_process');

try {
    console.log('[yt-dlp] Checking for updates...');
    execSync(`${__dirname}/node_modules/yt-dlp-exec/bin/yt-dlp -U`, { stdio: 'pipe' });
    console.log('[yt-dlp] Up to date.');
} catch (e) {
    console.warn('[yt-dlp] Auto-update failed (non-fatal):', e.message);
}

dotenv.config();

const connectDB = require('./config/db');

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    'http://localhost:5174',
    'http://localhost:5173',
    'https://adio.adityayadav.site',
    'https://adio-frontend.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
})); app.use(express.json());

app.use('/api', routes);

const cronService = require('./services/cronService');
cronService.initCron();

app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║     Music App Server (Node.js MVC)    ║`);
    console.log(`╚════════════════════════════════════════╝`);
    console.log(`\n→ Node.js API: http://localhost:${PORT}`);
});
