const User = require('../models/User');
const Resume = require('../models/Resume');
const LinkedInProfile = require('../models/LinkedInProfile');
const GitHubProfile = require('../models/GitHubProfile');
const GitHubRepository = require('../models/GitHubRepository');
const Assessment = require('../models/Assessment');

class AIContextBuilder {
  /**
   * Builds a structured context object for a candidate.
   * @param {string} userId - The user ID of the candidate.
   * @returns {Promise<Object>} The compiled structured candidate context.
   */
  static async buildContext(userId) {
    try {
      const [user, resume, linkedin, githubProfile, githubRepos, assessments] = await Promise.all([
        User.findById(userId).lean(),
        Resume.findOne({ user: userId, isPrimary: true }).sort('-createdAt').lean().then(r => r || Resume.findOne({ user: userId }).sort('-createdAt').lean()),
        LinkedInProfile.findOne({ user: userId }).lean(),
        GitHubProfile.findOne({ user: userId }).lean(),
        GitHubRepository.find({ user: userId }).lean(),
        Assessment.find({ user: userId, completed: true }).lean()
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      // 1. Core Profile Details
      const profile = {
        name: user.name,
        email: user.email,
        phone: user.phone || 'N/A',
        location: user.location || 'N/A',
        bio: user.bio || 'N/A',
        skills: user.skills || [],
        experienceYears: user.experience || 0
      };

      // 2. LinkedIn Context
      const linkedinContext = linkedin ? {
        headline: linkedin.headline || 'N/A',
        profileUrl: linkedin.profileUrl || 'N/A',
        name: linkedin.name,
        email: linkedin.email
      } : null;

      // 3. Resume Context
      const resumeContext = resume && resume.parsed ? {
        summary: resume.parsed.summary || 'N/A',
        skills: resume.parsed.skills || [],
        experience: (resume.parsed.experience || []).map(exp => ({
          company: exp.company,
          role: exp.role,
          duration: `${exp.startDate || ''} - ${exp.endDate || ''}`,
          description: exp.description || ''
        })),
        education: (resume.parsed.education || []).map(edu => ({
          institution: edu.institution,
          degree: edu.degree,
          year: edu.year
        })),
        certifications: resume.parsed.certifications || [],
        atsScore: resume.atsScore || resume.score || 0
      } : null;

      // 4. GitHub Context
      const githubContext = (githubProfile || githubRepos.length) ? {
        username: githubProfile?.username || user.githubUsername,
        followers: githubProfile?.followers || 0,
        totalCommits: githubProfile?.totalCommits || 0,
        totalPRs: githubProfile?.totalPRs || 0,
        portfolioScore: githubProfile?.portfolioScore || 70,
        codingConsistency: githubProfile?.codingConsistency || 70,
        projectComplexity: githubProfile?.projectComplexity || 70,
        languages: githubProfile?.languages || [],
        repositories: githubRepos.map(repo => ({
          name: repo.name,
          fullName: repo.fullName,
          description: repo.description,
          stars: repo.stars || 0,
          forks: repo.forks || 0,
          language: repo.language || '',
          languages: repo.languages || {},
          topics: repo.topics || [],
          readmeLength: repo.readme ? repo.readme.length : 0,
          branchesCount: repo.branches ? repo.branches.length : 0,
          contributorsCount: repo.contributors ? repo.contributors.length : 0,
          commitsCount: repo.commits ? repo.commits.length : 0
        }))
      } : null;

      // 5. Assessments Context
      const codingAssessments = (assessments || []).map(asm => ({
        title: asm.title,
        language: asm.language,
        score: asm.score,
        completedAt: asm.createdAt,
        type: asm.type,
        feedback: asm.feedback || {}
      }));

      // Combined Context Object
      return {
        profile,
        linkedin: linkedinContext,
        resume: resumeContext,
        github: githubContext,
        assessments: codingAssessments
      };
    } catch (error) {
      console.error('[AIContextBuilder] Error building context:', error);
      throw error;
    }
  }

  /**
   * Formats candidate context into a text prompt representation for Gemini.
   * @param {Object} context - The compiled context from buildContext().
   * @returns {string} The text prompt context.
   */
  static formatPromptContext(context) {
    let contextStr = `CANDIDATE GENERAL PROFILE:\n`;
    contextStr += `- Name: ${context.profile.name}\n`;
    contextStr += `- Email: ${context.profile.email}\n`;
    contextStr += `- Location: ${context.profile.location}\n`;
    contextStr += `- Experience: ${context.profile.experienceYears} years\n`;
    contextStr += `- Skills: ${context.profile.skills.join(', ') || 'N/A'}\n`;
    contextStr += `- Bio: ${context.profile.bio}\n\n`;

    if (context.linkedin) {
      contextStr += `LINKEDIN PROFILE DETAILS:\n`;
      contextStr += `- Name: ${context.linkedin.name}\n`;
      contextStr += `- Headline: ${context.linkedin.headline}\n`;
      contextStr += `- Profile Link: ${context.linkedin.profileUrl}\n\n`;
    }

    if (context.resume) {
      contextStr += `RESUME PARSED DATA:\n`;
      contextStr += `- Summary: ${context.resume.summary}\n`;
      contextStr += `- Certifications: ${context.resume.certifications.join(', ') || 'None'}\n`;
      contextStr += `- ATS Score: ${context.resume.atsScore}/100\n`;
      contextStr += `- Education:\n`;
      context.resume.education.forEach(edu => {
        contextStr += `  * ${edu.degree} from ${edu.institution} (${edu.year})\n`;
      });
      contextStr += `- Employment History:\n`;
      context.resume.experience.forEach(exp => {
        contextStr += `  * ${exp.role} at ${exp.company} (${exp.duration})\n`;
        contextStr += `    Description: ${exp.description}\n`;
      });
      contextStr += `\n`;
    }

    if (context.github) {
      contextStr += `GITHUB PORTFOLIO SUMMARY:\n`;
      contextStr += `- Username: ${context.github.username}\n`;
      contextStr += `- Metrics: Portfolio Score ${context.github.portfolioScore}/100, Project Complexity: ${context.github.projectComplexity}/100\n`;
      contextStr += `- Languages: ${context.github.languages.map(l => `${l.name} (${l.percentage}%)`).join(', ') || 'None'}\n`;
      contextStr += `- Repositories:\n`;
      context.github.repositories.forEach(repo => {
        contextStr += `  * ${repo.name} (${repo.language}): ${repo.description || 'No description'}\n`;
        contextStr += `    Stats: ${repo.stars} stars, ${repo.forks} forks, ${repo.commitsCount} commits\n`;
      });
      contextStr += `\n`;
    }

    if (context.assessments.length > 0) {
      contextStr += `CODING ASSESSMENTS RESULTS:\n`;
      context.assessments.forEach(asm => {
        contextStr += `- ${asm.title} (${asm.language}): Score ${asm.score}/100. Type: ${asm.type}\n`;
      });
      contextStr += `\n`;
    }

    return contextStr;
  }
}

module.exports = AIContextBuilder;
