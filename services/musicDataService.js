const lastFmService = require('./lastFmService');
const YTDlpWrap = require('yt-dlp-exec');

// Run async tasks with a max concurrency limit.
// This prevents spawning too many yt-dlp child processes simultaneously
// which would crash a low-memory server (e.g. Render 512 MB).
async function runWithLimit(tasks, limit = 2) {
    const results = new Array(tasks.length);
    let index = 0;

    async function worker() {
        while (index < tasks.length) {
            const i = index++;
            results[i] = await tasks[i]();
        }
    }

    // Start `limit` workers in parallel
    const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

// Helper to search YouTube for a single query (returns simplified object)
async function searchYouTube(query) {
    try {
        const result = await YTDlpWrap(query, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
            defaultSearch: 'ytsearch1',
            // Use Android client to bypass YouTube bot-detection
            extractorArgs: 'youtube:player_client=android'
        });

        const video = result.entries ? result.entries[0] : result;

        if (!video) return null;

        return {
            id: video.id,
            title: video.title,
            author: video.uploader || video.channel || "Unknown",
            duration: video.duration,
            thumb: video.thumbnail || (video.thumbnails && video.thumbnails[0]?.url) || "",
        };
    } catch (error) {
        // console.warn(`Failed to search for "${query}":`, error.message);
        return null;
    }
}

const fetchAndResolveByGenre = async (genre, limit = 10) => {
    try {
        const tracks = await lastFmService.getTopTracksByTag(genre, limit);

        // Build lazy tasks (functions) so we control when each yt-dlp process starts
        const tasks = tracks.map(track => () => {
            const query = `${track.name} ${track.artist.name} audio`;
            return searchYouTube(query);
        });

        // Run max 2 yt-dlp processes at a time instead of all at once
        const results = await runWithLimit(tasks, 2);
        return results.filter(r => r !== null);
    } catch (e) {
        console.error(`Music Service Error (${genre}):`, e);
        return [];
    }
};

module.exports = {
    searchYouTube,
    fetchAndResolveByGenre
};
