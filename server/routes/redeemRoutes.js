const express = require('express');
const router = express.Router();
const Redeem = require('../models/Redeem');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

/**
 * Redeem Routes
 * Handles virtual coin redemption
 */

const Transaction = require('../models/Transaction');

const REDEEM_OPTIONS = [
    { id: 1, name: 'Tech Excellence Certificate', cost: 100, value: '₹10 (ref)' },
    { id: 2, name: 'Community Creation Credits', cost: 200, value: '₹20 (ref)' },
    { id: 3, name: 'Profile Highlight (7 days)', cost: 50, value: '₹5 (ref)' },
    { id: 4, name: 'Platform Pro Badge', cost: 150, value: '₹15 (ref)' }
];

// @route   GET /api/redeem/transactions
// @desc    Get user's full transaction history
// @access  Private
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/redeem/options
// @desc    Get all redemption options
// @access  Public
router.get('/options', (req, res) => {
    res.json({ success: true, data: REDEEM_OPTIONS });
});

// @route   POST /api/redeem
// @desc    Redeem coins for a reward
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { rewardId } = req.body;
        const option = REDEEM_OPTIONS.find(o => o.id === parseInt(rewardId));

        if (!option) {
            return res.status(404).json({ success: false, message: 'Reward option not found' });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.coins < option.cost) {
            return res.status(400).json({ success: false, message: 'Insufficient coins for this reward' });
        }

        // Apply special logic for highlights
        if (option.id === 3) {
            user.isHighlighted = true;
            user.profileColor = 'gold';
        }

        // Deduct coins
        user.coins -= option.cost;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
            userId: req.userId,
            type: 'spend',
            amount: option.cost,
            description: `Redeemed: ${option.name}`
        });
        await transaction.save();

        // Create redemption record (legacy/specific)
        const redemption = new Redeem({
            userId: req.userId,
            rewardName: option.name,
            coinsUsed: option.cost,
            illustrativeValue: option.value
        });

        await redemption.save();

        res.json({
            success: true,
            message: `Redeemed ${option.name} successfully!`,
            data: redemption,
            remainingCoins: user.coins
        });
    } catch (error) {
        console.error('Error redeeming coins:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/redeem/history
// @desc    Get user's redemption history
// @access  Private
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const history = await Redeem.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
