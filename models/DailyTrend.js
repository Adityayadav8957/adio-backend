const mongoose = require('mongoose');

const DailyTrendSchema = new mongoose.Schema({
    genre: { type: String, required: true },
    trend_date: { type: Date, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }, // Store counts or trending song IDs
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyTrend', DailyTrendSchema);
