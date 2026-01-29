const mongoose = require('mongoose');

/**
 * Startup Schema
 * Represents a student-led startup in the SkillSwap platform
 */
const startupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    ideaOrProblem: {
        type: String,
        required: true,
        maxlength: 500
    },
    implementation: {
        type: String,
        required: true,
        maxlength: 2000
    },
    githubLink: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalSponsoredCoins: {
        type: Number,
        default: 0
    },
    ratings: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        stars: { type: Number, min: 1, max: 5 }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate average rating before saving
startupSchema.pre('save', function (next) {
    if (this.ratings && this.ratings.length > 0) {
        const total = this.ratings.reduce((acc, curr) => acc + curr.stars, 0);
        this.averageRating = total / this.ratings.length;
    }
    next();
});

module.exports = mongoose.model('Startup', startupSchema);
