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

// @route   GET /api/users/leaderboard
// @desc    Get top users by coins
// @access  Public
router.get('/leaderboard', async (req, res) => {
    try {
        // Rank by Rating > Review Count > Coins
        const topUsers = await User.find()
            .sort({ averageRating: -1, totalRatingsCount: -1, coins: -1 })
            .limit(3)
            .select('name email coins averageRating totalRatingsCount skillsOffered bio');

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

const { authMiddleware } = require('../middleware/auth');

// @route   PUT /api/users/profile
// @desc    Update user profile (bio, social links, achievements)
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { bio, socialLinks, achievements } = req.body;

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (bio !== undefined) user.bio = bio;
        if (socialLinks) {
            if (socialLinks.linkedin !== undefined) user.socialLinks.linkedin = socialLinks.linkedin;
            if (socialLinks.github !== undefined) user.socialLinks.github = socialLinks.github;
            if (socialLinks.portfolio !== undefined) user.socialLinks.portfolio = socialLinks.portfolio;
        }
        if (achievements) user.achievements = achievements;

        await user.save();

        const populatedUser = await User.findById(user._id)
            .populate('skillsOffered')
            .populate('skillsWanted');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: populatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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



const { calculateMentorScore } = require('../utils/recommendationEngine');

// @route   GET /api/users/recommendations/:userId
// @desc    Get smart mentor recommendations for a user
// @access  Public
router.get('/recommendations/:userId', async (req, res) => {
    try {
        const targetUserId = req.params.userId;

        // 1. Fetch target user with skills
        const user = await User.findById(targetUserId)
            .populate('skillsWanted');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. Fetch potential mentors (all users except target)
        // We select fields needed for scoring and display
        const mentors = await User.find({ _id: { $ne: targetUserId } })
            .populate('skillsOffered')
            .select('name skillsOffered averageRating coins lastActiveAt bio');

        // 3. Score mentors
        const scoredMentors = mentors.map(mentor => {
            const score = calculateMentorScore(user, mentor);
            return {
                _id: mentor._id,
                name: mentor.name,
                skills: mentor.skillsOffered.map(s => s.skillName),
                avgRating: mentor.averageRating,
                coins: mentor.coins,
                recommendationScore: score,
                bio: mentor.bio
            };
        });

        // 4. Sort by score DESC and take top 5
        const recommendations = scoredMentors
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 5);

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
