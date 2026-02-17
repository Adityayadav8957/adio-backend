const lastFmService = require('./lastFmService');
const YTDlpWrap = require('yt-dlp-exec');

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
            defaultSearch: 'ytsearch1' // Get top 1 result
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

        const searchPromises = tracks.map(track => {
            const query = `${track.name} ${track.artist.name} audio`;
            return searchYouTube(query);
        });

        const results = await Promise.all(searchPromises);
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
