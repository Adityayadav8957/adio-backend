const ytDlp = require('yt-dlp-exec');

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
            const info = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
                dumpSingleJson: true,
                noWarnings: true,
                skipDownload: true
            });
            ctxTitle = info.title;
            ctxAuthor = info.uploader;
            metaCache.set(videoId, { title: ctxTitle, author: ctxAuthor });
        }

        // 2. Search for a similar song
        // Query: "Song Title Artist similar songs"
        const searchQuery = `${ctxTitle} ${ctxAuthor} similar songs`;
        console.log(`[Rec] Searching: ${searchQuery}`);

        const output = await ytDlp(`ytsearch5:${searchQuery}`, {
            dumpSingleJson: true,
            noWarnings: true,
            flatPlaylist: true,
            skipDownload: true
        });

        const entries = output.entries || [];
        let nextVid = null;

        // Find first video that ISN'T the current one
        for (const entry of entries) {
            if (entry.id && entry.id !== videoId) {
                nextVid = entry;
                break;
            }
        }

        if (!nextVid) {
            return res.status(404).json({ error: "No recommendation found" });
        }

        res.json({
            id: nextVid.id,
            title: nextVid.title,
            author: nextVid.uploader || nextVid.channel,
            duration: nextVid.duration,
            thumb: nextVid.thumbnails ? nextVid.thumbnails[nextVid.thumbnails.length - 1].url : "",
            source: "yt-dlp-node"
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
