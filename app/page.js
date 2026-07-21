// app/page.js
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function LandingPage() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);

  // Auth & Database States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Auto-redirect if user is already logged in
  useEffect(() => {
    const checkActiveUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    checkActiveUser();
  }, [router]);

  // Quick interactive demo player
  const playSample = () => {
    setIsPlaying(true);
    const synth = window.speechSynthesis;
    if (synth) {
      const utterance = new SpeechSynthesisUtterance("Ça dit quoi, mon vieux?");
      utterance.lang = "fr-FR";
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      synth.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(false), 1500);
    }
  };

  // Handle Email/Password Auth
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (isSignUp && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match. Please check and try again.' });
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Success! Please check your email to verify your account.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setMessage({ type: 'error', text: 'Google Login failed: ' + error.message });
    }
  };

  const testimonials = [
    { name: "Chinedu O.", role: "E-commerce Merchant, Adjame Market", quote: "Omo, when I first landed from Lagos, buying goods at the market was a headache. After 2 weeks on this site, I learned how to say 'Fais-moi un prix' with the real Ivorian swag.", avatarBg: "bg-orange-500/20 text-orange-400", flag: "🇳🇬 ➡️ 🇨🇮" },
    { name: "Amaka A.", role: "Software Designer, Cocody", quote: "I moved to Abidjan for a tech job. The standard French I learned in school was too formal—nobody talks like that on the streets! NaijaToBabi taught me Nouchi slang and the actual speech rhythm.", avatarBg: "bg-emerald-500/20 text-emerald-400", flag: "🇳🇬 ➡️ 🇨🇮" },
    { name: "Tunde S.", role: "Business Consultant, Zone 4", quote: "The voice feature is the real game-changer. Listening to the authentic pronunciation and repeating it made me confident. I used to be scared of stopping a Gbaka, but now, I just tell them 'Je capte!'", avatarBg: "bg-amber-500/20 text-amber-400", flag: "🇳🇬 ➡️ 🇨🇮" },
    { name: "Blessing I.", role: "Skincare Retailer, Treichville", quote: "I can't believe how fast I caught up. Just 3 weeks of practicing on this site and I can comfortably chat with my suppliers. The Pidgin-to-French explanations are so hilarious and easy.", avatarBg: "bg-blue-500/20 text-blue-400", flag: "🇳🇬 ➡️ 🇨🇮" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex justify-between items-center">
        <span className="text-2xl font-black bg-gradient-to-r from-orange-500 to-emerald-500 bg-clip-text text-transparent">NaijaToBabi</span>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => { setIsSignUp(false); setMessage({ type: '', text: '' }); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isSignUp ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
          >
            Log In
          </button>
          <button 
            onClick={() => { setIsSignUp(true); setMessage({ type: '', text: '' }); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSignUp ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
          >
            Sign Up
          </button>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-8">
          <h1 className="text-5xl font-extrabold tracking-tight">Land in Abidjan. <br /> <span className="text-orange-500">Speak like a local.</span></h1>
          <p className="text-lg text-slate-400 max-w-xl">Master Ivorian French and Nouchi in under 30 days. No boring textbooks—just real vibes.</p>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 max-w-md">
            <button onClick={playSample} className="flex items-center space-x-4">
              <div className={`h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold ${isPlaying ? 'animate-pulse' : ''}`}>▶</div>
              <p className="font-semibold">"Ça dit quoi, mon vieux?"</p>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-xl">
            <h2 className="text-2xl font-bold mb-6">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            {message.text && <div className={`p-3 mb-4 rounded-xl text-xs ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{message.text}</div>}
            
            <form className="space-y-4" onSubmit={handleAuth}>
              <div>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Email Address" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition-colors" 
                  required 
                />
              </div>

              {/* Password Field with Eye Icon Toggle */}
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Password" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-orange-500 transition-colors" 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    /* Open Eye Icon */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    /* Slashed Eye Icon (Your Custom Match) */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243l4.242 4.242z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Confirm Password Field with Eye Icon Toggle (Only visible during Sign Up) */}
              {isSignUp && (
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm Password" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-orange-500 transition-colors" 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243l4.242 4.242z" />
                      </svg>
                    )}
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95"
              >
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-950 px-3 text-xs text-slate-500 absolute uppercase tracking-wider font-mono">or</span>
            </div>

            <button 
              onClick={handleGoogleLogin} 
              className="w-full py-3 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              Continue with Google
            </button>

            {/* Highly Visible and Bold Switch Toggle Link */}
            <div className="mt-6 text-center">
              <button 
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setMessage({ type: '', text: '' }); }}
                className="text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-4"
              >
                {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <section className="max-w-7xl w-full mx-auto px-6 py-16 border-t border-slate-900">
        <h2 className="text-3xl font-bold mb-12 text-center">What Our Brothers & Sisters Are Saying</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6">
              <p className="text-slate-300 italic mb-6">"{t.quote}"</p>
              <div className="flex items-center justify-between border-t border-slate-900 pt-4">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${t.avatarBg}`}>{t.name[0]}</div>
                  <div><h4 className="font-semibold text-sm">{t.name}</h4><p className="text-xs text-slate-500">{t.role}</p></div>
                </div>
                <span className="text-xs">{t.flag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-7xl w-full mx-auto px-6 py-8 border-t border-slate-900 text-center text-xs text-slate-600">
        <p>© 2026 NaijaToBabi. Built for future Ivorian speech stars.</p>
      </footer>
    </div>
  );
}