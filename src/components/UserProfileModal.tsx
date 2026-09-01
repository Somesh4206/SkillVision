import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  X,
  Camera,
  Upload,
  Check,
  FileText,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Linkedin,
  Github,
  Globe,
  Sparkles,
  Save,
  Trash2,
  ExternalLink,
  Target,
  ShieldCheck,
  Flame,
  Clock,
  Layers,
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';

interface ProfileData {
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

interface ResumeData {
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

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; email: string; name: string; avatar?: string } | null;
  profile: ProfileData | null;
  resume: ResumeData | null;
  streak?: number;
  onSaveProfile: (updatedProfile: Partial<ProfileData>) => Promise<boolean>;
  onUpdateAvatar: (avatarDataUrl: string) => Promise<boolean>;
  onOpenResumeUpload: () => void;
}

const AVATAR_PRESETS = [
  { id: 'dev-1', label: 'Tech Pro Alex', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
  { id: 'dev-2', label: 'Lead Engineer Priya', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' },
  { id: 'dev-3', label: 'Full Stack Marcus', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  { id: 'dev-4', label: 'AI Specialist Elena', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80' },
  { id: 'bot-1', label: 'Cyber Cybernaut', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SkillVisionPro' },
  { id: 'avatar-1', label: 'Creative Dev', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
  { id: 'avatar-2', label: 'Cloud Architect', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan' },
  { id: 'avatar-3', label: 'Data Scientist', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Taylor' }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  resume,
  streak = 1,
  onSaveProfile,
  onUpdateAvatar,
  onOpenResumeUpload
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'edit'>('overview');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form states initialized from profile and user
  const [formData, setFormData] = useState({
    name: profile?.name || user?.name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
    university: profile?.university || '',
    graduationYear: profile?.graduationYear || '',
    cgpa: profile?.cgpa || '',
    targetCareer: profile?.targetCareer || '',
    interests: profile?.interests?.join(', ') || '',
    currentSkills: profile?.currentSkills?.join(', ') || '',
    linkedinUrl: profile?.linkedinUrl || '',
    githubUrl: profile?.githubUrl || '',
    portfolioUrl: profile?.portfolioUrl || '',
    education: profile?.education || '',
    experience: profile?.experience || '',
    certifications: profile?.certifications || ''
  });

  // Sync formData when profile changes
  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || user?.name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        university: profile.university || '',
        graduationYear: profile.graduationYear || '',
        cgpa: profile.cgpa || '',
        targetCareer: profile.targetCareer || '',
        interests: profile.interests?.join(', ') || '',
        currentSkills: profile.currentSkills?.join(', ') || '',
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        education: profile.education || '',
        experience: profile.experience || '',
        certifications: profile.certifications || ''
      });
    }
  }, [profile, user]);

  if (!isOpen) return null;

  const currentAvatar = user?.avatar || profile?.avatar;
  const userInitials = (formData.name || user?.name || 'User')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Handle local image file upload with client-side compression/resizing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 400x400 for crisp quality and compact size
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          applyNewAvatar(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const applyNewAvatar = async (avatarUrl: string) => {
    setIsAvatarSaving(true);
    const success = await onUpdateAvatar(avatarUrl);
    setIsAvatarSaving(false);
    if (success) {
      setShowPhotoPicker(false);
      setSaveSuccessMsg('Profile photo updated successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsAvatarSaving(true);
    const success = await onUpdateAvatar('');
    setIsAvatarSaving(false);
    if (success) {
      setShowPhotoPicker(false);
      setSaveSuccessMsg('Profile photo removed.');
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload: Partial<ProfileData> = {
      name: formData.name.trim() || 'User',
      phone: formData.phone.trim(),
      location: formData.location.trim(),
      bio: formData.bio.trim(),
      university: formData.university.trim(),
      graduationYear: formData.graduationYear.trim(),
      cgpa: formData.cgpa.trim(),
      targetCareer: formData.targetCareer.trim(),
      interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean),
      currentSkills: formData.currentSkills.split(',').map(s => s.trim()).filter(Boolean),
      linkedinUrl: formData.linkedinUrl.trim(),
      githubUrl: formData.githubUrl.trim(),
      portfolioUrl: formData.portfolioUrl.trim(),
      education: formData.education.trim(),
      experience: formData.experience.trim(),
      certifications: formData.certifications.trim()
    };

    const success = await onSaveProfile(payload);
    setIsSaving(false);

    if (success) {
      setSaveSuccessMsg('Profile details saved & synchronized successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 3500);
      setActiveTab('overview');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden relative"
      >
        {/* Top Decorative Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shrink-0 overflow-hidden">
          {/* Subtle tech grid mesh background */}
          <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"
            title="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Hero Header Content */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Avatar with Photo Upload Trigger */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-3xl flex items-center justify-center shadow-xl ring-4 ring-white/10 overflow-hidden border-2 border-indigo-400/40">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>

              {/* Add/Change Photo overlay button */}
              <button
                onClick={() => setShowPhotoPicker(prev => !prev)}
                className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl shadow-lg border-2 border-slate-900 transition-all hover:scale-105 flex items-center gap-1 group-hover:ring-2 ring-indigo-400"
                title="Change Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* User Core Identity Meta */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                  {formData.name || 'Anonymous Learner'}
                </h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold rounded-full flex items-center gap-1 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Verified Candidate
                </span>
                <span className="px-2.5 py-0.5 bg-orange-500/20 border border-orange-400/30 text-orange-300 text-[10px] font-extrabold rounded-full flex items-center gap-1 uppercase tracking-wider">
                  <Flame className="w-3 h-3 fill-orange-400" /> {streak}d Streak
                </span>
              </div>

              <p className="text-indigo-200 text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5 truncate">
                <Target className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{formData.targetCareer || 'Career Path in Discovery'}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{user?.email || 'No email attached'}</span>
                </div>
                {formData.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formData.location}</span>
                  </div>
                )}
                {formData.university && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{formData.university}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="shrink-0 flex sm:flex-col gap-2">
              <button
                onClick={() => setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/20 flex items-center gap-1.5"
              >
                {activeTab === 'edit' ? <FileText className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{activeTab === 'edit' ? 'View Profile' : 'Edit Details'}</span>
              </button>
            </div>
          </div>

          {/* Photo Picker Dropdown / Modal Extension */}
          <AnimatePresence>
            {showPhotoPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 bg-slate-900/90 border border-slate-700 rounded-2xl backdrop-blur-xl relative z-30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Select Profile Photo</h4>
                  </div>
                  <button
                    onClick={() => setShowPhotoPicker(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option A: Upload from Computer */}
                  <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-white mb-1">Upload from Device</p>
                      <p className="text-[11px] text-slate-400">Choose any JPG, PNG, or WEBP photo from your computer or phone.</p>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAvatarSaving}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isAvatarSaving ? 'Uploading...' : 'Choose File'}</span>
                      </button>
                      {currentAvatar && (
                        <button
                          onClick={handleRemoveAvatar}
                          disabled={isAvatarSaving}
                          className="bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1 transition-all border border-rose-700/50"
                          title="Remove custom photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Option B: Enter Image URL */}
                  <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-white mb-1">Paste Image URL</p>
                      <p className="text-[11px] text-slate-400">Provide direct link to your LinkedIn, GitHub, or public photo.</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <input
                        type="url"
                        value={customPhotoUrl}
                        onChange={(e) => setCustomPhotoUrl(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => {
                          if (customPhotoUrl.trim()) applyNewAvatar(customPhotoUrl.trim());
                        }}
                        disabled={!customPhotoUrl.trim() || isAvatarSaving}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option C: Preset Avatars */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <p className="text-[11px] font-bold text-slate-300 mb-2.5">Or Choose from Curated Pro Avatars:</p>
                  <div className="flex items-center gap-3 overflow-x-auto pb-1.5">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => applyNewAvatar(preset.url)}
                        className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all hover:scale-110 relative ${
                          currentAvatar === preset.url ? 'border-indigo-400 ring-2 ring-indigo-400' : 'border-slate-700 hover:border-indigo-300'
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Feedback Banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs font-bold text-emerald-800 animate-fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Inner Tabs Bar */}
        <div className="px-6 sm:px-8 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex gap-2 sm:gap-6 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 pt-2 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile & Personal Details</span>
            </button>

            <button
              onClick={() => setActiveTab('resume')}
              className={`pb-2 pt-2 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'resume'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Resume Deep-Dive</span>
              {resume ? (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-extrabold">
                  {resume.atsScore}/100
                </span>
              ) : (
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">
                  Missing
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('edit')}
              className={`pb-2 pt-2 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'edit'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Edit Profile Data</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenResumeUpload();
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 py-1.5 px-3 rounded-lg border border-indigo-200 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Update Resume</span>
            </button>
          </div>
        </div>

        {/* Scrollable Main Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/50 space-y-6">
          {/* TAB 1: OVERVIEW / PERSONAL DETAILS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Short Bio / Headline */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Professional Bio & Headline
                  </h3>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  {formData.bio ||
                    'Aspiring technologist aiming to accelerate placement readiness through continuous learning, project-driven software development, and algorithmic mock mastery.'}
                </p>
              </div>

              {/* Personal & Academic Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Academic & University Profile */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    Academic Credentials
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Institution / University</span>
                      <span className="font-bold text-slate-800 text-right">
                        {formData.university || resume?.education || 'Not specified'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Graduation Year / Term</span>
                      <span className="font-bold text-slate-800">
                        {formData.graduationYear || '2026'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Academic CGPA / GPA</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold rounded-md">
                        {formData.cgpa || '8.5 / 10'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-500 font-medium">Target Placement Role</span>
                      <span className="font-bold text-indigo-600">
                        {formData.targetCareer || 'Software Engineer'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Professional Channels */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    Contact & Professional Links
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                      </span>
                      <span className="font-bold text-slate-800">{user?.email || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
                      </span>
                      <span className="font-bold text-slate-800">{formData.phone || '+1 (555) 019-2834'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn
                      </span>
                      {formData.linkedinUrl ? (
                        <a
                          href={formData.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                        >
                          <span>{formData.linkedinUrl.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Not connected</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-slate-800" /> GitHub
                      </span>
                      {formData.githubUrl ? (
                        <a
                          href={formData.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-slate-800 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                        >
                          <span>{formData.githubUrl.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Not connected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills & Domain Interests Tags */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-500" />
                    Verified Skills & Focus Domains
                  </h3>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold"
                  >
                    + Add Skills
                  </button>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-500 mb-2">Active Technical Competencies:</p>
                  <div className="flex flex-wrap gap-2">
                    {profile?.currentSkills && profile.currentSkills.length > 0 ? (
                      profile.currentSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs rounded-xl shadow-2xs"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No skills cataloged yet. Upload your resume or add in edit mode.</span>
                    )}
                  </div>
                </div>

                {profile?.interests && profile.interests.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 mb-2">Interests & Specializations:</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RESUME DEEP-DIVE */}
          {activeTab === 'resume' && (
            <div className="space-y-6 animate-fade-in">
              {/* Resume Status Deck */}
              {resume ? (
                <>
                  <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50/30 p-5 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-600/20 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{resume.fileName}</h4>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded uppercase">
                            Parsed
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Analyzed by Gemini Resume Agent • Synchronized with placement database
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ATS Score</p>
                        <p className="text-2xl font-black text-indigo-600">{resume.atsScore}<span className="text-xs text-slate-400 font-normal">/100</span></p>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenResumeUpload();
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-upload</span>
                      </button>
                    </div>
                  </div>

                  {/* Resume Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Parsed Experience */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        Extracted Work Experience & Projects
                      </h4>
                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        {resume.experience || profile?.experience || 'No detailed work history found in uploaded resume.'}
                      </p>
                    </div>

                    {/* Parsed Education & Certifications */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        Education & Certifications
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Degree & Institution</p>
                          <p className="text-xs font-semibold text-slate-800 mt-1">
                            {resume.education || profile?.education || 'Standard University Program'}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Certifications & Badges</p>
                          <p className="text-xs font-semibold text-slate-800 mt-1">
                            {resume.certifications || profile?.certifications || 'No certifications detected.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills extracted from Resume */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      Key Skills Identified in Resume
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills && resume.skills.length > 0 ? (
                        resume.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-lg flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No skills parsed.</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Keywords & Suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Missing Keywords */}
                    <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-3 bg-amber-50/20">
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Missing ATS Target Keywords
                      </h4>
                      <p className="text-[11px] text-slate-500">Include these industry terms to boost your ATS pass rate:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.missingKeywords && resume.missingKeywords.length > 0 ? (
                          resume.missingKeywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-md border border-amber-200"
                            >
                              + {kw}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold">Great job! No major keywords missing.</span>
                        )}
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-sm space-y-3 bg-indigo-50/20">
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        AI Resume Coach Bullet Improvements
                      </h4>
                      <ul className="space-y-2">
                        {resume.suggestions && resume.suggestions.length > 0 ? (
                          resume.suggestions.slice(0, 3).map((sug, idx) => (
                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                              <span>{sug}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-400">Resume is well formatted and optimized.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">No Resume Uploaded Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Upload your resume in PDF or TXT format to automatically calculate your ATS score, extract your skills into your profile, and receive tailored interview questions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenResumeUpload();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Resume Now</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EDIT PROFILE DATA */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveForm} className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-indigo-600" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Somesh Kumar"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Location / City</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. San Francisco, CA / Bengaluru, India"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Placement Career</label>
                    <input
                      type="text"
                      value={formData.targetCareer}
                      onChange={(e) => setFormData({ ...formData, targetCareer: e.target.value })}
                      placeholder="e.g. Full Stack Developer / AI Engineer"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Short Bio / Career Objective</label>
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Brief headline or career vision..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Academic & University Profile */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Academic Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">University / College</label>
                    <input
                      type="text"
                      value={formData.university}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      placeholder="e.g. Stanford University"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Graduation Year</label>
                    <input
                      type="text"
                      value={formData.graduationYear}
                      onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                      placeholder="e.g. 2026"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Current CGPA / GPA</label>
                    <input
                      type="text"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      placeholder="e.g. 8.7 or 3.8"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Skills & Focus Areas */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Skills & Focus Domains
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Technical Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.currentSkills}
                    onChange={(e) => setFormData({ ...formData, currentSkills: e.target.value })}
                    placeholder="React, TypeScript, Node.js, Python, PostgreSQL, Docker, AWS"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Separate individual technologies with a comma.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Interests & Domains (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.interests}
                    onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                    placeholder="Cloud Computing, Machine Learning, Web3, Distributed Systems"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Links & Socials */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  Social & Portfolio Links
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">LinkedIn Profile</label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">GitHub Profile</label>
                    <input
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Portfolio / Website</label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                      placeholder="https://portfolio.dev"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Action Bar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="px-6 sm:px-8 py-3 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span>SkillVision AI Database Synchronized</span>
          </div>
          <div>
            <span>User ID: <code className="text-slate-700 font-mono">{user?.id?.slice(0, 12) || 'usr_default'}</code></span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
