/*
const dotenv = require('dotenv');
dotenv.config();

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5001';

// Proxies a request to the Python backend.
// @param {string} endpoint - The API endpoint to call (e.g., '/api/search')
// @param {object} queryParams - Query parameters to append
// @returns {Promise<{data: any, status: number}>} Response data and status

async function proxyToPython(endpoint, queryParams = {}) {
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${PYTHON_API_URL}${endpoint}${queryString ? '?' + queryString : ''}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return { data, status: response.status };
    } catch (error) {
        console.error(`Error proxying to Python (${url}): ${error.message}`);
        throw error;
    }
}

module.exports = {
    proxyToPython,
    PYTHON_API_URL
};
*/
