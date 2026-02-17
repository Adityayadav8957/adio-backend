const dotenv = require('dotenv');

dotenv.config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
    console.warn("WARNING: UNSPLASH_ACCESS_KEY is not set in .env");
}

/**
 * Search Unsplash for an artist image
 * @param {string} query 
 */
async function getArtistImage(query) {
    if (!UNSPLASH_ACCESS_KEY) return null;

    const url = `https://api.unsplash.com/search/photos?page=1&query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });

        if (!response.ok) {
            console.error(`Unsplash API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].urls.regular; // Return high quality parsed URL
        }
        return null;
    } catch (error) {
        console.error("Unsplash Fetch Error:", error);
        return null;
    }
}

module.exports = {
    getArtistImage
};
