// Native fetch is available in Node 18+
const dotenv = require('dotenv');

dotenv.config();

const API_KEY = process.env.LASTFM_API_KEY;
const BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

if (!API_KEY) {
    console.warn("WARNING: LASTFM_API_KEY is not set in .env");
}

/**
 * Helper to make Last.fm API calls
 */
async function callLastFm(method, params = {}) {
    const queryParams = new URLSearchParams({
        method,
        api_key: API_KEY,
        format: 'json',
        ...params
    });

    const url = `${BASE_URL}?${queryParams.toString()}`;
    console.log(`[DEBUG] Calling Last.fm: ${url.replace(API_KEY, 'API_KEY')}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const text = await response.text();
            console.error(`Last.fm Error Body: ${text}`);
            throw new Error(`Last.fm API error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error calling Last.fm (${method}):`, error);
        throw error;
    }
}

/**
 * Get Top Tracks (Trending)
 * @param {number} limit 
 */
async function getTopTracks(limit = 10) {
    const data = await callLastFm('chart.gettoptracks', { limit });
    return data.tracks?.track || [];
}

/**
 * Get Tracks by Tag (Genre)
 * @param {string} tag 
 * @param {number} limit 
 */
async function getTopTracksByTag(tag, limit = 10) {
    const data = await callLastFm('tag.gettoptracks', { tag, limit });
    return data.tracks?.track || [];
}

/**
 * Get Top Albums
 * @param {number} limit 
 */
async function getTopAlbums(limit = 10) {
    // chart.gettopalbums is not available, using tag 'pop' as proxy
    const data = await callLastFm('tag.gettopalbums', { tag: 'pop', limit });
    return data.albums?.album || [];
}

/**
 * Get Top Artists by Tag
 * @param {string} tag 
 * @param {number} limit 
 */
async function getTopArtistsByTag(tag, limit = 10) {
    const data = await callLastFm('tag.gettopartists', { tag, limit });
    return data.topartists?.artist || [];
}

/**
 * Get Artist Info (for better images)
 * @param {string} artist 
 */
async function getArtistInfo(artist) {
    const data = await callLastFm('artist.getinfo', { artist });
    return data.artist || null;
}

/**
 * Get Similar Tracks
 * @param {string} artist
 * @param {string} track
 * @param {number} limit
 */
async function getSimilarTracks(artist, track, limit = 10) {
    const data = await callLastFm('track.getsimilar', { artist, track, limit });
    return data.similartracks?.track || [];
}

module.exports = {
    getTopTracks,
    getTopTracksByTag,
    getTopAlbums,
    getTopArtistsByTag,
    getArtistInfo,
    getSimilarTracks
};
