const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    user_id: { type: String, required: true, ref: 'User' },
    song_id: { type: String, required: true },
    title: { type: String },
    artist: { type: String },
    genre: { type: String },
    album: { type: String },
    thumb: { type: String },
    duration: { type: Number },
    played_at: { type: Date, default: Date.now }
});

// Index for efficient retrieval of latest history
HistorySchema.index({ user_id: 1, played_at: -1 });

module.exports = mongoose.model('History', HistorySchema);
