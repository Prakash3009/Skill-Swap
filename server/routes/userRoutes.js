const express = require('express');
const router = express.Router();
const User = require('../models/User');

const Transaction = require('../models/Transaction');

/**
 * User Routes
 * Handles user creation and retrieval
 */

// @route   POST /api/users
// @desc    Create a new user
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, bio } = req.body;

        // ... existing validation ...
        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and email are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Create new user with default 10 coins
        const user = new User({
            name,
            email,
            bio: bio || '',
            coins: 10
        });

        await user.save();

        // Log initial coins transaction
        const transaction = new Transaction({
            userId: user._id,
            type: 'earn',
            amount: 10,
            description: '🎁 Welcome Bonus (SkillSwap Account Created)'
        });
        await transaction.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID with populated skills
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('skillsOffered')
            .populate('skillsWanted');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Public
router.get('/', async (req, res) => {
    try {
        const users = await User.find()
            .populate('skillsOffered')
            .populate('skillsWanted');

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/users/leaderboard
// @desc    Get top users by coins
// @access  Public
router.get('/leaderboard', async (req, res) => {
    try {
        const topUsers = await User.find()
            .sort({ coins: -1 })
            .limit(10)
            .select('name coins averageRating');

        res.json({
            success: true,
            data: topUsers
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
