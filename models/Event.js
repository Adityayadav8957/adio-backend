const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    user_id: { type: String, required: true, ref: 'User' },
    type: { type: String, required: true }, // 'play', 'skip', 'search'
    song_id: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
