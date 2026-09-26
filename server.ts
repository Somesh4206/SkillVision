import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

import { db } from './server/db';
import {
  analyzeResumeAgent,
  generateQuizAgent,
  generateCareerRecommendationsAgent,
  analyzeSkillGapAgent,
  generateLearningRoadmapAgent,
  recommendCoursesAgent,
  recommendJobsAgent,
  analyzeCustomJobAgent,
  generateInterviewQuestionsAgent,
  evaluateInterviewAnswerAgent,
  generateTechInterviewAgent,
  evaluateTechInterviewAnswerAgent,
  generateInterviewTipsAgent
} from './server/agents';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'careerpilot-super-secret-key';

// Increase payload limits for resume uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Authentication Middleware ---
interface AuthenticatedRequest extends Request {
  userId?: string;
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.userId = user.userId;
    next();
  });
}

// --- API Routes ---

// POST /register
app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = 'u_' + Math.random().toString(36).substring(2, 11);
    db.addUser({
      id: userId,
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    });

    // Create default profile
    db.upsertProfile({
      userId,
      name,
      cgpa: '',
      interests: [],
      currentSkills: [],
      targetCareer: ''
    });

    // Create default progress tracking
    db.upsertProgress({
      userId,
      coursesCompleted: [],
      projectsCompleted: [],
      goals: [
        { id: 'g1', text: 'Upload resume to analyze core skills', completed: false, category: 'skill' },
        { id: 'g2', text: 'Take a skill assessment quiz', completed: false, category: 'interview' },
        { id: 'g3', text: 'Complete your first recommended course', completed: false, category: 'course' },
        { id: 'g4', text: 'Complete a mock interview round', completed: false, category: 'interview' }
      ],
      updatedAt: new Date().toISOString()
    });

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: userId, email, name, avatar: '' } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /login
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const profile = db.getProfile(user.id);
    const name = profile ? profile.name : 'User';
    const avatar = user.avatar || profile?.avatar || '';

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name, avatar } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/google - Sign In / Register with Google
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    let { credential, email, name, avatar, googleId } = req.body;

    // If a Google ID token credential was sent from Google Identity Services (GSI)
    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.email) email = payload.email;
          if (payload.name) name = payload.name;
          if (payload.picture) avatar = payload.picture;
          if (payload.sub) googleId = payload.sub;
        }
      } catch (decodeErr) {
        console.warn('Could not decode GSI token, falling back to direct fields', decodeErr);
      }
    }

    if (!email) {
      res.status(400).json({ error: 'Google email address is required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const finalName = (name && name.trim()) || normalizedEmail.split('@')[0] || 'Google User';
    const finalAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalName)}`;

    let user = db.getUserByEmail(normalizedEmail);
    let isNewUser = false;

    if (!user) {
      // New user registering via Google
      isNewUser = true;
      const userId = 'u_g_' + Math.random().toString(36).substring(2, 11);
      user = {
        id: userId,
        email: normalizedEmail,
        passwordHash: 'google_oauth_authorized',
        avatar: finalAvatar,
        createdAt: new Date().toISOString()
      };
      db.addUser(user);

      // Create default profile
      db.upsertProfile({
        userId,
        name: finalName,
        avatar: finalAvatar,
        cgpa: '',
        interests: [],
        currentSkills: [],
        targetCareer: ''
      });

      // Create default progress tracking
      db.upsertProgress({
        userId,
        coursesCompleted: [],
        projectsCompleted: [],
        goals: [
          { id: 'g1', text: 'Upload resume to analyze core skills', completed: false, category: 'skill' },
          { id: 'g2', text: 'Take a skill assessment quiz', completed: false, category: 'interview' },
          { id: 'g3', text: 'Complete your first recommended course', completed: false, category: 'course' },
          { id: 'g4', text: 'Complete a mock interview round', completed: false, category: 'interview' }
        ],
        updatedAt: new Date().toISOString()
      });
    } else {
      // Existing user logging in via Google
      if (finalAvatar && (!user.avatar || user.avatar.includes('dicebear'))) {
        db.updateUser({ id: user.id, avatar: finalAvatar });
        user.avatar = finalAvatar;
      }
      const existingProfile = db.getProfile(user.id);
      if (existingProfile) {
        if (!existingProfile.avatar && finalAvatar) {
          existingProfile.avatar = finalAvatar;
          db.upsertProfile(existingProfile);
        }
      }
    }

    const profile = db.getProfile(user.id);
    const resolvedName = profile?.name || finalName;
    const resolvedAvatar = user.avatar || profile?.avatar || finalAvatar;

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        name: resolvedName,
        avatar: resolvedAvatar
      }
    });
  } catch (error: any) {
    console.error('Error in Google Auth:', error);
    res.status(500).json({ error: error.message || 'Google authentication failed' });
  }
});

// GET /api/me
app.get('/api/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = db.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const profile = db.getProfile(userId);
  const resume = db.getResume(userId);
  res.json({
    id: user.id,
    email: user.email,
    name: profile?.name || 'User',
    avatar: user.avatar || profile?.avatar || '',
    profile,
    resume: resume || null
  });
});

// POST /api/profile
app.post('/api/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { 
    name, 
    cgpa, 
    interests, 
    currentSkills, 
    targetCareer, 
    education, 
    experience, 
    certifications, 
    avatar, 
    phone, 
    location, 
    bio, 
    linkedinUrl, 
    githubUrl, 
    portfolioUrl,
    graduationYear,
    university
  } = req.body;

  const currentProfile = db.getProfile(userId);
  const updatedProfile = {
    userId,
    name: name !== undefined ? name : (currentProfile?.name || 'User'),
    cgpa: cgpa !== undefined ? cgpa : (currentProfile?.cgpa || ''),
    interests: interests !== undefined ? interests : (currentProfile?.interests || []),
    currentSkills: currentSkills !== undefined ? currentSkills : (currentProfile?.currentSkills || []),
    targetCareer: targetCareer !== undefined ? targetCareer : (currentProfile?.targetCareer || ''),
    education: education !== undefined ? education : (currentProfile?.education || ''),
    experience: experience !== undefined ? experience : (currentProfile?.experience || ''),
    certifications: certifications !== undefined ? certifications : (currentProfile?.certifications || ''),
    avatar: avatar !== undefined ? avatar : (currentProfile?.avatar || ''),
    phone: phone !== undefined ? phone : (currentProfile?.phone || ''),
    location: location !== undefined ? location : (currentProfile?.location || ''),
    bio: bio !== undefined ? bio : (currentProfile?.bio || ''),
    linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : (currentProfile?.linkedinUrl || ''),
    githubUrl: githubUrl !== undefined ? githubUrl : (currentProfile?.githubUrl || ''),
    portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : (currentProfile?.portfolioUrl || ''),
    graduationYear: graduationYear !== undefined ? graduationYear : (currentProfile?.graduationYear || ''),
    university: university !== undefined ? university : (currentProfile?.university || '')
  };

  db.upsertProfile(updatedProfile);

  if (avatar !== undefined) {
    db.updateUser({ id: userId, avatar });
  }

  const user = db.getUserById(userId);
  res.json({ 
    message: 'Profile updated successfully', 
    profile: updatedProfile,
    user: {
      id: userId,
      email: user?.email || '',
      name: updatedProfile.name,
      avatar: updatedProfile.avatar || user?.avatar || ''
    }
  });
});

// POST /api/profile/avatar
app.post('/api/profile/avatar', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { avatar } = req.body;

  if (!avatar) {
    res.status(400).json({ error: 'Avatar image data or URL is required' });
    return;
  }

  db.updateUser({ id: userId, avatar });
  const profile = db.getProfile(userId);
  if (profile) {
    profile.avatar = avatar;
    db.upsertProfile(profile);
  }

  const user = db.getUserById(userId);
  res.json({ 
    success: true, 
    message: 'Profile avatar updated successfully', 
    avatar,
    user: {
      id: userId,
      email: user?.email || '',
      name: profile?.name || 'User',
      avatar
    }
  });
});

// POST /api/upload-resume
app.post('/api/upload-resume', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { content, isPdf, fileName } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Resume content is required' });
      return;
    }

    // Call the Resume Analyzer Agent (Gemini API)
    const analysis = await analyzeResumeAgent(content, !!isPdf, fileName || 'resume.pdf');

    const dbAnalysis = {
      userId,
      fileName: fileName || 'resume.pdf',
      ...analysis,
      updatedAt: new Date().toISOString()
    };

    db.upsertResume(dbAnalysis);

    // Extract informations and store in the user profile database
    const currentProfile = db.getProfile(userId);
    const updatedProfile = {
      userId,
      name: (analysis.candidateName && analysis.candidateName.trim() && (!currentProfile?.name || currentProfile.name === 'User'))
        ? analysis.candidateName.trim()
        : (currentProfile?.name || 'User'),
      cgpa: (analysis.cgpa && analysis.cgpa.trim()) ? analysis.cgpa.trim() : (currentProfile?.cgpa || ''),
      interests: (analysis.interests && Array.isArray(analysis.interests) && analysis.interests.length > 0)
        ? Array.from(new Set([...(currentProfile?.interests || []), ...analysis.interests]))
        : (currentProfile?.interests || []),
      currentSkills: (analysis.skills && Array.isArray(analysis.skills))
        ? Array.from(new Set([...(currentProfile?.currentSkills || []), ...analysis.skills]))
        : (currentProfile?.currentSkills || []),
      targetCareer: (analysis.targetCareer && analysis.targetCareer.trim())
        ? analysis.targetCareer.trim()
        : (currentProfile?.targetCareer || ''),
      education: analysis.education || currentProfile?.education || '',
      experience: analysis.experience || currentProfile?.experience || '',
      certifications: analysis.certifications || currentProfile?.certifications || '',
      avatar: currentProfile?.avatar || '',
      phone: currentProfile?.phone || '',
      location: currentProfile?.location || '',
      bio: currentProfile?.bio || '',
      linkedinUrl: currentProfile?.linkedinUrl || '',
      githubUrl: currentProfile?.githubUrl || '',
      portfolioUrl: currentProfile?.portfolioUrl || '',
      graduationYear: currentProfile?.graduationYear || '',
      university: currentProfile?.university || ''
    };

    db.upsertProfile(updatedProfile);

    // Mark resume upload goal as completed
    const progress = db.getProgress(userId);
    if (progress) {
      const goal = progress.goals.find(g => g.id === 'g1');
      if (goal) goal.completed = true;
      db.upsertProgress(progress);
    }

    // Record activity for streak
    db.recordActivity(userId, 'resume', 'Uploaded and analyzed resume');

    res.json({ message: 'Resume analyzed and profile database updated successfully', analysis: dbAnalysis, profile: updatedProfile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/resume-analysis
app.get('/api/resume-analysis', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const analysis = db.getResume(userId);
  if (!analysis) {
    res.status(404).json({ error: 'No resume analysis found. Please upload your resume first.' });
    return;
  }
  res.json(analysis);
});

// POST /api/assessment/generate
app.post('/api/assessment/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { type } = req.body; // 'programming' | 'aptitude' | 'communication' | 'ai'
    if (!type) {
      res.status(400).json({ error: 'Assessment type is required' });
      return;
    }

    const profile = db.getProfile(userId);
    const resume = db.getResume(userId);
    const skills = resume?.skills || profile?.currentSkills || [];
    const career = profile?.targetCareer || 'Software Engineer';

    const quiz = await generateQuizAgent(skills, career, type);
    res.json({ type, quiz });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assessment
app.post('/api/assessment', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { programming, logical, communication, aptitude } = req.body;

    const current = db.getAssessment(userId);
    const updated = {
      userId,
      programming: typeof programming === 'number' ? programming : (current?.programming || 0),
      logical: typeof logical === 'number' ? logical : (current?.logical || 0),
      communication: typeof communication === 'number' ? communication : (current?.communication || 0),
      aptitude: typeof aptitude === 'number' ? aptitude : (current?.aptitude || 0),
      takenAt: new Date().toISOString()
    };

    db.upsertAssessment(updated);

    // Mark quiz goal completed
    const progress = db.getProgress(userId);
    if (progress) {
      const goal = progress.goals.find(g => g.id === 'g2');
      if (goal) goal.completed = true;
      db.upsertProgress(progress);
    }

    // Record quiz activity for streak
    db.recordActivity(userId, 'quiz', 'Completed skill assessment quiz');

    res.json({ message: 'Assessment scores saved successfully', assessment: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assessment
app.get('/api/assessment', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const assessment = db.getAssessment(userId);
  if (!assessment) {
    res.json({
      userId,
      programming: 0,
      logical: 0,
      communication: 0,
      aptitude: 0,
      takenAt: null
    });
    return;
  }
  res.json(assessment);
});

// GET /api/career-recommendation
app.get('/api/career-recommendation', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const forceRefresh = req.query.refresh === 'true';

    const existing = db.getCareerRecommendations(userId);
    if (existing && !forceRefresh) {
      res.json(existing);
      return;
    }

    const profile = db.getProfile(userId);
    const resume = db.getResume(userId);
    const assessment = db.getAssessment(userId);

    if (!profile) {
      res.status(400).json({ error: 'Profile not set up' });
      return;
    }

    const recs = await generateCareerRecommendationsAgent({
      skills: resume?.skills || profile.currentSkills,
      cgpa: profile.cgpa,
      interests: profile.interests,
      quizScores: assessment
    });

    const dbRecs = {
      userId,
      recommendations: recs,
      updatedAt: new Date().toISOString()
    };

    db.upsertCareerRecommendations(dbRecs);

    // Automatically set the highest matching career as the targetCareer if they don't have one!
    if (!profile.targetCareer && recs.length > 0) {
      profile.targetCareer = recs[0].career;
      db.upsertProfile(profile);
    }

    res.json(dbRecs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/skill-gap
app.get('/api/skill-gap', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const forceRefresh = req.query.refresh === 'true';

    const existing = db.getSkillGap(userId);
    if (existing && !forceRefresh) {
      res.json(existing);
      return;
    }

    const profile = db.getProfile(userId);
    const resume = db.getResume(userId);

    const currentSkills = resume?.skills || profile?.currentSkills || [];
    const targetCareer = profile?.targetCareer || 'Software Engineer';

    const gap = await analyzeSkillGapAgent(currentSkills, targetCareer);

    const dbGap = {
      userId,
      currentSkills: gap.currentSkills,
      targetCareer: gap.targetCareer,
      missingSkills: gap.missingSkills,
      updatedAt: new Date().toISOString()
    };

    db.upsertSkillGap(dbGap);
    res.json(dbGap);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/roadmap
app.get('/api/roadmap', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const forceRefresh = req.query.refresh === 'true';

    const existing = db.getRoadmap(userId);
    if (existing && !forceRefresh) {
      res.json(existing);
      return;
    }

    const profile = db.getProfile(userId);
    const gap = db.getSkillGap(userId);

    const targetCareer = profile?.targetCareer || 'Software Engineer';
    const missingSkills = gap?.missingSkills || ['Docker', 'System Design', 'MLOps'];

    const roadmap = await generateLearningRoadmapAgent(targetCareer, missingSkills);

    const dbRoadmap = {
      userId,
      targetCareer: roadmap.targetCareer,
      weeks: roadmap.weeks,
      updatedAt: new Date().toISOString()
    };

    db.upsertRoadmap(dbRoadmap);
    res.json(dbRoadmap);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/roadmap/task/toggle
app.post('/api/roadmap/task/toggle', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { taskId, completed } = req.body;

  const roadmap = db.getRoadmap(userId);
  if (!roadmap) {
    res.status(404).json({ error: 'Roadmap not found' });
    return;
  }

  let found = false;
  for (const week of roadmap.weeks) {
    const task = week.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = completed;
      found = true;
      break;
    }
  }

  if (!found) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  db.upsertRoadmap(roadmap);

  if (completed) {
    db.recordActivity(userId, 'task', 'Completed roadmap learning task');
  }

  res.json({ message: 'Task toggled successfully', roadmap });
});

// GET /api/courses
app.get('/api/courses', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const forceRefresh = req.query.refresh === 'true';

    const existing = db.getCourses(userId);
    if (existing && !forceRefresh) {
      res.json(existing);
      return;
    }

    const profile = db.getProfile(userId);
    const gap = db.getSkillGap(userId);

    const targetCareer = profile?.targetCareer || 'Software Engineer';
    const missingSkills = gap?.missingSkills || ['Docker', 'System Design', 'MLOps'];

    const coursesList = await recommendCoursesAgent(missingSkills, targetCareer);

    const dbCourses = {
      userId,
      courses: coursesList,
      updatedAt: new Date().toISOString()
    };

    db.upsertCourses(dbCourses);
    res.json(dbCourses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs (LinkedIn & Indeed Integrated)
app.get('/api/jobs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const forceRefresh = req.query.refresh === 'true';

    const existing = db.getJobs(userId);
    if (existing && !forceRefresh && existing.jobs && existing.jobs.length > 0) {
      res.json(existing);
      return;
    }

    const profile = db.getProfile(userId);
    const resume = db.getResume(userId);
    const skillGap = db.getSkillGap(userId);

    const targetCareer = profile?.targetCareer || 'Software Engineer';
    const skills = resume?.skills || profile?.currentSkills || [];
    const missingSkills = skillGap?.missingSkills || [];
    const atsScore = resume?.atsScore || 85;

    const jobsList = await recommendJobsAgent(skills, targetCareer, {
      atsScore,
      missingSkills
    });

    const dbJobs = {
      userId,
      jobs: jobsList,
      updatedAt: new Date().toISOString()
    };

    db.upsertJobs(dbJobs);
    res.json(dbJobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs/sync - Refresh latest matching jobs from LinkedIn & Indeed
app.post('/api/jobs/sync', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { targetCareerOverride, locationFilter } = req.body;

    const profile = db.getProfile(userId);
    const resume = db.getResume(userId);
    const skillGap = db.getSkillGap(userId);

    const targetCareer = targetCareerOverride || profile?.targetCareer || 'Software Engineer';
    const skills = resume?.skills || profile?.currentSkills || [];
    const missingSkills = skillGap?.missingSkills || [];
    const atsScore = resume?.atsScore || 85;

    const freshJobs = await recommendJobsAgent(skills, targetCareer, {
      location: locationFilter,
      atsScore,
      missingSkills
    });

    // Preserve saved/applied/offered custom jobs from existing list
    const existing = db.getJobs(userId);
    const preservedJobs = (existing?.jobs || []).filter(
      j => j.applicationStatus !== 'not_applied'
    );

    // Merge fresh AI jobs with any actively tracked user applications
    const mergedJobs = [...preservedJobs];
    freshJobs.forEach(fj => {
      if (!mergedJobs.some(mj => mj.title === fj.title && mj.company === fj.company)) {
        mergedJobs.push(fj);
      }
    });

    const dbJobs = {
      userId,
      jobs: mergedJobs,
      updatedAt: new Date().toISOString()
    };

    db.upsertJobs(dbJobs);
    res.json({ message: 'Jobs synchronized successfully with LinkedIn and Indeed', jobs: mergedJobs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs/status - Update application status (Saved, Applied, Interviewing, Offered, Rejected)
app.post('/api/jobs/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { jobId, status, notes } = req.body;

    if (!jobId || !status) {
      res.status(400).json({ error: 'jobId and status are required' });
      return;
    }

    const updatedJob = db.updateJobStatus(userId, jobId, status, notes);
    if (!updatedJob) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json({ message: 'Job status updated successfully', job: updatedJob });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs/offer - Record or update formal job offer details
app.post('/api/jobs/offer', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { jobId, offerDetails } = req.body;

    if (!jobId || !offerDetails) {
      res.status(400).json({ error: 'jobId and offerDetails are required' });
      return;
    }

    const updatedJob = db.updateJobOffer(userId, jobId, offerDetails);
    if (!updatedJob) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json({ message: 'Job offer saved successfully', job: updatedJob });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs/analyze-custom - Parse pasted LinkedIn / Indeed job description
app.post('/api/jobs/analyze-custom', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { jobInput, applyUrl } = req.body;

    if (!jobInput || typeof jobInput !== 'string' || jobInput.trim().length < 10) {
      res.status(400).json({ error: 'Please paste a valid job description or details (minimum 10 characters).' });
      return;
    }

    const profile = db.getProfile(userId);
    const resume = db.getResume(userId);

    const skills = resume?.skills || profile?.currentSkills || [];
    const resumeContext = resume ? `Experience: ${resume.experience}. Education: ${resume.education}` : '';

    const analysis = await analyzeCustomJobAgent(jobInput, skills, resumeContext);

    const platformVal = (analysis.platform === 'indeed' || (applyUrl && applyUrl.includes('indeed')))
      ? 'indeed'
      : (analysis.platform === 'linkedin' || (applyUrl && applyUrl.includes('linkedin')))
        ? 'linkedin'
        : 'direct';

    const cleanLoc = analysis.location ? analysis.location.split('(')[0].trim() : 'Remote';
    const linkedinSearchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(analysis.title + ' ' + analysis.company)}&location=${encodeURIComponent(cleanLoc)}`;
    const indeedSearchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(analysis.title + ' ' + analysis.company)}&l=${encodeURIComponent(cleanLoc)}`;

    const newJob: any = {
      id: `custom_job_${Date.now()}`,
      title: analysis.title || 'Custom Tech Role',
      company: analysis.company || 'Direct Employer',
      platform: platformVal,
      salary: analysis.salary || '$110,000 - $140,000 / yr',
      location: analysis.location || 'Remote',
      workplaceType: analysis.workplaceType || 'Remote',
      jobType: 'Full-time',
      experienceLevel: 'Mid-Senior',
      postedDate: 'Custom Added',
      requiredSkills: analysis.requiredSkills || [],
      matchedSkills: analysis.matchedSkills || [],
      missingSkills: analysis.missingSkills || [],
      matchScore: analysis.matchScore || 80,
      description: analysis.description || jobInput.slice(0, 200),
      requirements: analysis.requiredSkills || [],
      benefits: ['Competitive compensation', 'Standard tech benefits'],
      applyLink: applyUrl || (platformVal === 'linkedin' ? linkedinSearchUrl : indeedSearchUrl),
      linkedinSearchUrl,
      indeedSearchUrl,
      applicationStatus: 'saved',
      notes: analysis.coverLetterPitch ? `AI Pitch: ${analysis.coverLetterPitch}` : undefined
    };

    db.addCustomJob(userId, newJob);

    res.json({
      message: 'Custom job analyzed and added to your tracker',
      job: newJob,
      tailorSuggestions: analysis.tailorSuggestions,
      coverLetterPitch: analysis.coverLetterPitch
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET & POST /api/interview/tips - 3 AI-generated randomized high-impact career advice snippets
app.get('/api/interview/tips', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const profile = db.getProfile(userId);
    const resume = db.getResume(userId);

    const careerRole = profile?.targetCareer || 'Software Engineer';
    const skills = resume?.skills?.length ? resume.skills : (profile?.currentSkills || []);

    const tips = await generateInterviewTipsAgent(careerRole, skills);
    res.json({
      tips,
      careerRole,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/interview/tips', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { careerType } = req.body;
    const profile = db.getProfile(userId);
    const resume = db.getResume(userId);

    const careerRole = careerType || profile?.targetCareer || 'Software Engineer';
    const skills = resume?.skills?.length ? resume.skills : (profile?.currentSkills || []);

    const tips = await generateInterviewTipsAgent(careerRole, skills);
    res.json({
      tips,
      careerRole,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/interview/start
app.post('/api/interview/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { careerType } = req.body;

    const role = careerType || db.getProfile(userId)?.targetCareer || 'Software Engineer';

    // Generate questions
    const aiQuestions = await generateInterviewQuestionsAgent(role);

    const questions = aiQuestions.map((q: any, index: number) => ({
      id: `q_${index}`,
      question: q.question,
      type: q.type || 'technical',
      completed: false
    }));

    const session: any = {
      id: 'sess_' + Math.random().toString(36).substring(2, 11),
      userId,
      careerType: role,
      questions,
      currentQuestionIndex: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    db.upsertInterviewSession(session);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/interview/sessions
app.get('/api/interview/sessions', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const sessions = db.getInterviewSessions(userId);
  res.json(sessions);
});

// GET /api/interview/session/:id
app.get('/api/interview/session/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const session = db.getInterviewSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json(session);
});

// POST /api/interview/answer
app.post('/api/interview/answer', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { sessionId, questionId, answer } = req.body;

    if (!sessionId || !questionId || !answer) {
      res.status(400).json({ error: 'SessionId, questionId, and answer are required' });
      return;
    }

    const session = db.getInterviewSession(sessionId);
    if (!session || session.userId !== userId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const qIdx = session.questions.findIndex(q => q.id === questionId);
    if (qIdx === -1) {
      res.status(404).json({ error: 'Question not found in session' });
      return;
    }

    const questionObj = session.questions[qIdx];
    
    // Evaluate answer using Gemini Coach Agent
    const evaluation = await evaluateInterviewAnswerAgent(questionObj.question, questionObj.type, answer);

    questionObj.completed = true;
    questionObj.userAnswer = answer;
    questionObj.evaluation = evaluation;

    // Advance current question index or complete session
    session.currentQuestionIndex += 1;
    if (session.currentQuestionIndex >= session.questions.length) {
      session.status = 'completed';

      // Complete progress interview goal
      const progress = db.getProgress(userId);
      if (progress) {
        const goal = progress.goals.find(g => g.id === 'g4');
        if (goal) goal.completed = true;
        db.upsertProgress(progress);
      }
    }

    db.upsertInterviewSession(session);
    db.recordActivity(userId, 'interview', 'Answered mock interview question');
    res.json({ question: questionObj, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// --- TECH INTERVIEW (20 TAILORED QUESTIONS ON PROJECTS & TECH SKILLS) ---
// ==========================================

// POST /api/tech-interview/start
app.post('/api/tech-interview/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { forceNew } = req.body;

    const profile = db.getProfile(userId);
    const resume = db.getResume(userId);

    // If an active session exists and user didn't request a fresh one, return it
    const existingSessions = db.getTechInterviews(userId);
    const activeSession = existingSessions.find(s => s.status === 'active');
    if (activeSession && !forceNew) {
      const stats = db.getTechInterviewStats(userId);
      res.json({ session: activeSession, stats });
      return;
    }

    // Extract skills and projects summary from user data
    const skills = resume?.skills?.length ? resume.skills : (profile?.currentSkills?.length ? profile.currentSkills : ['JavaScript', 'React', 'Node.js', 'SQL']);
    const projectsSummary = [
      resume?.experience || '',
      profile?.experience || '',
      resume?.suggestions ? `Candidate Profile Context: ${resume.suggestions.join('. ')}` : ''
    ].filter(Boolean).join('\n') || 'Full-stack application development with databases, APIs, and responsive web clients.';
    const targetCareer = profile?.targetCareer || 'Software Engineer';

    // Generate 20 tailored questions (7 Project Subjective + 13 Skill MCQs)
    const generatedQuestions = await generateTechInterviewAgent(skills, projectsSummary, targetCareer);

    const questions = generatedQuestions.map((q: any, idx: number) => ({
      id: idx + 1,
      questionType: q.questionType || (idx < 7 ? 'project_subjective' : 'skill_mcq'),
      question: q.question,
      category: q.category || (idx < 7 ? 'project_architecture' : 'tech_stack_core'),
      targetTopic: q.targetTopic || (idx < 7 ? `Project Architecture #${idx + 1}` : `Tech Skill MCQ #${idx + 1}`),
      hint: q.hint || (idx < 7 ? 'Focus on architectural principles, performance, and concrete implementation details.' : 'Analyze the options carefully to select the most technically accurate choice.'),
      idealKeyPoints: q.idealKeyPoints || ['Architecture', 'Implementation', 'Tradeoffs'],
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation
    }));

    const newSession = {
      id: 'tech_sess_' + Math.random().toString(36).substring(2, 11),
      userId,
      targetCareer,
      techSkills: skills,
      projectsSummary,
      questions,
      currentQuestionIndex: 0,
      status: 'active' as const,
      averageScore: 0,
      createdAt: new Date().toISOString()
    };

    db.upsertTechInterview(newSession);
    const stats = db.getTechInterviewStats(userId);

    res.json({ session: newSession, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tech-interview/current
app.get('/api/tech-interview/current', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const sessions = db.getTechInterviews(userId);
    const stats = db.getTechInterviewStats(userId);

    // Active session or most recent session
    const active = sessions.find(s => s.status === 'active');
    const latest = sessions.length > 0 ? sessions[sessions.length - 1] : null;

    res.json({
      session: active || latest || null,
      stats,
      allSessionsCount: sessions.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tech-interview/submit-answer
app.post('/api/tech-interview/submit-answer', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { sessionId, questionId, answer } = req.body;

    if (!sessionId || questionId === undefined || answer === undefined) {
      res.status(400).json({ error: 'sessionId, questionId, and answer are required' });
      return;
    }

    const session = db.getTechInterview(sessionId);
    if (!session || session.userId !== userId) {
      res.status(404).json({ error: 'Tech interview session not found' });
      return;
    }

    const qIdx = session.questions.findIndex(q => q.id === Number(questionId));
    if (qIdx === -1) {
      res.status(404).json({ error: 'Question not found in session' });
      return;
    }

    const questionObj = session.questions[qIdx];

    if (questionObj.questionType === 'skill_mcq') {
      // Multiple Choice Question evaluation
      let selectedIdx = typeof req.body.selectedOptionIndex === 'number' ? req.body.selectedOptionIndex : Number(answer);
      if (isNaN(selectedIdx) && questionObj.options) {
        selectedIdx = questionObj.options.findIndex(opt => opt.trim().toLowerCase() === String(answer).trim().toLowerCase());
      }
      
      const isCorrect = selectedIdx === questionObj.correctOptionIndex;
      const score = isCorrect ? 100 : 0;
      const selectedText = questionObj.options && selectedIdx >= 0 && selectedIdx < questionObj.options.length 
        ? questionObj.options[selectedIdx] 
        : String(answer);

      questionObj.selectedOptionIndex = selectedIdx;
      questionObj.userAnswer = selectedText;
      questionObj.score = score;
      questionObj.verdict = isCorrect ? 'Correct' : 'Incorrect';
      questionObj.strengths = isCorrect ? [
        "Accurately identified the correct technical principle",
        "Demonstrated mastery of core language / framework behavior"
      ] : [];
      questionObj.missingKeyPoints = !isCorrect ? [
        "Selected distractor option instead of the correct execution model",
        questionObj.explanation || "Review the exact runtime order and specification behavior"
      ] : [];
      questionObj.refinedAnswer = questionObj.explanation || (questionObj.options && questionObj.correctOptionIndex !== undefined ? `Correct choice: Option ${String.fromCharCode(65 + questionObj.correctOptionIndex)} — ${questionObj.options[questionObj.correctOptionIndex]}` : 'Correct Option selected.');
      questionObj.actionableTip = questionObj.hint || 'Carefully analyze execution steps and memory allocation when dealing with this skill.';
      questionObj.answeredAt = new Date().toISOString();
    } else {
      // Project-based Subjective answer evaluation with Gemini Senior Staff Agent
      const evaluation = await evaluateTechInterviewAnswerAgent(
        questionObj.question,
        questionObj.targetTopic,
        questionObj.idealKeyPoints || [],
        String(answer)
      );

      questionObj.userAnswer = String(answer);
      questionObj.score = evaluation.score;
      questionObj.verdict = evaluation.verdict;
      questionObj.strengths = evaluation.strengths;
      questionObj.missingKeyPoints = evaluation.missingKeyPoints;
      questionObj.refinedAnswer = evaluation.refinedAnswer;
      questionObj.actionableTip = evaluation.actionableTip;
      questionObj.answeredAt = new Date().toISOString();
    }

    // Recalculate average score across all answered questions
    const answeredQuestions = session.questions.filter(q => q.score !== undefined && q.score !== null);
    if (answeredQuestions.length > 0) {
      const sum = answeredQuestions.reduce((acc, q) => acc + (q.score || 0), 0);
      session.averageScore = Math.round(sum / answeredQuestions.length);
    }

    // If this was current question, advance pointer if possible
    if (session.currentQuestionIndex === qIdx && session.currentQuestionIndex < session.questions.length - 1) {
      session.currentQuestionIndex += 1;
    }

    // If all 20 questions answered, mark completed
    if (answeredQuestions.length === session.questions.length) {
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
    }

    db.upsertTechInterview(session);
    db.recordActivity(userId, 'interview', 'Answered tech interview question');
    const stats = db.getTechInterviewStats(userId);

    res.json({
      question: questionObj,
      session,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tech-interview/complete
app.post('/api/tech-interview/complete', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { sessionId } = req.body;

    const session = db.getTechInterview(sessionId);
    if (!session || session.userId !== userId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    session.status = 'completed';
    session.completedAt = new Date().toISOString();

    const answeredQuestions = session.questions.filter(q => q.score !== undefined && q.score !== null);
    if (answeredQuestions.length > 0) {
      const sum = answeredQuestions.reduce((acc, q) => acc + (q.score || 0), 0);
      session.averageScore = Math.round(sum / answeredQuestions.length);
    }

    db.upsertTechInterview(session);
    const stats = db.getTechInterviewStats(userId);

    res.json({ session, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tech-interview/sessions
app.get('/api/tech-interview/sessions', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const sessions = db.getTechInterviews(userId);
  const stats = db.getTechInterviewStats(userId);
  res.json({ sessions, stats });
});

// GET /api/progress
app.get('/api/progress', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  let progress = db.getProgress(userId);
  if (!progress) {
    progress = {
      userId,
      coursesCompleted: [],
      projectsCompleted: [],
      goals: [],
      updatedAt: new Date().toISOString()
    };
    db.upsertProgress(progress);
  }
  const techInterviewStats = db.getTechInterviewStats(userId);
  const streak = db.getStreak(userId);
  res.json({
    ...progress,
    streak,
    techInterviewStats
  });
});

// POST /api/progress/goal/add
app.post('/api/progress/goal/add', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { text, category } = req.body;

  if (!text) {
    res.status(400).json({ error: 'Goal text is required' });
    return;
  }

  const progress = db.getProgress(userId);
  if (!progress) {
    res.status(404).json({ error: 'Progress tracker not found' });
    return;
  }

  const newGoal = {
    id: 'g_' + Math.random().toString(36).substring(2, 11),
    text,
    completed: false,
    category: category || 'skill'
  };

  progress.goals.push(newGoal);
  progress.updatedAt = new Date().toISOString();
  db.upsertProgress(progress);

  res.json(progress);
});

// POST /api/progress/goal/toggle
app.post('/api/progress/goal/toggle', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { goalId, completed } = req.body;

  const progress = db.getProgress(userId);
  if (!progress) {
    res.status(404).json({ error: 'Progress tracker not found' });
    return;
  }

  const goal = progress.goals.find(g => g.id === goalId);
  if (!goal) {
    res.status(404).json({ error: 'Goal not found' });
    return;
  }

  goal.completed = completed;
  progress.updatedAt = new Date().toISOString();
  db.upsertProgress(progress);

  if (completed) {
    db.recordActivity(userId, 'task', `Completed goal: ${goal.text}`);
  }

  res.json(progress);
});

// POST /api/progress/toggle-item
app.post('/api/progress/toggle-item', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { type, name, completed } = req.body; // type: 'course' | 'project'

  const progress = db.getProgress(userId);
  if (!progress) {
    res.status(404).json({ error: 'Progress not found' });
    return;
  }

  if (type === 'course') {
    if (completed) {
      if (!progress.coursesCompleted.includes(name)) {
        progress.coursesCompleted.push(name);
      }
    } else {
      progress.coursesCompleted = progress.coursesCompleted.filter(c => c !== name);
    }
  } else if (type === 'project') {
    if (completed) {
      if (!progress.projectsCompleted.includes(name)) {
        progress.projectsCompleted.push(name);
      }
    } else {
      progress.projectsCompleted = progress.projectsCompleted.filter(p => p !== name);
    }
  }

  progress.updatedAt = new Date().toISOString();
  db.upsertProgress(progress);

  if (completed) {
    db.recordActivity(userId, 'task', `Completed ${type}: ${name}`);
  }

  res.json(progress);
});

// GET /api/dashboard-summary
app.get('/api/dashboard-summary', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;

  const profile = db.getProfile(userId);
  const resume = db.getResume(userId);
  const assessment = db.getAssessment(userId);
  const gap = db.getSkillGap(userId);
  const roadmap = db.getRoadmap(userId);
  const progress = db.getProgress(userId);
  const interviews = db.getInterviewSessions(userId);

  // Calculate stats - for new user with no resume or tests, default strictly to 0
  const atsScore = resume ? resume.atsScore : 0;
  const recommendedCareers = db.getCareerRecommendations(userId)?.recommendations || [];
  
  let bestMatchCareer = 'Undecided';
  let bestMatchPercentage = 0;

  if (recommendedCareers.length > 0) {
    bestMatchCareer = recommendedCareers[0].career;
    bestMatchPercentage = recommendedCareers[0].matchPercentage;
  } else if (profile?.targetCareer) {
    bestMatchCareer = profile.targetCareer;
    bestMatchPercentage = resume ? 70 : 0;
  }

  const missingSkillsCount = gap?.missingSkills?.length || 0;
  const missingSkills = gap?.missingSkills || [];

  // Interview scores
  let averageInterviewScore: number | null = null;
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  if (completedInterviews.length > 0) {
    let totalScore = 0;
    let count = 0;
    completedInterviews.forEach(sess => {
      sess.questions.forEach(q => {
        if (q.evaluation?.score) {
          totalScore += q.evaluation.score;
          count++;
        }
      });
    });
    if (count > 0) {
      averageInterviewScore = Math.round((totalScore / count) * 10) / 10;
    }
  }

  // Roadmap tasks progress
  let roadmapProgress = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  if (roadmap && roadmap.weeks) {
    roadmap.weeks.forEach(w => {
      w.tasks.forEach(t => {
        totalTasks++;
        if (t.completed) completedTasks++;
      });
    });
    if (totalTasks > 0) {
      roadmapProgress = Math.round((completedTasks / totalTasks) * 100);
    }
  }

  // Overall Task Progress (Milestone Goals)
  const totalGoals = progress?.goals?.length || 0;
  const completedGoals = progress?.goals?.filter(g => g.completed).length || 0;
  const overallTaskProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Overall Test / Assessment Score
  let overallTestProgress = 0;
  if (assessment && assessment.takenAt) {
    overallTestProgress = Math.round(
      ((assessment.programming || 0) + (assessment.logical || 0) + (assessment.communication || 0) + (assessment.aptitude || 0)) / 4
    );
  }

  const techInterviewStats = db.getTechInterviewStats(userId);
  const streak = db.getStreak(userId);

  res.json({
    atsScore,
    careerMatch: {
      career: bestMatchCareer,
      percentage: bestMatchPercentage
    },
    missingSkillsCount,
    missingSkills,
    averageInterviewScore,
    techInterviewStats,
    streak,
    roadmapProgress,
    overallTaskProgress,
    overallTestProgress,
    totalTasks,
    completedTasks,
    totalGoals,
    completedGoals,
    recentInterviews: interviews.slice(-3),
    goals: progress?.goals || [],
    profile,
    resumeExists: !!resume
  });
});

// --- Integration with Vite Dev Server / Static Files Serving ---
async function startServer() {
  const distIndex = path.join(process.cwd(), 'dist', 'index.html');
  const isProduction =
    process.env.NODE_ENV === 'production' || fs.existsSync(distIndex);
  if (isProduction) {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Setup Vite as a middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareerPilot AI Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
