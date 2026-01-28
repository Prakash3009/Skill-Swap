const mongoose = require('mongoose');

/**
 * Feedback Schema
 * Stores feedback/rating given by learner after mentorship completion
 * Linked to a mentorship request
 */

const feedbackSchema = new mongoose.Schema({
    // Reference to the mentorship request
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorshipRequest',
        required: true
    },
    // User who gave the feedback (learner)
    learnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // User who received the feedback (mentor)
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: '',
        maxlength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
