/**
 * Voice Service — Speech recognition + TTS abstraction layer.
 * Uses browser Web Speech API with language-locked configurations.
 */

import type { Language } from '../types';

// Language codes for Web Speech API
const SPEECH_LANG_CODES: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
};

export const detectLanguage = (text: string): Language => {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
};

// ── Speech Recognition ────────────────────────────────────────────────────────

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, interim: boolean) => void;
  onEnd?: (finalTranscript: string) => void;
  onError?: (error: string) => void;
}

let recognition: any = null;
let finalTranscript = '';

export const isSpeechRecognitionSupported = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

export const startSpeechRecognition = (
  language: Language,
  callbacks: SpeechRecognitionCallbacks
): void => {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onError?.('notSupported');
    return;
  }

  const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  recognition = new SpeechRecognition();
  finalTranscript = '';

  recognition.lang = SPEECH_LANG_CODES[language];
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    callbacks.onStart?.();
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript + ' ';
        callbacks.onResult?.(finalTranscript.trim(), false);
      } else {
        interimTranscript = result[0].transcript;
        callbacks.onResult?.(finalTranscript + interimTranscript, true);
      }
    }
  };

  recognition.onerror = (event: any) => {
    const errorMap: Record<string, string> = {
      'not-allowed': 'micDenied',
      'no-speech': 'noSpeech',
      'audio-capture': 'micDenied',
      'network': 'general',
    };
    callbacks.onError?.(errorMap[event.error] || 'general');
  };

  recognition.onend = () => {
    callbacks.onEnd?.(finalTranscript.trim());
  };

  try {
    recognition.start();
  } catch (e) {
    callbacks.onError?.('general');
  }
};

export const stopSpeechRecognition = (): string => {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  return finalTranscript.trim();
};

// ── Text to Speech ────────────────────────────────────────────────────────────

let currentUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

const loadVoices = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
};

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export const isTTSSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

export const speak = (text: string, language: Language, options?: {
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
}): void => {
  if (!isTTSSupported()) return;

  // Stop any ongoing speech
  stopSpeaking();

  if (!cachedVoices || cachedVoices.length === 0) {
    loadVoices();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const targetLang = SPEECH_LANG_CODES[language] || 'en-IN';
  utterance.lang = targetLang;
  utterance.rate = options?.rate ?? (language === 'ta' ? 0.85 : 0.9);
  utterance.pitch = options?.pitch ?? 1.0;
  utterance.volume = options?.volume ?? 1.0;

  // Select best available voice for the language
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  const bestVoice =
    voices.find((v) => v.lang === targetLang) ||
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === targetLang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(language)) ||
    voices.find((v) => v.name.toLowerCase().includes(language === 'ta' ? 'tamil' : language === 'hi' ? 'hindi' : 'india')) ||
    voices.find((v) => v.lang.includes('IN')) ||
    null;

  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  utterance.onend = () => {
    currentUtterance = null;
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('[TTS Warning]', e);
    currentUtterance = null;
    options?.onEnd?.();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
};

export const isSpeaking = (): boolean => {
  return speechSynthesis.speaking;
};

// ── Device ID ─────────────────────────────────────────────────────────────────

export const getOrCreateDeviceId = (): string => {
  const stored = localStorage.getItem('anubhavai_device_id');
  if (stored) return stored;

  const newId = 'device-' + Math.random().toString(36).substring(2, 15)
    + '-' + Date.now().toString(36);
  localStorage.setItem('anubhavai_device_id', newId);
  return newId;
};
