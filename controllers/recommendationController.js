const pythonService = require('../services/pythonService');

// Simple cache for video metadata to avoid re-fetching for recommendations
const metaCache = new Map();

const getNextSong = async (req, res) => {
    const videoId = req.params.videoId;

    if (!videoId) {
        return res.status(400).json({ error: "Missing video ID" });
    }

    try {
        // 1. Get info of current video to know what to search for
        let ctxTitle = "";
        let ctxAuthor = "";

        // Try to get from cache or fetch
        if (metaCache.has(videoId)) {
            const cached = metaCache.get(videoId);
            ctxTitle = cached.title;
            ctxAuthor = cached.author;
        } else {
            const info = await pythonService.getStreamUrl(videoId);
            ctxTitle = info.title;
            ctxAuthor = info.author;
            metaCache.set(videoId, { title: ctxTitle, author: ctxAuthor });
        }

        // 2. Search for a similar song
        // Query: "Song Title Artist similar songs"
        const searchQuery = `${ctxTitle} ${ctxAuthor} similar songs`;
        console.log(`[Rec] Searching: ${searchQuery}`);

        const nextVid = await pythonService.searchYouTube(searchQuery);

        if (!nextVid || nextVid.id === videoId) {
            return res.status(404).json({ error: "No recommendation found" });
        }

        res.json({
            id: nextVid.id,
            title: nextVid.title,
            author: nextVid.author,
            duration: nextVid.duration,
            thumb: nextVid.thumb,
            source: "python-microservice"
        });

    } catch (e) {
        console.error("Recommendation Error", e);
        res.status(500).json({ error: e.message });
    }
};

module.exports = {
    getNextSong,
    // Keep this for now if routes still reference it, but it should be dead code
    getSpotifyRecommendations: (req, res) => res.status(410).json({ error: "Spotify recommendations removed" })
};
