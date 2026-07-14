const Organization = require('../models/Organization');
const CandidatePipeline = require('../models/CandidatePipeline');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const Application = require('../models/Application');
const User = require('../models/User');
const crypto = require('crypto');

// Socket notification dispatcher helper
const emitSocketUpdate = (req, event, data) => {
  const io = req.app.get('socketio');
  if (io) {
    io.emit(event, data);
  }
};

// Create permanent audit log entry
const createAudit = async (userId, username, action, details, orgId, ip) => {
  try {
    await AuditLog.create({
      user: userId,
      username: username || 'System',
      action,
      details,
      organization: orgId,
      ip
    });
  } catch (err) {
    console.error('Audit Log writing failed:', err);
  }
};

// ==========================================
// ORGANIZATION CRUD
// ==========================================

exports.createOrg = async (req, res) => {
  try {
    const { name, description, logo } = req.body;
    const org = await Organization.create({
      name,
      description,
      logo,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'owner',
        permissions: ['all']
      }]
    });

    await createAudit(req.user._id, req.user.name, 'create_organization', `Created organization ${name}`, org._id, req.ip);
    res.status(201).json({ success: true, organization: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrgs = async (req, res) => {
  try {
    // Find all organizations where user is owner, admin, or member
    const orgs = await Organization.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).populate('owner', 'name email').populate('members.user', 'name email role');

    res.json({ success: true, organizations: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrg = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');
      
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.json({ success: true, organization: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOrg = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    // Only Owner can delete
    if (org.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the Organization Owner can delete the organization' });
    }

    await createAudit(req.user._id, req.user.name, 'delete_organization', `Deleted organization ${org.name}`, org._id, req.ip);
    await Organization.deleteOne({ _id: org._id });
    res.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// DEPARTMENTS & TEAMS CRUD
// ==========================================

exports.addDepartment = async (req, res) => {
  try {
    const { name, description, managerId } = req.body;
    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    org.departments.push({ name, description, manager: managerId || req.user._id });
    await org.save();

    await createAudit(req.user._id, req.user.name, 'add_department', `Added department ${name}`, org._id, req.ip);
    res.json({ success: true, organization: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addTeam = async (req, res) => {
  try {
    const { name, departmentName, description } = req.body;
    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    org.teams.push({ name, departmentName, description });
    await org.save();

    await createAudit(req.user._id, req.user.name, 'add_team', `Added team ${name} to department ${departmentName}`, org._id, req.ip);
    res.json({ success: true, organization: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// INVITATION SYSTEM
// ==========================================

exports.inviteMember = async (req, res) => {
  try {
    const { email, role, department, team } = req.body;
    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const invitation = {
      email,
      role: role || 'recruiter',
      department,
      team,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
    };

    org.invitations.push(invitation);
    await org.save();

    await createAudit(req.user._id, req.user.name, 'invite_member', `Invited ${email} to join as ${role}`, org._id, req.ip);

    // Mock Email link
    const acceptLink = `/api/org/invite/accept/${token}`;

    res.json({ 
      success: true, 
      message: `Invitation email sent to ${email}`, 
      acceptLink,
      invitations: org.invitations 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const org = await Organization.findOne({ 'invitations.token': token });
    if (!org) return res.status(400).send('<h2>Invalid or expired invitation token.</h2>');

    const invite = org.invitations.find(i => i.token === token);
    if (!invite || invite.status !== 'pending' || invite.expiresAt < new Date()) {
      return res.status(400).send('<h2>Invitation has expired or already accepted.</h2>');
    }

    // Add member
    org.members.push({
      user: req.user._id,
      role: invite.role,
      department: invite.department,
      team: invite.team,
      permissions: ['read', 'write']
    });

    // Mark as accepted
    invite.status = 'accepted';
    await org.save();

    await createAudit(req.user._id, req.user.name, 'accept_invitation', `Accepted invitation and joined organization ${org.name}`, org._id, req.ip);
    
    // Redirect candidate/recruiter back to frontend profile dashboard
    res.redirect(`${req.protocol}://${req.get('host')}/#/recruiter/settings`);
  } catch (error) {
    res.status(500).send(`<h2>Error accepting invitation: ${error.message}</h2>`);
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.body; // User model ID
    const org = await Organization.findById(req.params.orgId);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    org.members = org.members.filter(m => m.user.toString() !== memberId.toString());
    await org.save();

    await createAudit(req.user._id, req.user.name, 'remove_member', `Removed member ID ${memberId}`, org._id, req.ip);
    res.json({ success: true, organization: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// COLLABORATIVE HIRING BOARD (KANBAN)
// ==========================================

exports.getPipeline = async (req, res) => {
  try {
    const orgId = req.params.orgId;
    let cards = await CandidatePipeline.find({ organization: orgId })
      .populate({
        path: 'application',
        populate: [
          { path: 'candidate', select: 'name email phone avatar skills experience location bio githubUsername githubConnected linkedinConnected linkedinName linkedinProfilePicture linkedinProfileUrl' },
          { path: 'job', select: 'title description skills location type status' }
        ]
      })
      .populate('assignedMember', 'name email role')
      .populate('comments.author', 'name email role');

    // If no cards exist, let's auto-import/map any existing Applications to seed this org's pipeline!
    if (cards.length === 0) {
      const apps = await Application.find().populate('candidate').populate('job');
      for (const app of apps) {
        // Pre-run AI predict placeholder
        const devRoles = ['Python', 'TensorFlow', 'ML', 'AI'];
        const isAi = app.candidate.skills?.some(s => devRoles.includes(s)) || app.job.title?.includes('Machine Learning') || app.job.title?.includes('AI');
        const bestDept = isAi ? 'AI/ML' : 'Engineering';
        const bestTeam = isAi ? 'AI Department' : 'Backend Team';
        
        await CandidatePipeline.create({
          application: app._id,
          organization: orgId,
          stage: app.status === 'shortlisted' ? 'Recruiter Review' : 'Applied',
          assignedMember: req.user._id,
          aiDecision: {
            bestDepartment: bestDept,
            bestTeam,
            bestRecruiter: req.user._id,
            bestTechnicalInterviewer: req.user._id,
            bestInterviewSequence: ['Recruiter Review', 'Technical Interview', 'Hiring Manager Review'],
            confidenceScore: 92,
            reasoning: `AI matched skills [${app.candidate.skills?.join(', ')}] against JD ${app.job.title}.`
          },
          aiSummary: {
            candidateSummary: `Alex Chen is an experienced developer matching ${app.skillMatch}% of requirements.`,
            interviewSummary: 'Candidate did excellent in coding assessment.',
            hiringRecommendation: 'Highly Recommended',
            offerRecommendation: 'Base Salary $140,000 + Benefits',
            riskAssessment: 'Low Risk',
            skillGapAnalysis: ['Docker', 'AWS'],
            trainingSuggestions: ['Complete AWS Cloud Practitioner'],
            confidence: 88
          }
        });
      }
      
      cards = await CandidatePipeline.find({ organization: orgId })
        .populate({
          path: 'application',
          populate: [{ path: 'candidate' }, { path: 'job' }]
        })
        .populate('assignedMember', 'name email role');
    }

    res.json({ success: true, pipeline: cards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.moveCandidate = async (req, res) => {
  try {
    const { cardId, newStage } = req.body;
    const card = await CandidatePipeline.findById(cardId);
    if (!card) return res.status(404).json({ success: false, message: 'Candidate pipeline entry not found' });

    const oldStage = card.stage;
    card.stage = newStage;
    card.activityHistory.push({
      user: req.user._id,
      action: 'move_stage',
      details: `Moved candidate from ${oldStage} to ${newStage}`
    });

    await card.save();
    
    // Also sync the underlying Application status if matched
    await Application.findByIdAndUpdate(card.application, {
      status: newStage === 'Offer' ? 'offer' : (newStage === 'Rejected' ? 'rejected' : 'screening')
    });

    await createAudit(req.user._id, req.user.name, 'move_stage', `Moved candidate ID ${cardId} to ${newStage}`, card.organization, req.ip);

    // Notify other members in real-time
    emitSocketUpdate(req, 'pipeline_changed', {
      cardId,
      oldStage,
      newStage,
      movedBy: req.user.name
    });

    res.json({ success: true, card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// COMMENTS, TASKS, CHECKLISTS
// ==========================================

exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const card = await CandidatePipeline.findById(req.params.cardId);
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

    card.comments.push({
      author: req.user._id,
      content
    });
    
    card.activityHistory.push({
      user: req.user._id,
      action: 'add_comment',
      details: `Added comment: "${content.slice(0, 30)}..."`
    });

    await card.save();

    // Check for mentions @Name
    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.slice(1);
        const mentionedUser = await User.findOne({ name: new RegExp(username, 'i') });
        if (mentionedUser) {
          await Notification.create({
            user: mentionedUser._id,
            title: 'You were mentioned',
            message: `${req.user.name} mentioned you in a comment on a candidate profile.`,
            type: 'info',
            link: `#/recruiter/hiring-board`
          });
          emitSocketUpdate(req, 'notification_received', { userId: mentionedUser._id, message: 'You were mentioned in a comment!' });
        }
      }
    }

    const populatedCard = await CandidatePipeline.findById(card._id).populate('comments.author', 'name email role');
    emitSocketUpdate(req, 'comment_added', { cardId: card._id, comment: populatedCard.comments[populatedCard.comments.length - 1] });

    res.json({ success: true, comments: populatedCard.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addTask = async (req, res) => {
  try {
    const { title, assignedTo, dueDate } = req.body;
    const card = await CandidatePipeline.findById(req.params.cardId);
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

    card.tasks.push({ title, assignedTo, dueDate });
    card.activityHistory.push({
      user: req.user._id,
      action: 'add_task',
      details: `Created task: "${title}"`
    });

    await card.save();
    res.json({ success: true, tasks: card.tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    const card = await CandidatePipeline.findById(req.params.cardId);
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

    const task = card.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.completed = !task.completed;
    await card.save();

    res.json({ success: true, tasks: card.tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// WORKLOAD BALANCER & HEATMAP
// ==========================================

exports.getWorkloadData = async (req, res) => {
  try {
    const orgId = req.params.orgId;
    const org = await Organization.findById(orgId).populate('members.user');
    if (!org) return res.status(404).json({ success: false, message: 'Org not found' });

    // Calculate recruiter candidate load
    const recruiters = org.members.filter(m => ['recruiter', 'manager', 'admin'].includes(m.role));
    const heatmap = [];

    for (const m of recruiters) {
      const activeCount = await CandidatePipeline.countDocuments({
        organization: orgId,
        assignedMember: m.user._id,
        stage: { $nin: ['Hired', 'Rejected'] }
      });
      heatmap.push({
        recruiterId: m.user._id,
        name: m.user.name,
        email: m.user.email,
        workload: activeCount,
        role: m.role,
        status: activeCount > 5 ? 'overloaded' : (activeCount > 2 ? 'normal' : 'underloaded')
      });
    }

    // Auto-generate a balancing recommendation if any overload exists
    const overloaded = heatmap.find(h => h.workload > 4);
    const underloaded = heatmap.find(h => h.workload <= 2);
    let recommendation = null;

    if (overloaded && underloaded) {
      recommendation = {
        from: overloaded.name,
        to: underloaded.name,
        amount: Math.ceil((overloaded.workload - underloaded.workload) / 2),
        reason: `Recruiter ${overloaded.name} has ${overloaded.workload} active candidates, while ${underloaded.name} has only ${underloaded.workload}. Rebalancing keeps hiring velocity fast.`
      };
    }

    res.json({ success: true, workloadHeatmap: heatmap, recommendation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// AI CONFLICT DETECTOR
// ==========================================

exports.detectConflict = async (req, res) => {
  try {
    const card = await CandidatePipeline.findById(req.params.cardId).populate('assignedMember');
    if (!card) return res.status(404).json({ success: false, message: 'Candidate card not found' });

    // Mock reviewer mismatch detection
    // e.g. Recruiter rated 95%, Tech Lead rated 42%
    const recruiterScore = 95;
    const techLeadScore = 42;

    const explanation = `Conflict detected: recruiter rated candidate highly (${recruiterScore}%) based on soft skills and culture fit, but the technical reviewer rated candidate low (${techLeadScore}%) due to weak coding architecture answers.`;
    const reasoning = 'A third neutral reviewer from the Platform team is recommended to conduct a code design review to break the tie.';

    card.conflictDetails = {
      recruiterScore,
      techLeadScore,
      detectedConflict: true,
      explanation,
      recommendedReviewer: req.user._id, // Assign back to current user as proxy reviewer
      reasoning
    };

    await card.save();
    res.json({ success: true, conflictDetails: card.conflictDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// INTERACTIVE KNOWLEDGE GRAPH
// ==========================================

exports.getKnowledgeGraph = async (req, res) => {
  try {
    const orgId = req.params.orgId;
    const org = await Organization.findById(orgId).populate('owner').populate('members.user');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    const pipelines = await CandidatePipeline.find({ organization: orgId })
      .populate({
        path: 'application',
        populate: [{ path: 'candidate' }, { path: 'job' }]
      });

    const nodes = [];
    const links = [];

    // 1. Add Organization node
    nodes.push({ id: 'org', label: org.name, group: 'organization' });

    // 2. Add Departments nodes
    org.departments.forEach((dept, i) => {
      const deptId = `dept_${i}`;
      nodes.push({ id: deptId, label: dept.name, group: 'department' });
      links.push({ source: 'org', target: deptId });

      // Add Teams under departments
      org.teams.filter(t => t.departmentName === dept.name).forEach((team, ti) => {
        const teamId = `team_${i}_${ti}`;
        nodes.push({ id: teamId, label: team.name, group: 'team' });
        links.push({ source: deptId, target: teamId });
      });
    });

    // 3. Add Recruiters nodes
    org.members.forEach((member) => {
      const recId = `member_${member.user._id}`;
      nodes.push({ id: recId, label: member.user.name, group: 'recruiter' });
      links.push({ source: 'org', target: recId });
    });

    // 4. Add Candidate & Skills nodes
    pipelines.forEach((p, pi) => {
      if (!p.application || !p.application.candidate) return;
      const cand = p.application.candidate;
      const candId = `cand_${cand._id}`;
      
      nodes.push({ 
        id: candId, 
        label: `${cand.name} (${p.stage})`, 
        group: 'candidate', 
        score: p.application.aiScore 
      });
      
      // Link candidate to assigned recruiter
      if (p.assignedMember) {
        links.push({ source: `member_${p.assignedMember}`, target: candId });
      }

      // Add Skill nodes linked to candidate
      if (cand.skills && Array.isArray(cand.skills)) {
        cand.skills.slice(0, 3).forEach((skill) => {
          const skillId = `skill_${skill.toLowerCase()}`;
          if (!nodes.find(n => n.id === skillId)) {
            nodes.push({ id: skillId, label: skill, group: 'skill' });
          }
          links.push({ source: candId, target: skillId });
        });
      }
    });

    res.json({ success: true, graph: { nodes, links } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// AUDIT LOG LIST
// ==========================================
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({ organization: req.params.orgId })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
