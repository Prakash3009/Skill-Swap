const express = require('express');
const router = express.Router();
const Experience = require('../models/Experience');
const { authMiddleware } = require('../middleware/auth');

/**
 * Experience Routes
 * Handles sharing and viewing real-world experiences
 */

// @route   POST /api/experiences
// @desc    Create a new experience
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, type, description, guidelines } = req.body;

        // Validate required fields
        if (!title || !type || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title, type, and description are required'
            });
        }

        // Validate type
        const validTypes = ['Internship', 'Hackathon', 'Job Interview', 'Other'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid experience type'
            });
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

module.exports = router;
