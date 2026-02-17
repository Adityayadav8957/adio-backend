

const logEvent = async (req, res) => {
    const { type, songId, metadata } = req.body;
    if (!type || !songId) return res.status(400).json({ error: "Missing event data" });

    try {
        const user = req.user;
        if (user) {
            // Log to MongoDB
            await require('../models/Event').create({
                user_id: user.id,
                type,
                song_id: songId,
                metadata: metadata || {}
            });
        }

        // Always return success to client
        res.status(200).json({ status: 'ok' });

    } catch (e) {
        console.error("Event Log Error:", e);
        res.status(500).json({ error: 'Failed to log event' });
    }
};

module.exports = {
    logEvent
};
