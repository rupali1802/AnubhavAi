import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, Sparkles, X } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { speak } from '../../services/voice';

export default function VoiceBuddy() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');

  const recognitionRef = useRef<any>(null);

  const langCodeMap: Record<string, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    ta: 'ta-IN',
  };

  const startAssistant = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback(
        language === 'ta' ? 'குரல் அங்கீகாரம் இந்த உலாவியில் ஆதரிக்கப்படவில்லை.' :
        language === 'hi' ? 'इस ब्राउज़र में वाक् पहचान समर्थित नहीं है।' :
        'Speech recognition is not supported in this browser.'
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langCodeMap[language] || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setFeedback(
        language === 'ta' ? 'கேட்கிறது... "அடுத்து", "திறன்", "பாஸ்போர்ட்" என்று சொல்லுங்கள்' :
        language === 'hi' ? 'सुन रहे हैं... "अगला", "कौशल", "पासपोर्ट" बोलें' :
        'Listening... Say "Next", "Skills", "Passport", or "Verify"'
      );
    };

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript.toLowerCase();
      setTranscript(spokenText);
      handleVoiceCommand(spokenText);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setFeedback(
        language === 'hi' ? 'स्पष्ट रूप से सुनाई नहीं दिया। पुनः प्रयास करने के लिए माइक दबाएं।' :
        language === 'ta' ? 'தெளிவாக கேட்கவில்லை. மீண்டும் முயற்சிக்க மைக்கைத் தொடுங்கள்.' :
        'Could not hear clearly. Tap mic to try again.'
      );
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleVoiceCommand = (cmd: string) => {
    let responseText = '';

    if (cmd.includes('next') || cmd.includes('अगला') || cmd.includes('आगे') || cmd.includes('அடுத்து')) {
      responseText = language === 'ta' ? 'அடுத்த பக்கத்திற்குச் செல்கிறது' : language === 'hi' ? 'अगले पृष्ठ पर जा रहे हैं' : 'Navigating to next step';
      navigate('/app/skills');
    } else if (cmd.includes('story') || cmd.includes('कहानी') || cmd.includes('कथा') || cmd.includes('கதை')) {
      responseText = language === 'ta' ? 'கதை பக்கத்திற்குச் செல்கிறது' : language === 'hi' ? 'कहानी पृष्ठ पर जा रहे हैं' : 'Navigating to Voice Input';
      navigate('/app/story');
    } else if (cmd.includes('skill') || cmd.includes('कौशल') || cmd.includes('திறன்')) {
      responseText = language === 'ta' ? 'திறன்கள் பக்கத்திற்குச் செல்கிறது' : language === 'hi' ? 'कौशल पृष्ठ पर जा रहे हैं' : 'Navigating to Skills Discovered';
      navigate('/app/skills');
    } else if (cmd.includes('verify') || cmd.includes('सत्यापित') || cmd.includes('जांच') || cmd.includes('சரிபார்')) {
      responseText = language === 'ta' ? 'சரிபார்ப்பு பக்கத்திற்குச் செல்கிறது' : language === 'hi' ? 'सत्यापन पृष्ठ पर जा रहे हैं' : 'Navigating to Verification';
      navigate('/app/verify');
    } else if (cmd.includes('scheme') || cmd.includes('opportunity') || cmd.includes('स्कीम') || cmd.includes('अवसर') || cmd.includes('வாய்ப்பு')) {
      responseText = language === 'ta' ? 'வாய்ப்புகள் பக்கத்திற்குச் செல்கிறது' : language === 'hi' ? 'अवसर पृष्ठ पर जा रहे हैं' : 'Navigating to Opportunities';
      navigate('/app/opportunities');
    } else if (cmd.includes('passport') || cmd.includes('पासपोर्ट') || cmd.includes('சான்றிதழ்') || cmd.includes('பாஸ்போர்ட்')) {
      responseText = language === 'ta' ? 'பாஸ்போர்ட் பக்கத்திற்குச் செல்கிறது' : language === 'hi' ? 'पासपोर्ट पृष्ठ पर जा रहे हैं' : 'Navigating to Skill Passport';
      navigate('/app/passport');
    } else if (cmd.includes('recruiter') || cmd.includes('hire') || cmd.includes('नौकरी') || cmd.includes('रोजगार') || cmd.includes('வேலை')) {
      responseText = language === 'ta' ? 'வேலைவாய்ப்பு போர்ட்டலுக்குச் செல்கிறது' : language === 'hi' ? 'भर्ती पोर्टल पर जा रहे हैं' : 'Navigating to Recruiter Hiring Portal';
      navigate('/recruiter');
    } else {
      responseText = language === 'ta' ? 'கட்டளை புரியவில்லை. மீண்டும் முயற்சிக்கவும்' : language === 'hi' ? 'कमांड समझ में नहीं आई। कृपया पुनः प्रयास करें' : 'Command not recognized. Please try saying "Skills" or "Verify".';
    }

    setFeedback(responseText);
    speak(responseText, language);
  };

  const stopAssistant = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) startAssistant();
          }}
          className="relative group bg-primary-700 hover:bg-primary-800 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
          title="Anubhav Buddy — Hands-free Voice Assistant"
        >
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-500 rounded-full flex items-center justify-center text-3xs font-bold animate-pulse">
            <Sparkles size={10} />
          </span>
          <Mic size={24} />
        </button>
      </div>

      {/* Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm w-full bg-white rounded-2xl border-2 border-primary-600 shadow-2xl p-5 animate-slide-up print:hidden">
          <div className="flex items-center justify-between mb-3 border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700 font-bold">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Anubhav Buddy</h4>
                <p className="text-2xs text-text-muted">
                  {language === 'hi' ? 'हैंड्स-फ्री वॉयस असिस्टेंट' : language === 'ta' ? 'ஹேண்ட்ஸ்-ஃப்ரீ குரல் உதவியாளர்' : 'Hands-Free Voice Assistant'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                stopAssistant();
                setIsOpen(false);
              }}
              className="text-text-muted hover:text-text-primary"
            >
              <X size={18} />
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
            {isListening ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <span className="voice-ring" />
                  <span className="voice-ring" />
                  <Mic className="text-primary-600 relative z-10" size={24} />
                </div>
                <p className="text-xs font-semibold text-primary-700 animate-pulse">
                  {language === 'hi' ? 'सुन रहे हैं...' : language === 'ta' ? 'கேட்கிறது...' : 'Listening...'}
                </p>
              </div>
            ) : (
              <Volume2 className="text-primary-600 mx-auto mb-1" size={24} />
            )}

            <p className="text-xs text-text-primary font-medium mt-2 leading-relaxed">
              {feedback || (language === 'hi' ? 'माइक दबाएं और वॉयस कमांड बोलें।' : language === 'ta' ? 'மைக்கைத் தொட்டு குரல் கட்டளையைச் சொல்லுங்கள்.' : 'Tap the mic and speak a voice command.')}
            </p>

            {transcript && (
              <div className="mt-2 text-2xs bg-white p-2 rounded-lg border border-surface-border text-text-secondary">
                {language === 'hi' ? 'आपने कहा:' : language === 'ta' ? 'நீங்கள் கூறியது:' : 'You said:'} &ldquo;{transcript}&rdquo;
              </div>
            )}
          </div>

          {/* Quick Voice Commands Guide */}
          <div className="space-y-1 text-2xs text-text-muted">
            <p className="font-semibold text-text-secondary mb-1">
              {language === 'hi' ? 'कमांड बोलकर देखें:' : language === 'ta' ? 'பேசிப்பார்க்க கட்டளைகள்:' : 'Try Spoken Commands:'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(language === 'hi'
                ? ['"कहानी"', '"कौशल"', '"सत्यापित"', '"अवसर"', '"पासपोर्ट"', '"नौकरी"']
                : language === 'ta'
                ? ['"கதை"', '"திறன்"', '"சரிபார்"', '"வாய்ப்பு"', '"பாஸ்போர்ட்"', '"வேலை"']
                : ['"Story"', '"Skills"', '"Verify"', '"Opportunities"', '"Passport"', '"Recruiter"']
              ).map(cmd => (
                <span key={cmd} className="px-2 py-0.5 bg-gray-100 rounded text-text-secondary">
                  {cmd}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {!isListening ? (
              <button
                onClick={startAssistant}
                className="btn-primary w-full justify-center text-xs py-2"
              >
                <Mic size={14} /> {language === 'hi' ? 'कमांड बोलें' : language === 'ta' ? 'கட்டளை பேசு' : 'Speak Command'}
              </button>
            ) : (
              <button
                onClick={stopAssistant}
                className="btn-secondary w-full justify-center text-xs py-2 bg-red-50 text-red-600 border-red-200"
              >
                <MicOff size={14} /> {language === 'hi' ? 'सुनना बंद करें' : language === 'ta' ? 'கேட்பதை நிறுத்து' : 'Stop Listening'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
