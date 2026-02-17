const ytDlp = require('yt-dlp-exec');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Cache for stream URLs to avoid re-fetching
const streamCache = new Map();
const CACHE_TTL = 3600 * 1000; // 1 hour

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
            format: 'bestaudio/best'
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

        // Cache it
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

const proxyAudio = async (req, res) => {
    const videoId = req.params.videoId;

    if (!videoId || videoId.length !== 11) {
        return res.status(400).json({ error: "Invalid video ID" });
    }

    try {
        // We need the stream URL first. We can call getStreamUrl logic internally or just fetch it.
        // Let's use the cache or fetch it.
        let streamUrl;
        if (streamCache.has(videoId) && streamCache.get(videoId).expires > Date.now()) {
            streamUrl = streamCache.get(videoId).data.url;
        } else {
            const output = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
                dumpSingleJson: true,
                noWarnings: true,
                skipDownload: true,
                format: 'bestaudio/best'
            });
            streamUrl = output.url;
            // Update cache while we are at it
            streamCache.set(videoId, {
                data: {
                    url: output.url,
                    title: output.title,
                    author: output.uploader,
                    duration: output.duration,
                    format: { ext: output.ext, acodec: output.acodec },
                    video_id: videoId
                },
                expires: Date.now() + CACHE_TTL
            });
        }

        const response = await fetch(streamUrl, {
            headers: {
                'Range': req.headers.range || '',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Copy key headers
        res.status(response.status);

        ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(header => {
            if (response.headers.get(header)) {
                res.setHeader(header, response.headers.get(header));
            }
        });

        // Pipe the response
        if (response.body && typeof response.body.pipe === 'function') {
            response.body.pipe(res);
        } else {
            // For node-fetch v3+ which uses Web Streams, we might need a different approach if not compatible with res.write
            // But valid node-fetch typically returns a body we can pipe or iterate.
            // If this is node-fetch v2, .body is a stream. 
            // Just in case, let's use standard stream piping.
            const arrayBuffer = await response.arrayBuffer();
            res.end(Buffer.from(arrayBuffer));
        }

    } catch (e) {
        console.error("Proxy Audio Controller Error", e);
        res.status(500).json({ error: 'Failed to proxy audio stream.' });
    }
};

module.exports = {
    getStreamUrl,
    proxyAudio
};
