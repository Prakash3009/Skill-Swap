const mongoose = require('mongoose');

/**
 * Experience Schema
 * Users share real-world experiences (internships, hackathons, interviews, etc.)
 */

const experienceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    type: {
        type: String,
        required: true,
        enum: ['Internship', 'Hackathon', 'Job Interview', 'Other']
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    guidelines: {
        type: String,
        default: '',
        maxlength: 1000
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

module.exports = mongoose.model('Experience', experienceSchema);
