'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SkillExchangeBoard } from '@/components/landing/SkillExchangeBoard';

const PASSWORD_RULES = [
  { label: '6+ chars', test: (p: string) => p.length >= 6 },
  { label: 'Lowercase', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Digit (0-9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Symbol (!@#)', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Please enter your name'); return; }
    if (!email) { toast.error('Please enter your email'); return; }

    const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
    if (failedRule) { toast.error(`Password: ${failedRule.label}`); return; }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
      } else {
        toast.success("Account created! Let's set up your profile.");
        window.location.href = ROUTES.onboarding;
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setOauthLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (error) {
      toast.error(error.message);
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neo-cream font-body">
      
      {/* LEFT SIDE - Brand Panel (50%) */}
      <div className="hidden md:flex md:w-1/2 bg-neo-yellow border-r-[4px] border-neo-ink p-12 flex-col justify-between">
        
        {/* Brand */}
        <Link href={ROUTES.home} className="flex items-center gap-3 w-max group">
          <div className="w-12 h-12 flex items-center justify-center bg-white border-[3px] border-neo-ink rounded-md shadow-[4px_4px_0_#111111] transition-transform group-hover:rotate-6">
            <span className="text-neo-ink font-heading font-black text-2xl">S</span>
          </div>
          <span className="font-heading font-black text-3xl tracking-tighter uppercase text-neo-ink">
            {APP_NAME}
          </span>
        </Link>

        {/* Copy & Graphic */}
        <div className="flex-grow flex flex-col justify-center max-w-[500px] w-full mx-auto mt-12">
          <h1 className="font-heading font-black text-5xl lg:text-[5.5rem] leading-[0.85] text-white mb-6" style={{ WebkitTextStroke: '2px #111111' }}>
            JOIN THE<br/>
            SKILL<br/>
            SWAP.
          </h1>
          <p className="font-heading font-bold text-neo-ink text-xl uppercase tracking-wide mb-10 border-l-[4px] border-neo-purple pl-4">
            Teach what you know.<br/>
            Learn what you love.
          </p>
          
          <div className="w-full opacity-90 scale-95 origin-left">
            <SkillExchangeBoard />
          </div>
        </div>

      </div>

      {/* RIGHT SIDE - Signup Form (50%) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-6 sm:p-12 lg:p-24 overflow-y-auto max-h-screen">
        <div className="w-full max-w-md mx-auto py-8">
          
          <div className="mb-10 md:hidden">
            <h2 className="font-heading font-black text-4xl text-neo-ink uppercase leading-none">
              JOIN THE<br/>SKILL SWAP.
            </h2>
          </div>

          <div className="hidden md:block mb-10">
            <h2 className="font-heading font-black text-3xl text-neo-ink uppercase leading-none">
              CREATE YOUR ACCOUNT
            </h2>
          </div>

          <div className="bg-white border-[4px] border-neo-ink rounded-md p-8 shadow-[8px_8px_0_#111111]">
            <form onSubmit={handleSignup} className="space-y-5">
              
              <div>
                <label className="block font-heading font-bold text-neo-ink uppercase text-sm tracking-widest mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-[56px] px-4 bg-white border-[3px] border-neo-ink rounded-md text-neo-ink font-medium focus:outline-none focus:ring-0 focus:border-neo-green focus:shadow-[4px_4px_0_#B7F34A] transition-all"
                />
              </div>

              <div>
                <label className="block font-heading font-bold text-neo-ink uppercase text-sm tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="jane@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[56px] px-4 bg-white border-[3px] border-neo-ink rounded-md text-neo-ink font-medium focus:outline-none focus:ring-0 focus:border-neo-green focus:shadow-[4px_4px_0_#B7F34A] transition-all"
                />
              </div>

              <div>
                <label className="block font-heading font-bold text-neo-ink uppercase text-sm tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[56px] px-4 pr-12 bg-white border-[3px] border-neo-ink rounded-md text-neo-ink font-medium focus:outline-none focus:ring-0 focus:border-neo-green focus:shadow-[4px_4px_0_#B7F34A] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neo-ink p-1 hover:text-neo-green"
                  >
                    {showPassword ? <EyeOff size={24} strokeWidth={2.5} /> : <Eye size={24} strokeWidth={2.5} />}
                  </button>
                </div>
                
                {/* Live password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-2">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <span key={rule.label} className={`flex items-center gap-2 text-[11px] sm:text-xs font-heading font-bold tracking-wider uppercase ${ok ? 'text-neo-purple' : 'text-neo-ink/40'}`}>
                          {ok ? <CheckCircle2 size={16} strokeWidth={3} /> : <XCircle size={16} strokeWidth={3} />}
                          {rule.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[56px] bg-neo-purple border-[3px] border-neo-ink rounded-md font-heading font-black text-xl text-white uppercase tracking-widest shadow-[4px_4px_0_#111111] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#111111] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center mt-4 disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : 'CREATE ACCOUNT'}
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-[3px] bg-neo-ink opacity-20" />
              <span className="font-heading font-black text-neo-ink uppercase text-sm opacity-50">OR</span>
              <div className="flex-1 h-[3px] bg-neo-ink opacity-20" />
            </div>

            <button
              onClick={handleGoogleSignup}
              disabled={oauthLoading}
              className="w-full h-[56px] bg-white border-[3px] border-neo-ink rounded-md font-heading font-bold text-neo-ink uppercase tracking-wide shadow-[4px_4px_0_#111111] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#111111] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
            >
              {oauthLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="font-heading font-bold text-neo-ink uppercase tracking-wide text-sm">
              ALREADY HAVE AN ACCOUNT?{' '}
              <Link href={ROUTES.login} className="text-neo-purple hover:text-neo-green underline underline-offset-4 decoration-[2px] transition-colors">
                LOG IN &rarr;
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
