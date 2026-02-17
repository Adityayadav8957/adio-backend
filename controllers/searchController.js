const ytDlp = require('yt-dlp-exec');

const search = async (req, res) => {
    const q = req.query.q;
    const n = parseInt(req.query.n) || 15;

    if (!q) {
        return res.status(400).json({ error: "Missing query parameter 'q'" });
    }

    try {
        console.log(`Searching for: ${q}`);
        const output = await ytDlp(`ytsearch${n}:${q}`, {
            dumpSingleJson: true,
            noWarnings: true,
            flatPlaylist: true,
            skipDownload: true
        });

        const results = (output.entries || []).map(entry => ({
            id: entry.id,
            title: entry.title,
            author: entry.uploader || entry.channel || "Unknown Artist",
            duration: entry.duration || 0,
            thumb: entry.thumbnails ? entry.thumbnails[entry.thumbnails.length - 1].url : ""
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
