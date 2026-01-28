const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const User = require('../models/User');

/**
 * Skill Routes
 * Handles skill creation and search functionality
 */

// @route   POST /api/skills
// @desc    Add a new skill for a user
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { skillName, level, category, userId, type } = req.body;

        // Validate required fields
        if (!skillName || !userId || !type) {
            return res.status(400).json({
                success: false,
                message: 'Skill name, userId, and type are required'
            });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create new skill
        const skill = new Skill({
            skillName,
            level: level || 'Beginner',
            category: category || 'Other',
            userId,
            type
        });

        await skill.save();

        // Update user's skill arrays
        if (type === 'offered') {
            user.skillsOffered.push(skill._id);
        } else if (type === 'wanted') {
            user.skillsWanted.push(skill._id);
        }
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Skill added successfully',
            data: skill
        });
    } catch (error) {
        console.error('Error adding skill:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/skills/search
// @desc    Search for mentors by skill name
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const { skillName, category } = req.query;

        let query = { type: 'offered' };

        if (skillName) {
            query.skillName = { $regex: skillName, $options: 'i' };
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        // Find all offered skills matching the search term
        const skills = await Skill.find(query).populate('userId');

        // Extract unique mentors
        const mentors = skills.map(skill => ({
            mentor: skill.userId,
            skill: {
                _id: skill._id,
                skillName: skill.skillName,
                level: skill.level,
                category: skill.category
            }
        }));

        res.json({
            success: true,
            count: mentors.length,
            data: mentors
        });
    } catch (error) {
        console.error('Error searching skills:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/skills/user/:userId
// @desc    Get all skills for a specific user
// @access  Public
router.get('/user/:userId', async (req, res) => {
    try {
        const skills = await Skill.find({ userId: req.params.userId });

        res.json({
            success: true,
            count: skills.length,
            data: skills
        });
    } catch (error) {
        console.error('Error fetching user skills:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
