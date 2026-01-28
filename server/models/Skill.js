const mongoose = require('mongoose');

/**
 * Skill Schema
 * Represents a skill that can be offered or requested
 * Linked to a user who possesses/wants this skill
 */

const skillSchema = new mongoose.Schema({
    skillName: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: String,
        required: true,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    category: {
        type: String,
        required: true,
        enum: ['Web', 'ML', 'Design', 'DSA', 'Other'],
        default: 'Other'
    },
    // User who possesses this skill
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Type: offered or wanted
    type: {
        type: String,
        enum: ['offered', 'wanted'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Skill', skillSchema);
