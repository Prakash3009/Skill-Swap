const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const MentorshipRequest = require('../models/MentorshipRequest');

/**
 * Feedback Routes
 * Handles feedback submission after mentorship completion
 */

// @route   POST /api/feedback
// @desc    Submit feedback for a completed mentorship
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { requestId, learnerId, mentorId, rating, comment } = req.body;

        // Validate required fields
        if (!requestId || !learnerId || !mentorId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'RequestId, learnerId, mentorId, and rating are required'
            });
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Verify request exists and is completed
        const request = await MentorshipRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Mentorship request not found'
            });
        }

        if (request.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Feedback can only be submitted for completed mentorships'
            });
        }

        // Check if feedback already exists for this request
        const existingFeedback = await Feedback.findOne({ requestId });
        if (existingFeedback) {
            return res.status(400).json({
                success: false,
                message: 'Feedback already submitted for this mentorship'
            });
        }

        // Create feedback
        const feedback = new Feedback({
            requestId,
            learnerId,
            mentorId,
            rating,
            comment: comment || ''
        });

        await feedback.save();

        // Update mentor's average rating
        const mentor = await User.findById(mentorId);
        if (mentor) {
            const currentTotalScore = mentor.averageRating * mentor.totalRatingsCount;
            mentor.totalRatingsCount += 1;
            mentor.averageRating = (currentTotalScore + rating) / mentor.totalRatingsCount;
            await mentor.save();
        }

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/feedback/mentor/:mentorId
// @desc    Get all feedback for a mentor
// @access  Public
router.get('/mentor/:mentorId', async (req, res) => {
    try {
        const feedback = await Feedback.find({ mentorId: req.params.mentorId })
            .populate('learnerId')
            .populate('requestId')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const avgRating = feedback.length > 0
            ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
            : 0;

        res.json({
            success: true,
            count: feedback.length,
            averageRating: avgRating,
            data: feedback
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/feedback/request/:requestId
// @desc    Get feedback for a specific request
// @access  Public
router.get('/request/:requestId', async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ requestId: req.params.requestId })
            .populate('learnerId')
            .populate('mentorId');

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'No feedback found for this request'
            });
        }

        res.json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
