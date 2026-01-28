const express = require('express');
const router = express.Router();
const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');
const Skill = require('../models/Skill');

const Transaction = require('../models/Transaction');

/**
 * Mentorship Request Routes
 * Handles request creation, acceptance, and completion
 * Implements coin system logic
 */

// @route   POST /api/requests
// @desc    Send a mentorship request (costs 1 coin)
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { learnerId, mentorId, skillId, message, suggestedDate, suggestedTime } = req.body;

        // Validate required fields
        if (!learnerId || !mentorId || !skillId) {
            return res.status(400).json({
                success: false,
                message: 'LearnerId, mentorId, and skillId are required'
            });
        }

        // Verify learner exists and has enough coins
        const learner = await User.findById(learnerId);
        if (!learner) {
            return res.status(404).json({
                success: false,
                message: 'Learner not found'
            });
        }

        if (learner.coins < 1) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient coins. You need at least 1 coin to send a request.'
            });
        }

        // Verify mentor exists
        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Verify skill exists
        const skill = await Skill.findById(skillId);
        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found'
            });
        }

        // Deduct 1 coin from learner
        learner.coins -= 1;
        await learner.save();

        // Log spend transaction
        const transaction = new Transaction({
            userId: learnerId,
            type: 'spend',
            amount: 1,
            description: `Sent Mentorship Request to ${mentor.name}`
        });
        await transaction.save();

        // Create mentorship request
        const request = new MentorshipRequest({
            learnerId,
            mentorId,
            skillId,
            message: message || '',
            suggestedDate,
            suggestedTime,
            status: 'pending'
        });

        await request.save();

        res.status(201).json({
            success: true,
            message: 'Mentorship request sent successfully. 1 coin deducted.',
            data: request,
            remainingCoins: learner.coins
        });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/requests/:id/accept
// @desc    Accept a mentorship request
// @access  Public
router.put('/:id/accept', async (req, res) => {
    try {
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending requests can be accepted'
            });
        }

        // Update request status
        request.status = 'accepted';
        request.acceptedAt = new Date();
        await request.save();

        res.json({
            success: true,
            message: 'Request accepted successfully',
            data: request
        });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/requests/:id/complete
// @desc    Mark mentorship as completed (mentor gets +5 coins)
// @access  Public
router.put('/:id/complete', async (req, res) => {
    try {
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Only accepted requests can be completed'
            });
        }

        // Update request status
        request.status = 'completed';
        request.completedAt = new Date();
        await request.save();

        // Award 5 coins to mentor
        const mentor = await User.findById(request.mentorId).populate('skillId');
        mentor.coins += 5;
        await mentor.save();

        // Log earn transaction
        const transaction = new Transaction({
            userId: mentor._id,
            type: 'earn',
            amount: 5,
            description: `Session Expert Reward (Completed mentorship)`
        });
        await transaction.save();

        res.json({
            success: true,
            message: 'Mentorship completed successfully. Mentor earned 5 coins!',
            data: request,
            mentorCoins: mentor.coins
        });
    } catch (error) {
        console.error('Error completing request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/requests/user/:userId
// @desc    Get all requests for a user (both as learner and mentor)
// @access  Public
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get requests where user is learner
        const asLearner = await MentorshipRequest.find({ learnerId: userId })
            .populate('mentorId')
            .populate('skillId')
            .sort({ createdAt: -1 });

        // Get requests where user is mentor
        const asMentor = await MentorshipRequest.find({ mentorId: userId })
            .populate('learnerId')
            .populate('skillId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                outgoing: asLearner,  // Requests sent by user
                incoming: asMentor    // Requests received by user
            }
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/requests/:id/notes
// @desc    Add or update session notes (Mentor only)
// @access  Public (Should be protected in production)
router.put('/:id/notes', async (req, res) => {
    try {
        const { sessionNotes } = req.body;
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Can only add notes to accepted requests'
            });
        }

        request.sessionNotes = sessionNotes || '';
        await request.save();

        res.json({
            success: true,
            message: 'Session notes updated successfully',
            data: request
        });
    } catch (error) {
        console.error('Error updating notes:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
