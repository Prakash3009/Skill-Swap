/**
 * ML-style scoring engine for mentor recommendations
 */
const calculateMentorScore = (learner, mentor) => {
    let score = 0;

    // 1. Skill Match Weight (High: 50%)
    // Intersection of learner.skillsWanted and mentor.skillsOffered
    const learnerWanted = learner.skillsWanted.map(s => s.skillName.toLowerCase());
    const mentorOffered = mentor.skillsOffered.map(s => s.skillName.toLowerCase());

    const commonSkills = learnerWanted.filter(skill => mentorOffered.includes(skill));
    const skillMatchScore = (commonSkills.length > 0) ? 50 : 0;
    // Extra points for more matches
    const skillBonus = Math.min(commonSkills.length * 10, 50);
    score += (skillMatchScore + skillBonus);

    // 2. Rating Weight (Medium: 20%)
    // Base it on averageRating (0-5 scale)
    const ratingScore = (mentor.averageRating || 0) * 4; // Max 20
    score += ratingScore;

    // 3. Activity Weight (Medium: 20%)
    // Based on lastActiveAt recency (last 7 days)
    const lastActive = new Date(mentor.lastActiveAt);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - lastActive) / (1000 * 60 * 60 * 24));

    let activityScore = 0;
    if (diffDays <= 1) activityScore = 20;
    else if (diffDays <= 3) activityScore = 15;
    else if (diffDays <= 7) activityScore = 10;
    else if (diffDays <= 30) activityScore = 5;
    score += activityScore;

    // 4. Coin Weight (Low: 10%)
    // Reward active users with some coins, but not too much to skew results
    const coinScore = Math.min((mentor.coins || 0) / 10, 10); // Max 10
    score += coinScore;

    return Math.round(score);
};

module.exports = { calculateMentorScore };
