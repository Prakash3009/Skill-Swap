/**
 * Simple keyword-based classifier for experiences
 * Categorizes text into: Internship, Hackathon, Job Interview, Other
 */
const classifyExperience = (text) => {
    if (!text) return 'Other';

    const content = text.toLowerCase();

    const keywords = {
        'Job Interview': ['interview', 'hr round', 'technical round', 'coding round', 'hiring', 'recruiter', 'job offer', 'salary discussion'],
        'Hackathon': ['hackathon', '48 hours', '24 hours', 'devpost', 'team project', 'competition', 'prize', 'winner', 'building', 'project'],
        'Internship': ['intern', 'stipend', 'company', 'corporate', 'onboarding', 'training', 'manager', 'full-time', 'placement']
    };

    for (const [category, words] of Object.entries(keywords)) {
        if (words.some(word => content.includes(word))) {
            return category;
        }
    }

    return 'Other';
};

module.exports = { classifyExperience };
