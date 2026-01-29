const mongoose = require('mongoose');

/**
 * MentorshipRequest Schema
 * Represents a request from a learner to a mentor for a specific skill
 * Tracks status: pending, accepted, completed
 */

const mentorshipRequestSchema = new mongoose.Schema({
    // User who is requesting mentorship (learner)
    learnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // User who will provide mentorship (mentor)
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Skill being requested
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
            options: [{ type: String, required: true }], // 4 options usually
            correctAnswer: { type: Number, required: true } // Index 0-3
        }],
        isEnabled: { type: Boolean, default: false }
    },
    quizScore: {
        type: Number,
        default: null // null not taken, or 0-3
    }
});

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
