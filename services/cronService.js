const cron = require('node-cron');
const musicDataService = require('./musicDataService');
const DailyTrend = require('../models/DailyTrend');

const GENRES_TO_CACHE = [
    'bollywood', 'punjabi', 'hindi'
];

const updateDailyCache = async () => {
    console.log("Running Daily Cache Update...");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    console.log(`Updating cache for date: ${today.toISOString().split('T')[0]}`);

    for (const genre of GENRES_TO_CACHE) {
        try {
            // Check if we already have data for today to avoid re-fetching early on restart
            const existing = await DailyTrend.findOne({ genre, trend_date: today });
            if (existing) {
                console.log(`[${genre}] Cache already exists for today. Skipping.`);
                continue;
            }

            console.log(`[${genre}] Fetching fresh data from Last.fm & Resolving on YT...`);
            const tracks = await musicDataService.fetchAndResolveByGenre(genre, 10);

            console.log(`[${genre}] Fetched ${tracks.length} tracks.`);

            if (tracks.length > 0) {
                console.log(`[${genre}] Attempting to upsert into MongoDB...`);

                await DailyTrend.findOneAndUpdate(
                    { genre: genre, trend_date: today },
                    {
                        genre,
                        trend_date: today,
                        metadata: { tracks: tracks },
                        created_at: new Date()
                    },
                    { upsert: true, returnDocument: 'after' }
                );

                console.log(`[${genre}] Successfully cached!`);
            } else {
                console.warn(`[${genre}] No tracks found to cache.`);
            }
        } catch (e) {
            console.error(`[${genre}] Error in update process:`, e);
        }
    }
    console.log("Daily Cache Update Cycle Complete.");
};

const initCron = () => {
    // Schedule task to run at 00:00 (Midnight) every day
    cron.schedule('0 0 * * *', () => {
        updateDailyCache();
    });

    // Also run immediately on startup if cache is missing (optional, but good for dev)
    // For now, we just log initialization
    console.log("Cron Service Initialized (Schedule: 0 0 * * *)");
};

// Exposed for manual triggering if needed
module.exports = {
    initCron: () => {
        // Schedule task to run at 00:00 (Midnight) every day
        cron.schedule('0 0 * * *', () => {
            updateDailyCache();
        });

        // Run immediately on startup to populate cache if missing
        console.log("Initializing Cron Service... Running immediate cache update.");
        updateDailyCache();
    },
    updateDailyCache
};
