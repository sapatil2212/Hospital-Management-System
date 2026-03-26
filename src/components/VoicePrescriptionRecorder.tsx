"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Sparkles, CheckCircle2, AlertCircle, Play, Pause, Square } from "lucide-react";

interface VoicePrescriptionRecorderProps {
  prescriptionId: string;
  patientName: string;
  doctorName: string;
  onTranscriptionComplete: (result: any) => void;
  accent?: string;
}

export default function VoicePrescriptionRecorder({
  prescriptionId,
  patientName,
  doctorName,
  onTranscriptionComplete,
  accent = "#10b981",
}: VoicePrescriptionRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "complete" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const finalTranscriptRef = useRef<string>("");

  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const setupAudioAnalyser = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    microphone.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(Math.min(100, (average / 128) * 100));
      animationRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  const startRecording = async () => {
    try {
      setErrorMsg("");
      finalTranscriptRef.current = "";
      setTranscript("");
      
      // Check for Web Speech API support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setErrorMsg("Speech recognition not supported in this browser. Please use Chrome or Edge.");
        setStatus("error");
        return;
      }

      // Get microphone for audio level visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setupAudioAnalyser(stream);

      // Setup speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
        }
        setTranscript(finalTranscriptRef.current + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Ignore no-speech errors, continue listening
          return;
        }
        setErrorMsg(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        if (isRecording && !isPaused) {
          // Restart if still recording
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      setIsRecording(true);
      setStatus("recording");
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error("Error starting recording:", error);
      setErrorMsg("Microphone access denied. Please allow microphone access.");
      setStatus("error");
    }
  };

  const pauseRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    // Process the transcript
    processRecording();
  };

  const processRecording = async () => {
    setStatus("processing");
    setIsProcessing(true);

    try {
      const transcriptText = finalTranscriptRef.current.trim();
      
      if (!transcriptText) {
        setErrorMsg("No speech detected. Please try again and speak clearly.");
        setStatus("error");
        setIsProcessing(false);
        return;
      }

      const response = await fetch("/api/prescriptions/voice-transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prescriptionId,
          transcriptText,
          language: selectedLanguage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus("complete");
        onTranscriptionComplete(result.data);
      } else {
        setErrorMsg(result.message || "Failed to process recording");
        setStatus("error");
      }
    } catch (error: any) {
      console.error("Processing error:", error);
      setErrorMsg("Failed to process recording. Please try again.");
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
          <Sparkles size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>AI Voice Prescription</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Record conversation for automatic prescription generation</div>
        </div>
      </div>

      {status === "idle" && (
        <>
          {/* Language Selector */}
          <div style={{ marginBottom: 20, padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>
              🌐 Select Language / भाषा चुनें
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, fontWeight: 500, color: "#1e293b", background: "#fff", cursor: "pointer" }}
            >
              <option value="en-IN">🇮🇳 English (India)</option>
              <option value="hi-IN">🇮🇳 हिन्दी (Hindi)</option>
              <option value="mr-IN">🇮🇳 मराठी (Marathi)</option>
              <option value="ta-IN">🇮🇳 தமிழ் (Tamil)</option>
              <option value="te-IN">🇮🇳 తెలుగు (Telugu)</option>
              <option value="kn-IN">🇮🇳 ಕನ್ನಡ (Kannada)</option>
              <option value="gu-IN">🇮🇳 ગુજરાતી (Gujarati)</option>
              <option value="bn-IN">🇮🇳 বাংলা (Bengali)</option>
              <option value="ml-IN">🇮🇳 മലയാളം (Malayalam)</option>
              <option value="pa-IN">🇮🇳 ਪੰਜਾਬੀ (Punjabi)</option>
            </select>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 6, fontStyle: "italic" }}>
              ✨ AI will understand and translate to English for prescription
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Mic size={36} color={accent} />
            </div>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              Click the button below to start recording the doctor-patient conversation.
              <br />The AI will automatically extract diagnosis, medications, and more.
            </p>
            <button
              onClick={startRecording}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${accent}, #059669)`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${accent}40` }}
            >
              <Mic size={18} />
              Start Recording
            </button>
          </div>
        </>
      )}

      {status === "recording" && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 20px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `${accent}15`, animation: "pulse 2s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: 10, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${accent}` }}>
              {isPaused ? <Pause size={40} color={accent} /> : <Mic size={40} color={accent} />}
            </div>
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: accent, marginBottom: 8 }}>
            {formatTime(recordingTime)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Recording in progress...</div>

          <div style={{ width: "100%", height: 6, background: "#f1f5f9", borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", background: `linear-gradient(90deg, ${accent}, #10b981)`, width: `${audioLevel}%`, transition: "width 0.1s", borderRadius: 3 }} />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {!isPaused ? (
              <button onClick={pauseRecording} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Pause size={14} />
                Pause
              </button>
            ) : (
              <button onClick={resumeRecording} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 9, border: "none", background: accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                <Play size={14} />
                Resume
              </button>
            )}
            <button onClick={stopRecording} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <Square size={14} />
              Stop & Process
            </button>
          </div>
        </div>
      )}

      {status === "processing" && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <Loader2 size={48} color={accent} style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Processing Recording...</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            AI is analyzing the conversation and generating prescription
          </div>
        </div>
      )}

      {status === "complete" && (
        <div style={{ padding: "20px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>Prescription Generated Successfully!</span>
          </div>
          {transcript && (
            <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginTop: 12, maxHeight: 200, overflowY: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>TRANSCRIPT:</div>
              <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{transcript}</div>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div style={{ padding: "20px", background: "#fff5f5", borderRadius: 12, border: "1px solid #fecaca", textAlign: "center" }}>
          <AlertCircle size={40} color="#ef4444" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>Error</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>{errorMsg}</div>
          <button
            onClick={() => { setStatus("idle"); setErrorMsg(""); }}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
