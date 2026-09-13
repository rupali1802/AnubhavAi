import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Sparkles, Languages } from 'lucide-react';
import { speak, stopSpeaking } from '../../services/voice';
import { useApp } from '../../hooks/useApp';
import type { Language } from '../../types';

interface VoicePitchPlayerProps {
  workerName: string;
  voiceText: string;
  voiceTextHi?: string;
  voiceTextTa?: string;
  compact?: boolean;
}

export default function VoicePitchPlayer({
  workerName,
  voiceText,
  voiceTextHi,
  voiceTextTa,
  compact = false,
}: VoicePitchPlayerProps) {
  const { language } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>(language || 'en');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Sync with global language changes
  useEffect(() => {
    if (language) {
      setSelectedLang(language);
    }
  }, [language]);

  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopSpeaking();
      }
    };
  }, [isPlaying]);

  const getTextForLang = (): string => {
    if (selectedLang === 'hi' && voiceTextHi) return voiceTextHi;
    if (selectedLang === 'ta' && voiceTextTa) return voiceTextTa;
    return voiceText;
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      const textToSpeak = getTextForLang();
      setIsPlaying(true);
      speak(textToSpeak, selectedLang, {
        rate: playbackRate,
        volume: isMuted ? 0 : 1.0,
        onEnd: () => setIsPlaying(false),
      });
    }
  };

  const handleLangChange = (lang: Language) => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    }
    setSelectedLang(lang);
  };

  const cycleSpeed = () => {
    const nextRate = playbackRate === 1.0 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1.0;
    setPlaybackRate(nextRate);
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    }
  };

  const bioLabel = selectedLang === 'hi' ? 'ऑडियो बायो' : selectedLang === 'ta' ? 'குரல் பயோ' : 'Voice Bio';
  const fullHeader = selectedLang === 'hi' ? `ऑडियो बायो — ${workerName}` : selectedLang === 'ta' ? `குரல் பயோ — ${workerName}` : `Audio Spoken Bio — ${workerName}`;
  const fullSub = selectedLang === 'hi' ? 'मौखिक अनुभव से रिकॉर्ड किया गया कौशल विवरण' : selectedLang === 'ta' ? 'குரல் பதிவு மூலம் எடுக்கப்பட்ட திறன் பயோ' : 'Spoken account extracted skill recording preview';
  const playBtnText = isPlaying
    ? (selectedLang === 'hi' ? 'ऑडियो रोकें' : selectedLang === 'ta' ? 'ஒலியை நிறுத்து' : 'Pause Audio')
    : (selectedLang === 'hi' ? 'आवाज़ बायो सुनें' : selectedLang === 'ta' ? 'குரல் பயோவைக் கேளுங்கள்' : 'Listen to Spoken Bio');

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-primary-50/70 border border-primary-200/80 rounded-xl p-2 text-xs">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTogglePlay();
          }}
          className={`p-1.5 rounded-lg text-white transition-all shadow-sm flex items-center justify-center shrink-0 ${
            isPlaying ? 'bg-amber-600 animate-pulse' : 'bg-primary-600 hover:bg-primary-700'
          }`}
          title={playBtnText}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="font-semibold text-primary-900 text-2xs uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={10} className="text-primary-600" /> {bioLabel}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleLangChange('en'); }}
                className={`text-3xs px-1 rounded font-medium ${selectedLang === 'en' ? 'bg-primary-600 text-white' : 'text-primary-700 hover:bg-primary-100'}`}
              >EN</button>
              <button
                onClick={(e) => { e.stopPropagation(); handleLangChange('hi'); }}
                className={`text-3xs px-1 rounded font-medium ${selectedLang === 'hi' ? 'bg-primary-600 text-white' : 'text-primary-700 hover:bg-primary-100'}`}
              >HI</button>
              <button
                onClick={(e) => { e.stopPropagation(); handleLangChange('ta'); }}
                className={`text-3xs px-1 rounded font-medium ${selectedLang === 'ta' ? 'bg-primary-600 text-white' : 'text-primary-700 hover:bg-primary-100'}`}
              >TA</button>
            </div>
          </div>

          <div className="flex items-end gap-0.5 h-3">
            {[40, 75, 50, 90, 60, 100, 45, 80, 55, 70].map((h, i) => (
              <span
                key={i}
                className={`w-0.5 rounded-full transition-all duration-200 ${
                  isPlaying ? 'bg-primary-600 animate-bounce' : 'bg-primary-300'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(25, Math.round(h * Math.random()))}%` : '35%',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary-900 to-indigo-900 text-white rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-primary-200">
            <Volume2 size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-200 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" /> {fullHeader}
            </h4>
            <p className="text-3xs text-primary-300">{fullSub}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-primary-800/80 p-1 rounded-lg border border-primary-700">
          <Languages size={12} className="text-primary-300 ml-1" />
          <button
            onClick={() => handleLangChange('en')}
            className={`text-2xs px-1.5 py-0.5 rounded font-semibold transition-colors ${
              selectedLang === 'en' ? 'bg-primary-600 text-white' : 'text-primary-300 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleLangChange('hi')}
            className={`text-2xs px-1.5 py-0.5 rounded font-semibold transition-colors ${
              selectedLang === 'hi' ? 'bg-primary-600 text-white' : 'text-primary-300 hover:text-white'
            }`}
          >
            हिंदी
          </button>
          <button
            onClick={() => handleLangChange('ta')}
            className={`text-2xs px-1.5 py-0.5 rounded font-semibold transition-colors ${
              selectedLang === 'ta' ? 'bg-primary-600 text-white' : 'text-primary-300 hover:text-white'
            }`}
          >
            தமிழ்
          </button>
        </div>
      </div>

      <div className="bg-primary-950/60 p-3 rounded-lg border border-primary-800/80 mb-3 font-serif italic text-xs text-primary-100 leading-relaxed">
        "{getTextForLang()}"
      </div>

      <div className="flex items-center justify-between gap-3 bg-primary-800/60 p-2 rounded-lg border border-primary-700/60">
        <button
          onClick={handleTogglePlay}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold shadow transition-all ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{playBtnText}</span>
        </button>

        <div className="flex-1 flex items-center justify-center gap-1 px-4 h-6">
          {[40, 80, 55, 95, 70, 100, 60, 85, 45, 90, 65, 75, 50, 95].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying ? 'bg-amber-400 animate-bounce' : 'bg-primary-600'
              }`}
              style={{
                height: isPlaying ? `${Math.max(30, Math.round(h * Math.random()))}%` : '20%',
                animationDelay: `${(i % 5) * 0.12}s`,
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleSpeed}
            className="text-2xs font-mono font-bold bg-primary-700 hover:bg-primary-600 px-2 py-1 rounded text-primary-200"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-primary-300 hover:text-white p-1"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
