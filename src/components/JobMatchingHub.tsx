import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Send,
  Sparkles,
  DollarSign,
  MapPin,
  Building2,
  Clock,
  RefreshCw,
  Plus,
  X,
  FileText,
  MessageSquare,
  Trophy,
  Filter,
  Check,
  Globe2,
  Layers,
  ChevronRight,
  TrendingUp,
  Share2
} from 'lucide-react';

export interface JobItem {
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
  matchedSkills?: string[];
  missingSkills?: string[];
  matchScore?: number;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  applyLink: string;
  linkedinSearchUrl?: string;
  indeedSearchUrl?: string;
  applicationStatus?: 'not_applied' | 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  appliedAt?: string;
  notes?: string;
  offerDetails?: {
    salaryOffered?: string;
    deadline?: string;
    decision?: 'evaluating' | 'accepted' | 'declined';
    bonusOrPerks?: string;
  };
}

interface JobMatchingHubProps {
  jobs: JobItem[];
  targetCareer: string;
  userSkills: string[];
  atsScore?: number;
  onRefreshJobs: (filters?: { targetCareer?: string; location?: string }) => Promise<void>;
  onUpdateJobStatus: (jobId: string, status: JobItem['applicationStatus'], notes?: string) => Promise<void>;
  onSaveJobOffer: (jobId: string, offerDetails: NonNullable<JobItem['offerDetails']>) => Promise<void>;
  onAnalyzeCustomJob: (jobInput: string, applyUrl?: string) => Promise<any>;
  onLaunchInterviewForJob: (role: string) => void;
  onNavigateToResume: () => void;
}

export const JobMatchingHub: React.FC<JobMatchingHubProps> = ({
  jobs,
  targetCareer,
  userSkills,
  atsScore = 85,
  onRefreshJobs,
  onUpdateJobStatus,
  onSaveJobOffer,
  onAnalyzeCustomJob,
  onLaunchInterviewForJob,
  onNavigateToResume
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'linkedin' | 'indeed'>('all');
  const [workplaceFilter, setWorkplaceFilter] = useState<'all' | 'Remote' | 'Hybrid' | 'On-site'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'saved' | 'applied' | 'interviewing' | 'offered'>('all');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal States
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobItem | null>(null);
  const [customJobModalOpen, setCustomJobModalOpen] = useState(false);
  const [customJobText, setCustomJobText] = useState('');
  const [customJobUrl, setCustomJobUrl] = useState('');
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
  const [customAnalysisResult, setCustomAnalysisResult] = useState<any>(null);

  // Offer Modal State
  const [offerModalJob, setOfferModalJob] = useState<JobItem | null>(null);
  const [offerSalary, setOfferSalary] = useState('');
  const [offerDeadline, setOfferDeadline] = useState('');
  const [offerBonus, setOfferBonus] = useState('');
  const [offerDecision, setOfferDecision] = useState<'evaluating' | 'accepted' | 'declined'>('evaluating');
  const [isSavingOffer, setIsSavingOffer] = useState(false);

  // Stats calculation
  const totalMatches = jobs.length;
  const highFitCount = jobs.filter(j => (j.matchScore || 75) >= 85).length;
  const savedCount = jobs.filter(j => j.applicationStatus === 'saved').length;
  const appliedCount = jobs.filter(j => j.applicationStatus === 'applied' || j.applicationStatus === 'interviewing').length;
  const offeredCount = jobs.filter(j => j.applicationStatus === 'offered').length;

  // Filtered jobs list
  const filteredJobs = jobs.filter(job => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = job.title.toLowerCase().includes(q);
      const compMatch = job.company.toLowerCase().includes(q);
      const locMatch = job.location.toLowerCase().includes(q);
      const skillsMatch = (job.requiredSkills || []).some(s => s.toLowerCase().includes(q));
      if (!titleMatch && !compMatch && !locMatch && !skillsMatch) return false;
    }

    // Platform filter
    if (platformFilter !== 'all') {
      if (job.platform !== platformFilter) return false;
    }

    // Workplace filter
    if (workplaceFilter !== 'all') {
      if (job.workplaceType !== workplaceFilter) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (job.applicationStatus !== statusFilter) return false;
    }

    // Min match score filter
    if (minMatchScore > 0 && (job.matchScore || 70) < minMatchScore) {
      return false;
    }

    return true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshJobs();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: JobItem['applicationStatus']) => {
    await onUpdateJobStatus(jobId, newStatus);
    if (selectedJobForDetails && selectedJobForDetails.id === jobId) {
      setSelectedJobForDetails(prev => prev ? { ...prev, applicationStatus: newStatus } : null);
    }
  };

  const handleAnalyzeCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customJobText.trim()) return;
    setIsAnalyzingCustom(true);
    try {
      const res = await onAnalyzeCustomJob(customJobText, customJobUrl);
      setCustomAnalysisResult(res);
    } catch (err) {
      console.error('Custom job analysis error:', err);
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  const handleOpenOfferModal = (job: JobItem) => {
    setOfferModalJob(job);
    setOfferSalary(job.offerDetails?.salaryOffered || job.salary || '');
    setOfferDeadline(job.offerDetails?.deadline || '');
    setOfferBonus(job.offerDetails?.bonusOrPerks || '');
    setOfferDecision(job.offerDetails?.decision || 'evaluating');
  };

  const handleSaveOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerModalJob) return;
    setIsSavingOffer(true);
    try {
      await onSaveJobOffer(offerModalJob.id, {
        salaryOffered: offerSalary,
        deadline: offerDeadline,
        bonusOrPerks: offerBonus,
        decision: offerDecision
      });
      setOfferModalJob(null);
    } finally {
      setIsSavingOffer(false);
    }
  };

  return (
    <div id="job-matching-hub-container" className="space-y-6 animate-fade-in">
      {/* Top Banner: Integration Header & Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 lg:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                Live Job Matching Engine
              </span>

              {/* LinkedIn & Indeed Live Badges */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-xs font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Connected:</span>
                <span className="text-[#0a66c2] font-bold">LinkedIn</span>
                <span>&bull;</span>
                <span className="text-[#2164f3] font-bold">Indeed</span>
              </div>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Targeted Opportunities for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-300">{targetCareer || 'Software Engineer'}</span>
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed">
              Real-time openings matched against your analyzed skills ({userSkills.slice(0, 4).join(', ')}{userSkills.length > 4 ? ` +${userSkills.length - 4}` : ''}) and ATS benchmark ({atsScore}%). Apply with 1-click deep links or analyze custom listings.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="sync-jobs-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing Live Postings...' : 'Sync LinkedIn & Indeed'}</span>
            </button>

            <button
              id="paste-job-btn"
              onClick={() => {
                setCustomJobModalOpen(true);
                setCustomAnalysisResult(null);
                setCustomJobText('');
                setCustomJobUrl('');
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all hover:text-white"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Analyze Job URL / Description</span>
            </button>
          </div>
        </div>

        {/* Funnel Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 mt-6 border-t border-slate-800/80">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <div className="text-[11px] text-slate-400 font-medium">Total Matches</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{totalMatches}</div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> High Fit (&gt;85%)
            </div>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{highFitCount}</div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <div className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
              <Bookmark className="w-3 h-3" /> Saved Roles
            </div>
            <div className="text-xl font-extrabold text-indigo-400 mt-0.5">{savedCount}</div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
              <Send className="w-3 h-3" /> Active Applied
            </div>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">{appliedCount}</div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm col-span-2 sm:col-span-1">
            <div className="text-[11px] text-purple-400 font-medium flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Offers Received
            </div>
            <div className="text-xl font-extrabold text-purple-300 mt-0.5">{offeredCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="job-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role, company, skill (e.g. React)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Platform & Workplace Segment Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Platform filter tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                platformFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All Platforms
            </button>
            <button
              onClick={() => setPlatformFilter('linkedin')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                platformFilter === 'linkedin' ? 'bg-[#0a66c2] text-white shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              <span>LinkedIn</span>
            </button>
            <button
              onClick={() => setPlatformFilter('indeed')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                platformFilter === 'indeed' ? 'bg-[#2164f3] text-white shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              <span>Indeed</span>
            </button>
          </div>

          {/* Workplace type selector */}
          <select
            id="workplace-filter-select"
            value={workplaceFilter}
            onChange={(e: any) => setWorkplaceFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Any Workplace</option>
            <option value="Remote">Remote Only</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          {/* Status selector */}
          <select
            id="status-filter-select"
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Application States</option>
            <option value="saved">Saved Only</option>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered Only 🏆</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job, jobIdx) => {
            const uniqueJobKey = job.id || `job-${jobIdx}-${job.title}-${job.company}`;
            const score = job.matchScore || 75;
            const isHighFit = score >= 85;
            const isSaved = job.applicationStatus === 'saved';
            const isApplied = job.applicationStatus === 'applied';
            const isInterviewing = job.applicationStatus === 'interviewing';
            const isOffered = job.applicationStatus === 'offered';

            return (
              <motion.div
                key={uniqueJobKey}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-6 hover:shadow-lg relative overflow-hidden group ${
                  isOffered
                    ? 'border-purple-300 ring-2 ring-purple-100 bg-gradient-to-b from-purple-50/20 to-white'
                    : isInterviewing
                      ? 'border-indigo-300 ring-2 ring-indigo-100'
                      : isApplied
                        ? 'border-emerald-300 bg-emerald-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Top bar: Platform Badge, Match score, Save bookmark */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Platform indicator badge */}
                      {job.platform === 'linkedin' ? (
                        <span className="px-2 py-0.5 bg-[#0a66c2]/10 border border-[#0a66c2]/30 text-[#0a66c2] text-[10px] font-extrabold rounded-md flex items-center gap-1">
                          <span className="font-black">in</span> LinkedIn Jobs
                        </span>
                      ) : job.platform === 'indeed' ? (
                        <span className="px-2 py-0.5 bg-[#2164f3]/10 border border-[#2164f3]/30 text-[#2164f3] text-[10px] font-extrabold rounded-md flex items-center gap-1">
                          <span className="font-black">indeed</span> Post
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-extrabold rounded-md">
                          Direct Portal
                        </span>
                      )}

                      {/* Workplace badge */}
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                        job.workplaceType === 'Remote'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {job.workplaceType}
                      </span>
                    </div>

                    {/* Compatibility Match Score Pill */}
                    <div className="flex items-center gap-1.5">
                      <div className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                        isHighFit
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : score >= 70
                            ? 'bg-indigo-100 text-indigo-800 font-extrabold'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        <span>{score}% Match</span>
                      </div>

                      {/* Quick Bookmark Toggle */}
                      <button
                        title={isSaved ? "Remove from saved" : "Save this job"}
                        onClick={() => handleStatusChange(job.id, isSaved ? 'not_applied' : 'saved')}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isSaved
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Title & Company */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-slate-600 text-xs font-medium">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {job.company}
                      </span>
                      <span>&bull;</span>
                      <span className="text-slate-400">{job.postedDate}</span>
                    </div>
                  </div>

                  {/* Salary & Location Info */}
                  <div className="space-y-1 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                  </div>

                  {/* Skills Match Breakdown Chips */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Skills Match ({job.matchedSkills?.length || 0} / {job.requiredSkills?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(job.matchedSkills || []).slice(0, 3).map((sk, sIdx) => (
                        <span
                          key={`matched-${uniqueJobKey}-${sk}-${sIdx}`}
                          className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          {sk}
                        </span>
                      ))}

                      {(job.missingSkills || []).slice(0, 2).map((sk, sIdx) => (
                        <span
                          key={`missing-${uniqueJobKey}-${sk}-${sIdx}`}
                          className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold rounded"
                        >
                          + {sk}
                        </span>
                      ))}

                      {((job.requiredSkills?.length || 0) > 5) && (
                        <span className="px-1.5 py-0.5 text-slate-400 text-[10px] font-semibold">
                          +{(job.requiredSkills?.length || 0) - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Banner if active application */}
                  {job.applicationStatus && job.applicationStatus !== 'not_applied' && (
                    <div className="pt-2">
                      {isOffered ? (
                        <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs flex items-center justify-between text-purple-900 font-bold">
                          <div className="flex items-center gap-1.5">
                            <Trophy className="w-4 h-4 text-purple-600" />
                            <span>Offer Received: {job.offerDetails?.salaryOffered || job.salary}</span>
                          </div>
                          <button
                            onClick={() => handleOpenOfferModal(job)}
                            className="text-[10px] text-purple-700 underline font-semibold hover:text-purple-900"
                          >
                            Details
                          </button>
                        </div>
                      ) : isInterviewing ? (
                        <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs flex items-center gap-1.5 text-indigo-900 font-semibold">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Interview in Progress</span>
                        </div>
                      ) : isApplied ? (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center gap-1.5 text-emerald-800 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Applied on {job.appliedAt ? new Date(job.appliedAt).toLocaleDateString() : 'Platform'}</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Bottom Action Tray */}
                <div className="space-y-2 pt-4 mt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    {/* View on Platform (LinkedIn / Indeed) */}
                    <a
                      href={job.applyLink || (job.platform === 'linkedin' ? job.linkedinSearchUrl : job.indeedSearchUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 py-2 text-center text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] ${
                        job.platform === 'linkedin'
                          ? 'bg-[#0a66c2] hover:bg-[#004182]'
                          : 'bg-[#2164f3] hover:bg-[#0f4ac4]'
                      }`}
                    >
                      <span>Apply on {job.platform === 'linkedin' ? 'LinkedIn' : 'Indeed'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* AI Fit & Strategy Details Modal */}
                    <button
                      onClick={() => setSelectedJobForDetails(job)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>AI Pitch & Fit</span>
                    </button>
                  </div>

                  {/* Status update quick buttons */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="font-semibold">Status:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStatusChange(job.id, 'applied')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          isApplied
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                        }`}
                      >
                        Applied
                      </button>

                      <button
                        onClick={() => handleStatusChange(job.id, 'interviewing')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          isInterviewing
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 hover:border-indigo-400 hover:text-indigo-700'
                        }`}
                      >
                        Interview
                      </button>

                      <button
                        onClick={() => handleOpenOfferModal(job)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          isOffered
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'border-slate-200 hover:border-purple-400 hover:text-purple-700'
                        }`}
                      >
                        🏆 Offer
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
          <h3 className="font-bold text-slate-800 text-base">No Matching Job Postings Found</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
            No openings match your current search or filter criteria. Try broadening filters or click "Sync LinkedIn & Indeed" to refresh opportunities.
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Sync All Roles
          </button>
        </div>
      )}

      {/* MODAL 1: In-Depth Job AI Fit, Tailored Cover Pitch & Interview Prep */}
      <AnimatePresence>
        {selectedJobForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded uppercase">
                      {selectedJobForDetails.platform} Verified
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded">
                      {selectedJobForDetails.matchScore || 85}% Skill Match
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg mt-1">{selectedJobForDetails.title}</h3>
                  <p className="text-indigo-600 font-bold text-xs">{selectedJobForDetails.company} &bull; {selectedJobForDetails.location}</p>
                </div>
                <button
                  onClick={() => setSelectedJobForDetails(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
                {/* Salary & Workplace summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Compensation</span>
                    <span className="font-extrabold text-slate-900">{selectedJobForDetails.salary}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Workplace</span>
                    <span className="font-bold text-slate-800">{selectedJobForDetails.workplaceType} ({selectedJobForDetails.jobType})</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Seniority</span>
                    <span className="font-bold text-slate-800">{selectedJobForDetails.experienceLevel}</span>
                  </div>
                </div>

                {/* Role Description */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 text-xs">Role Mission & Overview</h4>
                  <p className="leading-relaxed text-slate-600">{selectedJobForDetails.description}</p>
                </div>

                {/* Requirements */}
                {selectedJobForDetails.requirements && selectedJobForDetails.requirements.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800 text-xs">Key Qualifications</h4>
                    <ul className="space-y-1">
                      {selectedJobForDetails.requirements.map((req, i) => (
                        <li key={`detail-req-${selectedJobForDetails.id || 'job'}-${i}`} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Tailored Cover Letter Pitch */}
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-emerald-50 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      AI Application Pitch for {selectedJobForDetails.company}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Copy Ready
                    </span>
                  </div>
                  <p className="text-slate-700 font-mono text-[11px] leading-relaxed bg-white/80 p-3 rounded-lg border border-indigo-100">
                    "Hi {selectedJobForDetails.company} Hiring Team, as a candidate specializing in {userSkills.slice(0, 3).join(', ')}, I was excited to find the {selectedJobForDetails.title} role. My background in building performant systems and solving complex challenges directly aligns with your team requirements."
                  </p>
                </div>

                {/* Mock Interview Launch Button */}
                <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs">Prepare with AI Interview Coach</h5>
                    <p className="text-slate-400 text-[11px]">Generate simulated questions targeting {selectedJobForDetails.company}'s tech stack.</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedJobForDetails(null);
                      onLaunchInterviewForJob(selectedJobForDetails.title);
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    Launch Mock Loop
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-semibold">Track Status:</span>
                  <select
                    value={selectedJobForDetails.applicationStatus || 'not_applied'}
                    onChange={(e: any) => handleStatusChange(selectedJobForDetails.id, e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700"
                  >
                    <option value="not_applied">Not Applied</option>
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered 🏆</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={selectedJobForDetails.applyLink || selectedJobForDetails.linkedinSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Launch Direct Application</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Paste Any LinkedIn or Indeed Job URL / Description for Instant AI Audit */}
      <AnimatePresence>
        {customJobModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Paste Any LinkedIn / Indeed Job</h3>
                    <p className="text-slate-400 text-xs">Instantly audit your ATS match fit & extract targeted interview prep</p>
                  </div>
                </div>
                <button
                  onClick={() => setCustomJobModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {!customAnalysisResult ? (
                  <form onSubmit={handleAnalyzeCustomSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        LinkedIn / Indeed Application Link (Optional)
                      </label>
                      <input
                        type="url"
                        value={customJobUrl}
                        onChange={(e) => setCustomJobUrl(e.target.value)}
                        placeholder="https://www.linkedin.com/jobs/view/... or Indeed URL"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Job Description / Text <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={6}
                        required
                        value={customJobText}
                        onChange={(e) => setCustomJobText(e.target.value)}
                        placeholder="Paste the requirements, qualifications, and role description copied from LinkedIn or Indeed..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAnalyzingCustom || customJobText.trim().length < 10}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                    >
                      <Sparkles className={`w-4 h-4 ${isAnalyzingCustom ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzingCustom ? 'Analyzing ATS Compatibility...' : 'Audit Match Fit & Add to Tracker'}</span>
                    </button>
                  </form>
                ) : (
                  /* Analysis Result View */
                  <div className="space-y-4 text-xs">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-emerald-950 text-sm">{customAnalysisResult.job?.title}</h4>
                        <p className="text-emerald-700 font-semibold">{customAnalysisResult.job?.company} &bull; {customAnalysisResult.job?.location}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs rounded-full">
                        {customAnalysisResult.job?.matchScore}% Match
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-800 text-xs">Resume Tailoring Recommendations</h5>
                      <ul className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {(customAnalysisResult.tailorSuggestions || []).map((s: string, idx: number) => (
                          <li key={`tailor-sug-${idx}-${s.slice(0, 10)}`} className="flex items-start gap-2 text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {customAnalysisResult.coverLetterPitch && (
                      <div className="space-y-1.5">
                        <h5 className="font-bold text-slate-800 text-xs">Direct Pitch Snippet</h5>
                        <p className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl font-mono text-[11px] text-slate-700">
                          {customAnalysisResult.coverLetterPitch}
                        </p>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Added to your active tracker!</span>
                      <button
                        onClick={() => {
                          setCustomJobModalOpen(false);
                          setCustomAnalysisResult(null);
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Formal Job Offer Logger & Decision Helper */}
      <AnimatePresence>
        {offerModalJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 bg-purple-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Log Job Offer</h3>
                    <p className="text-slate-500 text-[11px]">{offerModalJob.title} at {offerModalJob.company}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOfferModalJob(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveOfferSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Offered Base Compensation
                  </label>
                  <input
                    type="text"
                    required
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(e.target.value)}
                    placeholder="e.g. $140,000 / yr or ₹24 LPA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Bonus, Equity & Perks
                  </label>
                  <input
                    type="text"
                    value={offerBonus}
                    onChange={(e) => setOfferBonus(e.target.value)}
                    placeholder="e.g. $20k Signing Bonus + 0.05% Equity"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Decision Deadline
                    </label>
                    <input
                      type="date"
                      value={offerDeadline}
                      onChange={(e) => setOfferDeadline(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={offerDecision}
                      onChange={(e: any) => setOfferDecision(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="evaluating">Evaluating 🤔</option>
                      <option value="accepted">Accepted 🎉</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingOffer}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    {isSavingOffer ? 'Saving Offer...' : 'Save Offer to Dashboard'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
