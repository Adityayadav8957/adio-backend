const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');

const searchController = require('../controllers/searchController');
const streamController = require('../controllers/streamController');
const playlistController = require('../controllers/playlistController');
const eventController = require('../controllers/eventController');
const recommendationController = require('../controllers/recommendationController');
const browseController = require('../controllers/browseController');
const historyController = require('../controllers/historyController');

const userController = require('../controllers/userController');

// Search
router.get('/search', searchController.search);

// User Profile (Immediate Sync)
router.get('/me', requireAuth, userController.getMe);

// Setup Stream
router.get('/stream/:videoId', streamController.getStreamUrl);

// Proxy Audio
router.get('/proxy-audio/:videoId', streamController.proxyAudio);

// Playlists
router.get('/playlists', requireAuth, playlistController.getPlaylists);
router.post('/playlists', requireAuth, playlistController.createPlaylist);

// Browse (New Releases & Artists) - REMOVED SPOTIFY
// const browseController = require('../controllers/browseController');
// router.get('/browse/new-releases', browseController.getNewReleases);
// router.get('/browse/artist/:id/albums', browseController.getArtistAlbums);

// Recommendations
// router.get('/recommend/spotify', recommendationController.getSpotifyRecommendations);
router.get('/next/:videoId', recommendationController.getNextSong);

// Events
router.post('/events', requireAuth, eventController.logEvent);

// Status
router.get('/status', async (req, res) => {
    res.json({
        status: 'ok',
        server: 'node-js-native',
        yt_dlp: 'enabled'
    });
});

// History
router.post('/history', requireAuth, historyController.addToHistory);
router.get('/history', requireAuth, historyController.getHistory);

// Browse / Last.fm
router.get('/browse/trending', browseController.getTrending);
router.get('/browse/genre/:genre', browseController.getByGenre);
router.get('/browse/genre/:genre', browseController.getByGenre);
router.get('/browse/artists', browseController.getTopArtists);
router.get('/browse/albums', browseController.getPopularAlbums);
router.get('/browse/similar', browseController.getSimilarTracks);

module.exports = router;
