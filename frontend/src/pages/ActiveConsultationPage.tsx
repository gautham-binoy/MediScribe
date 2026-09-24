import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { consultationsApi } from '@/api/client';
import { Consultation, TranscriptSegment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { LiveTranscript } from '@/components/consultation/LiveTranscript';
import { DetectedInfoCard } from '@/components/consultation/DetectedInfoCard';
import { AudioRecorder } from '@/components/consultation/AudioRecorder';
import { LanguageSelector } from '@/components/consultation/LanguageSelector';
import { Button } from '@/components/ui/Button';
import { Stethoscope, User, ShieldCheck, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export const ActiveConsultationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [detectedSymptoms, setDetectedSymptoms] = useState<string[]>([]);
  const [detectedDuration, setDetectedDuration] = useState<string | undefined>(undefined);
  const [detectedAllergies, setDetectedAllergies] = useState<string | undefined>(undefined);
  const [detectedWarnings, setDetectedWarnings] = useState<string[]>([]);
  const [normalizedPreview, setNormalizedPreview] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  const timerRef = useRef<any>(null);

  // Load consultation details
  useEffect(() => {
    if (id) {
      consultationsApi
        .getById(id)
        .then((c) => {
          setConsultation(c);
          if (c.transcript && c.transcript.segments) {
            setSegments(c.transcript.segments);
            setNormalizedPreview(c.transcript.normalized_clinical_text);
          }
          if (c.status === 'PENDING_REVIEW' || c.status === 'APPROVED') {
            navigate(`/consultations/${id}/review`, { replace: true });
          }
        })
        .catch((err) => {
          toastError('Error', 'Consultation could not be loaded');
        })
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  // Handle URL preset scenario (e.g. ?scenario=malayalam_fever)
  useEffect(() => {
    const scenario = searchParams.get('scenario');
    if (scenario && id && !isRecording && segments.length === 0) {
      handleTriggerDemo(scenario);
    }
  }, [searchParams, id]);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const stopMediaRecorderAsync = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        if (audioChunksRef.current.length > 0) {
          resolve(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        } else {
          resolve(null);
        }
        return;
      }
      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          resolve(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        } else {
          resolve(null);
        }
      };
      recorder.stop();
      if (recorder.stream) {
        recorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    });
  };

  const handleStartRecording = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new (window as any).MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        recorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(500);
      }
      setIsRecording(true);
      info('Recording Started', 'Capturing doctor & patient audio dialogue.');
    } catch (err: any) {
      setIsRecording(true);
      toastError(
        'Microphone Denied / Unavailable',
        'Microphone access is unavailable or denied. Streaming simulated Malayalam-English dialogue for safe demo presentation.'
      );
      handleTriggerDemo('malayalam_fever');
    }
  };

  const handlePauseRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
  };

  const handleResumeRecording = () => {
    timerRef.current = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  };

  const handleTriggerDemo = async (scenario: string = 'malayalam_fever') => {
    if (!id) return;
    setIsRecording(true);
    info('Simulating Conversation', 'Streaming Malayalam + English doctor-patient dialogue...');

    try {
      const transcript = await consultationsApi.triggerDemoAudio(id, scenario);
      setSegments(transcript.segments);
      setNormalizedPreview(transcript.normalized_clinical_text);

      // Populate live detected entities for visual WOW effect
      if (scenario === 'malayalam_fever') {
        setDetectedSymptoms(['Fever', 'Headache', 'Mild cough']);
        setDetectedDuration('3 days');
        setDetectedAllergies('No known drug allergies reported');
        setDetectedWarnings(['Watch for temperature > 102°F or dehydration']);
      } else {
        setDetectedSymptoms(['Dry cough', 'Sore throat']);
        setDetectedDuration('4 days');
        setDetectedAllergies('NKDA');
      }

      setDurationSeconds(42);
      success('Dialogue Captured', 'Transcript ready for clinical draft generation.');
    } catch (err: any) {
      toastError('Demo Simulation Failed', err.message);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!id) return;
    setIsUploading(true);
    info('Transcribing Audio', `Uploading and transcribing ${file.name} with Gemini AI...`);
    try {
      const transcript = await consultationsApi.uploadAudio(id, file);
      setSegments(transcript.segments);
      setNormalizedPreview(transcript.normalized_clinical_text);
      success(
        'Audio Transcribed',
        `Successfully transcribed ${transcript.segments.length} dialogue turns from ${file.name}.`
      );
    } catch (err: any) {
      toastError('Audio Upload Error', err.message || 'Failed to transcribe audio file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStopAndExtract = async () => {
    if (!id) return;
    setIsRecording(false);
    setIsGenerating(true);

    try {
      // 1. If microphone was capturing audio, wait for recorder to finish and collect audio blob
      let recordedBlob: Blob | null = null;
      if (mediaRecorderRef.current) {
        recordedBlob = await stopMediaRecorderAsync();
      }

      // 2. Transcribe recorded microphone audio if we don't already have segments
      if (recordedBlob && recordedBlob.size > 0 && segments.length === 0) {
        try {
          info('Transcribing Voice', 'Transcribing your microphone recording with Gemini AI...');
          const audioFile = new File([recordedBlob], 'mic_recording.webm', { type: 'audio/webm' });
          const transcript = await consultationsApi.uploadAudio(id, audioFile);
          setSegments(transcript.segments);
          setNormalizedPreview(transcript.normalized_clinical_text);
        } catch (uploadErr: any) {
          console.warn('Live mic transcription error:', uploadErr);
          toastError('Transcription Warning', uploadErr.message || 'Could not transcribe voice recording.');
        }
      }

      // 3. Fallback only if no segments were captured AND no audio was recorded
      if (segments.length === 0 && (!recordedBlob || recordedBlob.size === 0)) {
        await consultationsApi.triggerDemoAudio(id, 'malayalam_fever');
      }

      // 4. Generate full AI clinical drafts (SOAP, Diagnoses, Investigations, Prescription, ICD)
      info('Clinical Synthesis', 'Generating SOAP note and prescription drafts with Gemini AI...');
      await consultationsApi.generateDrafts(id);
      success('AI Clinical Draft Generated', 'Redirecting to Doctor Review workspace...');

      // 5. Navigate to review screen
      navigate(`/consultations/${id}/review`);
    } catch (err: any) {
      toastError('AI Generation Failed', err.message || 'Error occurred');
      setIsGenerating(false);
    }
  };

  if (loading || !consultation) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading consultation room...</div>;
  }

  const patient = consultation.patient;

  return (
    <div className="space-y-6">
      {/* Consultation Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold">
                  {consultation.consultation_id}
                </span>
                <span className="text-sm font-bold text-white">CONSULTATION IN PROGRESS</span>
                <span className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  Live Session
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                <span className="font-semibold text-white">Patient: {patient?.name} ({patient?.patient_id})</span>
                <span>•</span>
                <span>{patient?.age}y, {patient?.gender}</span>
                <span>•</span>
                <span>Allergies: <strong className="text-amber-400 font-semibold">{patient?.allergies || 'NKDA'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              size="md"
              onClick={handleStopAndExtract}
              isLoading={isGenerating}
              icon={<ArrowRight className="w-4 h-4" />}
              className="shadow-md shadow-rose-600/30 font-bold"
            >
              End Consultation & Generate AI Draft
            </Button>
          </div>
        </div>
      </div>

      {/* Main split grid: Controls & Live Transcript & Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Transcript (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <LiveTranscript
            segments={segments}
            isRecording={isRecording}
            detectedLanguage={consultation.detected_language}
            normalizedPreview={normalizedPreview}
          />
        </div>

        {/* Right Column: Audio Recording Controls & Detected Entities */}
        <div className="space-y-4">
          <AudioRecorder
            isRecording={isRecording}
            onStart={handleStartRecording}
            onPause={handlePauseRecording}
            onResume={handleResumeRecording}
            onStop={handleStopAndExtract}
            onTriggerDemo={handleTriggerDemo}
            onFileUpload={handleFileUpload}
            durationSeconds={durationSeconds}
            disabled={isGenerating}
            isUploading={isUploading}
          />

          <DetectedInfoCard
            symptoms={detectedSymptoms}
            duration={detectedDuration}
            allergies={detectedAllergies}
            warnings={detectedWarnings}
          />

          {/* Clinical Safety Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              Doctor-in-the-Loop Protocol
            </div>
            <p className="text-[11px]">
              Ending the consultation triggers multilingual AI extraction. The resulting SOAP note,
              diagnoses, and prescription will remain in DRAFT status until you explicitly verify and approve them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
