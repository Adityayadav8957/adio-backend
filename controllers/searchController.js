const pythonService = require('../services/pythonService');

const search = async (req, res) => {
    const q = req.query.q;

    if (!q) {
        return res.status(400).json({ error: "Missing query parameter 'q'" });
    }

    try {
        console.log(`Searching for: ${q}`);
        // Python service is currently hardcoded to return 1 item via ytsearch1:
        // but we'll adapt the frontend/backend to accept the array format.
        const output = await pythonService.searchYouTube(q);

        if (!output) {
            return res.json({ results: [], query: q });
        }

        // Support both old single object payloads and new array payloads from Python microservice
        const dataArray = Array.isArray(output) ? output : [output];

        const results = dataArray.map(item => ({
            id: item.id,
            title: item.title,
            author: item.author,
            duration: item.duration,
            thumb: item.thumb
        })).filter(item => item.id && item.duration > 30 && item.duration < 900); // Filter shorts/long mixes

        res.json({ results, query: q });

    } catch (e) {
        console.error("Search Controller Error", e);
        res.status(500).json({
            error: 'Failed to search.',
            details: e.message
        });
    }
};

module.exports = {
    search
};
