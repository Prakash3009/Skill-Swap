const mongoose = require('mongoose');

const redeemSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rewardName: {
        type: String,
        required: true
    },
    coinsUsed: {
        type: Number,
        required: true
    },
    illustrativeValue: {
        type: String, // e.g., "₹10"
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Redeem', redeemSchema);
