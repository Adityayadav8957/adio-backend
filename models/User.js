const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Using Supabase UID as _id
    email: { type: String, required: true, unique: true },
    full_name: { type: String },
    avatar_url: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
