const lastFmService = require('./lastFmService');
const pythonService = require('./pythonService');

// Run async tasks with a max concurrency limit (prevent overwhelming the Python service)
async function runWithLimit(tasks, limit = 3) {
    const results = new Array(tasks.length);
    let index = 0;
    async function worker() {
        while (index < tasks.length) {
            const i = index++;
            results[i] = await tasks[i]();
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
    return results;
}

// Search YouTube via the Python microservice
async function searchYouTube(query) {
    try {
        return await pythonService.searchYouTube(query);
    } catch {
        return null;
    }
}

const fetchAndResolveByGenre = async (genre, limit = 10) => {
    try {
        const tracks = await lastFmService.getTopTracksByTag(genre, limit);

        const tasks = tracks.map(track => () => {
            const query = `${track.name} ${track.artist.name} audio`;
            return searchYouTube(query);
        });

        const results = await runWithLimit(tasks, 3);
        return results.filter(r => r !== null);
    } catch (e) {
        console.error(`Music Service Error (${genre}):`, e);
        return [];
    }
};

module.exports = { searchYouTube, fetchAndResolveByGenre };
