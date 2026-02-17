const mongoose = require('mongoose');

const PlaylistItemSchema = new mongoose.Schema({
    id: { type: String, required: true }, // YouTube ID
    title: { type: String, required: true },
    author: { type: String },
    duration: { type: String },
    thumbnail: { type: String },
    added_at: { type: Date, default: Date.now }
});

const PlaylistSchema = new mongoose.Schema({
    user_id: { type: String, required: true, ref: 'User' },
    name: { type: String, required: true },
    songs: [PlaylistItemSchema],
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
