const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

async function getStreamUrl(videoId) {
    const res = await fetch(`${PYTHON_API_URL}/stream?video_id=${videoId}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Python service error ${res.status}`);
    }
    return res.json();
}

async function searchYouTube(query) {
    const res = await fetch(`${PYTHON_API_URL}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    return res.json().catch(() => null);
}

// Returns a raw node-fetch Response for the audio stream.
// Python handles: URL extraction + fetch in one step from the same IP.
async function streamAudio(videoId, rangeHeader) {
    const url = `${PYTHON_API_URL}/stream-audio?video_id=${videoId}`;
    const headers = {};
    if (rangeHeader) headers['range'] = rangeHeader;
    return fetch(url, { headers });
}

module.exports = { getStreamUrl, searchYouTube, streamAudio };
