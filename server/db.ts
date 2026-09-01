import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  phone?: string;
  location?: string;
  createdAt: string;
}

export interface Profile {
  userId: string;
  name: string;
  cgpa: string;
  interests: string[];
  currentSkills: string[];
  targetCareer: string;
  education?: string;
  experience?: string;
  certifications?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  graduationYear?: string;
  university?: string;
}

export interface ResumeAnalysis {
  userId: string;
  fileName: string;
  atsScore: number;
  skills: string[];
  missingKeywords: string[];
  suggestions: string[];
  experience: string;
  education: string;
  certifications: string;
  coverLetter?: string;
  linkedinHeadline?: string;
  updatedAt: string;
}

export interface Assessment {
  userId: string;
  programming: number; // Percentage
  logical: number;
  communication: number;
  aptitude: number;
  takenAt: string;
}

export interface CareerRecommendation {
  userId: string;
  recommendations: Array<{
    career: string;
    matchPercentage: number;
    salary: string;
    futureScope: string;
    reason: string;
    requiredSkills: string[];
  }>;
  updatedAt: string;
}

export interface SkillGap {
  userId: string;
  currentSkills: string[];
  targetCareer: string;
  missingSkills: string[];
  updatedAt: string;
}

export interface RoadmapWeek {
  week: string;
  title: string;
  topics: string[];
  miniProject: {
    title: string;
    description: string;
  };
  tasks: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
}

export interface LearningRoadmap {
  userId: string;
  targetCareer: string;
  weeks: RoadmapWeek[];
  updatedAt: string;
}

export interface Course {
  title: string;
  platform: string;
  duration: string;
  price: string;
  difficulty: string;
  rating: number;
  link: string;
}

export interface CourseRecommendations {
  userId: string;
  courses: Course[];
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  platform: 'linkedin' | 'indeed' | 'glassdoor' | 'direct';
  workplaceType: 'Remote' | 'Hybrid' | 'On-site';
  jobType: 'Full-time' | 'Contract' | 'Internship' | 'Part-time';
  experienceLevel: 'Entry Level' | 'Mid-Senior' | 'Lead' | 'Internship';
  postedDate: string;
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number;
  description: string;
  requirements: string[];
  benefits: string[];
  applyLink: string;
  linkedinSearchUrl?: string;
  indeedSearchUrl?: string;
  applicationStatus: 'not_applied' | 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  appliedAt?: string;
  notes?: string;
  offerDetails?: {
    salaryOffered?: string;
    deadline?: string;
    decision?: 'evaluating' | 'accepted' | 'declined';
    bonusOrPerks?: string;
  };
}

export interface JobRecommendations {
  userId: string;
  jobs: Job[];
  updatedAt: string;
}

export interface InterviewExchange {
  questionId: string;
  role: 'ai' | 'user';
  text: string;
  score?: number;
  feedback?: string;
  grammar?: string;
  suggestions?: string;
  timestamp: string;
}

export interface MockInterviewSession {
  id: string;
  userId: string;
  careerType: string;
  questions: Array<{
    id: string;
    question: string;
    type: 'technical' | 'hr' | 'coding';
    completed: boolean;
    userAnswer?: string;
    evaluation?: {
      score: number;
      confidence: string;
      grammar: string;
      suggestions: string;
    };
  }>;
  currentQuestionIndex: number;
  status: 'active' | 'completed';
  createdAt: string;
}

export interface TechInterviewQuestion {
  id: number;
  question: string;
  questionType: 'project_subjective' | 'skill_mcq';
  category: 'project_architecture' | 'tech_stack_core' | 'debugging_optimization' | 'system_design';
  targetTopic: string;
  hint: string;
  idealKeyPoints: string[];
  options?: string[];
  correctOptionIndex?: number;
  selectedOptionIndex?: number;
  explanation?: string;
  userAnswer?: string;
  score?: number;
  verdict?: 'Excellent' | 'Good' | 'Needs Improvement' | 'Incomplete' | 'Correct' | 'Incorrect';
  feedback?: string;
  strengths?: string[];
  missingKeyPoints?: string[];
  refinedAnswer?: string;
  actionableTip?: string;
  answeredAt?: string;
}

export interface TechInterviewSession {
  id: string;
  userId: string;
  targetCareer: string;
  techSkills: string[];
  projectsSummary: string;
  questions: TechInterviewQuestion[];
  currentQuestionIndex: number;
  status: 'active' | 'completed';
  averageScore: number;
  completedAt?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  category: 'course' | 'project' | 'interview' | 'skill';
}

export interface StreakActivity {
  type: 'task' | 'quiz' | 'interview' | 'resume';
  title: string;
  timestamp: string;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  activityDates: string[]; // list of YYYY-MM-DD
  recentActivities?: StreakActivity[];
}

export interface ProgressState {
  userId: string;
  coursesCompleted: string[];
  projectsCompleted: string[];
  goals: Goal[];
  streak?: StreakState;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  profiles: Profile[];
  resumes: ResumeAnalysis[];
  assessments: Assessment[];
  careerRecommendations: CareerRecommendation[];
  skillGaps: SkillGap[];
  roadmaps: LearningRoadmap[];
  courses: CourseRecommendations[];
  jobs: JobRecommendations[];
  interviews: MockInterviewSession[];
  techInterviews: TechInterviewSession[];
  progress: ProgressState[];
}

const emptySchema: DatabaseSchema = {
  users: [],
  profiles: [],
  resumes: [],
  assessments: [],
  careerRecommendations: [],
  skillGaps: [],
  roadmaps: [],
  courses: [],
  jobs: [],
  interviews: [],
  techInterviews: [],
  progress: []
};

class FileDB {
  private data: DatabaseSchema = { ...emptySchema };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Guarantee all arrays exist
        this.data.users = this.data.users || [];
        this.data.profiles = this.data.profiles || [];
        this.data.resumes = this.data.resumes || [];
        this.data.assessments = this.data.assessments || [];
        this.data.careerRecommendations = this.data.careerRecommendations || [];
        this.data.skillGaps = this.data.skillGaps || [];
        this.data.roadmaps = this.data.roadmaps || [];
        this.data.courses = this.data.courses || [];
        this.data.jobs = this.data.jobs || [];
        this.data.interviews = this.data.interviews || [];
        this.data.techInterviews = this.data.techInterviews || [];
        this.data.progress = this.data.progress || [];
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading database, resetting to empty', e);
      this.data = { ...emptySchema };
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database', e);
    }
  }

  // --- Users Operations ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  addUser(user: User): void {
    this.data.users.push(user);
    this.save();
  }

  updateUser(userUpdate: Partial<User> & { id: string }): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === userUpdate.id);
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...userUpdate };
      this.save();
      return this.data.users[idx];
    }
    return undefined;
  }

  // --- Profile Operations ---
  getProfile(userId: string): Profile | undefined {
    return this.data.profiles.find(p => p.userId === userId);
  }

  upsertProfile(profile: Profile): void {
    const idx = this.data.profiles.findIndex(p => p.userId === profile.userId);
    if (idx >= 0) {
      this.data.profiles[idx] = profile;
    } else {
      this.data.profiles.push(profile);
    }
    this.save();
  }

  // --- Resume Operations ---
  getResume(userId: string): ResumeAnalysis | undefined {
    return this.data.resumes.find(r => r.userId === userId);
  }

  upsertResume(resume: ResumeAnalysis): void {
    const idx = this.data.resumes.findIndex(r => r.userId === resume.userId);
    if (idx >= 0) {
      this.data.resumes[idx] = resume;
    } else {
      this.data.resumes.push(resume);
    }
    this.save();
  }

  // --- Assessment Operations ---
  getAssessment(userId: string): Assessment | undefined {
    return this.data.assessments.find(a => a.userId === userId);
  }

  upsertAssessment(assessment: Assessment): void {
    const idx = this.data.assessments.findIndex(a => a.userId === assessment.userId);
    if (idx >= 0) {
      this.data.assessments[idx] = assessment;
    } else {
      this.data.assessments.push(assessment);
    }
    this.save();
  }

  // --- Career Recommendations ---
  getCareerRecommendations(userId: string): CareerRecommendation | undefined {
    return this.data.careerRecommendations.find(c => c.userId === userId);
  }

  upsertCareerRecommendations(recs: CareerRecommendation): void {
    const idx = this.data.careerRecommendations.findIndex(c => c.userId === recs.userId);
    if (idx >= 0) {
      this.data.careerRecommendations[idx] = recs;
    } else {
      this.data.careerRecommendations.push(recs);
    }
    this.save();
  }

  // --- Skill Gaps ---
  getSkillGap(userId: string): SkillGap | undefined {
    return this.data.skillGaps.find(s => s.userId === userId);
  }

  upsertSkillGap(gap: SkillGap): void {
    const idx = this.data.skillGaps.findIndex(s => s.userId === gap.userId);
    if (idx >= 0) {
      this.data.skillGaps[idx] = gap;
    } else {
      this.data.skillGaps.push(gap);
    }
    this.save();
  }

  // --- Learning Roadmaps ---
  getRoadmap(userId: string): LearningRoadmap | undefined {
    return this.data.roadmaps.find(r => r.userId === userId);
  }

  upsertRoadmap(roadmap: LearningRoadmap): void {
    const idx = this.data.roadmaps.findIndex(r => r.userId === roadmap.userId);
    if (idx >= 0) {
      this.data.roadmaps[idx] = roadmap;
    } else {
      this.data.roadmaps.push(roadmap);
    }
    this.save();
  }

  // --- Course Recommendations ---
  getCourses(userId: string): CourseRecommendations | undefined {
    return this.data.courses.find(c => c.userId === userId);
  }

  upsertCourses(courses: CourseRecommendations): void {
    const idx = this.data.courses.findIndex(c => c.userId === courses.userId);
    if (idx >= 0) {
      this.data.courses[idx] = courses;
    } else {
      this.data.courses.push(courses);
    }
    this.save();
  }

  // --- Job Recommendations ---
  getJobs(userId: string): JobRecommendations | undefined {
    return this.data.jobs.find(j => j.userId === userId);
  }

  upsertJobs(jobs: JobRecommendations): void {
    const idx = this.data.jobs.findIndex(j => j.userId === jobs.userId);
    if (idx >= 0) {
      this.data.jobs[idx] = jobs;
    } else {
      this.data.jobs.push(jobs);
    }
    this.save();
  }

  updateJobStatus(userId: string, jobId: string, status: Job['applicationStatus'], notes?: string): Job | undefined {
    const recs = this.getJobs(userId);
    if (!recs) return undefined;
    const job = recs.jobs.find(j => j.id === jobId);
    if (!job) return undefined;
    
    job.applicationStatus = status;
    if (status === 'applied' && !job.appliedAt) {
      job.appliedAt = new Date().toISOString();
    }
    if (notes !== undefined) {
      job.notes = notes;
    }
    recs.updatedAt = new Date().toISOString();
    this.upsertJobs(recs);
    return job;
  }

  updateJobOffer(userId: string, jobId: string, offerDetails: Job['offerDetails']): Job | undefined {
    const recs = this.getJobs(userId);
    if (!recs) return undefined;
    const job = recs.jobs.find(j => j.id === jobId);
    if (!job) return undefined;
    
    job.applicationStatus = 'offered';
    job.offerDetails = {
      ...(job.offerDetails || {}),
      ...offerDetails
    };
    recs.updatedAt = new Date().toISOString();
    this.upsertJobs(recs);
    return job;
  }

  addCustomJob(userId: string, job: Job): Job {
    let recs = this.getJobs(userId);
    if (!recs) {
      recs = {
        userId,
        jobs: [],
        updatedAt: new Date().toISOString()
      };
    }
    // Prepend custom job
    recs.jobs.unshift(job);
    recs.updatedAt = new Date().toISOString();
    this.upsertJobs(recs);
    return job;
  }

  // --- Interview Sessions ---
  getInterviewSessions(userId: string): MockInterviewSession[] {
    return this.data.interviews.filter(i => i.userId === userId);
  }

  getInterviewSession(sessionId: string): MockInterviewSession | undefined {
    return this.data.interviews.find(i => i.id === sessionId);
  }

  upsertInterviewSession(session: MockInterviewSession): void {
    const idx = this.data.interviews.findIndex(i => i.id === session.id);
    if (idx >= 0) {
      this.data.interviews[idx] = session;
    } else {
      this.data.interviews.push(session);
    }
    this.save();
  }

  // --- Tech Interview (20 Questions on Projects & Tech Skills) ---
  getTechInterviews(userId: string): TechInterviewSession[] {
    return this.data.techInterviews.filter(i => i.userId === userId);
  }

  getTechInterview(sessionId: string): TechInterviewSession | undefined {
    return this.data.techInterviews.find(i => i.id === sessionId);
  }

  upsertTechInterview(session: TechInterviewSession): void {
    const idx = this.data.techInterviews.findIndex(i => i.id === session.id);
    if (idx >= 0) {
      this.data.techInterviews[idx] = session;
    } else {
      this.data.techInterviews.push(session);
    }
    this.save();
  }

  getTechInterviewStats(userId: string): {
    recentScore: number;
    highestScore: number;
    totalSessions: number;
    completedSessions: number;
    questionsAnswered: number;
  } {
    const sessions = this.getTechInterviews(userId);
    const completed = sessions.filter(s => s.status === 'completed');
    
    let recentScore = 0;
    let highestScore = 0;
    let questionsAnswered = 0;

    sessions.forEach(s => {
      s.questions.forEach(q => {
        if (q.userAnswer && q.userAnswer.trim().length > 0) {
          questionsAnswered++;
        }
      });
    });

    if (completed.length > 0) {
      // Sort completed by completedAt / createdAt descending for most recent
      const sortedCompleted = [...completed].sort((a, b) => {
        const timeA = new Date(a.completedAt || a.createdAt).getTime();
        const timeB = new Date(b.completedAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      recentScore = Math.round(sortedCompleted[0].averageScore || 0);
      highestScore = Math.round(Math.max(...completed.map(s => s.averageScore || 0)));
    } else if (sessions.length > 0) {
      // Check if active sessions have partial scores
      const activeWithScores = sessions.filter(s => s.averageScore > 0);
      if (activeWithScores.length > 0) {
        recentScore = Math.round(activeWithScores[activeWithScores.length - 1].averageScore);
        highestScore = Math.round(Math.max(...activeWithScores.map(s => s.averageScore)));
      }
    }

    return {
      recentScore,
      highestScore,
      totalSessions: sessions.length,
      completedSessions: completed.length,
      questionsAnswered
    };
  }

  // --- Progress & Streak Tracking ---
  getProgress(userId: string): ProgressState | undefined {
    return this.data.progress.find(p => p.userId === userId);
  }

  upsertProgress(progress: ProgressState): void {
    const idx = this.data.progress.findIndex(p => p.userId === progress.userId);
    if (idx >= 0) {
      this.data.progress[idx] = progress;
    } else {
      this.data.progress.push(progress);
    }
    this.save();
  }

  recordActivity(
    userId: string,
    activityType: 'task' | 'quiz' | 'interview' | 'resume' = 'task',
    activityTitle: string = 'Completed activity'
  ): StreakState {
    let progress = this.getProgress(userId);
    const todayStr = new Date().toISOString().split('T')[0];

    if (!progress) {
      progress = {
        userId,
        coursesCompleted: [],
        projectsCompleted: [],
        goals: [],
        updatedAt: new Date().toISOString()
      };
    }

    const activityRecord: StreakActivity = {
      type: activityType,
      title: activityTitle,
      timestamp: new Date().toISOString()
    };

    if (!progress.streak) {
      progress.streak = {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: todayStr,
        activityDates: [todayStr],
        recentActivities: [activityRecord]
      };
    } else {
      const streak = progress.streak;
      if (!streak.activityDates) streak.activityDates = [];
      if (!streak.recentActivities) streak.recentActivities = [];

      streak.recentActivities.unshift(activityRecord);
      if (streak.recentActivities.length > 20) {
        streak.recentActivities = streak.recentActivities.slice(0, 20);
      }

      if (streak.lastActiveDate === todayStr) {
        // Already active today, streak count remains active
        if (!streak.activityDates.includes(todayStr)) {
          streak.activityDates.push(todayStr);
        }
      } else if (streak.lastActiveDate) {
        const lastDate = new Date(streak.lastActiveDate + 'T00:00:00Z');
        const todayDate = new Date(todayStr + 'T00:00:00Z');
        const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive consecutive day!
          streak.currentStreak = (streak.currentStreak || 0) + 1;
        } else {
          // Gap of 2 or more days, reset streak to 1
          streak.currentStreak = 1;
        }

        streak.longestStreak = Math.max(streak.longestStreak || 1, streak.currentStreak);
        streak.lastActiveDate = todayStr;
        if (!streak.activityDates.includes(todayStr)) {
          streak.activityDates.push(todayStr);
        }
      } else {
        streak.currentStreak = 1;
        streak.longestStreak = Math.max(streak.longestStreak || 1, 1);
        streak.lastActiveDate = todayStr;
        if (!streak.activityDates.includes(todayStr)) {
          streak.activityDates.push(todayStr);
        }
      }
    }

    progress.updatedAt = new Date().toISOString();
    this.upsertProgress(progress);
    return progress.streak;
  }

  getStreak(userId: string): {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
    activityDates: string[];
    todayActive: boolean;
    recentActivities: StreakActivity[];
  } {
    const progress = this.getProgress(userId);
    const todayStr = new Date().toISOString().split('T')[0];

    if (!progress || !progress.streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
        activityDates: [],
        todayActive: false,
        recentActivities: []
      };
    }

    const streak = progress.streak;
    const todayActive = streak.lastActiveDate === todayStr;

    let currentStreak = streak.currentStreak || 0;
    if (!todayActive && streak.lastActiveDate) {
      const lastDate = new Date(streak.lastActiveDate + 'T00:00:00Z');
      const todayDate = new Date(todayStr + 'T00:00:00Z');
      const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If user hasn't logged an activity yet today, but was active yesterday, their streak is still alive!
      // If more than 1 day missed, the streak has broken.
      if (diffDays > 1) {
        currentStreak = 0;
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(streak.longestStreak || 0, currentStreak),
      lastActiveDate: streak.lastActiveDate || '',
      activityDates: streak.activityDates || [],
      todayActive,
      recentActivities: streak.recentActivities || []
    };
  }
}

export const db = new FileDB();
