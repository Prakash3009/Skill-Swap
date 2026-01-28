const mongoose = require('mongoose');

/**
 * Message Schema
 * Simple request-based messaging (NOT real-time)
 * Messages are tied to a specific mentorship request
 */

const messageSchema = new mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorshipRequest',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);
