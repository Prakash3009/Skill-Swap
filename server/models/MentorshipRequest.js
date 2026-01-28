const mongoose = require('mongoose');

/**
 * MentorshipRequest Schema
 * Represents a request from a learner to a mentor for a specific skill
 * Tracks status: pending, accepted, completed
 */

const mentorshipRequestSchema = new mongoose.Schema({
    // ... existing fields ...
    learnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'completed', 'feedback_submitted'],
        default: 'pending'
    },
    message: {
        type: String,
        default: '',
        maxlength: 500
    },
    sessionNotes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    quiz: {
        questions: [{
            text: { type: String, required: true },
            options: [{ type: String, required: true }],
            correctAnswer: { type: Number, required: true }
        }],
        isEnabled: { type: Boolean, default: false }
    },
    quizScore: {
        type: Number,
        default: null
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate for feedback
mentorshipRequestSchema.virtual('feedback', {
    ref: 'Feedback',
    localField: '_id',
    foreignField: 'requestId',
    justOne: true
});

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
