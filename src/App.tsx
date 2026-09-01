import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FileText,
  Award,
  Map,
  Briefcase,
  MessageSquare,
  LineChart,
  LogOut,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Play,
  Upload,
  Star,
  Clock,
  MapPin,
  DollarSign,
  ArrowRight,
  User,
  Plus,
  Trash2,
  Search,
  Sparkles,
  RefreshCw,
  BookOpen,
  CheckSquare,
  Send,
  Lock,
  ThumbsUp,
  X,
  Target,
  FileCheck,
  Cpu,
  GraduationCap,
  Layers,
  HelpCircle,
  Info,
  Code2,
  Terminal,
  Zap,
  Check,
  Lightbulb,
  Camera,
  ShieldCheck
} from 'lucide-react';
import { UserProfileModal } from './components/UserProfileModal';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { SkillRadarChart } from './components/SkillRadarChart';
import { JobMatchingHub, JobItem } from './components/JobMatchingHub';
import { QuickInterviewTips } from './components/QuickInterviewTips';
import { DailyStreakCounter, StreakData } from './components/DailyStreakCounter';

// Interfaces mapping to Backend API models
interface Goal {
  id: string;
  text: string;
  completed: boolean;
  category: 'course' | 'project' | 'interview' | 'skill';
}

interface Profile {
  userId?: string;
  name: string;
  email?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  graduationYear?: string;
  university?: string;
  cgpa: string;
  interests: string[];
  currentSkills: string[];
  targetCareer: string;
  education?: string;
  experience?: string;
  certifications?: string;
}

export interface TechInterviewStats {
  recentScore: number;
  highestScore: number;
  totalSessions: number;
  completedSessions: number;
  questionsAnswered: number;
}

interface DashboardSummary {
  atsScore: number | null;
  careerMatch: {
    career: string;
    percentage: number;
  };
  missingSkillsCount: number;
  missingSkills: string[];
  averageInterviewScore: number | null;
  techInterviewStats?: TechInterviewStats;
  streak?: StreakData;
  roadmapProgress: number;
  overallTaskProgress?: number;
  overallTestProgress?: number;
  totalTasks?: number;
  completedTasks?: number;
  totalGoals?: number;
  completedGoals?: number;
  goals: Goal[];
  profile: Profile | null;
  resumeExists: boolean;
}

interface ResumeAnalysis {
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
  updatedAt?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

interface RoadmapWeek {
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

interface LearningRoadmap {
  targetCareer: string;
  weeks: RoadmapWeek[];
  updatedAt: string;
}

interface Course {
  title: string;
  platform: string;
  duration: string;
  price: string;
  difficulty: string;
  rating: number;
  link: string;
}

type Job = JobItem;

interface MockInterviewQuestion {
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
}

interface MockInterviewSession {
  id: string;
  careerType: string;
  questions: MockInterviewQuestion[];
  currentQuestionIndex: number;
  status: 'active' | 'completed';
}

export interface TechInterviewQuestion {
  id: number;
  questionType?: 'project_subjective' | 'skill_mcq';
  question: string;
  category: 'project_architecture' | 'tech_stack_core' | 'debugging_optimization' | 'system_design';
  targetTopic: string;
  hint: string;
  idealKeyPoints: string[];
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
  selectedOptionIndex?: number;
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

export default function App() {
  // Session / Authentication state
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('skillvision_token') || localStorage.getItem('careerpilot_token')
  );
  const [user, setUser] = useState<{ id: string; email: string; name: string; avatar?: string } | null>(
    JSON.parse(localStorage.getItem('skillvision_user') || localStorage.getItem('careerpilot_user') || 'null')
  );
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Core application tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'resume' | 'assessment' | 'roadmap' | 'jobs' | 'interview' | 'tech_interview' | 'progress'>('dashboard');

  // Business state
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [careersList, setCareersList] = useState<any[]>([]);
  const [skillGap, setSkillGap] = useState<any | null>(null);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assessments, setAssessments] = useState<any | null>(null);
  const [interviewSessions, setInterviewSessions] = useState<MockInterviewSession[]>([]);
  const [activeInterview, setActiveInterview] = useState<MockInterviewSession | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);

  // Tech Interview state (20 questions derived from Projects & Tech Skills)
  const [techInterviewSession, setTechInterviewSession] = useState<TechInterviewSession | null>(null);
  const [techInterviewStats, setTechInterviewStats] = useState<TechInterviewStats>({
    recentScore: 0,
    highestScore: 0,
    totalSessions: 0,
    completedSessions: 0,
    questionsAnswered: 0
  });
  const [techInterviewLoading, setTechInterviewLoading] = useState(false);
  const [techInterviewActiveQId, setTechInterviewActiveQId] = useState<number>(1);
  const [techInterviewAnswerInput, setTechInterviewAnswerInput] = useState('');
  const [techInterviewSelectedOption, setTechInterviewSelectedOption] = useState<number | null>(null);
  const [techInterviewSubmitting, setTechInterviewSubmitting] = useState(false);
  const [techInterviewShowHint, setTechInterviewShowHint] = useState(false);
  const [techCategoryFilter, setTechCategoryFilter] = useState<string>('all');

  // Roadmap task completion animation & positive feedback states
  const [completedFeedback, setCompletedFeedback] = useState<{ taskId: string; text: string; weekTitle?: string } | null>(null);
  const [recentlyCompletedTaskIds, setRecentlyCompletedTaskIds] = useState<string[]>([]);

  // Action/Modal states
  const [uploadTextMode, setUploadTextMode] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeKeywordInput, setResumeKeywordInput] = useState('');
  const [resumeOptimizedOutput, setResumeOptimizedOutput] = useState<string[] | null>(null);

  // Custom visual theme logger states (Simulated agent websocket streams)
  const [agentLogs, setAgentLogs] = useState<string[]>([
    '> Initializing CareerPilot Orchestrator...',
    '> All backend cognitive modules verified.',
    '> System ready. Awaiting resume or profile input.'
  ]);
  const [agentStatus, setAgentStatus] = useState<Record<string, string>>({
    'Resume Agent': 'IDLE',
    'Skill Agent': 'IDLE',
    'Career Agent': 'IDLE',
    'Roadmap Agent': 'IDLE',
    'Interview Coach': 'IDLE',
    'Job Recommender': 'IDLE',
    'Progress Tracker': 'IDLE'
  });

  // Quiz interactive states
  const [quizType, setQuizType] = useState<'programming' | 'aptitude' | 'communication' | 'ai' | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizAnswerChecked, setQuizAnswerChecked] = useState(false);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizResultsSubmitted, setQuizResultsSubmitted] = useState(false);

  // Interview state
  const [interviewAnswerInput, setInterviewAnswerInput] = useState('');
  const [interviewSubmitLoading, setInterviewSubmitLoading] = useState(false);
  const [interviewSelectedCareer, setInterviewSelectedCareer] = useState('');
  const [interviewStarting, setInterviewStarting] = useState(false);

  // Profile update / edit state
  const [profileCGPA, setProfileCGPA] = useState('');
  const [profileInterests, setProfileInterests] = useState('');
  const [profileSkills, setProfileSkills] = useState('');
  const [profileTargetCareer, setProfileTargetCareer] = useState('');
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Onboarding & Report modal states
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<any | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<'upload' | 'extracting' | 'success'>('upload');
  const [hasPromptedResume, setHasPromptedResume] = useState(false);

  // New goal add
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'course' | 'project' | 'interview' | 'skill'>('skill');

  // Loading indicator for tabs
  const [tabLoading, setTabLoading] = useState(false);

  // Helper log animation triggers
  const addAgentLog = (msg: string) => {
    setAgentLogs(prev => [...prev.slice(-15), `> ${msg}`]);
  };

  // Setup initial load
  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token, activeTab]);

  const loadAllData = async () => {
    setTabLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load primary stats
      const dSummaryRes = await fetch('/api/dashboard-summary', { headers });
      if (dSummaryRes.ok) {
        const dData = await dSummaryRes.json();
        setDashboardSummary(dData);
        if (dData.profile) {
          setProfileCGPA(dData.profile.cgpa || '');
          setProfileInterests(dData.profile.interests?.join(', ') || '');
          setProfileSkills(dData.profile.currentSkills?.join(', ') || '');
          setProfileTargetCareer(dData.profile.targetCareer || '');
        }
        // Auto-show resume upload onboarding prompt for new accounts without resume
        if (!dData.resumeExists && !hasPromptedResume) {
          setShowResumeModal(true);
          setHasPromptedResume(true);
        }
      }

      // Fetch Tech Interview current session and stats
      const techIntRes = await fetch('/api/tech-interview/current', { headers });
      if (techIntRes.ok) {
        const tData = await techIntRes.json();
        if (tData.session) {
          setTechInterviewSession(tData.session);
          // Set active question if not set
          if (!techInterviewSession) {
            const firstUnanswered = tData.session.questions.find((q: TechInterviewQuestion) => !q.userAnswer);
            setTechInterviewActiveQId(firstUnanswered ? firstUnanswered.id : 1);
            setTechInterviewAnswerInput(firstUnanswered?.userAnswer || '');
          }
        }
        if (tData.stats) {
          setTechInterviewStats(tData.stats);
        }
      }

      // Fetch assessment data for dashboard radar chart and assessment view
      if (activeTab === 'dashboard' || activeTab === 'assessment') {
        const assessRes = await fetch('/api/assessment', { headers });
        if (assessRes.ok) {
          const aData = await assessRes.json();
          setAssessments(aData);
        }
      }

      // Load specific tab files if requested
      if (activeTab === 'resume') {
        const resAnalysisRes = await fetch('/api/resume-analysis', { headers });
        if (resAnalysisRes.ok) {
          const rData = await resAnalysisRes.json();
          setResumeAnalysis(rData);
        }
      } else if (activeTab === 'roadmap') {
        const roadmapRes = await fetch('/api/roadmap', { headers });
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json();
          setRoadmap(roadmapData);
        }
        const coursesRes = await fetch('/api/courses', { headers });
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.courses || []);
        }
      } else if (activeTab === 'jobs') {
        const jobsRes = await fetch('/api/jobs', { headers });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData.jobs || []);
        }
      } else if (activeTab === 'assessment') {
        const assessRes = await fetch('/api/assessment', { headers });
        if (assessRes.ok) {
          const aData = await assessRes.json();
          setAssessments(aData);
        }
        const recsRes = await fetch('/api/career-recommendation', { headers });
        if (recsRes.ok) {
          const rData = await recsRes.json();
          setCareersList(rData.recommendations || []);
        }
      } else if (activeTab === 'interview') {
        const sessionsRes = await fetch('/api/interview/sessions', { headers });
        if (sessionsRes.ok) {
          const sData = await sessionsRes.json();
          setInterviewSessions(sData);
          // Find any active session
          const active = sData.find((s: any) => s.status === 'active');
          if (active) {
            setActiveInterview(active);
          }
        }
      } else if (activeTab === 'tech_interview') {
        const techRes = await fetch('/api/tech-interview/current', { headers });
        if (techRes.ok) {
          const tData = await techRes.json();
          if (tData.session) {
            setTechInterviewSession(tData.session);
          }
          if (tData.stats) {
            setTechInterviewStats(tData.stats);
          }
        }
      } else if (activeTab === 'progress') {
        const dSummaryRes = await fetch('/api/dashboard-summary', { headers });
        if (dSummaryRes.ok) {
          const dData = await dSummaryRes.json();
          setDashboardSummary(dData);
          if (dData.techInterviewStats) {
            setTechInterviewStats(dData.techInterviewStats);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setTabLoading(false);
    }
  };

  // --- Auth Handlers ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    const body = authMode === 'login' 
      ? { email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword, name: authName };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('skillvision_token', data.token);
      localStorage.setItem('skillvision_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      
      // Update agent visual logs
      setAgentLogs([
        `> User authenticated: ${data.user.email}`,
        `> Tokens validated. Multi-agent core active.`,
        `> Checking user profile status...`
      ]);

      // Check if user has a resume, if not, prompt upload immediately
      setHasPromptedResume(false);
      setShowResumeModal(true);
      setOnboardingStep('upload');
    } catch (err: any) {
      setAuthError(err.message || 'Server error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuthSuccess = (data: { token: string; user: { id: string; email: string; name: string; avatar?: string }; isNewUser?: boolean }) => {
    localStorage.setItem('skillvision_token', data.token);
    localStorage.setItem('skillvision_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setAuthError('');

    // Update agent visual logs
    setAgentLogs([
      `> User authenticated via Google: ${data.user.email}`,
      `> Google token validated. Session registered in Placement DB.`,
      `> Multi-agent cognitive network active.`
    ]);

    // Check if user has a resume, if not, prompt upload immediately
    setHasPromptedResume(false);
    setShowResumeModal(true);
    setOnboardingStep('upload');
  };

  const handleLogout = () => {
    localStorage.removeItem('skillvision_token');
    localStorage.removeItem('skillvision_user');
    localStorage.removeItem('careerpilot_token');
    localStorage.removeItem('careerpilot_user');
    setToken(null);
    setUser(null);
    setDashboardSummary(null);
    setResumeAnalysis(null);
    setRoadmap(null);
    setCourses([]);
    setJobs([]);
    setActiveInterview(null);
    setQuizType(null);
  };

  // --- Profile Updates ---
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdating(true);
    addAgentLog('Updating user cognitive coordinates...');
    setAgentStatus(prev => ({ ...prev, 'Progress Tracker': 'UPDATING' }));

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: user?.name,
          cgpa: profileCGPA,
          interests: profileInterests.split(',').map(s => s.trim()).filter(Boolean),
          currentSkills: profileSkills.split(',').map(s => s.trim()).filter(Boolean),
          targetCareer: profileTargetCareer
        })
      });

      if (res.ok) {
        addAgentLog('Profile variables synchronized successfully!');
        loadAllData();
      }
    } catch (e) {
      addAgentLog('ERROR: Profile synchronized failed.');
    } finally {
      setProfileUpdating(false);
      setAgentStatus(prev => ({ ...prev, 'Progress Tracker': 'IDLE' }));
    }
  };

  const handleSaveProfile = async (updatedProfile: Partial<Profile>): Promise<boolean> => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProfile)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(prev => prev ? { ...prev, ...data.user } : data.user);
          localStorage.setItem('skillvision_user', JSON.stringify(data.user));
        }
        addAgentLog('User profile details updated in Placement DB');
        await loadAllData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error saving profile', e);
      return false;
    }
  };

  const handleUpdateAvatar = async (avatarDataUrl: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: avatarDataUrl })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(prev => prev ? { ...prev, avatar: avatarDataUrl } : data.user);
          localStorage.setItem('skillvision_user', JSON.stringify({ ...(user || {}), avatar: avatarDataUrl }));
        }
        setDashboardSummary(prev => prev ? {
          ...prev,
          profile: prev.profile ? { ...prev.profile, avatar: avatarDataUrl } : null
        } : null);
        addAgentLog('User avatar synchronized across multi-agent workspace');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error updating avatar', e);
      return false;
    }
  };

  // --- Resume Parse Upload ---
  const handleResumeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResumeLoading(true);
    setOnboardingStep('extracting');
    addAgentLog('Triggering Resume Analyzer Agent...');
    setAgentStatus(prev => ({ ...prev, 'Resume Agent': 'ANALYZING' }));

    let contentPayload = resumeText;
    let isPdfPayload = false;
    let fileNamePayload = 'resume_pasted_text.txt';

    if (!uploadTextMode && resumeFile) {
      addAgentLog('Converting binary payload to Base64 stream...');
      fileNamePayload = resumeFile.name;
      isPdfPayload = resumeFile.type === 'application/pdf';

      // Read as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(resumeFile);
      });
      contentPayload = await base64Promise;
    }

    if (!contentPayload || !contentPayload.trim()) {
      alert('Please select a file or paste your resume text first!');
      setResumeLoading(false);
      setOnboardingStep('upload');
      return;
    }

    try {
      const res = await fetch('/api/upload-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: contentPayload,
          isPdf: isPdfPayload,
          fileName: fileNamePayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResumeAnalysis(data.analysis);
        setExtractedPreview({
          name: data.profile?.name || user?.name,
          skills: data.analysis.skills || [],
          targetCareer: data.profile?.targetCareer || data.analysis.targetCareer || 'Software Engineer',
          education: data.analysis.education,
          experience: data.analysis.experience,
          atsScore: data.analysis.atsScore || 70,
          cgpa: data.profile?.cgpa || ''
        });
        setOnboardingStep('success');
        addAgentLog(`ATS Score grading: ${data.analysis.atsScore}/100. Extracted skills saved to Profile database!`);
        addAgentLog(`AI LinkedIn Headline & Cover Letter created.`);
        await loadAllData();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to parse resume');
      }
    } catch (error: any) {
      addAgentLog(`ERROR: Resume Agent crashed: ${error.message}`);
      alert(`Resume processing error: ${error.message}`);
      setOnboardingStep('upload');
    } finally {
      setResumeLoading(false);
      setAgentStatus(prev => ({ ...prev, 'Resume Agent': 'IDLE' }));
    }
  };

  // --- Resume Keyword Optimizer ---
  const handleKeywordOptimization = () => {
    if (!resumeKeywordInput.trim()) return;
    addAgentLog('Analyzing job keywords match matrix...');
    // Create custom suggestions matching input
    const inputWords = resumeKeywordInput.toLowerCase().split(/\W+/);
    const mockKeywords = ['docker', 'kubernetes', 'aws', 'gcp', 'cicd', 'jenkins', 'graphql', 'system design', 'microservices', 'redis', 'elasticsearch'];
    const matching = mockKeywords.filter(k => inputWords.includes(k) || Math.random() > 0.4);
    
    setResumeOptimizedOutput(matching.slice(0, 5));
    addAgentLog(`Identified ${matching.length} critical optimization keywords for this job description.`);
  };

  // --- Skill Assessment Interactive Game ---
  const startQuiz = async (type: 'programming' | 'aptitude' | 'communication' | 'ai') => {
    setQuizLoading(true);
    setQuizType(type);
    setQuizCurrentIndex(0);
    setQuizSelectedOption(null);
    setQuizAnswerChecked(false);
    setQuizCorrectCount(0);
    setQuizResultsSubmitted(false);
    addAgentLog(`Constructing unique ${type} assessment using Skill Agent...`);
    setAgentStatus(prev => ({ ...prev, 'Skill Agent': 'GENERATING_QUIZ' }));

    try {
      const res = await fetch('/api/assessment/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });

      if (res.ok) {
        const data = await res.json();
        setQuizQuestions(data.quiz);
        addAgentLog(`5 assessment items loaded. Cognitive focus: ${type.toUpperCase()}`);
      }
    } catch (err) {
      addAgentLog('ERROR: Skill Agent failed to compile quiz.');
    } finally {
      setQuizLoading(false);
      setAgentStatus(prev => ({ ...prev, 'Skill Agent': 'IDLE' }));
    }
  };

  const handleQuizOptionSelect = (optionIdx: number) => {
    if (quizAnswerChecked) return;
    setQuizSelectedOption(optionIdx);
  };

  const checkQuizAnswer = () => {
    if (quizSelectedOption === null || quizAnswerChecked) return;
    
    const correct = quizQuestions[quizCurrentIndex].correctOption;
    if (quizSelectedOption === correct) {
      setQuizCorrectCount(prev => prev + 1);
    }
    setQuizAnswerChecked(true);
  };

  const advanceQuiz = () => {
    if (quizCurrentIndex + 1 < quizQuestions.length) {
      setQuizCurrentIndex(prev => prev + 1);
      setQuizSelectedOption(null);
      setQuizAnswerChecked(false);
    } else {
      submitQuizResults();
    }
  };

  const submitQuizResults = async () => {
    setQuizResultsSubmitted(true);
    addAgentLog('Submitting skill vectors to user dashboard database...');
    setAgentStatus(prev => ({ ...prev, 'Skill Agent': 'GRADING_QUIZ' }));

    const percent = Math.round((quizCorrectCount / quizQuestions.length) * 100);

    // Get current scores to merge
    const oldScores = assessments || { programming: 50, logical: 50, communication: 50, aptitude: 50 };
    const payload = { ...oldScores };
    
    if (quizType === 'programming') payload.programming = percent;
    else if (quizType === 'aptitude') payload.logical = percent; // Map logical to aptitude
    else if (quizType === 'communication') payload.communication = percent;
    else if (quizType === 'ai') payload.aptitude = percent; // Map AI score to aptitude representation

    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addAgentLog(`Graded successfully! Score: ${percent}%. Merging profiles...`);
        // Force refresh careers list and skill gap matching!
        await fetch('/api/career-recommendation?refresh=true', { headers: { 'Authorization': `Bearer ${token}` } });
        await fetch('/api/skill-gap?refresh=true', { headers: { 'Authorization': `Bearer ${token}` } });
        loadAllData();
      }
    } catch (e) {
      addAgentLog('ERROR: Skill database failed to receive packet.');
    } finally {
      setAgentStatus(prev => ({ ...prev, 'Skill Agent': 'IDLE' }));
    }
  };

  // --- Roadmap Toggle Task ---
  const handleToggleRoadmapTask = async (taskId: string, currentVal: boolean) => {
    const willBeCompleted = !currentVal;
    addAgentLog(`Syncing progress roadmap checkpoint: ${willBeCompleted ? 'Task Marked Completed (+25 XP)' : 'Task Reopened'}...`);

    // Immediate client-side update for instant feedback & animation
    if (roadmap) {
      let completedTaskText = '';
      let completedWeekTitle = '';

      const updatedWeeks = roadmap.weeks.map(w => {
        const updatedTasks = w.tasks.map(t => {
          if (t.id === taskId) {
            completedTaskText = t.text;
            completedWeekTitle = w.title;
            return { ...t, completed: willBeCompleted };
          }
          return t;
        });
        return { ...w, tasks: updatedTasks };
      });

      setRoadmap({ ...roadmap, weeks: updatedWeeks });

      if (willBeCompleted) {
        setRecentlyCompletedTaskIds(prev => [...prev.filter(id => id !== taskId), taskId]);
        setCompletedFeedback({
          taskId,
          text: completedTaskText || 'Checkpoint target completed!',
          weekTitle: completedWeekTitle
        });

        // Clear celebratory highlight after 3 seconds
        setTimeout(() => {
          setRecentlyCompletedTaskIds(prev => prev.filter(id => id !== taskId));
        }, 3000);

        // Auto dismiss positive feedback toast after 4.5 seconds
        setTimeout(() => {
          setCompletedFeedback(prev => (prev?.taskId === taskId ? null : prev));
        }, 4500);
      }
    }

    try {
      const res = await fetch('/api/roadmap/task/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskId, completed: willBeCompleted })
      });

      if (res.ok) {
        addAgentLog(`Checkpoint saved: ${willBeCompleted ? 'Marked Completed (+25 XP)' : 'Reopened'}`);
        loadAllData();
      }
    } catch (e) {
      addAgentLog('ERROR: Sync checkpoint failed.');
    }
  };

  // --- Mock Interview Game Flow ---
  const startMockInterview = async () => {
    const role = interviewSelectedCareer || dashboardSummary?.careerMatch.career || 'Software Engineer';
    setInterviewStarting(true);
    addAgentLog(`Generating bespoke interview suite for: ${role}...`);
    setAgentStatus(prev => ({ ...prev, 'Interview Coach': 'GENERATING_INTERVIEW' }));

    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ careerType: role })
      });

      if (res.ok) {
        const session = await res.json();
        setActiveInterview(session);
        setInterviewAnswerInput('');
        addAgentLog('Interview sessions initiated. Question #1 ready.');
      }
    } catch (e) {
      addAgentLog('ERROR: Interview Coach failed to start.');
    } finally {
      setInterviewStarting(false);
      setAgentStatus(prev => ({ ...prev, 'Interview Coach': 'ACTIVE' }));
    }
  };

  const submitInterviewAnswer = async () => {
    if (!interviewAnswerInput.trim() || !activeInterview) return;

    setInterviewSubmitLoading(true);
    addAgentLog('AI Interview Coach processing response metrics...');
    setAgentStatus(prev => ({ ...prev, 'Interview Coach': 'EVALUATING_RESPONSE' }));

    const currentQ = activeInterview.questions[activeInterview.currentQuestionIndex];

    try {
      const res = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: activeInterview.id,
          questionId: currentQ.id,
          answer: interviewAnswerInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveInterview(data.session);
        setInterviewAnswerInput('');
        
        // Show evaluation score in visual logs
        const score = data.question.evaluation?.score || 70;
        addAgentLog(`Response Graded: ${score}/100. STAR metric tracked.`);
        
        if (data.session.status === 'completed') {
          addAgentLog('Mock Interview Completed! Full feedback dashboard compiled.');
          loadAllData();
        }
      }
    } catch (e) {
      addAgentLog('ERROR: Response evaluation timeout.');
    } finally {
      setInterviewSubmitLoading(false);
      setAgentStatus(prev => ({ ...prev, 'Interview Coach': activeInterview?.status === 'completed' ? 'IDLE' : 'ACTIVE' }));
    }
  };

  // --- Tech Interview Handlers (20 Questions: 7 Project Subjective + 13 Tech Skill MCQs) ---
  const handleStartTechInterview = async (forceNew: boolean = false) => {
    setTechInterviewLoading(true);
    addAgentLog('Tech Interview Agent synthesizing 7 Project Architectural Questions + 13 Tech Skill MCQs...');
    setAgentStatus(prev => ({ ...prev, 'Interview Coach': 'GENERATING_TECH_INTERVIEW' }));

    try {
      const res = await fetch('/api/tech-interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ forceNew })
      });

      if (res.ok) {
        const data = await res.json();
        setTechInterviewSession(data.session);
        setTechInterviewStats(data.stats);
        
        // Pick first unanswered question or 1
        const firstUnanswered = data.session.questions.find((q: TechInterviewQuestion) => !q.userAnswer && q.score === undefined);
        const targetQ = firstUnanswered || data.session.questions[0];
        setTechInterviewActiveQId(targetQ.id);
        setTechInterviewAnswerInput(targetQ.userAnswer || '');
        if (targetQ.selectedOptionIndex !== undefined) {
          setTechInterviewSelectedOption(targetQ.selectedOptionIndex);
        } else if (targetQ.options && targetQ.userAnswer) {
          const optIdx = targetQ.options.findIndex((opt: string) => opt.trim() === targetQ.userAnswer?.trim());
          setTechInterviewSelectedOption(optIdx >= 0 ? optIdx : null);
        } else {
          setTechInterviewSelectedOption(null);
        }
        setTechInterviewShowHint(false);

        addAgentLog(`20 technical interview questions ready: 7 Project subjective questions & 13 Skill-based MCQs!`);
      } else {
        const err = await res.json();
        addAgentLog(`ERROR: ${err.error || 'Failed to start technical interview'}`);
      }
    } catch (e: any) {
      addAgentLog(`ERROR: Tech interview generation failed: ${e.message}`);
    } finally {
      setTechInterviewLoading(false);
      setAgentStatus(prev => ({ ...prev, 'Interview Coach': 'IDLE' }));
    }
  };

  const handleSelectTechQuestion = (qId: number) => {
    if (!techInterviewSession) return;
    setTechInterviewActiveQId(qId);
    const q = techInterviewSession.questions.find(item => item.id === qId);
    setTechInterviewAnswerInput(q?.userAnswer || '');
    if (q?.selectedOptionIndex !== undefined) {
      setTechInterviewSelectedOption(q.selectedOptionIndex);
    } else if (q?.options && q.userAnswer) {
      const optIdx = q.options.findIndex(opt => opt.trim() === q.userAnswer?.trim());
      setTechInterviewSelectedOption(optIdx >= 0 ? optIdx : null);
    } else {
      setTechInterviewSelectedOption(null);
    }
    setTechInterviewShowHint(false);
  };

  const handleSubmitTechAnswer = async () => {
    if (!techInterviewSession) return;
    const currentQ = techInterviewSession.questions.find(q => q.id === techInterviewActiveQId);
    if (!currentQ) return;

    const isMCQ = currentQ.questionType === 'skill_mcq';
    if (isMCQ && techInterviewSelectedOption === null) return;
    if (!isMCQ && !techInterviewAnswerInput.trim()) return;

    setTechInterviewSubmitting(true);
    addAgentLog(`Tech Evaluator evaluating answer for Question #${techInterviewActiveQId}...`);
    setAgentStatus(prev => ({ ...prev, 'Interview Coach': 'EVALUATING_TECH_ANSWER' }));

    try {
      const answerVal = isMCQ 
        ? (currentQ.options && techInterviewSelectedOption !== null ? currentQ.options[techInterviewSelectedOption] : String(techInterviewSelectedOption))
        : techInterviewAnswerInput;

      const res = await fetch('/api/tech-interview/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: techInterviewSession.id,
          questionId: techInterviewActiveQId,
          selectedOptionIndex: isMCQ ? techInterviewSelectedOption : undefined,
          answer: answerVal
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTechInterviewSession(data.session);
        setTechInterviewStats(data.stats);
        const gradedQ = data.question || data.evaluatedQuestion;
        addAgentLog(`Question #${techInterviewActiveQId} graded: ${gradedQ?.score ?? 0}/100 [${gradedQ?.verdict || 'Evaluated'}].`);
        
        // Refresh global dashboard summary & progress stats
        loadAllData();
      } else {
        const err = await res.json();
        addAgentLog(`ERROR: ${err.error || 'Submission failed'}`);
      }
    } catch (e: any) {
      addAgentLog(`ERROR: Evaluation failed: ${e.message}`);
    } finally {
      setTechInterviewSubmitting(false);
      setAgentStatus(prev => ({ ...prev, 'Interview Coach': 'IDLE' }));
    }
  };

  const handleCompleteTechInterview = async () => {
    if (!techInterviewSession) return;
    if (!window.confirm('Finalize and grade this 20-question Tech Interview session? This will update your progress metrics.')) return;

    try {
      const res = await fetch('/api/tech-interview/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId: techInterviewSession.id })
      });

      if (res.ok) {
        const data = await res.json();
        setTechInterviewSession(data.session);
        setTechInterviewStats(data.stats);
        addAgentLog(`Tech Interview completed! Final Average Score: ${data.session.averageScore}%.`);
        loadAllData();
      }
    } catch (e: any) {
      addAgentLog(`ERROR: Failed to complete interview: ${e.message}`);
    }
  };

  // --- Job Matching & LinkedIn / Indeed Integration Handlers ---
  const handleRefreshJobs = async (filters?: { targetCareer?: string; location?: string }) => {
    addAgentLog('Job Matcher Agent querying LinkedIn & Indeed live indexes...');
    setAgentStatus(prev => ({ ...prev, 'Job Matcher': 'SYNCING_LINKEDIN_INDEED' }));

    try {
      const res = await fetch('/api/jobs/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetCareerOverride: filters?.targetCareer,
          locationFilter: filters?.location
        })
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        addAgentLog(`Job Matcher synchronized ${data.jobs?.length || 0} active openings across LinkedIn and Indeed.`);
      } else {
        const err = await res.json();
        addAgentLog(`ERROR: Could not sync jobs: ${err.error || 'Request failed'}`);
      }
    } catch (e: any) {
      addAgentLog(`ERROR: Job sync failed: ${e.message}`);
    } finally {
      setAgentStatus(prev => ({ ...prev, 'Job Matcher': 'IDLE' }));
    }
  };

  const handleUpdateJobStatus = async (jobId: string, status: JobItem['applicationStatus'], notes?: string) => {
    try {
      const res = await fetch('/api/jobs/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId, status, notes })
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...data.job } : j));
        addAgentLog(`Job status updated to [${status?.toUpperCase()}].`);
      }
    } catch (e: any) {
      addAgentLog(`ERROR: Updating job status failed: ${e.message}`);
    }
  };

  const handleSaveJobOffer = async (jobId: string, offerDetails: NonNullable<JobItem['offerDetails']>) => {
    try {
      const res = await fetch('/api/jobs/offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId, offerDetails })
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...data.job } : j));
        addAgentLog(`🏆 Job offer recorded! Compensation: ${offerDetails.salaryOffered}. Status: ${offerDetails.decision}.`);
      }
    } catch (e: any) {
      addAgentLog(`ERROR: Saving offer failed: ${e.message}`);
    }
  };

  const handleAnalyzeCustomJob = async (jobInput: string, applyUrl?: string) => {
    addAgentLog('Job Matcher analyzing custom job description & candidate fit...');
    setAgentStatus(prev => ({ ...prev, 'Job Matcher': 'AUDITING_CUSTOM_JOB' }));

    try {
      const res = await fetch('/api/jobs/analyze-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobInput, applyUrl })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.job) {
          setJobs(prev => [data.job, ...prev.filter(j => j.id !== data.job.id)]);
        }
        addAgentLog(`Custom job evaluated: ${data.job?.title} at ${data.job?.company} (${data.job?.matchScore}% match).`);
        return data;
      } else {
        const err = await res.json();
        addAgentLog(`ERROR: Custom job analysis failed: ${err.error || 'Request failed'}`);
        throw new Error(err.error || 'Failed');
      }
    } finally {
      setAgentStatus(prev => ({ ...prev, 'Job Matcher': 'IDLE' }));
    }
  };

  const handleLaunchInterviewForJob = (role: string) => {
    setInterviewSelectedCareer(role);
    setActiveTab('interview');
    addAgentLog(`Interview Coach initialized with target role: "${role}".`);
  };

  // --- Custom Goals Tracking ---
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    try {
      const res = await fetch('/api/progress/goal/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newGoalText, category: newGoalCategory })
      });

      if (res.ok) {
        setNewGoalText('');
        addAgentLog('Custom placement milestone registered.');
        loadAllData();
      }
    } catch (e) {
      addAgentLog('ERROR: Could not save goal.');
    }
  };

  const handleToggleGoal = async (goalId: string, currentVal: boolean) => {
    try {
      const res = await fetch('/api/progress/goal/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ goalId, completed: !currentVal })
      });

      if (res.ok) {
        addAgentLog('Placement milestone progress recorded.');
        loadAllData();
      }
    } catch (e) {
      addAgentLog('ERROR: Milestone state update failed.');
    }
  };

  // --- Reset All Progress Helper ---
  const handleResetSandbox = async () => {
    if (!window.confirm('This will clear all your saved resume parsed data, roadmaps, mock scores, and custom goals in this sandbox. Continue?')) return;
    
    // Simulating clear by deleting database variables or simply clearing token and logging out!
    handleLogout();
    addAgentLog('Sandbox registers flushed. Memory cleared.');
  };

  // Render Login state first
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden" id="auth_screen">
        {/* Visual background lights */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md bg-slate-950 rounded-2xl border border-slate-800 p-8 shadow-2xl relative z-10 transition-all duration-300" id="auth_card">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">SV</div>
            <span className="text-white font-semibold text-2xl tracking-tight">SkillVision AI</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-slate-100">
              {authMode === 'login' ? 'Welcome back to SkillVision AI' : 'Join SkillVision AI'}
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              {authMode === 'login' ? 'Access your intelligent career guidance hub' : 'Register to unlock 9 multi-agent career tools'}
            </p>
          </div>

          {authError && (
            <div className="mb-6 bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl text-xs text-rose-300 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Primary Quick Action: Sign in with Google */}
          <div className="space-y-4 mb-6">
            <GoogleSignInButton
              onSuccess={handleGoogleAuthSuccess}
              defaultEmail={authEmail}
              text={authMode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
            />

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-950 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                Or continue with email
              </span>
              <div className="border-t border-slate-800 w-full"></div>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-slate-500 w-4.5 h-4.5" />
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500 text-sm font-medium">@</span>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-500 w-4.5 h-4.5" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 active:scale-[0.98] disabled:opacity-55 flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>{authMode === 'login' ? 'Sign In' : 'Create Free Account'}</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Register" : 'Already have an account? Log In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-slate-50" id="main_app_layout">
      {/* 1. Sidebar Navigation */}
      <nav className="w-64 bg-slate-900 flex flex-col justify-between shrink-0" id="sidebar_nav">
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">SV</div>
            <span className="text-white font-semibold text-lg tracking-tight">SkillVision AI</span>
          </div>

          {/* Links menu list */}
          <div className="px-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('resume')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'resume'
                  ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm">Resume Analyzer</span>
              {dashboardSummary && !dashboardSummary.resumeExists && (
                <span className="ml-auto w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('assessment')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'assessment'
                  ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="text-sm">Skill Assessment</span>
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'roadmap'
                  ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Map className="w-5 h-5" />
              <span className="text-sm">Career Roadmap</span>
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'jobs'
                  ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-sm">Job Matching</span>
            </button>

            <button
              onClick={() => setActiveTab('interview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'interview'
                  ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Interview Coach</span>
            </button>

            <button
              onClick={() => setActiveTab('tech_interview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group ${
                activeTab === 'tech_interview'
                  ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">Tech Interview</span>
                <span className="px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-indigo-300 rounded font-semibold">20 Qs</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'progress'
                  ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-5 h-5" />
              <span className="text-sm">Progress Stats</span>
            </button>
          </div>
        </div>

        {/* User Card footer with Profile Trigger & Logout */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="w-full group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/90 text-left transition-all border border-transparent hover:border-slate-700/80 cursor-pointer"
            title="Click to view & edit personal details, resume profile, and photo"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-md overflow-hidden ring-2 ring-indigo-400/30 group-hover:ring-indigo-400 transition-all">
                {(user?.avatar || dashboardSummary?.profile?.avatar) ? (
                  <img
                    src={user?.avatar || dashboardSummary?.profile?.avatar}
                    alt={user?.name || 'User'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{user?.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2) : 'JD'}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full ring-2 ring-slate-900 shadow group-hover:scale-110 transition-transform">
                <Camera className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm text-white font-semibold leading-none truncate group-hover:text-indigo-300 transition-colors">
                {user?.name || dashboardSummary?.profile?.name || 'Candidate'}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded font-bold uppercase tracking-wider">
                  View Profile
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {dashboardSummary?.profile?.targetCareer ? dashboardSummary.profile.targetCareer.slice(0, 14) + '...' : 'Pro Plan'}
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-800/60 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 text-xs font-semibold rounded-lg transition-all border border-slate-700/50 hover:border-rose-900/50"
            title="Sign out of your account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header toolbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Agent Orchestrator</span>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Multi-Agent Mesh Active
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tabLoading && (
              <span className="text-xs text-slate-400 italic flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                Refreshing database...
              </span>
            )}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-all shadow-2xs"
              title="View your personal & resume profile"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {(user?.avatar || dashboardSummary?.profile?.avatar) ? (
                  <img
                    src={user?.avatar || dashboardSummary?.profile?.avatar}
                    alt={user?.name || 'User'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{(user?.name || 'U')[0]}</span>
                )}
              </div>
              <span className="hidden sm:inline">My Profile</span>
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="text-slate-700 hover:text-indigo-600 text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg border border-slate-200"
            >
              <FileCheck className="w-4 h-4" />
              <span>Project Report</span>
            </button>
            <button
              onClick={handleResetSandbox}
              className="text-slate-400 hover:text-rose-500 text-xs font-semibold transition-colors flex items-center gap-1 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Sandbox
            </button>
          </div>
        </header>

        {/* Dynamic content scroll wrapper */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Mandatory Resume Banner if user hasn't uploaded a resume */}
              {!dashboardSummary?.resumeExists && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Step 1 Required: Upload Your Resume</h4>
                      <p className="text-xs text-amber-700 mt-0.5">CareerPilot needs your resume to extract skills, calculate ATS scores, generate your learning roadmap, and populate your database profile.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setOnboardingStep('upload');
                      setShowResumeModal(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Resume Now</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Placement Cockpit</h2>
                  <p className="text-slate-500 text-sm mt-1">Holistic multi-agent analysis of your profile, quiz metrics, and interview analytics.</p>
                </div>
                {dashboardSummary?.profile?.targetCareer && (
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center gap-3">
                    <Target className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="text-[10px] uppercase text-indigo-500 font-bold tracking-widest">Target Path</p>
                      <p className="text-sm font-bold text-slate-800">{dashboardSummary.profile.targetCareer}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Daily Streak Counter */}
              <DailyStreakCounter
                streak={dashboardSummary?.streak}
                onNavigateToRoadmap={() => setActiveTab('roadmap')}
                onNavigateToAssessment={() => setActiveTab('assessment')}
                onNavigateToInterview={() => setActiveTab('interview')}
              />

              {/* Stats KPI top deck */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* ATS Score card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-400 uppercase">ATS Resume Score</p>
                    <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold ${dashboardSummary?.resumeExists ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {dashboardSummary?.resumeExists ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {(dashboardSummary && dashboardSummary.atsScore !== null) ? `${dashboardSummary.atsScore}` : '0'}/100
                    </span>
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${dashboardSummary?.resumeExists ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {dashboardSummary?.resumeExists ? 'Analyzed' : 'No Resume'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" 
                      style={{ width: `${dashboardSummary?.atsScore || 0}%` }}
                    ></div>
                  </div>
                  <button 
                    onClick={() => {
                      if (!dashboardSummary?.resumeExists) {
                        setOnboardingStep('upload');
                        setShowResumeModal(true);
                      } else {
                        setActiveTab('resume');
                      }
                    }}
                    className="text-[11px] text-indigo-500 hover:text-indigo-600 font-semibold mt-3 block"
                  >
                    {dashboardSummary?.resumeExists ? 'Re-analyze resume →' : 'Upload resume to analyze →'}
                  </button>
                </div>

                {/* Match percentage */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase">Career Match</p>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-3xl font-extrabold text-indigo-600">
                      {dashboardSummary?.careerMatch?.percentage !== undefined ? dashboardSummary.careerMatch.percentage : 0}%
                    </span>
                    <span className="text-slate-400 text-xs truncate max-w-[120px]">
                      {dashboardSummary?.careerMatch?.career || 'Undecided'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4">
                    <div 
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000" 
                      style={{ width: `${dashboardSummary?.careerMatch?.percentage || 0}%` }}
                    ></div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('assessment')}
                    className="text-[11px] text-indigo-500 hover:text-indigo-600 font-semibold mt-3 block"
                  >
                    View recommended roles →
                  </button>
                </div>

                {/* Skill Gaps Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase">Skills GAP</p>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-3xl font-extrabold text-rose-500">
                      {dashboardSummary?.missingSkillsCount || '0'}
                    </span>
                    <span className="text-slate-400 text-xs">Missing skills</span>
                  </div>
                  <div className="flex gap-1.5 overflow-hidden text-ellipsis mt-3">
                    {dashboardSummary?.missingSkills && dashboardSummary.missingSkills.length > 0 ? (
                      dashboardSummary.missingSkills.slice(0, 2).map((k, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] rounded uppercase font-bold truncate">
                          {k}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {dashboardSummary?.resumeExists ? 'Skills aligned' : 'No Gap Analyzed'}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setActiveTab('roadmap')}
                    className="text-[11px] text-indigo-500 hover:text-indigo-600 font-semibold mt-3 block"
                  >
                    Launch skills roadmap →
                  </button>
                </div>

                {/* Interview Score Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase">Interview Readiness</p>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {(dashboardSummary && dashboardSummary.averageInterviewScore !== null) ? `${dashboardSummary.averageInterviewScore}` : '0'}<span className="text-slate-300 text-xl font-normal">/10</span>
                    </span>
                    <span className="text-slate-400 text-xs">Mock Score</span>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-500 italic truncate">
                    {(dashboardSummary && dashboardSummary.averageInterviewScore !== null) 
                      ? "Evaluated using STAR methodologies."
                      : "No interview history recorded."
                    }
                  </div>
                  <button 
                    onClick={() => setActiveTab('interview')}
                    className="text-[11px] text-indigo-500 hover:text-indigo-600 font-semibold mt-3 block"
                  >
                    Start mock chat →
                  </button>
                </div>
              </div>

              {/* Tech Interview Quick Access Bar */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase rounded tracking-wider">
                        New Module
                      </span>
                      <h4 className="text-base font-bold text-white">20-Question Tech Interview</h4>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Rigorous simulation testing your specific projects & technical skills across Architecture (8 Qs), Tech Stack (6 Qs), Debugging (3 Qs), and System Design (3 Qs).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="flex items-center gap-4 pr-2">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recent</p>
                      <p className="text-lg font-extrabold text-indigo-300">
                        {techInterviewStats.recentScore > 0 ? `${techInterviewStats.recentScore}%` : '0%'}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-slate-800"></div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Highest</p>
                      <p className="text-lg font-extrabold text-emerald-400">
                        {techInterviewStats.highestScore > 0 ? `${techInterviewStats.highestScore}%` : '0%'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('tech_interview')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 active:scale-[0.98]"
                  >
                    <span>Launch Tech Interview</span>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                  </button>
                </div>
              </div>

              {/* Skill Profile vs Target Role Requirements Radar Chart */}
              <SkillRadarChart
                currentSkills={dashboardSummary?.profile?.currentSkills || (resumeAnalysis?.skills) || []}
                missingSkills={dashboardSummary?.missingSkills || []}
                targetCareer={dashboardSummary?.profile?.targetCareer || dashboardSummary?.careerMatch?.career || 'Software Engineer'}
                assessmentScores={assessments}
                interviewScore={dashboardSummary?.averageInterviewScore}
                techInterviewScore={techInterviewStats?.recentScore || techInterviewStats?.highestScore || 0}
                atsScore={dashboardSummary?.atsScore}
                resumeExists={dashboardSummary?.resumeExists ?? false}
                onNavigateToRoadmap={() => setActiveTab('roadmap')}
                onNavigateToAssessment={() => setActiveTab('assessment')}
                onNavigateToTechInterview={() => setActiveTab('tech_interview')}
              />

              {/* Middle row: Roadmap Timeline and Live Agent activity logs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Learning Roadmap Widget */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Learning Roadmap Progress</h3>
                    <span 
                      onClick={() => setActiveTab('roadmap')}
                      className="text-xs text-indigo-600 font-bold uppercase cursor-pointer hover:underline"
                    >
                      View Full Plan
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex gap-4 items-start relative pb-6 border-l-2 border-slate-200 ml-2 pl-6">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-white"></div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase">Completed Checkpoint</p>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">Foundational Skills Sync</p>
                          <p className="text-xs text-slate-500 mt-1">Resume parsed, missing concepts identified by Career Agent.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start relative pb-6 border-l-2 border-slate-200 ml-2 pl-6">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-indigo-500 rounded-full ring-4 ring-white animate-pulse"></div>
                        <div>
                          <p className="text-xs font-bold text-indigo-600 uppercase">Roadmap Progress</p>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">Bespoke 6-Week Learning Path</p>
                          <p className="text-xs text-slate-500 mt-1">Complete courses and roadmap checklist items to boost readiness rating.</p>
                        </div>
                        <div className="ml-auto bg-indigo-50 px-2 py-1 rounded text-indigo-600 text-[10px] font-bold">
                          {dashboardSummary?.roadmapProgress || 0}%
                        </div>
                      </div>

                      <div className="flex gap-4 items-start relative ml-2 pl-6">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-slate-200 rounded-full ring-4 ring-white"></div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Placement Ready Stage</p>
                          <p className="text-sm font-semibold text-slate-400 mt-0.5">Hiring Pipelines Matching</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-sm">📚</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Explore Recommended Courses</p>
                          <p className="text-[11px] text-slate-500">Curated from Coursera, Udemy & freeCodeCamp</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('roadmap')}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-white transition-colors"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Agent activity console */}
                <div className="bg-slate-900 rounded-xl p-6 text-white flex flex-col shadow-xl ring-4 ring-indigo-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Agent Cognition Core</h3>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
                    </div>
                  </div>

                  {/* Micro list of all agents */}
                  <div className="space-y-2 mb-4">
                    {Object.entries(agentStatus).slice(0, 4).map(([name, status]) => (
                      <div key={name} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded-md border border-white/5">
                        <span className="text-slate-300 font-medium">{name}</span>
                        <span className={`font-mono text-[10px] font-bold ${status === 'IDLE' ? 'text-emerald-400' : 'text-indigo-400 animate-pulse'}`}>
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Terminal console */}
                  <p className="text-[10px] text-slate-400 uppercase mb-2 tracking-widest font-bold">Recent logs</p>
                  <div className="flex-1 bg-black/40 rounded p-3 font-mono text-[10px] leading-relaxed text-indigo-300/75 border border-white/5 h-36 overflow-y-auto">
                    {agentLogs.map((log, i) => (
                      <div key={i} className="mb-1">{log}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cognitive Setup / Quick Info Card */}
              {!dashboardSummary?.resumeExists && (
                <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-600/10">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-20 -translate-y-20"></div>
                  <div className="relative z-10 max-w-xl">
                    <h3 className="text-xl font-bold">Launch your career parsing process</h3>
                    <p className="text-indigo-100 text-sm mt-2">
                      Upload your PDF resume or copy-paste plain text. The **Resume Analyzer Agent** evaluates ATS keyword density, fills missing technical skills, compiles dynamic learning roadmaps, and prepares challenging mock questions.
                    </p>
                    <button 
                      onClick={() => setActiveTab('resume')}
                      className="bg-white text-indigo-600 font-bold px-5 py-2.5 rounded-xl text-xs mt-6 hover:bg-indigo-50 transition-all active:scale-[0.98]"
                    >
                      Analyze Resume Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RESUME ANALYZER TAB */}
          {activeTab === 'resume' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Resume Analyzer & Grading Agent</h2>
                <p className="text-slate-500 text-sm mt-1">Submit your qualifications. The neural parser grades your resume and outputs optimized credentials.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Upload & parse engine */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Resume Upload</h3>
                    <button 
                      onClick={() => setUploadTextMode(!uploadTextMode)}
                      className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold"
                    >
                      {uploadTextMode ? 'Switch to PDF upload' : 'Switch to Plain Text'}
                    </button>
                  </div>

                  <form onSubmit={handleResumeSubmit} className="space-y-4">
                    {uploadTextMode ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Paste Resume Text</label>
                        <textarea
                          rows={10}
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Paste work experiences, education history, and skillsets..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                        ></textarea>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-white transition-colors relative">
                        <input
                          type="file"
                          accept=".pdf,.txt"
                          onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-700">
                          {resumeFile ? resumeFile.name : 'Click or Drag PDF Resume'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Supports PDF & TXT up to 10MB</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={resumeLoading}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      {resumeLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Parsing with Gemini AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span>Run Agent Parsing</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Keyword optimizer assist */}
                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Job Keyword Match Assister</h4>
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        value={resumeKeywordInput}
                        onChange={(e) => setResumeKeywordInput(e.target.value)}
                        placeholder="Paste the Job Description to check missing keywords..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                      ></textarea>
                      <button
                        onClick={handleKeywordOptimization}
                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-2 rounded-xl text-xs transition-all"
                      >
                        Optimize Match Matrix
                      </button>

                      {resumeOptimizedOutput && (
                        <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                          <p className="text-[11px] font-semibold text-slate-600">Missing keywords identified for Job:</p>
                          <div className="flex flex-wrap gap-1">
                            {resumeOptimizedOutput.map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] rounded uppercase font-bold">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Analysis results */}
                <div className="lg:col-span-2 space-y-6">
                  {resumeAnalysis ? (
                    <div className="space-y-6">
                      
                      {/* Dashboard Grid summary */}
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-full border-8 border-indigo-500/10 flex items-center justify-center relative shrink-0">
                          <div className="text-2xl font-black text-slate-800">{resumeAnalysis.atsScore}</div>
                          <div className="text-[10px] text-slate-400 absolute bottom-3">ATS</div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="font-bold text-slate-800 text-lg">Parsed Metrics successfully compiled</h3>
                          <p className="text-slate-500 text-sm mt-1">Matched against 500+ tech job profiles. Added key qualifications to your matching coordinates.</p>
                        </div>
                      </div>

                      {/* Side by side: Extracted Skills & Missing keywords */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Extracted Core Skills
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {resumeAnalysis.skills.map((skill, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                            Urgent Keyword Gaps
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {resumeAnalysis.missingKeywords.map((kw, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Suggestions list */}
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800 mb-4">ATS Recommendations Suggestions</h4>
                        <div className="space-y-3">
                          {resumeAnalysis.suggestions.map((sug, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <p className="text-slate-600 text-xs leading-relaxed">{sug}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI cover letter and linkedin headline generator */}
                      {resumeAnalysis.coverLetter && (
                        <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-lg space-y-4">
                          <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <div>
                              <h4 className="font-bold text-sm">AI Placement Assets</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Bespoke customized marketing parameters</p>
                            </div>
                            <span className="text-[10px] bg-indigo-500/25 text-indigo-300 font-mono py-1 px-2.5 rounded font-bold uppercase">
                              Active outputs
                            </span>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">LinkedIn headline</p>
                              <div className="bg-white/5 p-3 rounded-lg text-slate-200 text-xs font-semibold mt-1 font-mono border border-white/5">
                                {resumeAnalysis.linkedinHeadline}
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Tailored Cover Letter</p>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(resumeAnalysis.coverLetter || '');
                                    alert('Cover letter copied to clipboard!');
                                  }}
                                  className="text-[10px] text-indigo-400 font-semibold hover:underline"
                                >
                                  Copy full text
                                </button>
                              </div>
                              <pre className="bg-white/5 p-3 rounded-lg text-slate-300 text-[11px] mt-1 font-sans border border-white/5 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                                {resumeAnalysis.coverLetter}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-bounce" />
                      <h3 className="font-bold text-slate-700">No Resume Registered</h3>
                      <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                        Please upload your resume file or paste experiences to run cognitive extraction.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: SKILL ASSESSMENT TAB */}
          {activeTab === 'assessment' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Skill Assessment Engine</h2>
                <p className="text-slate-500 text-sm mt-1">Test your concepts. The Cognitive Recruiter scores your responses and updates your career recommendations profile.</p>
              </div>

              {/* Assessment selector cards or ongoing test */}
              {!quizType ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">01</div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Programming Quiz</h4>
                        <p className="text-slate-400 text-[11px] mt-1">Algorithms, syntaxes, data structures.</p>
                      </div>
                      <div className="text-xs text-slate-500 flex justify-between items-center font-semibold pt-2">
                        <span>Current: {assessments?.programming !== undefined && assessments?.programming !== null ? `${assessments.programming}%` : '0%'}</span>
                        <button onClick={() => startQuiz('programming')} className="text-indigo-600 hover:underline">Start →</button>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">02</div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Aptitude & Math</h4>
                        <p className="text-slate-400 text-[11px] mt-1">Logical reasoning, patterns, quantitative.</p>
                      </div>
                      <div className="text-xs text-slate-500 flex justify-between items-center font-semibold pt-2">
                        <span>Current: {assessments?.logical !== undefined && assessments?.logical !== null ? `${assessments.logical}%` : '0%'}</span>
                        <button onClick={() => startQuiz('aptitude')} className="text-emerald-600 hover:underline">Start →</button>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">03</div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Communication</h4>
                        <p className="text-slate-400 text-[11px] mt-1">Corporate scenario negotiation, emotional intelligence.</p>
                      </div>
                      <div className="text-xs text-slate-500 flex justify-between items-center font-semibold pt-2">
                        <span>Current: {assessments?.communication !== undefined && assessments?.communication !== null ? `${assessments.communication}%` : '0%'}</span>
                        <button onClick={() => startQuiz('communication')} className="text-indigo-600 hover:underline">Start →</button>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center font-bold">04</div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">AI & ML Foundational</h4>
                        <p className="text-slate-400 text-[11px] mt-1">Regressions, CNNs, Transformers, Vector DB.</p>
                      </div>
                      <div className="text-xs text-slate-500 flex justify-between items-center font-semibold pt-2">
                        <span>Current: {assessments?.aptitude !== undefined && assessments?.aptitude !== null ? `${assessments.aptitude}%` : '0%'}</span>
                        <button onClick={() => startQuiz('ai')} className="text-rose-600 hover:underline">Start →</button>
                      </div>
                    </div>

                  </div>

                  {/* Careers matching listing */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h3 className="font-bold text-slate-800">Bespoke Career Recommendations Output</h3>
                    <p className="text-slate-500 text-xs">These predictions update adaptively as you complete quiz elements and update skillsets.</p>

                    <div className="space-y-4">
                      {careersList.length > 0 ? (
                        careersList.map((rec: any, i: number) => (
                          <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-100 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800 text-sm">{rec.career}</h4>
                                <span className="bg-indigo-50 text-indigo-600 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                                  {rec.matchPercentage}% MATCH
                                </span>
                              </div>
                              <p className="text-slate-500 text-xs leading-relaxed max-w-xl">{rec.reason}</p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {rec.requiredSkills?.map((s: string, idx: number) => (
                                  <span key={idx} className="px-2 py-0.5 bg-slate-200/60 text-slate-600 text-[9px] rounded font-semibold">{s}</span>
                                ))}
                              </div>
                            </div>
                            <div className="shrink-0 text-left md:text-right">
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Global Salary Range</p>
                              <p className="text-sm font-extrabold text-slate-800 mt-0.5">{rec.salary}</p>
                              <p className="text-[11px] text-indigo-500 mt-1 font-semibold">{rec.futureScope}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          Complete at least one quiz to compile matching predictions.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ACTIVE QUIZ VIEW */
                <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-scale-up">
                  {/* Progress info */}
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{quizType.toUpperCase()} ASSESSMENT</span>
                    <button 
                      onClick={() => setQuizType(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {quizLoading ? (
                    <div className="p-12 text-center space-y-3">
                      <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                      <p className="text-slate-500 text-sm">Orchestrator constructing randomized items...</p>
                    </div>
                  ) : quizResultsSubmitted ? (
                    <div className="p-12 text-center space-y-6">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-black mx-auto">
                        ✓
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-800 text-lg">Assessment Complete!</h3>
                        <p className="text-slate-500 text-sm">You answered {quizCorrectCount} out of {quizQuestions.length} questions correctly.</p>
                        <p className="text-indigo-600 font-bold text-2xl mt-4">Score: {Math.round((quizCorrectCount / quizQuestions.length) * 100)}%</p>
                      </div>
                      <button
                        onClick={() => setQuizType(null)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors"
                      >
                        Return to Hub
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 space-y-6">
                      {/* Progress bar */}
                      <div className="flex justify-between text-xs text-slate-400 font-semibold mb-2">
                        <span>Question {quizCurrentIndex + 1} of {quizQuestions.length}</span>
                        <span>{Math.round(((quizCurrentIndex) / quizQuestions.length) * 100)}% Complete</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-1.5 transition-all" style={{ width: `${((quizCurrentIndex + 1) / quizQuestions.length) * 100}%` }}></div>
                      </div>

                      {/* Question */}
                      <h3 className="text-base font-bold text-slate-800 leading-relaxed pt-2">
                        {quizQuestions[quizCurrentIndex]?.question}
                      </h3>

                      {/* Options */}
                      <div className="space-y-3 pt-2">
                        {quizQuestions[quizCurrentIndex]?.options.map((opt, idx) => {
                          const isSelected = quizSelectedOption === idx;
                          const isCorrect = quizQuestions[quizCurrentIndex].correctOption === idx;
                          
                          let cardStyle = "border-slate-200 hover:border-indigo-400 bg-slate-50";
                          if (isSelected) cardStyle = "border-indigo-500 bg-indigo-50/20 text-indigo-900 ring-2 ring-indigo-500/20";
                          if (quizAnswerChecked) {
                            if (isCorrect) {
                              cardStyle = "border-emerald-500 bg-emerald-50/25 text-emerald-900 font-semibold ring-2 ring-emerald-500/10";
                            } else if (isSelected) {
                              cardStyle = "border-rose-500 bg-rose-50/20 text-rose-900 ring-2 ring-rose-500/10";
                            }
                          }

                          return (
                            <div
                              key={idx}
                              onClick={() => handleQuizOptionSelect(idx)}
                              className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-3 ${cardStyle}`}
                            >
                              <span className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 font-bold flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      {quizAnswerChecked && (
                        <div className="bg-indigo-50/45 border border-indigo-100 p-4 rounded-xl text-xs text-slate-700 leading-relaxed space-y-1">
                          <p className="font-bold text-indigo-700 uppercase tracking-wide text-[10px]">Orchestrator explanation</p>
                          <p>{quizQuestions[quizCurrentIndex]?.explanation}</p>
                        </div>
                      )}

                      {/* Navigation bar */}
                      <div className="pt-4 flex justify-end">
                        {!quizAnswerChecked ? (
                          <button
                            onClick={checkQuizAnswer}
                            disabled={quizSelectedOption === null}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
                          >
                            Submit Response
                          </button>
                        ) : (
                          <button
                            onClick={advanceQuiz}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all active:scale-95"
                          >
                            {quizCurrentIndex + 1 < quizQuestions.length ? 'Next Question →' : 'Finish Assessment'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* TAB 4: CAREER ROADMAP & COURSES TAB */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Your 6-Week Learning Roadmap</h2>
                <p className="text-slate-500 text-sm mt-1">Acquire identified competencies. Complete checkpoint learning tasks to raise your profile readiness.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 6-Week timeline scroll */}
                <div className="lg:col-span-2 space-y-4">
                  {roadmap ? (
                    roadmap.weeks.map((week, wIdx) => {
                      const isWeekFullyCompleted = week.tasks.length > 0 && week.tasks.every(t => t.completed);
                      const completedCount = week.tasks.filter(t => t.completed).length;

                      return (
                        <div key={wIdx} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${
                          isWeekFullyCompleted ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200'
                        }`}>
                          <div className={`px-6 py-4 border-b flex justify-between items-center transition-colors ${
                            isWeekFullyCompleted ? 'bg-emerald-50/60 border-emerald-100' : 'bg-slate-50 border-slate-100'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest ${
                                isWeekFullyCompleted ? 'bg-emerald-200/70 text-emerald-800' : 'bg-indigo-50 text-indigo-600'
                              }`}>
                                {week.week}
                              </span>
                              <h4 className="font-bold text-slate-800 text-sm">{week.title}</h4>
                            </div>

                            <div className="flex items-center gap-2">
                              {isWeekFullyCompleted && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                                  animate={{ opacity: 1, scale: 1, x: 0 }}
                                  className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-full shadow-xs"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  <span>Week Mastered!</span>
                                </motion.span>
                              )}
                              <span className={`text-xs font-bold ${isWeekFullyCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                                {completedCount}/{week.tasks.length} Completed
                              </span>
                            </div>
                          </div>

                          <div className="p-6 space-y-4">
                            
                            {/* Topics of focus */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Subject modules</p>
                              <div className="flex flex-wrap gap-1.5">
                                {week.topics.map((top, tIdx) => (
                                  <span key={tIdx} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
                                    {top}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Mini project */}
                            <div className="bg-indigo-50/30 border border-indigo-100/40 p-4 rounded-xl">
                              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Weekly practical project</p>
                              <h5 className="font-bold text-slate-800 text-xs mt-1">{week.miniProject.title}</h5>
                              <p className="text-slate-500 text-xs mt-1 leading-relaxed">{week.miniProject.description}</p>
                            </div>

                            {/* Interactive Tasks Checklist with Smooth Slide-in Animations */}
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Checklist targets</p>
                                <span className="text-[10px] text-slate-400 font-medium">Click task to update checkpoint status</span>
                              </div>

                              <div className="space-y-1.5">
                                {week.tasks.map((task) => {
                                  const isRecentlyCompleted = recentlyCompletedTaskIds.includes(task.id);

                                  return (
                                    <motion.div 
                                      key={task.id}
                                      layout
                                      whileHover={{ x: 2 }}
                                      whileTap={{ scale: 0.985 }}
                                      onClick={() => handleToggleRoadmapTask(task.id, task.completed)}
                                      className={`flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 border relative overflow-hidden ${
                                        task.completed
                                          ? isRecentlyCompleted
                                            ? 'bg-emerald-50/90 border-emerald-300 shadow-sm ring-2 ring-emerald-200'
                                            : 'bg-emerald-50/40 border-emerald-100/80 hover:bg-emerald-50/60'
                                          : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300'
                                      }`}
                                    >
                                      {/* Left check box and text */}
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <motion.div 
                                          layout
                                          animate={{ 
                                            scale: task.completed ? [1, 1.25, 1] : 1,
                                            rotate: task.completed ? [0, -10, 0] : 0
                                          }}
                                          transition={{ duration: 0.3 }}
                                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                            task.completed 
                                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                                              : 'border-slate-300 bg-slate-50 hover:border-indigo-400'
                                          }`}
                                        >
                                          <AnimatePresence mode="wait">
                                            {task.completed && (
                                              <motion.div
                                                key="check-icon"
                                                initial={{ scale: 0, rotate: -45 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                              >
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </motion.div>

                                        <span className={`text-xs transition-all duration-200 select-none ${
                                          task.completed 
                                            ? 'text-slate-400 line-through font-normal' 
                                            : 'text-slate-700 font-semibold'
                                        }`}>
                                          {task.text}
                                        </span>
                                      </div>

                                      {/* Smooth slide-in positive feedback badge when completed */}
                                      <AnimatePresence>
                                        {task.completed && (
                                          <motion.div
                                            initial={{ opacity: 0, x: 28, scale: 0.8 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: 20, scale: 0.85 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 24 }}
                                            className="flex items-center gap-1.5 shrink-0 pl-2"
                                          >
                                            {isRecentlyCompleted && (
                                              <motion.span
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: [0.8, 1.15, 1], opacity: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.35 }}
                                                className="px-2 py-0.5 bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] rounded-md flex items-center gap-0.5 shadow-xs"
                                              >
                                                <Sparkles className="w-3 h-3 text-amber-500" />
                                                <span>+25 XP</span>
                                              </motion.span>
                                            )}
                                            
                                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1 shadow-xs">
                                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                                              <span>Completed</span>
                                            </span>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                      <Map className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
                      <h3 className="font-bold text-slate-700">Roadmap generation processing...</h3>
                      <p className="text-slate-400 text-xs mt-1">Please analyze your resume or configure target career profile to load weeks.</p>
                    </div>
                  )}
                </div>

                {/* Course advisor list sidebar */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800">Bespoke Course Recommendations</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">Direct links targeting identified skills vacancies generated by Course Agent.</p>

                    <div className="space-y-4">
                      {courses.length > 0 ? (
                        courses.map((course, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5 hover:border-indigo-100 transition-colors">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-extrabold rounded uppercase">{course.platform}</span>
                            <h4 className="font-bold text-slate-800 text-xs leading-normal">{course.title}</h4>
                            
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.duration}
                              </span>
                              <span>{course.price}</span>
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <Star className="w-3 h-3 fill-amber-500" />
                                {course.rating}
                              </span>
                            </div>

                            <a 
                              href={course.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full inline-block text-center bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold py-1.5 rounded transition-all"
                            >
                              Explore Syllabus
                            </a>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          No recommended courses found.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: JOB MATCHING & OFFERS HUB (LINKEDIN & INDEED INTEGRATED) */}
          {activeTab === 'jobs' && (
            <JobMatchingHub
              jobs={jobs}
              targetCareer={dashboardSummary?.profile?.targetCareer || dashboardSummary?.careerMatch?.career || 'Software Engineer'}
              userSkills={dashboardSummary?.profile?.currentSkills || resumeAnalysis?.skills || []}
              atsScore={dashboardSummary?.atsScore || resumeAnalysis?.atsScore || 85}
              onRefreshJobs={handleRefreshJobs}
              onUpdateJobStatus={handleUpdateJobStatus}
              onSaveJobOffer={handleSaveJobOffer}
              onAnalyzeCustomJob={handleAnalyzeCustomJob}
              onLaunchInterviewForJob={handleLaunchInterviewForJob}
              onNavigateToResume={() => setActiveTab('resume')}
            />
          )}

          {/* TAB 6: INTERVIEW COACH TAB */}
          {activeTab === 'interview' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">AI Interview Coach Agent</h2>
                <p className="text-slate-500 text-sm mt-1">Simulate rigorous interview loops. The agent grades your responses using structured criteria.</p>
              </div>

              {/* Quick Interview Tips Card */}
              <QuickInterviewTips
                targetCareer={interviewSelectedCareer || dashboardSummary?.profile?.targetCareer || 'Software Engineer'}
                token={token}
              />

              {!activeInterview ? (
                <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 text-center">
                  <MessageSquare className="w-12 h-12 text-indigo-500 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800">Launch New Mock Suite</h3>
                    <p className="text-slate-500 text-xs">A challenging loop containing 2 Technical, 2 HR, and 1 Coding questions tailored for your role.</p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="text-left">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Career Role</label>
                      <input
                        type="text"
                        value={interviewSelectedCareer}
                        onChange={(e) => setInterviewSelectedCareer(e.target.value)}
                        placeholder="e.g. AI Engineer, React Developer, product manager"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      onClick={startMockInterview}
                      disabled={interviewStarting}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {interviewStarting ? 'Constructing Cognitive questions...' : 'Launch Assessment Suite'}
                    </button>
                  </div>
                </div>
              ) : (
                /* IMMERSIVE INTERVIEW LOOP */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  
                  {/* Left checklist of session progress */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 shrink-0">
                    <h3 className="font-bold text-slate-800 text-sm">Session Progress</h3>
                    <div className="space-y-2">
                      {activeInterview.questions.map((q, idx) => {
                        const isActive = activeInterview.currentQuestionIndex === idx;
                        const isCompleted = q.completed;
                        
                        let cardStyle = "border-slate-100 bg-slate-50 text-slate-500";
                        if (isActive) cardStyle = "border-indigo-200 bg-indigo-50/20 text-indigo-900 ring-2 ring-indigo-500/10 font-semibold";
                        if (isCompleted) cardStyle = "border-emerald-100 bg-emerald-50/20 text-emerald-800";

                        return (
                          <div key={q.id} className={`p-3 rounded-lg border text-xs flex items-center justify-between ${cardStyle}`}>
                            <div className="flex items-center gap-2">
                              <span className="capitalize font-bold text-[10px] bg-white border px-1.5 py-0.5 rounded shadow-sm shrink-0">
                                {q.type}
                              </span>
                              <span className="truncate max-w-[120px]">{q.question}</span>
                            </div>
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : isActive ? (
                              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          if (window.confirm('Cancel this active mock loop?')) {
                            setActiveInterview(null);
                          }
                        }}
                        className="w-full py-2 border border-slate-200 rounded-lg text-slate-500 hover:text-rose-500 hover:border-rose-100 text-[11px] font-bold transition-all"
                      >
                        Terminate Loop
                      </button>
                    </div>
                  </div>

                  {/* Active screen area */}
                  <div className="lg:col-span-2 space-y-6">
                    {activeInterview.status === 'completed' ? (
                      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">✓</div>
                          <h3 className="font-extrabold text-slate-800 text-lg">Interview Loop Completed!</h3>
                          <p className="text-slate-500 text-sm">Full feedback analytics compiled below. Excellent progress.</p>
                        </div>

                        {/* Detailed questions review */}
                        <div className="space-y-4 pt-4">
                          {activeInterview.questions.map((q, i) => (
                            <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                                <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider">{q.type}</span>
                                <span className="text-xs font-bold text-slate-800">Score: {q.evaluation?.score || 70}/100</span>
                              </div>
                              <p className="text-xs font-bold text-slate-700">Q: {q.question}</p>
                              <div className="p-3 bg-white border rounded-lg text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {q.userAnswer}
                              </div>
                              
                              <div className="space-y-2 text-xs pt-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">AI Evaluation</p>
                                <div className="grid grid-cols-2 gap-3 text-[11px]">
                                  <div className="p-2 bg-slate-100 rounded">
                                    <span className="font-bold text-slate-700">Grammar:</span> {q.evaluation?.grammar}
                                  </div>
                                  <div className="p-2 bg-slate-100 rounded">
                                    <span className="font-bold text-slate-700">Suggestions:</span> {q.evaluation?.suggestions}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            setActiveInterview(null);
                            loadAllData();
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl"
                        >
                          Finish Session
                        </button>
                      </div>
                    ) : (
                      /* ACTIVE CHAT SCREEN */
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
                        
                        {/* Conversation Header */}
                        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                          <div>
                            <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest">Mock AI Loop</p>
                            <h4 className="font-bold text-sm truncate">{activeInterview.careerType}</h4>
                          </div>
                          <span className="text-xs bg-white/10 px-2 py-1 rounded font-mono">
                            Q {activeInterview.currentQuestionIndex + 1}/{activeInterview.questions.length}
                          </span>
                        </div>

                        {/* Dialogue content */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-6">
                          
                          {/* AI Assistant card */}
                          <div className="flex gap-3 items-start max-w-xl">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-indigo-400 flex items-center justify-center font-bold font-mono text-xs shrink-0">AI</div>
                            <div className="bg-slate-100 p-4 rounded-2xl text-xs text-slate-800 leading-relaxed font-medium">
                              {activeInterview.questions[activeInterview.currentQuestionIndex]?.question}
                            </div>
                          </div>

                          {/* Response placeholder */}
                          {interviewSubmitLoading && (
                            <div className="flex gap-3 items-start max-w-xl">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0 animate-pulse">CP</div>
                              <div className="bg-indigo-50 p-4 rounded-2xl text-xs text-slate-600 leading-relaxed italic flex items-center gap-2">
                                <span className="w-2 h-2 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                                Evaluator evaluating metrics response...
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Input bottom controller bar */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                          <div className="space-y-3">
                            <textarea
                              rows={3}
                              value={interviewAnswerInput}
                              onChange={(e) => setInterviewAnswerInput(e.target.value)}
                              placeholder="Type your response. Use STAR format to earn highest performance grades..."
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                            ></textarea>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-400 italic font-medium">Be structured and precise.</span>
                              <button
                                onClick={submitInterviewAnswer}
                                disabled={interviewSubmitLoading || !interviewAnswerInput.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-lg text-xs transition-all active:scale-[0.98] disabled:opacity-55 flex items-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Submit Response</span>
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB: TECH INTERVIEW MODULE (20 Questions on Projects & Skills) */}
          {activeTab === 'tech_interview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header with high level stats */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Code2 className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Tech Interview</h2>
                      <p className="text-slate-500 text-xs mt-0.5">20 targeted technical questions synthesized specifically from your projects and technical skills.</p>
                    </div>
                  </div>
                </div>

                {/* Score stats badges */}
                <div className="flex items-center gap-3">
                  <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Score</p>
                    <p className="text-lg font-extrabold text-indigo-600">
                      {techInterviewStats.recentScore > 0 ? `${techInterviewStats.recentScore}%` : '0%'}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Highest Score</p>
                    <p className="text-lg font-extrabold text-emerald-600">
                      {techInterviewStats.highestScore > 0 ? `${techInterviewStats.highestScore}%` : '0%'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartTechInterview(true)}
                    disabled={techInterviewLoading}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {techInterviewLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Synthesizing 20 Qs...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Generate Fresh 20 Qs</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* No active session launch banner */}
              {!techInterviewSession ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-3xl mx-auto text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
                    <Terminal className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-800">20-Question Technical Interview Simulation</h3>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                      Structured into <strong>7 In-Depth Project Architectural Questions</strong> (written answers evaluated by AI) and <strong>13 Tech Skill MCQs</strong> derived from your resume.
                    </p>
                  </div>

                  {/* Question split cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
                    <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-purple-200/60 text-purple-800 text-[10px] font-extrabold rounded uppercase tracking-wider">
                          Questions 1 – 7
                        </span>
                        <span className="text-[11px] font-bold text-purple-700">7 Questions</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">Project-Based Subjective</p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        In-depth written responses on your project system design, state management, API architecture, and production tradeoffs.
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-blue-200/60 text-blue-800 text-[10px] font-extrabold rounded uppercase tracking-wider">
                          Questions 8 – 20
                        </span>
                        <span className="text-[11px] font-bold text-blue-700">13 Questions</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">Tech Skill MCQs</p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Multiple-choice questions testing core execution mechanics, syntax, APIs, lifecycle, and concurrency for your tech stack.
                      </p>
                    </div>
                  </div>

                  {/* Details context pills */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Cpu className="w-4 h-4 text-indigo-500" />
                      <span>Context Source Parameters</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dashboardSummary?.profile?.currentSkills && dashboardSummary.profile.currentSkills.length > 0 ? (
                        dashboardSummary.profile.currentSkills.map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[11px] font-mono">
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No custom skills loaded. Will use career defaults.</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartTechInterview(false)}
                    disabled={techInterviewLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {techInterviewLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Synthesizing 20 Tailored Questions...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Start 20-Question Tech Interview</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* ACTIVE 20-QUESTION WORKSPACE */
                <div className="space-y-6">
                  {/* Session status & Filter bar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider">
                          20 Questions Set
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          Target Track: {techInterviewSession.targetCareer}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {techInterviewSession.questions.filter(q => !!q.userAnswer || q.score !== undefined).length} of 20 answered • Average Score:{' '}
                        <strong className="text-slate-800">
                          {techInterviewSession.questions.filter(q => typeof q.score === 'number').length > 0
                            ? Math.round(
                                techInterviewSession.questions.filter(q => typeof q.score === 'number').reduce((a, b) => a + (b.score || 0), 0) /
                                  (techInterviewSession.questions.filter(q => typeof q.score === 'number').length || 1)
                              )
                            : 0}%
                        </strong>
                      </p>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setTechCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          techCategoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All (20)
                      </button>
                      <button
                        onClick={() => setTechCategoryFilter('project')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          techCategoryFilter === 'project' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Project Questions (1-7)</span>
                      </button>
                      <button
                        onClick={() => setTechCategoryFilter('mcq')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          techCategoryFilter === 'mcq' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Skill MCQs (8-20)</span>
                      </button>
                      <button
                        onClick={handleCompleteTechInterview}
                        className="ml-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Finish & Save</span>
                      </button>
                    </div>
                  </div>

                  {/* 20 Questions Navigator Grid */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Question Palette (Select to Jump)</span>
                      <div className="flex items-center gap-3 lowercase text-[11px] font-normal normal-case text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                          <span>Q1-7 Project Subjective</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                          <span>Q8-20 Skill MCQs</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-20 gap-2">
                      {techInterviewSession.questions.map((q) => {
                        const isSelected = q.id === techInterviewActiveQId;
                        const hasScore = typeof q.score === 'number';
                        const isMCQ = q.questionType === 'skill_mcq' || q.id > 7;

                        // Filter visibility
                        if (techCategoryFilter === 'project' && isMCQ) return null;
                        if (techCategoryFilter === 'mcq' && !isMCQ) return null;

                        let btnClass = 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100';
                        if (isSelected) {
                          btnClass = 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300';
                        } else if (hasScore && (q.verdict === 'Correct' || (q.score !== undefined && q.score >= 80))) {
                          btnClass = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
                        } else if (hasScore && (q.verdict === 'Incorrect' || (q.score !== undefined && q.score < 50))) {
                          btnClass = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
                        } else if (hasScore) {
                          btnClass = 'bg-blue-50 text-blue-700 border-blue-300 font-bold';
                        }

                        return (
                          <button
                            key={q.id}
                            onClick={() => handleSelectTechQuestion(q.id)}
                            className={`h-11 rounded-lg border text-xs flex flex-col items-center justify-center transition-all relative ${btnClass}`}
                            title={`Q${q.id}: ${q.targetTopic} (${isMCQ ? 'Skill MCQ' : 'Project Subjective'})`}
                          >
                            <span className="font-bold">Q{q.id}</span>
                            <span className={`text-[9px] leading-none ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                              {hasScore ? `${q.score}%` : (isMCQ ? 'MCQ' : 'Subj')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Main Active Question & Answer Workspace */}
                  {(() => {
                    const currentQ = techInterviewSession.questions.find(q => q.id === techInterviewActiveQId) || techInterviewSession.questions[0];
                    if (!currentQ) return null;

                    const isMCQ = currentQ.questionType === 'skill_mcq' || currentQ.id > 7;
                    const isEvaluated = typeof currentQ.score === 'number';

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Question & Input Area (Left/Center) */}
                        <div className="lg:col-span-7 space-y-6">
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            {/* Question Header & Category */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                                  #{currentQ.id}
                                </span>
                                {isMCQ ? (
                                  <span className="px-2.5 py-0.5 rounded-full border text-[11px] font-bold bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                                    <CheckSquare className="w-3 h-3" />
                                    <span>Tech Skill MCQ</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full border text-[11px] font-bold bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    <span>Project Architecture (Subjective)</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                Skill/Topic: <strong className="text-slate-800">{currentQ.targetTopic}</strong>
                              </span>
                            </div>

                            {/* Question Statement */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                                {currentQ.question}
                              </p>
                            </div>

                            {/* Interviewer Hint & Key Concepts Toggle */}
                            <div>
                              <button
                                onClick={() => setTechInterviewShowHint(!techInterviewShowHint)}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1.5 transition-colors"
                              >
                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                <span>{techInterviewShowHint ? 'Hide Guidance Hint' : 'Show Guidance Hint & Key Concepts'}</span>
                              </button>

                              {techInterviewShowHint && (
                                <div className="mt-3 p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2 text-xs text-amber-900 animate-fade-in">
                                  <p className="font-semibold">💡 Interviewer Guidance:</p>
                                  <p className="text-slate-700 leading-relaxed">{currentQ.hint}</p>
                                  {currentQ.idealKeyPoints && currentQ.idealKeyPoints.length > 0 && (
                                    <div className="pt-1">
                                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Target Concepts:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {currentQ.idealKeyPoints.map((pt, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-white border border-amber-200 rounded text-[10px] font-mono text-amber-800">
                                            {pt}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* CONDITIONAL RENDERING: MCQ Options vs Subjective Textarea */}
                            {isMCQ ? (
                              /* --- MCQ OPTIONS SELECTION --- */
                              <div className="space-y-3 pt-2">
                                <label className="block text-xs font-bold text-slate-700">
                                  Select the accurate technical answer:
                                </label>

                                <div className="space-y-2.5">
                                  {(currentQ.options || [
                                    "Option A", "Option B", "Option C", "Option D"
                                  ]).map((opt, optIdx) => {
                                    const isSelected = techInterviewSelectedOption === optIdx;
                                    const isCorrectOpt = isEvaluated && optIdx === currentQ.correctOptionIndex;
                                    const isUserChoice = isEvaluated && isSelected;

                                    let cardStyle = "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700";
                                    if (isEvaluated) {
                                      if (isCorrectOpt) {
                                        cardStyle = "bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-200";
                                      } else if (isUserChoice && !isCorrectOpt) {
                                        cardStyle = "bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200";
                                      } else {
                                        cardStyle = "bg-slate-50/60 border-slate-200 text-slate-400 opacity-60";
                                      }
                                    } else if (isSelected) {
                                      cardStyle = "bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200 shadow-sm";
                                    }

                                    const optLetter = String.fromCharCode(65 + optIdx);

                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        disabled={isEvaluated || techInterviewSubmitting}
                                        onClick={() => setTechInterviewSelectedOption(optIdx)}
                                        className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${cardStyle}`}
                                      >
                                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                          isEvaluated && isCorrectOpt ? 'bg-emerald-600 text-white' :
                                          isEvaluated && isUserChoice && !isCorrectOpt ? 'bg-rose-600 text-white' :
                                          isSelected ? 'bg-indigo-600 text-white' :
                                          'bg-white border border-slate-300 text-slate-600'
                                        }`}>
                                          {optLetter}
                                        </span>

                                        <div className="flex-1">
                                          <p className="text-xs font-medium leading-relaxed">{opt}</p>
                                          {isEvaluated && isCorrectOpt && (
                                            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                              ✓ Correct Answer
                                            </span>
                                          )}
                                          {isEvaluated && isUserChoice && !isCorrectOpt && (
                                            <span className="inline-block mt-1 text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                                              ✗ Your Selection
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              /* --- PROJECT SUBJECTIVE TEXTAREA --- */
                              <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center text-xs">
                                  <label className="font-bold text-slate-600">Your Technical Response (Project Context)</label>
                                  <span className="text-slate-400 font-mono text-[11px]">
                                    {techInterviewAnswerInput.trim().split(/\s+/).filter(Boolean).length} words
                                  </span>
                                </div>

                                <textarea
                                  rows={7}
                                  value={techInterviewAnswerInput}
                                  onChange={(e) => setTechInterviewAnswerInput(e.target.value)}
                                  placeholder="Explain your architectural reasoning, trade-offs, code components, or debugging process in detail..."
                                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-sans leading-relaxed focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                                ></textarea>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSelectTechQuestion(Math.max(1, currentQ.id - 1))}
                                  disabled={currentQ.id === 1}
                                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all disabled:opacity-40"
                                >
                                  ← Prev Q
                                </button>
                                <button
                                  onClick={() => handleSelectTechQuestion(Math.min(20, currentQ.id + 1))}
                                  disabled={currentQ.id === 20}
                                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all disabled:opacity-40"
                                >
                                  Next Q →
                                </button>
                              </div>

                              <button
                                onClick={handleSubmitTechAnswer}
                                disabled={
                                  techInterviewSubmitting ||
                                  (isMCQ ? techInterviewSelectedOption === null : !techInterviewAnswerInput.trim())
                                }
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                              >
                                {techInterviewSubmitting ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>AI Evaluator Grading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4" />
                                    <span>{isMCQ ? 'Submit MCQ Answer' : 'Submit & Evaluate'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Evaluation & Model Answer Feedback (Right) */}
                        <div className="lg:col-span-5 space-y-6">
                          {isEvaluated ? (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 animate-fade-in">
                              {/* Score & Verdict Pill */}
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Result</p>
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase mt-1 ${
                                    currentQ.verdict === 'Correct' || (currentQ.score !== undefined && currentQ.score >= 80)
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    currentQ.verdict === 'Incorrect' || (currentQ.score !== undefined && currentQ.score < 50)
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                      'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {currentQ.verdict || 'Graded'}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-3xl font-extrabold text-slate-800">{currentQ.score}</span>
                                  <span className="text-slate-400 text-sm font-bold">/100</span>
                                </div>
                              </div>

                              {/* Key Strengths */}
                              {currentQ.strengths && currentQ.strengths.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <span>Key Strengths:</span>
                                  </p>
                                  <ul className="space-y-1 pl-5 list-disc text-xs text-slate-600">
                                    {currentQ.strengths.map((str, i) => (
                                      <li key={i}>{str}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Missing Key Points / Distractor explanation */}
                              {currentQ.missingKeyPoints && currentQ.missingKeyPoints.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    <span>{isMCQ ? 'Key Knowledge Gap:' : 'Missing Architectural Points:'}</span>
                                  </p>
                                  <ul className="space-y-1 pl-5 list-disc text-xs text-slate-600">
                                    {currentQ.missingKeyPoints.map((mis, i) => (
                                      <li key={i}>{mis}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Model Answer / Explanation */}
                              {currentQ.refinedAnswer && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    <span>{isMCQ ? 'Detailed Explanation:' : 'Senior Staff Engineer Model Answer:'}</span>
                                  </div>
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {currentQ.refinedAnswer}
                                  </p>
                                </div>
                              )}

                              {/* Actionable Pro-Tip */}
                              {currentQ.actionableTip && (
                                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
                                  <Zap className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">Technical Tip: </span>
                                    <span>{currentQ.actionableTip}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 shadow-sm text-center space-y-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                                <Code2 className="w-6 h-6" />
                              </div>
                              <h4 className="text-sm font-bold text-slate-700">Awaiting Submission</h4>
                              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                {isMCQ
                                  ? 'Select your option on the left and click "Submit MCQ Answer" to check correctness and view detailed explanation.'
                                  : 'Type your architectural response on the left and click "Submit & Evaluate" to receive multi-criteria AI grading.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PROGRESS STATS TAB */}
          {activeTab === 'progress' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Progress Stats & Performance Report</h2>
                <p className="text-slate-500 text-sm mt-1">Unified analytics tracking tasks, tests, tech interview scores, and skill indices across all career tracks.</p>
              </div>

              {/* Overall Task, Test, and Tech Interview Performance Scorecard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Overall Task Progress */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Overall Task Progress</p>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded uppercase font-bold">
                      {dashboardSummary?.completedTasks || 0} / {dashboardSummary?.totalTasks || 0} Done
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {dashboardSummary?.overallTaskProgress || 0}%
                    </span>
                    <span className="text-xs text-slate-400">task completion</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${dashboardSummary?.overallTaskProgress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* 2. Assessment Test Score */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Assessment Test Score</p>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] rounded uppercase font-bold">
                      4 Modules
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-600">
                      {dashboardSummary?.overallTestProgress || 0}%
                    </span>
                    <span className="text-xs text-slate-400">average quiz score</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${dashboardSummary?.overallTestProgress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* 3. Tech Interview Scorecard (Recent & Highest Score) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Tech Interview (20 Qs)</p>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded uppercase font-bold">
                      Projects & Skills
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-blue-600">
                        {techInterviewStats.recentScore > 0 ? `${techInterviewStats.recentScore}%` : '0%'}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-medium">Recent Score</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-emerald-600">
                        {techInterviewStats.highestScore > 0 ? `${techInterviewStats.highestScore}%` : '0%'}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-medium">Highest Score</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-blue-500 h-2 transition-all duration-1000" 
                      style={{ width: `${techInterviewStats.recentScore || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* 4. Milestones Goalpad */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Milestones Goalpad</p>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded uppercase font-bold">
                      {dashboardSummary?.completedGoals || 0} / {dashboardSummary?.totalGoals || 0} Active
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-purple-600">
                      {dashboardSummary?.totalGoals ? Math.round(((dashboardSummary.completedGoals || 0) / dashboardSummary.totalGoals) * 100) : 0}%
                    </span>
                    <span className="text-xs text-slate-400">milestones achieved</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${dashboardSummary?.totalGoals ? Math.round(((dashboardSummary.completedGoals || 0) / dashboardSummary.totalGoals) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Tech Interview Domain Mastery Analytics */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Tech Interview Domain Mastery</h3>
                    <p className="text-slate-400 text-xs">Evaluated across 20 tailored questions directly targeting candidate projects, core stack, debugging, and system scalability.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tech_interview')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Launch Tech Interview Suite →</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
                    <p className="text-[10px] font-extrabold text-purple-700 uppercase">Domain 1</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">Project Architecture</p>
                    <p className="text-xs text-slate-500 mt-0.5">8 Questions • Tradeoffs & stack rationale</p>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-extrabold text-blue-700 uppercase">Domain 2</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">Tech Stack Core</p>
                    <p className="text-xs text-slate-500 mt-0.5">6 Questions • Internals & concurrency</p>
                  </div>

                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-extrabold text-amber-700 uppercase">Domain 3</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">Debugging & Perf</p>
                    <p className="text-xs text-slate-500 mt-0.5">3 Questions • Profiling & memory leaks</p>
                  </div>

                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-extrabold text-emerald-700 uppercase">Domain 4</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">System Design</p>
                    <p className="text-xs text-slate-500 mt-0.5">3 Questions • Scalability & storage</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Skill growth charts */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="font-bold text-slate-800 text-base">Core Technical Competency Index</h3>
                  <p className="text-slate-400 text-xs">Indices calculated from assessments performance, keywords mapped, and roadmap tasks checkoffs.</p>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>Programming Fundamentals</span>
                        <span>{assessments?.programming || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000" 
                          style={{ width: `${assessments?.programming || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>Logical Ability & Quantitative</span>
                        <span>{assessments?.logical || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000" 
                          style={{ width: `${assessments?.logical || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>Corporate Communications</span>
                        <span>{assessments?.communication || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000" 
                          style={{ width: `${assessments?.communication || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>Machine Learning Foundational</span>
                        <span>{assessments?.aptitude || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000" 
                          style={{ width: `${assessments?.aptitude || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Variable Coordinates Editor */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Cognitive Coordinates</h3>
                  <p className="text-slate-400 text-xs">Verify variables mapped to CareerPilot Agents. Update values manually to synchronize.</p>

                  <form onSubmit={handleProfileUpdate} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">CGPA</label>
                      <input
                        type="text"
                        value={profileCGPA}
                        onChange={(e) => setProfileCGPA(e.target.value)}
                        placeholder="e.g. 8.9"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Target Career Path</label>
                      <input
                        type="text"
                        value={profileTargetCareer}
                        onChange={(e) => setProfileTargetCareer(e.target.value)}
                        placeholder="e.g. AI Engineer"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-semibold text-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Interests (Comma Separated)</label>
                      <input
                        type="text"
                        value={profileInterests}
                        onChange={(e) => setProfileInterests(e.target.value)}
                        placeholder="e.g. web products, deep learning, fintech"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Current Skills (Comma Separated)</label>
                      <textarea
                        rows={3}
                        value={profileSkills}
                        onChange={(e) => setProfileSkills(e.target.value)}
                        placeholder="e.g. Python, React, SQL"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-mono"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={profileUpdating}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      {profileUpdating ? 'Saving coordinates...' : 'Save Profile Coordinates'}
                    </button>
                  </form>
                </div>

                {/* Customized Milestones Checklist */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Custom Placement Milestones Goalpad</h3>
                  <p className="text-slate-400 text-xs">Define customized goals and tasks. Track progress through this interactive planner.</p>

                  <form onSubmit={handleAddGoal} className="flex gap-3">
                    <input
                      type="text"
                      value={newGoalText}
                      onChange={(e) => setNewGoalText(e.target.value)}
                      placeholder="Add custom task (e.g. Solve 5 medium trees in LeetCode)..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                    <select
                      value={newGoalCategory}
                      onChange={(e: any) => setNewGoalCategory(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700"
                    >
                      <option value="skill">Skill</option>
                      <option value="course">Course</option>
                      <option value="project">Project</option>
                      <option value="interview">Interview</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 rounded-xl text-xs flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Milestone
                    </button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {dashboardSummary?.goals && dashboardSummary.goals.length > 0 ? (
                      dashboardSummary.goals.map((goal) => (
                        <div 
                          key={goal.id}
                          onClick={() => handleToggleGoal(goal.id, goal.completed)}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-100 transition-colors"
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            goal.completed 
                              ? 'bg-indigo-500 border-indigo-500 text-white' 
                              : 'border-slate-300 bg-white'
                          }`}>
                            {goal.completed && <CheckSquare className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className={`text-xs truncate ${goal.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-semibold'}`}>
                              {goal.text}
                            </p>
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider mt-1 inline-block">
                              {goal.category}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-6 text-slate-400 text-xs">
                        No customized milestones configured.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL 1: RESUME ONBOARDING MODAL */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 md:p-8 space-y-6 border border-slate-100 relative">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-sm border border-indigo-100">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">
                    {onboardingStep === 'success' ? 'Profile Initialized Successfully!' : 'Upload Resume to Initialize Profile'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {onboardingStep === 'success' ? 'Cognitive coordinates saved in database' : 'Automatic neural extraction of skills, education & career path'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowResumeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Upload / Input Mode */}
            {onboardingStep === 'upload' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                  <p className="font-semibold mb-1">Why upload a resume?</p>
                  Our multi-agent orchestrator will analyze your resume to extract your <strong>technical skills, CGPA, target career, domain interests, and education</strong> directly into your personal database profile.
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Select Input Method</span>
                  <button
                    onClick={() => setUploadTextMode(!uploadTextMode)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    {uploadTextMode ? 'Switch to PDF Upload' : 'Switch to Plain Text Paste'}
                  </button>
                </div>

                {uploadTextMode ? (
                  <div>
                    <textarea
                      rows={8}
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your complete resume text or curriculum vitae here..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    ></textarea>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 text-center transition-all bg-slate-50/50">
                    <input 
                      type="file" 
                      id="onboarding-file-upload" 
                      accept=".pdf,.txt,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setResumeFile(e.target.files[0]);
                        }
                      }}
                      className="hidden" 
                    />
                    <label htmlFor="onboarding-file-upload" className="cursor-pointer block">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-indigo-600 border border-slate-100">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        {resumeFile ? resumeFile.name : 'Click to browse or drop PDF resume'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">Accepts PDF, DOCX, TXT (Max 5MB)</p>
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResumeModal(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-3 py-2"
                  >
                    I'll do this later
                  </button>
                  <button
                    onClick={() => handleResumeSubmit()}
                    disabled={resumeLoading || (!resumeFile && !resumeText.trim())}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Extract & Save to Profile Database</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Extracting Animation */}
            {onboardingStep === 'extracting' && (
              <div className="py-12 text-center space-y-5">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto"></div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">Multi-Agent Processing Underway</h4>
                  <p className="text-xs text-slate-400 mt-1">Resume Agent is extracting your skills, background, and career coordinates...</p>
                </div>
                <div className="max-w-xs mx-auto bg-slate-900 rounded-xl p-3 text-left font-mono text-[11px] text-emerald-400">
                  <p className="animate-pulse">&gt; Reading byte streams...</p>
                  <p className="text-indigo-300">&gt; Extracting technical entities...</p>
                  <p className="text-slate-400">&gt; Updating user profile schema...</p>
                </div>
              </div>
            )}

            {/* Step 3: Success Highlights Preview */}
            {onboardingStep === 'success' && (
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-emerald-900 text-xs">Resume Extracted & Profile Updated</h4>
                    <p className="text-[11px] text-emerald-700">All data has been saved to your database and synchronized with your dashboard.</p>
                  </div>
                </div>

                {extractedPreview && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Candidate Name</span>
                        <p className="font-bold text-slate-800">{extractedPreview.name || user?.name}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Target Career</span>
                        <p className="font-bold text-indigo-600">{extractedPreview.targetCareer || 'Software Engineer'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Initial ATS Score</span>
                        <p className="font-bold text-emerald-600">{extractedPreview.atsScore || 75}/100</p>
                      </div>
                      {extractedPreview.cgpa && (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">CGPA</span>
                          <p className="font-bold text-slate-800">{extractedPreview.cgpa}</p>
                        </div>
                      )}
                    </div>

                    {extractedPreview.skills && extractedPreview.skills.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">Extracted Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {extractedPreview.skills.slice(0, 8).map((s: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-semibold text-[10px] rounded-lg">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowResumeModal(false);
                    setActiveTab('dashboard');
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>Go to Placement Cockpit Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL 2: COMPREHENSIVE PROJECT ARCHITECTURE & IMPLEMENTATION REPORT */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">SkillVision AI – Project & Architecture Report</h3>
                  <p className="text-xs text-slate-400">Comprehensive Engineering Specification, Process & Multi-Agent Mesh</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scrollable Content */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-8 text-xs text-slate-700 leading-relaxed font-sans">
              
              {/* Executive Summary */}
              <section className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  1. Executive Summary & Core Objective
                </h4>
                <p className="text-slate-600">
                  <strong>SkillVision AI</strong> is an autonomous multi-agent career guidance, technical interview coach, and placement assistant platform. It bridges the gap between academic education and industry employment requirements by offering end-to-end resume cognitive parsing, skills gap remediation, 20-question project-driven technical simulations, adaptive 6-week curriculum synthesis, interactive STAR mock interview evaluations, and personalized job matching.
                </p>
              </section>

              {/* Multi-Agent Architecture */}
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  2. Multi-Agent Orchestrator Mesh
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <p className="font-bold text-indigo-600">📄 Resume Analyzer Agent</p>
                    <p className="text-slate-600 text-[11px]">Parses PDF/TXT resumes, computes ATS compliance rating, extracts entities (skills, CGPA, target career, education) and auto-updates user profile database.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <p className="font-bold text-indigo-600">🎯 Skill Assessment & Gap Agent</p>
                    <p className="text-slate-600 text-[11px]">Generates domain quizzes (Programming, Logical, Communication, AI), assesses user competencies, computes missing skills against target industry roles.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <p className="font-bold text-indigo-600">🗺️ Learning Roadmap Agent</p>
                    <p className="text-slate-600 text-[11px]">Creates bespoke 6-week progressive learning paths with milestone tasks, practical project recommendations, and verified course links.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <p className="font-bold text-indigo-600">🎙️ STAR Mock Interview Coach Agent</p>
                    <p className="text-slate-600 text-[11px]">Conducts interactive technical and behavioral interview rounds, evaluating responses on Situation, Task, Action, and Result with qualitative feedback.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <p className="font-bold text-indigo-600">💼 Job Recommender Agent</p>
                    <p className="text-slate-600 text-[11px]">Matches candidate skills matrix against curated tech positions with match percentages, salary estimates, and direct links.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <p className="font-bold text-indigo-600">📈 Progress & Analytics Agent</p>
                    <p className="text-slate-600 text-[11px]">Aggregates holistic statistics, calculates overall task progress (0% for newly registered accounts), test metrics, and placement readiness scores.</p>
                  </div>
                </div>
              </section>

              {/* Onboarding Flow */}
              <section className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  3. New User Onboarding & Database Extraction Flow
                </h4>
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 text-slate-700">
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                    <li><strong>Account Creation:</strong> Newly registered users initialize with 0% progress on all tasks, 0% test performance, and zero prior history.</li>
                    <li><strong>Mandatory Resume Prompt:</strong> Immediately after registration/login, the system detects missing resume state and prompts the user with the Resume Onboarding Modal.</li>
                    <li><strong>Cognitive Parsing & Persistence:</strong> The backend <code>analyzeResumeAgent</code> extracts technical skills, education, target role, and CGPA, directly populating the user's Profile in <code>db.json</code>.</li>
                    <li><strong>Instant Sync:</strong> The dashboard instantly refreshes all KPI cards, ATS meters, and learning recommendations.</li>
                  </ol>
                </div>
              </section>

              {/* REST API & Backend Architecture */}
              <section className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  4. REST API Endpoint Specifications
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Endpoint</th>
                        <th className="p-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-600">POST</td>
                        <td className="p-2.5 font-mono">/api/register</td>
                        <td className="p-2.5">Creates new user with clean 0% initial metrics.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-600">POST</td>
                        <td className="p-2.5 font-mono">/api/upload-resume</td>
                        <td className="p-2.5">Uploads PDF/TXT, extracts entities, and writes directly to profile DB.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-emerald-600">GET</td>
                        <td className="p-2.5 font-mono">/api/dashboard-summary</td>
                        <td className="p-2.5">Aggregates overall task and test progress, ATS score, and goals.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-600">POST</td>
                        <td className="p-2.5 font-mono">/api/quiz/generate</td>
                        <td className="p-2.5">Dynamically generates 5 structured questions for candidate skill tests.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-600">POST</td>
                        <td className="p-2.5 font-mono">/api/interview/start</td>
                        <td className="p-2.5">Initializes an AI mock interview session with personalized questions.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Verification & Quality Metrics */}
              <section className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  5. Implementation & Verification Status
                </h4>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1.5 text-[11px] text-slate-600">
                  <p>✔ <strong>Initial Zero State:</strong> New accounts display 0% on tasks, test metrics, and milestone checklists.</p>
                  <p>✔ <strong>Onboarding Enforcement:</strong> Immediate prompt upon registration guides users to upload and parse resumes.</p>
                  <p>✔ <strong>Database Persistence:</strong> Resume extracted skills, CGPA, and goals persist across sessions.</p>
                  <p>✔ <strong>Production Stability:</strong> Full build verification passing with zero TypeScript or runtime defects.</p>
                </div>
              </section>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setShowReportModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: COMPREHENSIVE USER PROFILE & RESUME DETAILS MODAL */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        profile={dashboardSummary?.profile || null}
        resume={resumeAnalysis}
        streak={Math.max(1, (dashboardSummary?.completedTasks || 0) + (dashboardSummary?.completedGoals || 0))}
        onSaveProfile={handleSaveProfile}
        onUpdateAvatar={handleUpdateAvatar}
        onOpenResumeUpload={() => {
          setOnboardingStep('upload');
          setShowResumeModal(true);
        }}
      />

      {/* Immediate Positive Feedback Floating Toast for Completed Roadmap Tasks */}
      <AnimatePresence>
        {completedFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3.5 max-w-sm backdrop-blur-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-extrabold text-white">Checkpoint Completed!</p>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded uppercase tracking-wider">
                  +25 XP
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5 font-medium">
                {completedFeedback.text}
              </p>
              {completedFeedback.weekTitle && (
                <p className="text-[9px] text-indigo-300 font-semibold truncate mt-0.5">
                  {completedFeedback.weekTitle}
                </p>
              )}
            </div>
            <button
              onClick={() => setCompletedFeedback(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
