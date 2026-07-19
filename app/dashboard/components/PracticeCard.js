// app/dashboard/components/PracticeCard.js
import React, { useState, useEffect, useRef } from 'react';

export default function PracticeCard({ 
  phrase, 
  index, 
  isAlreadyCleared, 
  onSentenceCleared 
}) {
  const [isCurrentActive, setIsCurrentActive] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'success' | 'fail' | null

  const audioTimeoutRef = useRef(null);
  const voicesRef = useRef({ nouchiVoice: null, standardVoice: null });
  const practiceRecognitionRef = useRef(null);

  useEffect(() => {
    setFeedback(null);
    stopPlayback();

    const loadVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      const frVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('fr'));
      if (frVoices.length > 0) {
        voicesRef.current.nouchiVoice = frVoices[0];
        voicesRef.current.standardVoice = frVoices[1] || frVoices[0];
      }
    };
    loadVoices();

    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        practiceRecognitionRef.current = new SpeechRecognition();
        practiceRecognitionRef.current.continuous = false;
        practiceRecognitionRef.current.interimResults = false;
        practiceRecognitionRef.current.lang = 'fr-FR';
      }
    }

    return () => stopPlayback();
  }, [phrase]);

  const stopPlayback = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
    setIsCurrentActive(false);
  };

  const startDualVoiceLoop = () => {
    if (isCurrentActive) {
      stopPlayback();
      return;
    }
    stopPlayback();
    setIsCurrentActive(true);

    const runSequence = () => {
      const synth = window.speechSynthesis;
      if (!synth) return;

      const utteranceNouchi = new SpeechSynthesisUtterance(phrase.nouchi);
      utteranceNouchi.lang = "fr-FR";
      utteranceNouchi.rate = 0.80;
      if (voicesRef.current.nouchiVoice) utteranceNouchi.voice = voicesRef.current.nouchiVoice;

      const utteranceFrench = new SpeechSynthesisUtterance(phrase.french.replace(/^(Formal:\s*)/i, ''));
      utteranceFrench.lang = "fr-FR";
      utteranceFrench.rate = 0.88;
      if (voicesRef.current.standardVoice) utteranceFrench.voice = voicesRef.current.standardVoice;

      utteranceNouchi.onend = () => {
        audioTimeoutRef.current = setTimeout(() => {
          synth.speak(utteranceFrench);
        }, 1000);
      };

      utteranceFrench.onend = () => {
        audioTimeoutRef.current = setTimeout(() => {
          runSequence();
        }, 2000);
      };

      utteranceNouchi.onerror = () => stopPlayback();
      utteranceFrench.onerror = () => stopPlayback();

      synth.speak(utteranceNouchi);
    };

    runSequence();
  };

  const handleSpeechPronunciation = () => {
    if (!practiceRecognitionRef.current) {
      alert("Microphone voice recognition is not supported on this device/browser.");
      return;
    }
    stopPlayback();

    if (isPracticing) {
      practiceRecognitionRef.current.stop();
      setIsPracticing(false);
      return;
    }

    setFeedback(null);
    setIsPracticing(true);

    practiceRecognitionRef.current.onresult = (event) => {
      if (!event.results || event.results.length === 0) return;
      const speechOutput = event.results[0][0].transcript.trim().toLowerCase();
      
      const cleanOutput = speechOutput.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
      const cleanTarget = phrase.nouchi.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();

      const hasMatched = cleanOutput.includes(cleanTarget) || 
                         cleanTarget.includes(cleanOutput) || 
                         cleanTarget.split(" ").some(word => word.length > 2 && cleanOutput.includes(word));

      if (hasMatched && cleanOutput.length > 0) {
        setFeedback('success');
        onSentenceCleared(phrase.id);
      } else {
        setFeedback('fail');
      }
    };

    practiceRecognitionRef.current.onerror = () => {
      setFeedback('fail');
      setIsPracticing(false);
    };

    practiceRecognitionRef.current.onend = () => {
      setIsPracticing(false);
    };

    practiceRecognitionRef.current.start();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden space-y-4">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${isAlreadyCleared ? 'bg-[#009E49]' : 'bg-[#F77F00]'}`} />
      
      <div className="flex justify-between items-center pl-3">
        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md border border-slate-200">
          Phrase #{index + 1}
        </span>
        {isAlreadyCleared ? (
          <span className="text-xs font-mono font-black text-emerald-600 flex items-center gap-1">
            ✓ Ok! Verified
          </span>
        ) : (
          <span className="text-xs font-mono font-bold text-amber-600 animate-pulse">
            🎙️ Practice Pending
          </span>
        )}
      </div>

      <div className="pl-3 space-y-3">
        <div className="flex justify-between items-center gap-3">
          <h4 className="text-lg font-black text-slate-800 font-mono tracking-tight">{phrase.nouchi}</h4>
          <button 
            onClick={startDualVoiceLoop}
            className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 ${
              isCurrentActive 
                ? 'bg-[#F77F00] border-[#F77F00] text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#F77F00]'
            }`}
          >
            {isCurrentActive ? "⏸" : "🔊"}
          </button>
        </div>

        <div className="text-xs space-y-1.5 border-t border-slate-100 pt-2">
          <p className="text-amber-800 italic font-medium">"{phrase.pidgin}"</p>
          <p className="text-slate-500 font-mono">{phrase.french}</p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleSpeechPronunciation}
            className={`px-4 py-2 rounded-xl border text-[11px] font-mono font-bold transition-all flex items-center gap-2 ${
              isPracticing
                ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                : 'bg-[#009E49] border-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
            }`}
          >
            <span>🎙️</span>
            <span>{isPracticing ? "Listening..." : "Verify Pronunciation"}</span>
          </button>

          {feedback && (
            <span className={`text-xs font-bold font-mono ${feedback === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
              {feedback === 'success' ? "🎯 Perfect! Match OK" : "❌ Pronunciation unmatched"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}