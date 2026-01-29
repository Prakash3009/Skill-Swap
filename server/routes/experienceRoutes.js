const express = require('express');
const router = express.Router();
const Experience = require('../models/Experience');
const { authMiddleware } = require('../middleware/auth');

/**
 * Experience Routes
 * Handles sharing and viewing real-world experiences
 */

const { classifyExperience } = require('../utils/classifier');

// @route   POST /api/experiences
// @desc    Create a new experience
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        let { title, type, description, guidelines } = req.body;

        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }

        // Auto-classify if type is 'Other' or not provided
        if (!type || type === 'Other') {
            const detectedType = classifyExperience(description);
            // If we detected something better than 'Other', use it
            if (detectedType !== 'Other') {
                type = detectedType;
            } else if (!type) {
                type = 'Other';
            }
        }

        // Validate type against enum
        const validTypes = ['Internship', 'Hackathon', 'Job Interview', 'Other'];
        if (!validTypes.includes(type)) {
            type = 'Other';
        }

        // Create experience
        const experience = new Experience({
            title,
            type,
            description,
            guidelines: guidelines || '',
            createdBy: req.userId
        });

        await experience.save();

        // Populate creator info
        await experience.populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Experience shared successfully',
            data: experience
        });
    } catch (error) {
        console.error('Error creating experience:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/experiences
// @desc    Get all experiences (with optional type filter)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;

        // Build filter
        const filter = {};
        if (type) {
            filter.type = type;
        }

        // Fetch experiences
        const experiences = await Experience.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: experiences.length,
            data: experiences
        });
    } catch (error) {
        console.error('Error fetching experiences:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/experiences/:id
// @desc    Get single experience by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const experience = await Experience.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!experience) {
            return res.status(404).json({
                success: false,
                message: 'Experience not found'
            });
        }

        res.json({
            success: true,
            data: experience
        });
    } catch (error) {
        console.error('Error fetching experience:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST /api/experiences/:id/vote
// @desc    Like or dislike an experience
// @access  Private
router.post('/:id/vote', authMiddleware, async (req, res) => {
    try {
        const { type } = req.body; // 'like' or 'dislike'
        const userId = req.userId;

        if (!['like', 'dislike'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid vote type' });
        }

        const experience = await Experience.findById(req.params.id);
        if (!experience) {
            return res.status(404).json({ success: false, message: 'Experience not found' });
        }

        const isLiked = experience.likes.includes(userId);
        const isDisliked = experience.dislikes.includes(userId);

        if (type === 'like') {
            if (isLiked) {
                // Toggle off
                experience.likes = experience.likes.filter(id => id.toString() !== userId);
            } else {
                experience.likes.push(userId);
                // Remove dislike if it exists
                experience.dislikes = experience.dislikes.filter(id => id.toString() !== userId);
            }
        } else {
            if (isDisliked) {
                // Toggle off
                experience.dislikes = experience.dislikes.filter(id => id.toString() !== userId);
            } else {
                experience.dislikes.push(userId);
                // Remove like if it exists
                experience.likes = experience.likes.filter(id => id.toString() !== userId);
            }
        }

        await experience.save();

        res.json({
            success: true,
            message: 'Vote updated',
            likes: experience.likes.length,
            dislikes: experience.dislikes.length
        });
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
