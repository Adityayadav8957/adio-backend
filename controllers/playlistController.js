const Playlist = require('../models/Playlist');

const getPlaylists = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const playlists = await Playlist.find({ user_id: user.id })
            .sort({ created_at: -1 });

        // Map _id to id for frontend compatibility
        const formattedPlaylists = playlists.map(p => ({
            ...p.toObject(),
            id: p._id
        }));

        res.json(formattedPlaylists);
    } catch (e) {
        console.error("Get Playlists Error", e);
        res.status(500).json({ error: e.message });
    }
};

const createPlaylist = async (req, res) => {
    let { name } = req.body;

    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        // If no name, generate "My Playlist #N"
        if (!name) {
            const count = await Playlist.countDocuments({ user_id: user.id });
            name = `My Playlist #${count + 1}`;
        }

        const newPlaylist = await Playlist.create({
            user_id: user.id,
            name,
            songs: []
        });

        res.json({
            ...newPlaylist.toObject(),
            id: newPlaylist._id
        });
    } catch (e) {
        console.error("Create Playlist Error", e);
        res.status(500).json({ error: e.message });
    }
};

module.exports = {
    getPlaylists,
    createPlaylist
};
