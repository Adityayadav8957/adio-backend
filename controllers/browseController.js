const lastFmService = require('../services/lastFmService');
const musicDataService = require('../services/musicDataService');
const DailyTrend = require('../models/DailyTrend');

const getTrending = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Try 'charts' from CACHE
        const cachedTrend = await DailyTrend.findOne({
            genre: 'charts',
            trend_date: { $gte: today }
        });

        if (cachedTrend && cachedTrend.metadata && cachedTrend.metadata.tracks) {
            console.log(`Serving Trending (charts) from cache.`);
            return res.json({ title: "Trending Now", results: cachedTrend.metadata.tracks.slice(0, limit) });
        }

        // 2. Fallback to Live Fetch
        console.log(`Cache miss for Trending (or DB unavailable). Fetching live...`);
        const tracks = await lastFmService.getTopTracks(limit);

        // Parallel search on YouTube
        const searchPromises = tracks.map(track => {
            const query = `${track.name} ${track.artist.name} audio`;
            return musicDataService.searchYouTube(query);
        });

        const results = await Promise.all(searchPromises);
        // Filter out failed searches
        const playableResults = results.filter(r => r !== null);

        res.json({ title: "Trending Now", results: playableResults });
    } catch (e) {
        console.error("Trending Error:", e);
        res.status(500).json({ error: 'Failed to fetch trending music' });
    }
};

const getByGenre = async (req, res) => {
    try {
        const { genre } = req.params;
        const limit = req.query.limit || 10;
        const normalizeGenre = genre.toLowerCase(); // Ensure lowercase for cache lookup

        // 1. Try fetching from CACHE first (MongoDB)
        // We match by genre and find the latest trend entry for today (or recent)
        // Simplified: just find latest for this genre
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cachedTrend = await DailyTrend.findOne({
            genre: normalizeGenre,
            trend_date: { $gte: today }
        });

        if (cachedTrend && cachedTrend.metadata && cachedTrend.metadata.tracks) {
            console.log(`Serving ${normalizeGenre} from cache.`);
            return res.json({ title: `Top ${genre.toUpperCase()}`, results: cachedTrend.metadata.tracks.slice(0, limit) });
        }

        // 2. Fallback to Live Fetch
        console.log(`Cache miss for ${normalizeGenre} (or DB unavailable). Fetching live...`);
        // Use original genre for Last.fm fetch as it might handle casing differently or we just pass it eagerly
        const playableResults = await musicDataService.fetchAndResolveByGenre(normalizeGenre, limit);

        res.json({ title: `Top ${genre.toUpperCase()}`, results: playableResults });

        // Optional: Trigger background cache update if missed?
        // For now, we rely on Cron, but we could also upsert here.

    } catch (e) {
        console.error("Genre Error:", e);
        res.status(500).json({ error: `Failed to fetch ${req.params.genre} music` });
    }
};

const getPopularAlbums = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const albums = await lastFmService.getTopAlbums(limit);

        // Map to simplified format
        const mappedAlbums = albums.map(album => ({
            name: album.name,
            artist: album.artist.name,
            thumb: album.image ? album.image[2]['#text'] : '', // Large image
            url: album.url
        }));

        res.json({ title: "Popular Albums", results: mappedAlbums });

    } catch (e) {
        console.error("Album Error:", e);
        res.status(500).json({ error: 'Failed to fetch popular albums' });
    }
};


const deezerService = require('../services/deezerService');

const getTopArtists = async (req, res) => {
    try {
        const tag = req.query.tag || 'bollywood';
        const limit = req.query.limit || 10;
        const artists = await lastFmService.getTopArtistsByTag(tag, limit);

        // Fetch high-quality images from Deezer in parallel
        const artistPromises = artists.map(async (artist) => {
            let thumb = '';

            // Try Deezer API
            const deezerImage = await deezerService.getArtistImage(artist.name);

            if (deezerImage) {
                thumb = deezerImage;
            } else {
                // Fallback to Last.fm default if Deezer fails
                thumb = artist.image ? artist.image[2]['#text'] : '';
            }

            return {
                name: artist.name,
                thumb: thumb,
                url: artist.url
            };
        });

        const mappedArtists = await Promise.all(artistPromises);

        res.json({ title: `Top ${tag} Artists`, results: mappedArtists });
    } catch (e) {
        console.error("Artist Error:", e);
        res.status(500).json({ error: 'Failed to fetch top artists' });
    }
};

const getSimilarTracks = async (req, res) => {
    try {
        const { artist, track } = req.query;
        const limit = req.query.limit || 5; // Default to 5 to keep it fast

        if (!artist || !track) {
            return res.status(400).json({ error: 'Artist and track are required' });
        }

        const tracks = await lastFmService.getSimilarTracks(artist, track, 10); // Fetch more from Last.fm, resolve top N

        // Sliced to requested limit for resolution
        const tracksToResolve = tracks.slice(0, limit);

        // Parallel resolution
        const resolvePromises = tracksToResolve.map(track => {
            const query = `${track.name} ${track.artist.name} audio`;
            return musicDataService.searchYouTube(query);
        });

        const resolvedTracks = await Promise.all(resolvePromises);
        const playableTracks = resolvedTracks.filter(t => t !== null);

        res.json({ title: "Similar Songs", results: playableTracks });
    } catch (e) {
        console.error("Similar Tracks Error:", e);
        res.status(500).json({ error: 'Failed to fetch similar tracks' });
    }
};

module.exports = {
    getTrending,
    getByGenre,
    getPopularAlbums,
    getTopArtists,
    getSimilarTracks
};
