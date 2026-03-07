const { Readable } = require('stream');
const pythonService = require('../services/pythonService');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// In-memory URL cache (capped at MAX_CACHE_SIZE entries, 1hr TTL)
const streamCache = new Map();
const CACHE_TTL = 3600 * 1000;
const MAX_CACHE_SIZE = 50;

// Helper: get stream data from cache or Python service
async function getCachedStreamData(videoId) {
    if (streamCache.has(videoId)) {
        const cached = streamCache.get(videoId);
        if (cached.expires > Date.now()) return cached.data;
        streamCache.delete(videoId);
    }
    const result = await pythonService.getStreamUrl(videoId);
    if (streamCache.size >= MAX_CACHE_SIZE) {
        streamCache.delete(streamCache.keys().next().value);
    }
    streamCache.set(videoId, { data: result, expires: Date.now() + CACHE_TTL });
    return result;
}

// Returns metadata + URL (used internally / for debugging)
const getStreamUrl = async (req, res) => {
    const { videoId } = req.params;
    if (!videoId || videoId.length !== 11) {
        return res.status(400).json({ error: "Invalid video ID" });
    }
    try {
        const result = await getCachedStreamData(videoId);
        res.json(result);
    } catch (e) {
        console.error("Stream Controller Error", e.message);
        res.status(500).json({ error: 'Failed to get stream.', details: e.message });
    }
};

// Proxies audio through the Python service.
// Python extracts the URL and fetches audio FROM THE SAME IP in one step,
// avoiding YouTube's signed URL IP-lock that causes 403 when the browser fetches directly.
const proxyAudio = async (req, res) => {
    const { videoId } = req.params;
    if (!videoId || videoId.length !== 11) {
        return res.status(400).json({ error: "Invalid video ID" });
    }

    try {
        console.log(`[Proxy] Streaming ${videoId} via Python`);
        const ytRes = await pythonService.streamAudio(videoId, req.headers.range);
        console.log(`[Proxy] Python returned status: ${ytRes.status}`);

        res.status(ytRes.status);
        for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
            const v = ytRes.headers.get(h);
            if (v) res.setHeader(h, v);
        }

        if (ytRes.body) {
            ytRes.body.pipe(res);
        } else {
            console.log(`[Proxy] No body from Python`);
            res.end();
        }
    } catch (e) {
        console.error("Proxy Audio Error", e.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to proxy audio.' });
        }
    }
};

module.exports = { getStreamUrl, proxyAudio };
