'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/dashboard/ui/Button';
import { PageHeader } from '@/components/dashboard/ui/PageHeader';
import {
  Coins, Star, Calendar, Loader2, Save, User, GraduationCap,
  MapPin, Globe, Phone, Github, Linkedin, Languages, Monitor,
  ChevronDown, X, Plus, Trash2, AlertTriangle, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ALL_SKILLS, ROUTES } from '@/lib/constants';
import { authFetch } from '@/lib/authFetch';
import { BadgesSection } from '@/components/dashboard/BadgesSection';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const DEGREE_OPTIONS = ['B.Tech', 'B.E.', 'B.Sc', 'BBA', 'BCA', 'B.Com', 'BA', 'M.Tech', 'M.Sc', 'MBA', 'MCA', 'PhD', 'Other'];
const SESSION_MODES = ['Online', 'In-person', 'Both'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Odia', 'Assamese', 'French', 'German', 'Spanish', 'Japanese', 'Korean', 'Mandarin'];
const YEAR_OPTIONS = [1, 2, 3, 4, 5];

function FormInput({ label, icon: Icon, value, onChange, placeholder, type = 'text' }: {
  label: string; icon: React.ElementType; value: string;
  onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <Icon size={18} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder.toUpperCase()}
          className="w-full pl-10 pr-4 h-12 bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
        />
      </div>
    </div>
  );
}

function FormSelect({ label, icon: Icon, value, onChange, options, placeholder }: {
  label: string; icon: React.ElementType; value: string;
  onChange: (v: string) => void; options: string[]; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <Icon size={18} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 h-12 bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all appearance-none cursor-pointer uppercase"
        >
          <option value="">{placeholder.toUpperCase()}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt.toUpperCase()}</option>
          ))}
        </select>
        <ChevronDown size={18} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-neo-ink pointer-events-none" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { profile, skills, loading, refreshProfile, connectionsCount } = useUser();

  // Form state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [city, setCity] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [preferredMode, setPreferredMode] = useState('Both');
  const [languages, setLanguages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [langInput, setLangInput] = useState('');
  
  // Real-time skill editing state
  const [offeredSkillInput, setOfferedSkillInput] = useState('');
  const [desiredSkillInput, setDesiredSkillInput] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || '');
    setBio(profile.bio || '');
    setPhoneNum(profile.phone || '');
    setGender(profile.gender || '');
    setAge(profile.age?.toString() || '');
    setCollegeName(profile.college_name || '');
    setDegree(profile.degree || '');
    setBranch(profile.branch || '');
    setYearOfStudy(profile.year_of_study?.toString() || '');
    setGradYear(profile.graduation_year?.toString() || '');
    setCity(profile.city || '');
    setGithubUrl(profile.github_url || '');
    setLinkedinUrl(profile.linkedin_url || '');
    setPreferredMode(profile.preferred_mode || 'Both');
    setLanguages(profile.languages || []);
  }, [profile]);

  // Calculate profile completion
  const fields = [fullName, bio, phoneNum, gender, collegeName, degree, branch, yearOfStudy, gradYear, city];
  const filledCount = fields.filter((f) => f.trim().length > 0).length;
  const completionPercent = Math.round((filledCount / fields.length) * 100);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    const updates = {
      full_name: fullName || null,
      bio: bio || null,
      phone: phoneNum || null,
      gender: gender || null,
      age: age ? parseInt(age) : null,
      college_name: collegeName || null,
      degree: degree || null,
      branch: branch || null,
      year_of_study: yearOfStudy ? parseInt(yearOfStudy) : null,
      graduation_year: gradYear ? parseInt(gradYear) : null,
      city: city || null,
      github_url: githubUrl || null,
      linkedin_url: linkedinUrl || null,
      preferred_mode: preferredMode || 'Both',
      languages: languages.length > 0 ? languages : null,
      profile_completed: completionPercent >= 70,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile!.id);

    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success('Profile updated! 🎉');
      await refreshProfile();
    }
    setSaving(false);
  };

  const addLanguage = (lang: string) => {
    if (lang && !languages.includes(lang)) {
      setLanguages([...languages, lang]);
    }
    setLangInput('');
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const handleAddSkill = async (skillName: string, type: 'offered' | 'desired') => {
    if (!skillName.trim() || !profile) return;
    
    // Check if they already have it in the same category
    const alreadyHas = skills.some((s) => s.skill_name.toLowerCase() === skillName.toLowerCase() && s.type === type);
    if (alreadyHas) {
      toast.error('Skill already added!');
      return;
    }

    // Prevent adding a skill that's already in the opposite category
    const oppositeType = type === 'offered' ? 'desired' : 'offered';
    const inOpposite = skills.some((s) => s.skill_name.toLowerCase() === skillName.toLowerCase() && s.type === oppositeType);
    if (inOpposite) {
      toast.error(
        type === 'offered'
          ? `"${skillName.trim()}" is already in your "Want to Learn" list — you can\'t teach and learn the same skill!`
          : `"${skillName.trim()}" is already in your "Teach" list — you can\'t learn and teach the same skill!`
      );
      return;
    }

    setIsAddingSkill(true);
    const supabase = createClient();
    const { error } = await supabase.from('skills').insert([
      { user_id: profile.id, skill_name: skillName.trim(), type }
    ]);

    if (error) {
      toast.error('Failed to add skill: ' + error.message);
    } else {
      toast.success(`Added ${skillName.trim()}`);
      if (type === 'offered') setOfferedSkillInput('');
      else setDesiredSkillInput('');
      await refreshProfile();
    }
    setIsAddingSkill(false);
  };

  const handleRemoveSkill = async (skillId: string, skillName: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('skills').delete().eq('id', skillId);
    
    if (error) {
      toast.error('Failed to remove skill: ' + error.message);
    } else {
      toast.success(`Removed ${skillName}`);
      await refreshProfile();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="animate-spin text-neo-purple" />
        <span className="font-heading font-black uppercase tracking-widest text-neo-ink">Loading Profile...</span>
      </div>
    );
  }

  const offeredSkills = skills.filter((s) => s.type === 'offered');
  const desiredSkills = skills.filter((s) => s.type === 'desired');
  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${profile?.username || 'User'}&backgroundColor=FFF9E9`;

  return (
    <div className="max-w-[800px] mx-auto space-y-8 animate-page-in">
      <PageHeader 
        title="Profile Settings"
        subtitle="Manage your skill exchange profile"
      />

      {/* Profile header card */}
      <div className="ss-card border-[4px] p-6 bg-neo-yellow shadow-[6px_6px_0_#111111]">
        <div className="flex items-start gap-6">
          <Image src={avatarUrl} alt={profile?.username || 'User'} width={96} height={96} className="w-24 h-24 border-[3px] border-neo-ink bg-white shadow-[4px_4px_0_#111111]" />
          <div className="flex-1">
            <h2 className="font-heading font-black text-3xl uppercase tracking-tight text-neo-ink leading-none mb-2">
              {fullName || profile?.username || 'Unknown'}
            </h2>
            <p className="text-sm font-bold uppercase tracking-widest text-neo-ink/70 mb-2">@{profile?.username}</p>
            {(collegeName || degree) && (
              <p className="text-xs font-bold uppercase tracking-widest text-neo-ink/90">
                {degree && `${degree} `}{branch && `IN ${branch} `}{collegeName && `• ${collegeName}`}
              </p>
            )}

            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[2px] border-neo-ink text-[10px] font-bold uppercase tracking-widest text-neo-ink shadow-[2px_2px_0_#111111]"><Users size={14} strokeWidth={3} className="text-neo-purple" />{connectionsCount} CONNECTIONS</span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[2px] border-neo-ink text-[10px] font-bold uppercase tracking-widest text-neo-ink shadow-[2px_2px_0_#111111]"><Coins size={14} strokeWidth={3} className="text-neo-yellow" />{profile?.credits ?? 0} CREDITS</span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[2px] border-neo-ink text-[10px] font-bold uppercase tracking-widest text-neo-ink shadow-[2px_2px_0_#111111]"><Star size={14} strokeWidth={3} className="text-neo-green fill-neo-green" />{profile?.average_rating?.toFixed(1) ?? '0.0'}</span>
            </div>
          </div>

          {/* Completion indicator */}
          <div className="text-center shrink-0 bg-white border-[3px] border-neo-ink p-3 shadow-[4px_4px_0_#111111]">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#FFFDF5" strokeWidth="6" className="border-neo-ink" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke={completionPercent >= 70 ? 'var(--ss-green)' : completionPercent >= 40 ? 'var(--ss-yellow)' : 'var(--ss-coral)'}
                  strokeWidth="6"
                  strokeDasharray={`${(completionPercent / 100) * 150.8} 150.8`}
                  strokeLinecap="square"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-heading font-black text-neo-ink">
                {completionPercent}%
              </span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neo-ink mt-2">COMPLETE</p>
          </div>
        </div>
      </div>

      {/* Badges & Milestones */}
      <BadgesSection />

      {/* Personal Info */}
      <div className="ss-card border-[3px] p-6 bg-white shadow-[6px_6px_0_#111111]">
        <h3 className="font-heading font-black text-xl uppercase tracking-tight text-neo-ink mb-6 flex items-center gap-3 border-b-[3px] border-neo-ink pb-4">
          <span className="w-8 h-8 flex items-center justify-center bg-neo-purple border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]"><User size={16} strokeWidth={3} className="text-white" /></span>
          Personal Info
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormInput label="Full Name" icon={User} value={fullName} onChange={setFullName} placeholder="Arjun Raghavan" />
          <FormInput label="Phone" icon={Phone} value={phoneNum} onChange={setPhoneNum} placeholder="+91 98765 43210" type="tel" />
          <FormSelect label="Gender" icon={User} value={gender} onChange={setGender} options={GENDER_OPTIONS} placeholder="Select gender" />
          <FormInput label="Age" icon={Calendar} value={age} onChange={setAge} placeholder="20" type="number" />
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="MERN DEVELOPER, CHESS NERD, LOVE TEACHING..."
              maxLength={300}
              className="w-full px-4 py-3 bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all resize-none h-24 uppercase"
            />
            <p className="text-[10px] font-bold uppercase tracking-widest text-neo-ink/50 mt-2 text-right">{bio.length}/300</p>
          </div>
        </div>
      </div>

      {/* Academic Info */}
      <div className="ss-card border-[3px] p-6 bg-white shadow-[6px_6px_0_#111111]">
        <h3 className="font-heading font-black text-xl uppercase tracking-tight text-neo-ink mb-6 flex items-center gap-3 border-b-[3px] border-neo-ink pb-4">
          <span className="w-8 h-8 flex items-center justify-center bg-neo-green border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]"><GraduationCap size={16} strokeWidth={3} className="text-neo-ink" /></span>
          Academic Info
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormInput label="College Name" icon={GraduationCap} value={collegeName} onChange={setCollegeName} placeholder="IIT Bombay" />
          <FormSelect label="Degree" icon={GraduationCap} value={degree} onChange={setDegree} options={DEGREE_OPTIONS} placeholder="Select degree" />
          <FormInput label="Branch / Major" icon={GraduationCap} value={branch} onChange={setBranch} placeholder="Computer Science" />
          <FormSelect label="Year of Study" icon={Calendar} value={yearOfStudy} onChange={setYearOfStudy} options={YEAR_OPTIONS.map(String)} placeholder="Select year" />
          <FormInput label="Graduation Year" icon={Calendar} value={gradYear} onChange={setGradYear} placeholder="2027" type="number" />
          <FormInput label="City / Campus" icon={MapPin} value={city} onChange={setCity} placeholder="Mumbai" />
        </div>
      </div>

      {/* Social Links */}
      <div className="ss-card border-[3px] p-6 bg-white shadow-[6px_6px_0_#111111]">
        <h3 className="font-heading font-black text-xl uppercase tracking-tight text-neo-ink mb-6 flex items-center gap-3 border-b-[3px] border-neo-ink pb-4">
          <span className="w-8 h-8 flex items-center justify-center bg-neo-blue border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]"><Globe size={16} strokeWidth={3} className="text-neo-ink" /></span>
          Social Links
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormInput label="GitHub" icon={Github} value={githubUrl} onChange={setGithubUrl} placeholder="HTTPS://GITHUB.COM/USERNAME" type="url" />
          <FormInput label="LinkedIn" icon={Linkedin} value={linkedinUrl} onChange={setLinkedinUrl} placeholder="HTTPS://LINKEDIN.COM/IN/USERNAME" type="url" />
        </div>
      </div>

      {/* Preferences */}
      <div className="ss-card border-[3px] p-6 bg-white shadow-[6px_6px_0_#111111]">
        <h3 className="font-heading font-black text-xl uppercase tracking-tight text-neo-ink mb-6 flex items-center gap-3 border-b-[3px] border-neo-ink pb-4">
          <span className="w-8 h-8 flex items-center justify-center bg-neo-coral border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]"><Monitor size={16} strokeWidth={3} className="text-white" /></span>
          Preferences
        </h3>
        <div className="space-y-6">
          {/* Session mode */}
          <div>
            <label className="block text-[11px] font-heading font-black text-neo-ink mb-3 uppercase tracking-widest">Preferred Session Mode</label>
            <div className="flex flex-wrap gap-3">
              {SESSION_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPreferredMode(mode)}
                  className={cn(
                    'px-6 py-3 text-sm font-heading font-black uppercase tracking-widest transition-all border-[3px]',
                    preferredMode === mode
                      ? 'bg-neo-purple text-white border-neo-ink shadow-[4px_4px_0_#111111] translate-x-[-2px] translate-y-[-2px]'
                      : 'bg-white text-neo-ink border-neo-ink hover:bg-neo-yellow/50 hover:shadow-[2px_2px_0_#111111]'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-[11px] font-heading font-black text-neo-ink mb-3 uppercase tracking-widest">Languages</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-neo-yellow border-[2px] border-neo-ink text-[11px] font-heading font-black uppercase tracking-widest text-neo-ink shadow-[2px_2px_0_#111111]"
                >
                  {lang}
                  <button onClick={() => removeLanguage(lang)} className="hover:bg-neo-coral hover:text-white p-0.5 border-[2px] border-transparent hover:border-neo-ink transition-colors">
                    <X size={14} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Languages size={18} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
                <input
                  list="language-options"
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLanguage(langInput.trim()); } }}
                  placeholder="ADD A LANGUAGE..."
                  className="w-full pl-10 pr-4 h-12 bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
                />
                <datalist id="language-options">
                  {LANGUAGE_OPTIONS.filter((l) => !languages.includes(l)).map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </div>
              <button
                onClick={() => addLanguage(langInput.trim())}
                disabled={!langInput.trim()}
                className={cn(
                  'w-12 h-12 flex items-center justify-center border-[3px] transition-all',
                  langInput.trim()
                    ? 'bg-white border-neo-ink text-neo-ink hover:bg-neo-yellow shadow-[2px_2px_0_#111111] hover:shadow-[4px_4px_0_#111111] hover:-translate-y-0.5 hover:-translate-x-0.5 cursor-pointer'
                    : 'bg-neo-surface border-neo-ink/20 text-neo-ink/30 cursor-not-allowed'
                )}
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Skills — Editable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="ss-card border-[3px] p-6 bg-white shadow-[6px_6px_0_#111111] flex flex-col h-full">
          <h3 className="font-heading font-black text-xl uppercase tracking-tight text-neo-ink mb-6 flex items-center gap-3 border-b-[3px] border-neo-ink pb-4">
            <span className="w-8 h-8 flex items-center justify-center bg-neo-yellow border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]"><Star size={16} strokeWidth={3} className="text-neo-ink" /></span>
            Skills I Teach
          </h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {offeredSkills.length > 0 ? (
              offeredSkills.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-neo-yellow border-[2px] border-neo-ink text-[11px] font-heading font-black uppercase tracking-widest text-neo-ink shadow-[2px_2px_0_#111111]"
                >
                  {s.skill_name}
                  <button onClick={() => handleRemoveSkill(s.id, s.skill_name)} className="hover:bg-neo-coral hover:text-white p-0.5 border-[2px] border-transparent hover:border-neo-ink transition-colors">
                    <X size={14} strokeWidth={3} />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-[10px] font-bold uppercase tracking-widest text-neo-ink/50 w-full">NO SKILLS ADDED YET.</p>
            )}
          </div>
          
          <div className="flex gap-3 mt-auto">
            <div className="relative flex-1">
              <input
                id="offered-skill-input"
                list="all-skills-offered"
                value={offeredSkillInput}
                onChange={(e) => setOfferedSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(offeredSkillInput, 'offered'); } }}
                placeholder="TYPE A SKILL..."
                className="w-full pl-3 pr-4 h-[44px] bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-yellow focus:shadow-[3px_3px_0_var(--ss-yellow)] transition-all uppercase"
              />
              <datalist id="all-skills-offered">
                {ALL_SKILLS
                  .filter((skill) => !desiredSkills.some((s) => s.skill_name.toLowerCase() === skill.name.toLowerCase()))
                  .map((skill) => (
                    <option key={skill.id} value={skill.name.toUpperCase()} />
                  ))}
              </datalist>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!offeredSkillInput.trim()) {
                  document.getElementById('offered-skill-input')?.focus();
                  return;
                }
                handleAddSkill(offeredSkillInput, 'offered');
              }}
              disabled={isAddingSkill}
              className={cn(
                'w-[44px] h-[44px] flex items-center justify-center border-[3px] transition-all',
                isAddingSkill
                  ? 'bg-neo-surface border-neo-ink/20 text-neo-ink/30 cursor-not-allowed'
                  : offeredSkillInput.trim()
                    ? 'bg-white border-neo-ink text-neo-ink hover:bg-neo-yellow shadow-[2px_2px_0_#111111] hover:shadow-[4px_4px_0_#111111] hover:-translate-y-0.5 hover:-translate-x-0.5 cursor-pointer'
                    : 'bg-white border-neo-ink text-neo-ink hover:bg-neo-surface cursor-pointer'
              )}
            >
              {isAddingSkill ? <Loader2 size={16} strokeWidth={3} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
            </button>
          </div>
        </div>

        <div className="ss-card border-[3px] p-6 bg-white shadow-[6px_6px_0_#111111] flex flex-col h-full">
          <h3 className="font-heading font-black text-xl uppercase tracking-tight text-neo-ink mb-6 flex items-center gap-3 border-b-[3px] border-neo-ink pb-4">
            <span className="w-8 h-8 flex items-center justify-center bg-neo-purple border-[2px] border-neo-ink shadow-[2px_2px_0_#111111]"><Star size={16} strokeWidth={3} className="text-white" /></span>
            Skills I Want
          </h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {desiredSkills.length > 0 ? (
              desiredSkills.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-neo-purple text-white border-[2px] border-neo-ink text-[11px] font-heading font-black uppercase tracking-widest shadow-[2px_2px_0_#111111]"
                >
                  {s.skill_name}
                  <button onClick={() => handleRemoveSkill(s.id, s.skill_name)} className="hover:bg-neo-coral hover:text-white p-0.5 border-[2px] border-transparent hover:border-neo-ink transition-colors">
                    <X size={14} strokeWidth={3} />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-[10px] font-bold uppercase tracking-widest text-neo-ink/50 w-full">NO SKILLS ADDED YET.</p>
            )}
          </div>

          <div className="flex gap-3 mt-auto">
            <div className="relative flex-1">
              <input
                id="desired-skill-input"
                list="all-skills-desired"
                value={desiredSkillInput}
                onChange={(e) => setDesiredSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(desiredSkillInput, 'desired'); } }}
                placeholder="TYPE A SKILL..."
                className="w-full pl-3 pr-4 h-[44px] bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
              />
              <datalist id="all-skills-desired">
                {ALL_SKILLS
                  .filter((skill) => !offeredSkills.some((s) => s.skill_name.toLowerCase() === skill.name.toLowerCase()))
                  .map((skill) => (
                    <option key={skill.id} value={skill.name.toUpperCase()} />
                  ))}
              </datalist>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!desiredSkillInput.trim()) {
                  document.getElementById('desired-skill-input')?.focus();
                  return;
                }
                handleAddSkill(desiredSkillInput, 'desired');
              }}
              disabled={isAddingSkill}
              className={cn(
                'w-[44px] h-[44px] flex items-center justify-center border-[3px] transition-all',
                isAddingSkill
                  ? 'bg-neo-surface border-neo-ink/20 text-neo-ink/30 cursor-not-allowed'
                  : desiredSkillInput.trim()
                    ? 'bg-white border-neo-ink text-neo-ink hover:bg-neo-purple hover:text-white shadow-[2px_2px_0_#111111] hover:shadow-[4px_4px_0_#111111] hover:-translate-y-0.5 hover:-translate-x-0.5 cursor-pointer'
                    : 'bg-white border-neo-ink text-neo-ink hover:bg-neo-surface cursor-pointer'
              )}
            >
              {isAddingSkill ? <Loader2 size={16} strokeWidth={3} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone — Delete Account */}
      <div className="ss-card border-[3px] border-neo-coral bg-neo-coral/5 p-6">
        <h3 className="font-heading font-black text-lg uppercase tracking-tight text-neo-coral mb-3 flex items-center gap-2">
          <AlertTriangle size={18} strokeWidth={3} /> Danger Zone
        </h3>
        <p className="text-sm font-bold uppercase tracking-widest text-neo-ink/70 mb-6">
          PERMANENTLY DELETE YOUR ACCOUNT AND ALL ASSOCIATED DATA. THIS ACTION CANNOT BE UNDONE.
        </p>
        <button
          id="delete-account-btn"
          onClick={async () => {
            const confirmed = window.confirm(
              'Are you absolutely sure? This will permanently delete your account, all your skills, sessions, and reviews. This cannot be undone.'
            );
            if (!confirmed) return;

            setDeleting(true);
            try {
              const res = await authFetch('/api/account/delete', { method: 'DELETE' });
              if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete account');
                return;
              }
              const supabase = createClient();
              await supabase.auth.signOut();
              toast.success('Account deleted. Goodbye!');
              window.location.href = ROUTES.signup;
            } catch (err) {
              console.error('Delete account error:', err);
              toast.error('Something went wrong. Please try again.');
            } finally {
              setDeleting(false);
            }
          }}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-6 py-3 border-[3px] border-neo-coral bg-white text-neo-coral font-heading font-black uppercase tracking-widest shadow-[4px_4px_0_var(--ss-coral)] hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--ss-coral)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
        >
          {deleting ? <><Loader2 size={18} strokeWidth={3} className="animate-spin" /> DELETING...</> : <><Trash2 size={18} strokeWidth={3} /> DELETE MY ACCOUNT</>}
        </button>
      </div>

      {/* Bottom save button */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} variant="primary" size="lg" className="w-full sm:w-auto" icon={saving ? <Loader2 size={18} strokeWidth={3} className="animate-spin" /> : <Save size={18} strokeWidth={3} />}>
          {saving ? 'SAVING CHANGES...' : 'SAVE ALL CHANGES'}
        </Button>
      </div>
    </div>
  );
}
