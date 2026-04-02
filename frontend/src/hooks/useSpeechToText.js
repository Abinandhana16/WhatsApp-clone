import { useState, useRef, useCallback } from 'react';

export const useSpeechToText = (onTextFound) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isFinal, setIsFinal] = useState(false); // Track if the full result is locked
  const recognitionRef = useRef(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
        setIsRecording(true);
        setIsFinal(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
          setIsFinal(true);
        } else {
          interimTranscript += event.results[i][0].transcript;
          setIsFinal(false);
        }
      }
      
      const currentText = finalTranscript || interimTranscript;
      setTranscript(currentText);
      if (onTextFound && finalTranscript) onTextFound(finalTranscript);
    };

    recognition.start();
  }, [onTextFound]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isRecording, transcript, isFinal, startRecording, stopRecording };
};
