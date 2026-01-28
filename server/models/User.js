const mongoose = require('mongoose');

/**
 * User Schema
 * Represents a user in the SkillSwap platform
 * Each user has profile info, coins, and references to skills
 */

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false // Don't return password in queries by default
    },
    bio: {
        type: String,
        default: '',
        maxlength: 500
    },
    socialLinks: {
        linkedin: { type: String, default: '' },
        github: { type: String, default: '' },
        portfolio: { type: String, default: '' }
    },
    achievements: [{
        title: { type: String, required: true },
        date: { type: Date, default: Date.now }
    }],
    coins: {
        type: Number,
        default: 10, // Every new user starts with 10 coins
        min: 0
    },
    // Skills this user can teach/offer
    skillsOffered: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
    }],
    // Skills this user wants to learn
    skillsWanted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    totalRatingsCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
