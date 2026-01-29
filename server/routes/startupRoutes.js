const express = require('express');
const router = express.Router();
const Startup = require('../models/Startup');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authMiddleware } = require('../middleware/auth');

/**
 * Startup Routes
 * Handles creation, listing, sponsorship and rating of startups
 */

// @route   POST /api/startups
// @desc    Create a new startup
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, ideaOrProblem, implementation, githubLink } = req.body;

        if (!name || !ideaOrProblem || !implementation) {
            return res.status(400).json({
                success: false,
                message: 'Name, Idea/Problem, and Implementation are required'
            });
        }

        const startup = new Startup({
            name,
            ideaOrProblem,
            implementation,
            githubLink: githubLink || '',
            createdBy: req.userId
        });

        await startup.save();

        res.status(201).json({
            success: true,
            message: 'Startup registered successfully!',
            data: startup
        });
    } catch (error) {
        console.error('Error creating startup:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/startups
// @desc    Get all startups (with top 3 limit option)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { limit } = req.query;
        let query = Startup.find().populate('createdBy', 'name email');

        // Sort by sponsorship and rating
        query = query.sort({ totalSponsoredCoins: -1, averageRating: -1 });

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const startups = await query;

        res.json({
            success: true,
            count: startups.length,
            data: startups
        });
    } catch (error) {
        console.error('Error fetching startups:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/startups/:id
// @desc    Get single startup
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const startup = await Startup.findById(req.params.id).populate('createdBy', 'name email');
        if (!startup) {
            return res.status(404).json({ success: false, message: 'Startup not found' });
        }
        res.json({ success: true, data: startup });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/startups/:id/sponsor
// @desc    Sponsor a startup using coins
// @access  Private
router.post('/:id/sponsor', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const sponsorshipAmount = parseInt(amount);

        if (isNaN(sponsorshipAmount) || sponsorshipAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid coin amount is required' });
        }

        const user = await User.findById(req.userId);
        if (user.coins < sponsorshipAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient coins' });
        }

        const startup = await Startup.findById(req.params.id);
        if (!startup) {
            return res.status(404).json({ success: false, message: 'Startup not found' });
        }

        // 1. Deduct coins from user
        user.coins -= sponsorshipAmount;
        await user.save();

        // 2. Add coins to startup
        startup.totalSponsoredCoins += sponsorshipAmount;
        await startup.save();

        // 3. Log transaction
        const transaction = new Transaction({
            userId: user._id,
            type: 'spend',
            amount: sponsorshipAmount,
            description: `🚀 Sponsored startup: ${startup.name}`
        });
        await transaction.save();

        res.json({
            success: true,
            message: `Successfully sponsored ${sponsorshipAmount} coins!`,
            data: {
                userCoins: user.coins,
                totalSponsored: startup.totalSponsoredCoins
            }
        });
    } catch (error) {
        console.error('Sponsorship error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/startups/:id/rate
// @desc    Rate a startup
// @access  Private
router.post('/:id/rate', authMiddleware, async (req, res) => {
    try {
        const { stars } = req.body;
        const ratingStars = parseInt(stars);

        if (isNaN(ratingStars) || ratingStars < 1 || ratingStars > 5) {
            return res.status(400).json({ success: false, message: 'Stars must be between 1 and 5' });
        }

        const startup = await Startup.findById(req.params.id);
        if (!startup) {
            return res.status(404).json({ success: false, message: 'Startup not found' });
        }

        // Check if user already rated
        const existingRating = startup.ratings.find(r => r.userId.toString() === req.userId);
        if (existingRating) {
            existingRating.stars = ratingStars;
        } else {
            startup.ratings.push({ userId: req.userId, stars: ratingStars });
        }

        await startup.save();

        res.json({
            success: true,
            message: 'Rating submitted successfully',
            averageRating: startup.averageRating
        });
    } catch (error) {
        console.error('Rating error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
