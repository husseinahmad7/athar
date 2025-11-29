import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceCounter({ targetPhrase, onCount, isActive, setIsActive }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const isStartingRef = useRef(false);
  
  // Cleanup function
  const cleanup = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {
        console.log('Cleanup error (expected):', e.message);
      }
    }
    setIsListening(false);
    setTranscript('');
    isStartingRef.current = false;
  };
  
  useEffect(() => {
    // Cleanup on unmount or when isActive changes to false
    if (!isActive) {
      cleanup();
    }
    
    return cleanup;
  }, [isActive]);
  
  const initializeRecognition = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('المتصفح لا يدعم التعرف على الصوت');
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      console.log('Recognition started');
      setIsListening(true);
      isStartingRef.current = false;
    };
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscript(interimTranscript || finalTranscript);
      
      // Check if the phrase matches - count any speech as one dhikr
      if (finalTranscript && finalTranscript.trim().length > 0) {
        onCount();
        // Visual feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    };
    
    recognition.onerror = (event) => {
      console.log('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Don't show error for no-speech or aborted
        return;
      }
      if (event.error === 'not-allowed') {
        toast.error('يرجى السماح بالوصول إلى الميكروفون');
        cleanup();
        setIsActive(false);
        return;
      }
      // For other errors, just log them
      console.error('Recognition error:', event.error);
    };
    
    recognition.onend = () => {
      console.log('Recognition ended');
      if (isActive && !isStartingRef.current) {
        // Restart if still active and not currently starting
        setTimeout(() => {
          if (isActive && recognitionRef.current) {
            try {
              isStartingRef.current = true;
              recognitionRef.current.start();
            } catch (e) {
              console.log('Error restarting recognition:', e.message);
              isStartingRef.current = false;
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };
    
    return recognition;
  };
  
  const startListening = () => {
    if (isStartingRef.current || isListening) {
      return; // Already starting or listening
    }
    
    try {
      // Clean up any existing recognition
      cleanup();
      
      // Create new recognition instance
      const recognition = initializeRecognition();
      if (!recognition) return;
      
      recognitionRef.current = recognition;
      isStartingRef.current = true;
      setIsActive(true);
      
      recognition.start();
      toast.success('بدأ الاستماع...');
    } catch (e) {
      console.error('Error starting recognition:', e);
      toast.error('فشل بدء التعرف على الصوت');
      cleanup();
      setIsActive(false);
    }
  };
  
  const stopListening = () => {
    setIsActive(false);
    cleanup();
    toast.info('توقف الاستماع');
  };
  
  const toggleListening = () => {
    if (!isListening && !isStartingRef.current) {
      startListening();
    } else {
      stopListening();
    }
  };
  
  return (
    <div className="space-y-4">
      <Button
        onClick={toggleListening}
        size="lg"
        disabled={isStartingRef.current}
        className={`w-full h-20 text-lg font-arabic-bold transition-all ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 pulse-glow' 
            : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {isStartingRef.current ? (
          <>
            <Volume2 className="w-6 h-6 ml-2 animate-pulse" />
            جاري البدء...
          </>
        ) : isListening ? (
          <>
            <MicOff className="w-6 h-6 ml-2" />
            إيقاف الاستماع
          </>
        ) : (
          <>
            <Mic className="w-6 h-6 ml-2" />
            ابدأ العد بالصوت
          </>
        )}
      </Button>
      
      {isListening && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4 animate-fadeIn" dir="rtl">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-5 h-5 text-emerald-600 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-900">جاري الاستماع...</span>
          </div>
          {transcript && (
            <p className="text-lg font-arabic text-emerald-800 mt-2">
              "{transcript}"
            </p>
          )}
        </div>
      )}
      
      <div className="text-sm text-gray-600 text-center font-arabic" dir="rtl">
        <p>قل الذكر بصوت واضح وسيتم احتسابه تلقائياً</p>
      </div>
    </div>
  );
}