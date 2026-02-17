const History = require('../models/History');

const addToHistory = async (req, res) => {
    // User attached by middleware
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { songId, title, artist, genre, album, thumb, duration } = req.body;
    if (!songId || !title) return res.status(400).json({ error: "Missing required fields" });

    try {
        // Create history entry in MongoDB
        await History.create({
            user_id: user.id,
            song_id: songId,
            title,
            artist,
            genre,
            album,
            thumb,
            duration
        });

        res.json({ status: 'ok', saved: true });
    } catch (e) {
        console.error("History Error:", e);
        res.status(500).json({ error: 'Server error' });
    }
};

const getHistory = async (req, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
        const history = await History.find({ user_id: user.id })
            .sort({ played_at: -1 })
            .limit(50);

        res.json(history);
    } catch (e) {
        console.error("History Fetch Error:", e);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = {
    addToHistory,
    getHistory
};
