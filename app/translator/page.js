"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Mic, Globe, ArrowLeft, Loader2, Sparkles, Languages } from 'lucide-react';

export default function WalkieTalkie() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [speechText, setSpeechText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/');
      else { setUser(user); setLoading(false); }
    };
    checkUser();

    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
      }
    }
  }, [router]);

  const speakOutLoud = (text, lang) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    synth.speak(utterance);
  };

  const handleStartRecording = (speaker) => {
    if (!recognitionRef.current) { alert("Browser not supported."); return; }
    if (activeSpeaker === speaker) { recognitionRef.current.stop(); setActiveSpeaker(null); return; }

    setActiveSpeaker(speaker);
    setSpeechText("Listening...");
    setTranslatedText("");
    recognitionRef.current.lang = speaker === 'me' ? 'en-US' : 'fr-FR';
    recognitionRef.current.onresult = async (e) => {
      const transcript = e.results[0][0].transcript;
      setSpeechText(transcript);
      await triggerTranslation(transcript, speaker);
    };
    recognitionRef.current.start();
  };

  const triggerTranslation = async (text, speaker) => {
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, direction: speaker === 'me' ? 'to-nouchi' : 'to-english' })
      });
      const data = await response.json();
      setTranslatedText(data.translation);
      speakOutLoud(data.translation, speaker === 'me' ? 'fr-FR' : 'en-US');
    } catch (err) {
      setTranslatedText("Error processing.");
    } finally {
      setIsTranslating(false);
    }
  };

  const openGoogleTranslate = () => {
    window.open("https://translate.google.com/?sl=en&tl=fr&op=translate", "_blank");
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Luxury Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold tracking-widest text-slate-400 uppercase">Walkie-Talkie</h1>
          
          {/* Google Translator Button with Text Label */}
          <button onClick={openGoogleTranslate} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full hover:bg-slate-800 transition text-orange-500 text-[10px] font-bold uppercase tracking-wider">
            <Languages size={16} />
            <span>Google Translator</span>
          </button>
        </div>

        {/* Display Glassmorphism Card */}
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 min-h-[280px] shadow-2xl flex flex-col justify-center gap-6 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={80} /></div>
          
          {speechText ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="text-slate-400 text-xs uppercase font-bold tracking-tighter">Captured</div>
              <p className="text-lg font-medium text-white italic">"{speechText}"</p>
              <div className="h-px bg-slate-800 w-full" />
              <div className="text-emerald-500 text-xs uppercase font-bold tracking-tighter">Translation</div>
              {isTranslating ? <Loader2 className="animate-spin text-emerald-500" /> : <p className="text-2xl font-black text-white">{translatedText}</p>}
            </div>
          ) : (
            <div className="text-center opacity-50 space-y-4">
              <Globe size={48} className="mx-auto" />
              <p className="text-sm">Select a language and speak to start the conversation.</p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleStartRecording('me')} className={`group relative p-6 rounded-3xl border transition-all ${activeSpeaker === 'me' ? 'bg-orange-600 border-orange-500 shadow-[0_0_30px_-5px_rgba(249,115,22,0.5)]' : 'bg-slate-900 border-slate-800 hover:border-orange-500/50'}`}>
            <Mic className={`mb-3 ${activeSpeaker === 'me' ? 'animate-bounce' : ''}`} />
            <span className="block text-[10px] font-black uppercase tracking-widest">Me</span>
            <span className="text-[10px] opacity-60">English/Pidgin</span>
          </button>

          <button onClick={() => handleStartRecording('them')} className={`group relative p-6 rounded-3xl border transition-all ${activeSpeaker === 'them' ? 'bg-emerald-600 border-emerald-500 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]' : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'}`}>
            <Mic className={`mb-3 ${activeSpeaker === 'them' ? 'animate-bounce' : ''}`} />
            <span className="block text-[10px] font-black uppercase tracking-widest">Local</span>
            <span className="text-[10px] opacity-60">French/Nouchi</span>
          </button>
        </div>
      </div>
    </div>
  );
}