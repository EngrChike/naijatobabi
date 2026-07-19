// app/dashboard/page.js
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import SyllabusSidebar from './components/SyllabusSidebar';
import PracticeCard from './components/PracticeCard';

const QUICK_SOUNDS = [
  { word: "Kpata!", meaning: "Magnificent / Clean", audioText: "Kpata" },
  { word: "Wari!", meaning: "Money!", audioText: "Wari" },
  { word: "Dja crowd!", meaning: "Extremely packed!", audioText: "Dja foule" },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentUnlockLimit, setCurrentUnlockLimit] = useState(6);
  const [activeDay, setActiveDay] = useState(1);
  const [phrases, setPhrases] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  
  // 4-by-4 page progression index
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0); 
  const sentencesPerBatch = 4;
  const targetCompletedPerDay = 20;

  const [completedDays, setCompletedDays] = useState([]);
  const [completedPhrases, setCompletedPhrases] = useState([]);
  const [activeTab, setActiveTab] = useState('campaign');

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);

      const savedCompletedPhrases = localStorage.getItem(`completed_phrases_${user.id}`);
      const savedCompletedDays = localStorage.getItem(`completed_days_${user.id}`);
      const savedCurrentDay = localStorage.getItem(`current_active_day_${user.id}`);
      const savedUnlockLimit = localStorage.getItem(`current_unlock_limit_${user.id}`);
      
      if (savedCompletedPhrases) setCompletedPhrases(JSON.parse(savedCompletedPhrases));
      if (savedCompletedDays) setCompletedDays(JSON.parse(savedCompletedDays));
      if (savedCurrentDay) setActiveDay(parseInt(savedCurrentDay, 10));
      if (savedUnlockLimit) setCurrentUnlockLimit(parseInt(savedUnlockLimit, 10));

      setLoading(false);
    };
    checkUserAndFetchData();
  }, [router]);

  // Fetch 20 high-quality sentences per day
  const fetchCurriculumForDay = async (day) => {
    setExercisesLoading(true);
    setCurrentBatchIndex(0); 
    
    const scenarioPrompt = day % 6 === 0 
      ? `comprehensive cumulative integration evaluation day covering street dialogue vocabulary`
      : `day ${day} progressive nouchi sentence building lesson`;

    try {
      const response = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioPrompt, count: 20 })
      });
      const data = await response.json();
      if (data && Array.isArray(data.phrases)) {
        setPhrases(data.phrases.slice(0, 20));
      } else {
        setPhrases([]);
      }
    } catch (err) {
      console.error("Error loading day curriculum:", err);
      setPhrases([]);
    } finally {
      setExercisesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCurriculumForDay(activeDay);
    }
  }, [activeDay, user]);

  const handleSentenceCleared = (phraseId) => {
    if (!user) return;
    const updatedPhrases = [...completedPhrases];
    if (!updatedPhrases.includes(phraseId)) {
      updatedPhrases.push(phraseId);
      setCompletedPhrases(updatedPhrases);
      localStorage.setItem(`completed_phrases_${user.id}`, JSON.stringify(updatedPhrases));
    }
  };

  // Extract the current set of 4 sentences
  const activeBatchStart = currentBatchIndex * sentencesPerBatch;
  const activeBatchEnd = activeBatchStart + sentencesPerBatch;
  const currentBatchPhrases = phrases.slice(activeBatchStart, activeBatchEnd);

  // Checks if the current set of 4 has been successfully verified
  const isActiveBatchCleared = () => {
    if (currentBatchPhrases.length === 0) return false;
    return currentBatchPhrases.every(p => completedPhrases.includes(p.id));
  };

  const handleNextBatchNavigation = () => {
    if (!isActiveBatchCleared()) return;

    const nextBatchStart = (currentBatchIndex + 1) * sentencesPerBatch;
    if (nextBatchStart < phrases.length) {
      setCurrentBatchIndex(prev => prev + 1);
    } else {
      handleDayCompleted();
    }
  };

  const handleDayCompleted = () => {
    if (completedDays.includes(activeDay)) {
      alert("You have already completed this day!");
      return;
    }

    const updatedDays = [...completedDays, activeDay];
    setCompletedDays(updatedDays);
    localStorage.setItem(`completed_days_${user.id}`, JSON.stringify(updatedDays));

    if (activeDay % 6 === 0) {
      const newLimit = activeDay + 6;
      setCurrentUnlockLimit(newLimit);
      localStorage.setItem(`current_unlock_limit_${user.id}`, newLimit.toString());
      alert(`🏆 Weekly Evaluation Complete! Resetting program roadmap and expanding limit to Day ${newLimit}!`);
    }

    const nextDay = activeDay + 1;
    if (nextDay <= 30) {
      setActiveDay(nextDay);
      localStorage.setItem(`current_active_day_${user.id}`, nextDay.toString());
      alert(`🎉 Progressive Milestone Complete! Day ${nextDay} is now open.`);
    } else {
      alert("🏆 Outstanding! You completed the full 30-Day progressive course!");
    }
  };

  // Safety trigger resetting the active user back to absolute zero
  const handleResetAllData = () => {
    if (!user) return;
    const confirmReset = window.confirm(
      "🚨 Are you sure you want to reset? This will wipe out all your verified sentences, locked days, and progress, restarting you back to Day 1!"
    );

    if (confirmReset) {
      localStorage.removeItem(`completed_phrases_${user.id}`);
      localStorage.removeItem(`completed_days_${user.id}`);
      localStorage.removeItem(`current_active_day_${user.id}`);
      localStorage.removeItem(`current_unlock_limit_${user.id}`);

      setCompletedPhrases([]);
      setCompletedDays([]);
      setActiveDay(1);
      setCurrentUnlockLimit(6);
      setCurrentBatchIndex(0);

      alert("🔄 Your progress has been successfully reset! Let's conquer the Abidjan streets from Day 1.");
    }
  };

  const getDayProgressPercentage = () => {
    if (phrases.length === 0) return 0;
    const completedOnes = phrases.filter(p => completedPhrases.includes(p.id)).length;
    return Math.round((completedOnes / targetCompletedPerDay) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] text-slate-900 flex items-center justify-center font-sans">
        <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col justify-between font-sans">
      
      {/* Premium Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-6xl w-full mx-auto flex flex-row justify-between items-center">
          <span className="text-xl font-black tracking-wider text-[#F77F00] flex items-center gap-2">
            🇨🇮 NaijaToBabi <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-normal">30-Day Master Course</span>
          </span>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 font-mono truncate">👤 {user?.email}</span>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
              }}
              className="px-4 py-2 border border-slate-200 hover:border-red-400 bg-white hover:bg-red-50 text-xs font-bold rounded-xl text-slate-600 hover:text-red-600 transition-all active:scale-95"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Progress HUD Banner */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 shadow-inner">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider font-mono">🔒 Strict Sequential Validation</span>
            <h2 className="text-lg font-black text-slate-800 mt-1">Master All 4 Active Sentences To Unblock "Next"</h2>
            <p className="text-xs text-slate-500">Practice 20 total progressive sentences to complete the Day.</p>
          </div>
          
          <div className="w-full md:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-xs font-mono font-bold text-slate-600">
              <span>Day {activeDay} Completion</span>
              <span className="text-[#009E49]">{getDayProgressPercentage()}% Completed</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${getDayProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Layout */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-grow space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('campaign')}
            className={`px-5 py-3 font-mono text-xs font-bold border-b-2 uppercase tracking-wider transition-colors duration-150 ${
              activeTab === 'campaign' ? 'border-[#F77F00] text-[#F77F00]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🗺️ Roadmap
          </button>
          <button 
            onClick={() => setActiveTab('soundboard')}
            className={`px-5 py-3 font-mono text-xs font-bold border-b-2 uppercase tracking-wider transition-colors duration-150 ${
              activeTab === 'soundboard' ? 'border-[#F77F00] text-[#F77F00]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🔊 Soundboard
          </button>
        </div>

        {/* 2-Column Responsive Layout Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎙️</span>
                <h3 className="font-bold text-slate-800 text-sm font-mono">Live Walkie-Talkie</h3>
              </div>
              <p className="text-xs text-slate-500">
                Practice conversations and translations in French/Nouchi with the talk translator!
              </p>
              <button 
                onClick={() => router.push('/translator')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-[#F77F00] hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase font-mono transition-all duration-150 active:scale-95 shadow-md shadow-orange-500/10"
              >
                💬 Open Walkie-Talkie
              </button>
            </div>

            <SyllabusSidebar 
              activeDay={activeDay}
              completedDays={completedDays}
              currentUnlockLimit={currentUnlockLimit}
              onSelectDay={(day) => setActiveDay(day)}
              onResetAll={handleResetAllData}
            />
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-8">
            {activeTab === 'campaign' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">
                    📝 Active Batch (Set {currentBatchIndex + 1} of 5)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Day {activeDay} Scenario</span>
                </div>

                {exercisesLoading ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <div className="h-6 w-6 rounded-full border-2 border-[#F77F00] border-t-transparent animate-spin mx-auto"></div>
                    <p className="text-xs font-mono text-slate-500 tracking-wider mt-3">PREPARING LESSON MATERIAL...</p>
                  </div>
                ) : (currentBatchPhrases.length > 0) ? (
                  <div className="space-y-4">
                    {currentBatchPhrases.map((p, offset) => (
                      <PracticeCard 
                        key={p.id}
                        phrase={p}
                        index={activeBatchStart + offset}
                        isAlreadyCleared={completedPhrases.includes(p.id)}
                        onSentenceCleared={handleSentenceCleared}
                      />
                    ))}

                    <div className="pt-4 flex justify-end">
                      {isActiveBatchCleared() ? (
                        <button
                          onClick={handleNextBatchNavigation}
                          className="px-8 py-3.5 bg-[#009E49] hover:bg-emerald-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase font-mono shadow-md transition-all active:scale-95"
                        >
                          Next Sentences ➡️
                        </button>
                      ) : (
                        <div className="px-6 py-3.5 bg-slate-100 text-slate-400 font-mono text-[10px] font-bold rounded-xl border border-slate-200 uppercase tracking-wider text-center cursor-not-allowed">
                          🔒 Verify All 4 Sentences Above Correctly To Progress
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-sm text-slate-400">Pulling daily progressive syllabus blocks...</p>
                  </div>
                )}
              </div>
            ) : (
              /* Quick Expression Soundboard */
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">📣 Street Expressions</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Spam these immediate phrases to sound like an authentic Ivorian local.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {QUICK_SOUNDS.map((sound) => (
                    <div key={sound.word} className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-700">
                      <span className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-[#F77F00] font-bold shadow-sm">{sound.word}</span>
                      <p className="text-[11px] text-slate-500 mt-2">{sound.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 border-t border-slate-200 text-center text-xs text-slate-400 font-mono">
        © 2026 NaijaToBabi. Built for premium street education.
      </footer>

    </div>
  );
}