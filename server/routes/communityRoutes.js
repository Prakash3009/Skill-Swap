const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const Transaction = require('../models/Transaction');

/**
 * Community Routes
 * Handles community creation, joining, and listing
 */

// @route   POST /api/communities
// @desc    Create a new skill-based community (Costs 20 coins)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, category, description } = req.body;
        const userId = req.userId;

        // Validation
        if (!name || !category || !description) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.coins < 20) {
            return res.status(400).json({ success: false, message: 'Insufficient coins. Creating a community costs 20 coins.' });
        }

        // Check if name already exists
        const existing = await Community.findOne({ name });
        if (existing) return res.status(400).json({ success: false, message: 'Community name already exists' });

        // Deduct coins
        user.coins -= 20;
        await user.save();

        // Log transaction
        const transaction = new Transaction({
            userId,
            type: 'spend',
            amount: 20,
            description: `Created Community: ${name}`
        });
        await transaction.save();

        const community = new Community({
            name,
            category,
            description,
            createdBy: userId,
            members: [userId] // Creator is the first member
        });

        await community.save();

        res.status(201).json({
            success: true,
            message: 'Community created successfully! 20 coins deducted.',
            data: community,
            remainingCoins: user.coins
        });
    } catch (error) {
        console.error('Error creating community:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/communities
// @desc    Get all communities (optional filter by user)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { user } = req.query;
        let query = {};

        if (user) {
            query.createdBy = user;
        }

        const communities = await Community.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: communities });
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/communities/:id
// @desc    Get community details including posts
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const community = await Community.findById(req.params.id)
            .populate('createdBy', 'name')
            .populate('members', 'name')
            .populate('posts.author', 'name');

        if (!community) return res.status(404).json({ success: false, message: 'Community not found' });

        res.json({ success: true, data: community });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/communities/:id/join
// @desc    Join a community
// @access  Private
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ success: false, message: 'Community not found' });

        if (community.members.includes(req.userId)) {
            return res.status(400).json({ success: false, message: 'Already a member' });
        }

        community.members.push(req.userId);
        await community.save();

        res.json({ success: true, message: 'Joined community successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/communities/:id/posts
// @desc    Create a post in a community
// @access  Private
router.post('/:id/posts', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ success: false, message: 'Community not found' });

        // Check if user is a member
        if (!community.members.includes(req.userId)) {
            return res.status(403).json({ success: false, message: 'Only members can post in this community' });
        }

        community.posts.push({
            content,
            author: req.userId
        });

        await community.save();

        // Return the latest post with author populated (simple way for hackathon)
        const updated = await Community.findById(req.params.id).populate('posts.author', 'name');
        const newPost = updated.posts[updated.posts.length - 1];

        res.status(201).json({ success: true, message: 'Post created', data: newPost });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/communities/:id/posts/:postId/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/posts/:postId/comments', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ success: false, message: 'Comment content is required' });

        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ success: false, message: 'Community not found' });

        if (!community.members.includes(req.userId)) {
            return res.status(403).json({ success: false, message: 'Only members can comment' });
        }

        const post = community.posts.id(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        post.comments.push({
            content,
            author: req.userId
        });

        await community.save();

        const updated = await Community.findById(req.params.id).populate('posts.comments.author', 'name');
        const updatedPost = updated.posts.id(req.params.postId);

        res.status(201).json({ success: true, message: 'Comment added', data: updatedPost.comments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/communities/:id/challenge
// @desc    Set today's challenge for the community (Creator only)
// @access  Private
router.post('/:id/challenge', authMiddleware, async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description are required' });

        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ success: false, message: 'Community not found' });

        // Check if user is the creator
        if (community.createdBy.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: 'Only the community creator can set challenges' });
        }

        community.currentChallenge = {
            title,
            description,
            createdAt: new Date()
        };

        await community.save();

        res.json({ success: true, message: 'Community challenge updated!', data: community.currentChallenge });
    } catch (error) {
        console.error('Error setting challenge:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
