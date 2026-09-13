import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, AlertCircle, Info, Edit3, Sparkles } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import {
  isSpeechRecognitionSupported,
  startSpeechRecognition,
  stopSpeechRecognition,
  detectLanguage,
} from '../services/voice';

type RecordingState = 'idle' | 'listening' | 'processing' | 'completed' | 'error';

export default function VoiceInputPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage, setCurrentTranscript } = useApp();

  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorKey, setErrorKey] = useState('');
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<any>(null);
  const isSupported = isSpeechRecognitionSupported();

  const SAMPLE_STORIES = [
    {
      title: language === 'hi' ? '🍰 बेकिंग और पेस्ट्री' : language === 'ta' ? '🍰 பேக்கிங் & பேஸ்ட்ரி' : '🍰 Baking & Pastry',
      text: language === 'hi'
        ? 'मैं 4 साल से घर पर केक, पेस्ट्री, मफिन और बिस्कुट बनाकर बेचती हूँ। ओवन तापमान और सजावट संभालती हूँ।'
        : language === 'ta'
        ? 'நான் 4 ஆண்டுகளாக வீட்டில் கேக், பேஸ்ட்ரி, பிஸ்கட் தயாரித்து விற்கிறேன். ஓவன் வெப்பநிலை மேலாண்மை செய்கிறேன்.'
        : 'I have been baking custom birthday cakes, pastries, cookies, and managing commercial baking ovens for 4 years.'
    },
    {
      title: language === 'hi' ? '👗 सिलाई और कढ़ाई' : language === 'ta' ? '👗 தையல் & எம்பிராய்டரி' : '👗 Tailoring & Embroidery',
      text: language === 'hi'
        ? 'मैं 5 साल से ब्लाउज की सिलाई, सूट की कटाई और आरी-जरदोजी कढ़ाई का काम कर रही हूँ।'
        : language === 'ta'
        ? 'நான் 5 வருடங்களாக பிளவுஸ் தையல், ஆடை வெட்டுதல் மற்றும் ஆரி எம்பிராய்டரி வேலை செய்து வருகிறேன்.'
        : 'I run a home tailoring shop for 5 years stitching designer blouses, suits, fabric pattern cutting, and Aari embroidery.'
    },
    {
      title: language === 'hi' ? '🍲 कुकिंग और खानपान' : language === 'ta' ? '🍲 சமையல் & கேட்டரிங்' : '🍲 Cooking & Catering',
      text: language === 'hi'
        ? 'मैं 6 साल से टिफिन सेवा चलाती हूँ और शादी व आयोजनों के लिए कैटरिंग भोजन बनाती हूँ।'
        : language === 'ta'
        ? 'நான் 6 ஆண்டுகளாக டிபன் சேவை நடத்துகிறேன் மற்றும் திருமண சமையல் கேட்டரிங் செய்கிறேன்.'
        : 'I have 6 years of experience cooking daily meals, tiffin services, and catering for small wedding functions.'
    },
    {
      title: language === 'hi' ? '💄 ब्राइडल मेकअप और ब्यूटी' : language === 'ta' ? '💄 மணப்பெண் ஒப்பனை & அழகு' : '💄 Bridal Makeup & Beauty',
      text: language === 'hi'
        ? 'मैं 3 साल से ब्यूटी पार्लर चला रही हूँ और ब्राइडल मेकअप, फेशियल, थ्रेडिंग और हेयर स्टाइलिंग करती हूँ।'
        : language === 'ta'
        ? 'நான் 3 ஆண்டுகளாக அழகு நிலையம் நடத்தி மணப்பெண் மேக்கப், ஃபேஷியல் மற்றும் முடி அலங்காரம் செய்கிறேன்.'
        : 'I operate a beauty parlour offering bridal makeup, skincare facials, threading, waxing, and festive hair styling for 3 years.'
    },
    {
      title: language === 'hi' ? '⚡ इलेक्ट्रिकल वायरिंग' : language === 'ta' ? '⚡ மின்சார வயரிங்' : '⚡ Electrical Wiring',
      text: language === 'hi'
        ? 'मैं 5 साल से घरों में बिजली की वायरिंग, स्विचबोर्ड लगाने और पंखे व मोटर की मरम्मत करता हूँ।'
        : language === 'ta'
        ? 'நான் 5 ஆண்டுகளாக வீடுகளுக்கு மின்சார வயரிங், சுவிட்ச்போர்டு பொருத்துதல் மற்றும் மோட்டார் பழுது நீக்குகிறேன்.'
        : 'I do domestic electrical house wiring, switchboard setup, ceiling fan repair, and motor troubleshooting for 5 years.'
    },
    {
      title: language === 'hi' ? '❓ कोई भी सवाल / प्रश्न पूछें' : language === 'ta' ? '❓ ஏதேனும் கேள்வி / சந்தேகம்' : '❓ Ask Any Question / Query',
      text: language === 'hi'
        ? 'वेब डेवलपमेंट और पाइथन प्रोग्रामिंग के लिए कौन से कौशल आवश्यक हैं?'
        : language === 'ta'
        ? 'மென்பொருள் உருவாக்கம் மற்றும் பைதான் நிரலாக்கத்திற்கு என்ன திறன்கள் தேவை?'
        : 'What skills are needed for python development and software engineering?'
    },
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = () => {
    if (!isSupported) {
      setErrorKey('notSupported');
      setState('error');
      return;
    }

    setState('listening');
    setDuration(0);
    setTranscript('');
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

    startSpeechRecognition(language, {
      onStart: () => setState('listening'),
      onResult: (text) => setTranscript(text),
      onEnd: (final) => {
        clearInterval(timerRef.current);
        if (final.trim()) {
          setTranscript(final);
          void setLanguage(detectLanguage(final));
          setState('completed');
        } else {
          setErrorKey('noSpeech');
          setState('error');
        }
      },
      onError: (err) => {
        clearInterval(timerRef.current);
        setErrorKey(err);
        setState('error');
      },
    });
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    const final = stopSpeechRecognition();
    if (final.trim()) {
      setTranscript(final);
      void setLanguage(detectLanguage(final));
      setState('completed');
    } else {
      setState('idle');
    }
  };

  const handleContinue = (overrideText?: string) => {
    const textToUse = (typeof overrideText === 'string' ? overrideText : transcript).trim() || SAMPLE_STORIES[0].text;
    setCurrentTranscript(textToUse);
    navigate('/app/transcript');
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const stateLabel = {
    idle: t('voice.idle'),
    listening: t('voice.listening'),
    processing: t('voice.processing'),
    completed: t('voice.completed'),
    error: t(`voice.error.${errorKey}`) || t('voice.error.general'),
  }[state];

  return (
    <div className="voice-page min-h-screen flex flex-col items-center justify-center px-5 py-8 animate-fade-in">
      <div className="w-full max-w-xl text-center">
        {/* Header */}
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {t('voice.title')}
        </h1>
        <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
          {t('voice.instruction')}
        </p>

        {/* Input Mode Toggle (Voice vs Text) */}
        <div className="inline-flex p-1 bg-surface-card border border-surface-border rounded-2xl mb-8 shadow-xs">
          <button
            onClick={() => { setInputMode('voice'); setState('idle'); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-xs transition-all ${
              inputMode === 'voice' ? 'bg-white text-primary-700 shadow-xs' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Mic size={14} />
            {language === 'hi' ? 'बोलकर कहें' : language === 'ta' ? 'குரல் பதிவு' : 'Voice Record'}
          </button>
          <button
            onClick={() => { setInputMode('text'); setState('idle'); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-xs transition-all ${
              inputMode === 'text' ? 'bg-white text-primary-700 shadow-xs' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Edit3 size={14} />
            {language === 'hi' ? 'कहानी लिखें' : language === 'ta' ? 'கதை எழுதவும்' : 'Type / Edit Story'}
          </button>
          <div className="flex items-center px-3 text-2xs font-semibold text-primary-700 bg-primary-50 rounded-xl ml-1">
            {language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिंदी' : 'English'}
          </div>
        </div>

        {/* Main Interface */}
        {inputMode === 'voice' ? (
          /* Voice Recording Circle */
          <div className="card py-10 px-6 flex flex-col items-center justify-center relative overflow-hidden shadow-card">
            {/* Pulsing ring during listening */}
            {state === 'listening' && (
              <div className="absolute w-40 h-40 rounded-full bg-primary-100 animate-ping opacity-75" />
            )}

            {/* Mic button */}
            <button
              onClick={state === 'listening' ? stopRecording : startRecording}
              disabled={state === 'processing'}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 z-10 shadow-lg ${
                state === 'listening'
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse scale-105'
                  : state === 'completed'
                  ? 'bg-success-600 text-white hover:scale-105'
                  : 'bg-primary-600 hover:bg-primary-700 text-white hover:scale-105'
              }`}
            >
              {state === 'listening' ? (
                <MicOff size={44} />
              ) : (
                <Mic size={44} />
              )}
            </button>

            {/* Timer */}
            {state === 'listening' && (
              <span className="mt-4 text-sm font-mono font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
                {formatDuration(duration)}
              </span>
            )}

            {/* Status label */}
            <p className="mt-4 text-sm font-semibold text-text-primary">
              {stateLabel}
            </p>

            {/* Live Transcript Preview */}
            {transcript && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-surface-border w-full max-w-md text-left animate-slide-up">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                  {t('transcript.title')}
                </p>
                <p className="text-sm text-text-primary leading-relaxed italic">
                  &ldquo;{transcript}&rdquo;
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Text Story Input Box */
          <div className="card p-6 text-left shadow-card">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">
              {t('voice.instruction')}
            </label>
            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                if (e.target.value.trim()) setState('completed');
              }}
              placeholder={t('voice.example')}
              className="input min-h-[140px] text-sm p-4 leading-relaxed resize-none rounded-xl"
              rows={5}
            />
            <p className="text-2xs text-text-muted mt-2">
              {language === 'hi' ? 'आप ऊपर "कहानी लिखें" टैब का उपयोग करके अपनी कहानी टाइप कर सकते हैं।' : language === 'ta' ? 'மேலே உள்ள "கதை எழுதவும்" பட்டனைப் பயன்படுத்தி தட்டச்சு செய்யலாம்.' : 'You can click "Type / Edit Story" above to type your work story directly.'}
            </p>
          </div>
        )}

        {/* Quick Sample Story Chips */}
        <div className="mt-8 text-left">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary-600" />
            {language === 'hi' ? 'उदाहरण कहानियाँ (कौशल जांचने के लिए क्लिक करें)' : language === 'ta' ? 'மாதிரி கதைகள் (கிளிக் செய்க)' : 'Sample Work Stories (Click to Try)'}
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_STORIES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(sample.text);
                  setState('completed');
                  handleContinue(sample.text);
                }}
                className="px-3.5 py-2.5 bg-white hover:bg-primary-50 border border-surface-border hover:border-primary-300 rounded-xl text-xs font-semibold text-text-primary transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          {inputMode === 'voice' && state === 'idle' && (
            <button onClick={startRecording} className="btn-primary w-full justify-center py-3.5 text-base font-semibold shadow-md">
              <Mic size={20} />
              {t('voice.startRecording')}
            </button>
          )}
          {inputMode === 'voice' && state === 'listening' && (
            <button onClick={stopRecording} className="btn-secondary w-full justify-center py-3.5 text-base font-semibold border-red-200 text-red-600 hover:bg-red-50">
              <MicOff size={20} />
              {t('voice.stopRecording')}
            </button>
          )}
          {(state === 'completed' || transcript.trim().length > 0 || inputMode === 'text') && (
            <>
              <button onClick={() => handleContinue()} className="btn-primary w-full justify-center py-3.5 text-base font-semibold shadow-md">
                {t('voice.continue')}
              </button>
              {inputMode === 'voice' && (
                <button onClick={() => { setState('idle'); setTranscript(''); }} className="btn-ghost w-full justify-center text-xs">
                  {t('transcript.retry')}
                </button>
              )}
            </>
          )}
          {state === 'error' && (
            <button onClick={() => setState('idle')} className="btn-primary w-full justify-center py-3">
              {t('common.retry')}
            </button>
          )}
        </div>

        {/* Informational Hints */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-2xs text-text-muted border-t border-surface-border pt-6">
          <div>{t('voice.hint1')}</div>
          <div>{t('voice.hint2')}</div>
          <div>{t('voice.hint3')}</div>
        </div>
      </div>
    </div>
  );
}
