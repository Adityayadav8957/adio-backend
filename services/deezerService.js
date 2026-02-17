/**
 * Helper to fetch artist image from Deezer
 * @param {string} artistName 
 */
async function getArtistImage(artistName) {
    try {
        const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}`;
        const response = await fetch(url);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            // Return the best available image (XL > Big > Medium)
            const artist = data.data[0];
            return artist.picture_xl || artist.picture_big || artist.picture_medium || artist.picture;
        }

        return null;
    } catch (error) {
        console.error("Deezer API Error:", error);
        return null;
    }
}

module.exports = {
    getArtistImage
};
