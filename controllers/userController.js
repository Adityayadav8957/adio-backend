const User = require('../models/User');

const getMe = async (req, res) => {
    // User is already attached by authMiddleware
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    res.json(req.user);
};

module.exports = {
    getMe
};
