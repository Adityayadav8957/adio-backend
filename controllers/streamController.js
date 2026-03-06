const ytDlp = require('yt-dlp-exec');

// Cache for stream URLs to avoid re-fetching
// Capped at MAX_CACHE_SIZE to prevent unbounded memory growth.
const streamCache = new Map();
const CACHE_TTL = 3600 * 1000; // 1 hour
const MAX_CACHE_SIZE = 50;

const getStreamUrl = async (req, res) => {
    const videoId = req.params.videoId;

    if (!videoId || videoId.length !== 11) {
        return res.status(400).json({ error: "Invalid video ID" });
    }

    // Check cache
    if (streamCache.has(videoId)) {
        const cached = streamCache.get(videoId);
        if (cached.expires > Date.now()) {
            console.log(`[CACHE HIT] ${videoId}`);
            return res.json(cached.data);
        } else {
            streamCache.delete(videoId);
        }
    }

    try {
        console.log(`[yt-dlp] Extracting: https://www.youtube.com/watch?v=${videoId}`);
        const output = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
            dumpSingleJson: true,
            noWarnings: true,
            skipDownload: true,
            format: 'bestaudio/best',
            // Use Android client to bypass YouTube bot-detection (no cookies needed)
            extractorArgs: 'youtube:player_client=android'
        });

        const result = {
            url: output.url,
            title: output.title,
            author: output.uploader || output.channel,
            duration: output.duration,
            format: {
                ext: output.ext,
                acodec: output.acodec,
                abr: output.abr
            },
            video_id: videoId
        };

        // Evict the oldest entry if we hit the size cap
        if (streamCache.size >= MAX_CACHE_SIZE) {
            const oldestKey = streamCache.keys().next().value;
            streamCache.delete(oldestKey);
        }

        streamCache.set(videoId, {
            data: result,
            expires: Date.now() + CACHE_TTL
        });

        res.json(result);

    } catch (e) {
        console.error("Stream Controller Error", e);
        res.status(500).json({
            error: 'Failed to get stream.',
            details: e.message
        });
    }
};

// NOTE: proxyAudio has been removed.
// The frontend receives the direct YouTube CDN URL from getStreamUrl and plays it
// natively via <audio src={url}> — no audio data ever flows through this server.

module.exports = {
    getStreamUrl
};
