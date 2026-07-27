'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { SkillBadge } from '@/components/shared/SkillBadge';
import { Button } from '@/components/dashboard/ui/Button';
import { SKILL_CATEGORIES, ALL_SKILLS, ROUTES } from '@/lib/constants';
import {
  ArrowLeft, ArrowRight, Check, Loader2, Plus, SkipForward,
  User, GraduationCap, MapPin, ChevronDown, Sparkles, RefreshCw, BadgeCheck, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types & Constants ──────────────────────────────────
type Step = 'have' | 'want' | 'confirm' | 'identity' | 'profile';

const STEPS: Step[] = ['have', 'want', 'confirm', 'identity', 'profile'];
const DEGREE_OPTIONS = ['B.Tech', 'B.E.', 'B.Sc', 'BBA', 'BCA', 'B.Com', 'BA', 'M.Tech', 'M.Sc', 'MBA', 'MCA', 'PhD', 'Other'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const YEAR_OPTIONS = ['1', '2', '3', '4', '5'];

const STEP_CONFIG: Record<Step, { title: string; subtitle: string }> = {
  have: { title: 'WHAT CAN YOU TEACH?', subtitle: "SELECT SKILLS YOU'RE CONFIDENT TEACHING TO PEERS" },
  want: { title: 'WHAT DO YOU WANT TO LEARN?', subtitle: "PICK SKILLS YOU'D LOVE TO PICK UP FROM FELLOW STUDENTS" },
  confirm: { title: 'LOOKING GOOD!', subtitle: 'REVIEW YOUR SKILL PROFILE BEFORE DIVING IN' },
  identity: { title: 'CREATE YOUR IDENTITY', subtitle: 'ROLL AN AVATAR AND CLAIM YOUR UNIQUE ALIAS' },
  profile: { title: 'COMPLETE YOUR PROFILE', subtitle: 'HELP US FIND YOU BETTER MATCHES (OPTIONAL)' },
};

// ─── Component ──────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('have');
  const [saving, setSaving] = useState(false);

  // Skill selection state
  const [skillsHave, setSkillsHave] = useState<string[]>([]);
  const [skillsWant, setSkillsWant] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState('');

  // Identity state
  const [avatarSeed, setAvatarSeed] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');

  // Derived state
  const stepIndex = STEPS.indexOf(step);
  const config = STEP_CONFIG[step];
  const currentSkills = step === 'have' ? skillsHave : skillsWant;
  const setCurrentSkills = step === 'have' ? setSkillsHave : setSkillsWant;
  const filteredSkills = selectedCategory
    ? ALL_SKILLS.filter((s) => s.category === selectedCategory)
    : ALL_SKILLS;

  // Initialize random seed on mount
  useEffect(() => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  }, []);

  // Username checking debounce
  useEffect(() => {
    if (step !== 'identity') return;
    
    if (!username.trim()) {
      setUsernameStatus('idle');
      return;
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (username !== cleanUsername) {
      setUsername(cleanUsername); // force lowercase alphanumeric & underscores only
    }

    if (cleanUsername.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error(error);
          setUsernameStatus('idle');
          return;
        }

        if (data && data.id !== user.id) {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('available');
        }
      } catch (err) {
        console.error('Failed to check username:', err);
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, step]);

  // ─── Handlers ───────────────────────────────────────────
  const toggleSkill = (name: string) => {
    setCurrentSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const addCustomSkill = () => {
    const name = customSkill.trim();
    if (!name) return;
    if (currentSkills.includes(name)) { toast.error('Skill already added'); return; }
    toggleSkill(name);
    toast.success(`Added "${name}"`);
    setCustomSkill('');
  };

  const handleSaveSkills = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Session expired. Please log in again.'); router.push(ROUTES.login); return; }

      const rows = [
        ...skillsHave.map((s) => ({ user_id: user.id, skill_name: s, type: 'offered' as const })),
        ...skillsWant.map((s) => ({ user_id: user.id, skill_name: s, type: 'desired' as const })),
      ];

      const { error } = await supabase.from('skills').insert(rows);
      if (error) { toast.error('Failed to save skills: ' + error.message); return; }

      toast.success('Skills saved!');
      setStep('identity');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIdentity = async () => {
    if (!username || usernameStatus !== 'available') {
      toast.error('Please pick a valid, available username');
      return;
    }
    
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Session expired.'); return; }

      const { error } = await supabase.from('profiles').update({
        username: username,
      }).eq('id', user.id);

      if (error) throw error;
      
      toast.success('Identity claimed!');
      setStep('profile');
    } catch {
      toast.error('Failed to save identity');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Session expired. Please log in again.'); router.push(ROUTES.login); return; }

      const updates: Record<string, unknown> = {};
      if (fullName.trim()) updates.full_name = fullName.trim();
      if (collegeName.trim()) updates.college_name = collegeName.trim();
      if (degree) updates.degree = degree;
      if (branch.trim()) updates.branch = branch.trim();
      if (yearOfStudy) updates.year_of_study = parseInt(yearOfStudy);
      if (city.trim()) updates.city = city.trim();
      if (gender) updates.gender = gender;
      if (bio.trim()) updates.bio = bio.trim();

      if (Object.keys(updates).length > 0) {
        updates.profile_completed = true;
        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
        if (error) { toast.error('Failed to save profile: ' + error.message); return; }
        toast.success('Profile saved! Welcome to SkillSwap 🎉');
      } else {
        toast.success('Welcome to SkillSwap 🎉');
      }

      window.location.href = ROUTES.dashboard;
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (step === 'have') { router.back(); }
    else { setStep(STEPS[stepIndex - 1]); }
  };

  const goNext = () => {
    if (step === 'have') setStep('want');
    else if (step === 'want') setStep('confirm');
  };

  // ─── Input class (reusable) ─────────────────────────────
  const inputClass = 'w-full pl-10 pr-4 py-3 bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase';
  const selectClass = 'w-full pl-10 pr-10 py-3 bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all appearance-none cursor-pointer uppercase';

  return (
    <div className="relative min-h-screen bg-neo-cream flex items-center justify-center px-4 py-12 animate-page-in">
      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={cn(
                'h-3 border-[2px] border-neo-ink transition-all duration-500 shadow-[2px_2px_0_#111111]',
                i <= stepIndex ? 'bg-neo-purple' : 'bg-white'
              )} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-neo-ink mb-3 uppercase tracking-tight drop-shadow-[2px_2px_0_#111111]">{config.title}</h1>
          <p className="text-sm font-bold text-neo-ink/70 uppercase tracking-widest">{config.subtitle}</p>
        </div>

        {/* ── SKILL SELECTION (have / want) ── */}
        {(step === 'have' || step === 'want') && (
          <div className="ss-card border-[4px] bg-white p-6 shadow-[8px_8px_0_#111111]">
            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b-[3px] border-neo-ink">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn('px-4 py-2 border-[2px] text-xs font-heading font-black uppercase tracking-widest transition-all shadow-[2px_2px_0_#111111] active:shadow-none active:translate-y-[2px]',
                  !selectedCategory ? 'bg-neo-purple border-neo-ink text-white' : 'bg-neo-surface border-neo-ink text-neo-ink hover:bg-neo-yellow'
                )}
              >ALL</button>
              {SKILL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn('px-4 py-2 border-[2px] text-xs font-heading font-black uppercase tracking-widest transition-all shadow-[2px_2px_0_#111111] active:shadow-none active:translate-y-[2px]',
                    selectedCategory === cat.id ? 'bg-neo-purple border-neo-ink text-white' : 'bg-neo-surface border-neo-ink text-neo-ink hover:bg-neo-yellow'
                  )}
                >{cat.icon} {cat.label}</button>
              ))}
            </div>

            {/* Skill grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredSkills.map((skill) => {
                const selected = currentSkills.includes(skill.name);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.name)}
                    className={cn(
                      'px-4 py-3 border-[3px] text-sm font-heading font-black uppercase tracking-widest transition-all text-left shadow-[2px_2px_0_#111111] active:shadow-none active:translate-y-[2px]',
                      selected
                        ? step === 'have'
                          ? 'bg-neo-green border-neo-ink text-neo-ink'
                          : 'bg-neo-purple border-neo-ink text-white'
                        : 'bg-white border-neo-ink text-neo-ink hover:bg-neo-yellow'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {selected && <Check size={16} strokeWidth={3} />}
                      {skill.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom skill input */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Plus size={18} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
                <input
                  type="text"
                  placeholder="CAN'T FIND YOUR SKILL? TYPE IT HERE..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                  className="w-full pl-10 pr-4 py-3 bg-neo-surface border-[3px] border-neo-ink border-dashed text-sm font-bold text-neo-ink placeholder:text-neo-ink/50 focus:outline-none focus:ring-0 focus:border-neo-purple focus:border-solid focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all uppercase"
                />
              </div>
              <button
                type="button"
                onClick={addCustomSkill}
                disabled={!customSkill.trim()}
                className={cn(
                  'w-12 h-12 flex items-center justify-center border-[3px] border-neo-ink transition-all shadow-[2px_2px_0_#111111]',
                  customSkill.trim()
                    ? step === 'have'
                      ? 'bg-neo-green text-neo-ink hover:bg-neo-green/80 active:shadow-none active:translate-y-[2px]'
                      : 'bg-neo-purple text-white hover:bg-neo-purple/80 active:shadow-none active:translate-y-[2px]'
                    : 'bg-neo-surface text-neo-ink/30 cursor-not-allowed'
                )}
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Selected count & badges */}
            <div className="flex items-center justify-between pt-4 border-t-[3px] border-neo-ink/20">
              <p className="text-xs font-bold uppercase tracking-widest text-neo-ink/70">
                {currentSkills.length} SKILL{currentSkills.length !== 1 ? 'S' : ''} SELECTED
              </p>
              <div className="flex flex-wrap gap-2">
                {currentSkills.map((s) => (
                  <div key={s} className={cn("px-2 py-1 border-[2px] border-neo-ink text-[10px] font-black uppercase tracking-widest", step === 'have' ? 'bg-neo-green text-neo-ink' : 'bg-neo-purple text-white')}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CONFIRM ── */}
        {step === 'confirm' && (
          <div className="ss-card border-[4px] bg-white p-8 shadow-[8px_8px_0_#111111]">
            <div className="space-y-8">
              <div>
                <h3 className="font-heading font-black text-xl text-neo-green mb-4 uppercase tracking-tight">Skills You&apos;ll Teach</h3>
                <div className="flex flex-wrap gap-3">
                  {skillsHave.length > 0
                    ? skillsHave.map((s) => (
                        <div key={s} className="px-4 py-2 border-[3px] border-neo-ink bg-neo-green text-neo-ink text-sm font-black uppercase tracking-widest shadow-[2px_2px_0_#111111]">
                          {s}
                        </div>
                      ))
                    : <p className="text-sm font-bold uppercase tracking-widest text-neo-ink/50">NONE SELECTED</p>}
                </div>
              </div>
              <div className="h-[3px] bg-neo-ink/10" />
              <div>
                <h3 className="font-heading font-black text-xl text-neo-purple mb-4 uppercase tracking-tight">Skills You&apos;ll Learn</h3>
                <div className="flex flex-wrap gap-3">
                  {skillsWant.length > 0
                    ? skillsWant.map((s) => (
                        <div key={s} className="px-4 py-2 border-[3px] border-neo-ink bg-neo-purple text-white text-sm font-black uppercase tracking-widest shadow-[2px_2px_0_#111111]">
                          {s}
                        </div>
                      ))
                    : <p className="text-sm font-bold uppercase tracking-widest text-neo-ink/50">NONE SELECTED</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── IDENTITY ── */}
        {step === 'identity' && (
          <div className="space-y-6">
            <div className="ss-card border-[4px] bg-neo-yellow p-8 shadow-[8px_8px_0_#111111] flex flex-col items-center">
              <h3 className="font-heading font-black text-2xl text-neo-ink mb-6 uppercase tracking-tight">Your Avatar</h3>
              
              <div className="relative mb-8 group">
                <div className="w-40 h-40 border-[4px] border-neo-ink bg-white shadow-[8px_8px_0_#111111] overflow-hidden flex items-center justify-center transition-transform group-hover:-translate-y-2 group-hover:shadow-[12px_12px_0_#111111]">
                  <Image 
                    src={`https://api.dicebear.com/9.x/bottts/svg?seed=${username || 'newuser'}&backgroundColor=FFF9E9`} 
                    alt="Avatar Preview" 
                    width={160} 
                    height={160}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Decorative sparkles */}
                <Sparkles size={24} strokeWidth={3} className="absolute -top-4 -right-4 text-neo-coral animate-pulse" />
                <Sparkles size={16} strokeWidth={3} className="absolute -bottom-2 -left-4 text-neo-purple animate-pulse" />
              </div>

              <p className="text-xs font-bold uppercase tracking-widest text-neo-ink/70 mt-2 text-center">
                Your avatar uniquely adapts to your alias!
              </p>
            </div>

            <div className="ss-card border-[4px] bg-white p-6 shadow-[8px_8px_0_#111111]">
              <label className="block text-[11px] font-heading font-black text-neo-ink mb-3 uppercase tracking-widest">
                Claim Your Alias (Username)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neo-ink/50 font-black text-lg">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="USERNAME"
                  maxLength={20}
                  className={cn(
                    "w-full pl-10 pr-12 py-4 bg-neo-surface border-[3px] text-lg font-black text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 transition-all uppercase",
                    usernameStatus === 'available' ? 'border-neo-green focus:shadow-[4px_4px_0_var(--ss-green)]' : 
                    usernameStatus === 'taken' ? 'border-neo-coral focus:shadow-[4px_4px_0_var(--ss-coral)]' : 
                    'border-neo-ink focus:border-neo-purple focus:shadow-[4px_4px_0_var(--ss-purple)]'
                  )}
                />
                
                {/* Status Indicator */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 size={24} strokeWidth={3} className="animate-spin text-neo-purple" />}
                  {usernameStatus === 'available' && <BadgeCheck size={24} strokeWidth={3} className="text-neo-green" />}
                  {usernameStatus === 'taken' && <AlertCircle size={24} strokeWidth={3} className="text-neo-coral" />}
                </div>
              </div>

              <div className="mt-3 text-xs font-bold uppercase tracking-widest min-h-[20px]">
                {usernameStatus === 'checking' && <span className="text-neo-purple">Checking availability...</span>}
                {usernameStatus === 'available' && <span className="text-neo-green">Awesome! This username is yours.</span>}
                {usernameStatus === 'taken' && <span className="text-neo-coral">Bummer! That username is taken.</span>}
                {usernameStatus === 'idle' && <span className="text-neo-ink/50">Must be at least 3 characters.</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE (optional) ── */}
        {step === 'profile' && (
          <>
            <div className="flex items-center justify-center gap-3 mb-8 px-5 py-3 border-[3px] border-neo-ink bg-neo-yellow shadow-[4px_4px_0_#111111] mx-auto w-fit transform -rotate-1">
              <Sparkles size={18} strokeWidth={3} className="text-neo-ink" />
              <span className="text-xs font-heading font-black uppercase tracking-widest text-neo-ink">Complete profiles get 3x better match quality</span>
            </div>

            <div className="ss-card border-[4px] bg-white p-6 shadow-[8px_8px_0_#111111]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <User size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="YOUR FULL NAME" className={inputClass} />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Gender</label>
                  <div className="relative">
                    <User size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass}>
                      <option value="">SELECT GENDER</option>
                      {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown size={16} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-neo-ink pointer-events-none" />
                  </div>
                </div>

                {/* College */}
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">College Name</label>
                  <div className="relative">
                    <GraduationCap size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
                    <input type="text" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="IIT BOMBAY" className={inputClass} />
                  </div>
                </div>

                {/* Degree */}
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Degree</label>
                  <div className="relative">
                    <GraduationCap size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
                    <select value={degree} onChange={(e) => setDegree(e.target.value)} className={selectClass}>
                      <option value="">SELECT DEGREE</option>
                      {DEGREE_OPTIONS.map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown size={16} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-neo-ink pointer-events-none" />
                  </div>
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Branch / Major</label>
                  <div className="relative">
                    <GraduationCap size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
                    <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="COMPUTER SCIENCE" className={inputClass} />
                  </div>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Year of Study</label>
                  <div className="relative">
                    <GraduationCap size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
                    <select value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} className={selectClass}>
                      <option value="">SELECT YEAR</option>
                      {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown size={16} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-neo-ink pointer-events-none" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">City / Campus</label>
                  <div className="relative">
                    <MapPin size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-neo-ink" />
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="MUMBAI" className={inputClass} />
                  </div>
                </div>

                {/* Bio */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-heading font-black text-neo-ink mb-2 uppercase tracking-widest">Bio (Optional)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="MERN DEVELOPER, CHESS NERD, LOVE TEACHING..."
                    maxLength={200}
                    className="w-full px-4 py-3 bg-white border-[3px] border-neo-ink text-sm font-bold text-neo-ink placeholder:text-neo-ink/30 focus:outline-none focus:ring-0 focus:border-neo-purple focus:shadow-[3px_3px_0_var(--ss-purple)] transition-all resize-none h-24 uppercase"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── NAVIGATION ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t-[4px] border-neo-ink/10">
          <button onClick={goBack} className="flex items-center gap-2 text-sm font-heading font-black uppercase tracking-widest text-neo-ink/60 hover:text-neo-ink transition-colors w-full sm:w-auto justify-center">
            <ArrowLeft size={18} strokeWidth={3} /> {step === 'have' ? 'EXIT' : 'BACK'}
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {step === 'profile' && (
              <button
                onClick={() => { toast.success('Welcome to SkillSwap 🎉'); window.location.href = ROUTES.dashboard; }}
                className="flex items-center justify-center gap-2 px-5 py-3 border-[3px] border-neo-ink bg-neo-surface text-sm font-heading font-black uppercase tracking-widest text-neo-ink hover:bg-neo-yellow shadow-[2px_2px_0_#111111] active:shadow-none active:translate-y-[2px] transition-all w-full sm:w-auto"
              >
                <SkipForward size={16} strokeWidth={3} /> SKIP FOR NOW
              </button>
            )}

            {step === 'confirm' ? (
              <Button size="lg" onClick={handleSaveSkills} disabled={saving} variant="primary" className="w-full sm:w-auto">
                {saving ? <><Loader2 size={18} strokeWidth={3} className="animate-spin mr-2" /> SAVING...</> : <>SAVE & CONTINUE <ArrowRight size={18} strokeWidth={3} className="ml-2" /></>}
              </Button>
            ) : step === 'identity' ? (
              <Button size="lg" onClick={handleSaveIdentity} disabled={saving || usernameStatus !== 'available'} variant="primary" className="w-full sm:w-auto">
                {saving ? <><Loader2 size={18} strokeWidth={3} className="animate-spin mr-2" /> SAVING...</> : <>CLAIM IDENTITY <ArrowRight size={18} strokeWidth={3} className="ml-2" /></>}
              </Button>
            ) : step === 'profile' ? (
              <Button size="lg" onClick={handleSaveProfile} disabled={saving} variant="primary" className="w-full sm:w-auto">
                {saving ? <><Loader2 size={18} strokeWidth={3} className="animate-spin mr-2" /> SAVING...</> : <>ENTER DASHBOARD <ArrowRight size={18} strokeWidth={3} className="ml-2" /></>}
              </Button>
            ) : (
              <Button size="lg" onClick={goNext} disabled={currentSkills.length === 0} variant="primary" className="w-full sm:w-auto">
                CONTINUE <ArrowRight size={18} strokeWidth={3} className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
