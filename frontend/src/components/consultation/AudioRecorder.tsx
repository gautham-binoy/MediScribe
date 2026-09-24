import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Pause, Play, Square, Sparkles, Upload, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AudioRecorderProps {
  isRecording: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTriggerDemo: (scenario: string) => void;
  onFileUpload: (file: File) => void;
  durationSeconds: number;
  disabled?: boolean;
  isUploading?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  isRecording,
  onStart,
  onPause,
  onResume,
  onStop,
  onTriggerDemo,
  onFileUpload,
  durationSeconds,
  disabled = false,
  isUploading = false,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      onResume();
    } else {
      setIsPaused(true);
      onPause();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFileUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
      {/* Top status bar: Timer and visualizer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isRecording
                ? isPaused
                  ? 'bg-amber-500'
                  : 'bg-rose-600 animate-ping'
                : 'bg-slate-300'
            }`}
          />
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isRecording
                ? isPaused
                  ? 'Recording Paused'
                  : 'Recording in Progress'
                : isUploading
                  ? 'Transcribing Audio...'
                  : 'Microphone Standby'}
            </div>
            <div className="text-2xl font-mono font-bold text-slate-900 tracking-tight">
              {formatTime(durationSeconds)}
            </div>
          </div>
        </div>

        {/* Audio Visualizer simulation */}
        {isRecording && !isPaused ? (
          <div className="flex items-center gap-1 h-8 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200">
            {[40, 75, 100, 50, 90, 60, 30, 85, 45, 95, 65, 35].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-brand-500 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 80}ms`,
                  animationDuration: '600ms',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            {isUploading ? 'Gemini AI processing audio...' : 'Audio stream idle'}
          </div>
        )}
      </div>

      {/* Main Control Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        {!isRecording ? (
          <Button
            variant="primary"
            size="md"
            onClick={onStart}
            disabled={disabled || isUploading}
            icon={<Mic className="w-4 h-4" />}
            className="flex-1"
          >
            Start Microphone Recording
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="md"
              onClick={handlePauseResume}
              icon={isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={onStop}
              icon={<Square className="w-4 h-4 fill-current" />}
              className="flex-1"
            >
              End Consultation & Extract
            </Button>
          </>
        )}

        {/* File upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.opus,.aac,.flac"
          className="hidden"
        />
        <Button
          variant="outline"
          size="md"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isRecording || isUploading}
          isLoading={isUploading}
          icon={<Upload className="w-4 h-4" />}
          title="Upload audio file (MP3, WAV, WebM, M4A, etc.)"
        >
          {isUploading ? 'Transcribing...' : 'Upload Audio'}
        </Button>
      </div>

      {/* Expo Demo Preset Quick Injections */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Expo Preset Dialogue Simulations (Zero-Latency Demo):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => onTriggerDemo('malayalam_fever')}
            disabled={disabled}
            className="flex items-center justify-between p-2.5 rounded-xl text-left border border-brand-200 bg-brand-50/50 hover:bg-brand-50 hover:border-brand-300 transition-all text-xs"
          >
            <div>
              <div className="font-bold text-brand-900">Malayalam + English</div>
              <div className="text-[10px] text-brand-700 font-mono">Fever 3 Days (Dr / Pt)</div>
            </div>
            <FileAudio className="w-4 h-4 text-brand-600 shrink-0" />
          </button>

          <button
            onClick={() => onTriggerDemo('english_respiratory')}
            disabled={disabled}
            className="flex items-center justify-between p-2.5 rounded-xl text-left border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 transition-all text-xs"
          >
            <div>
              <div className="font-bold text-slate-800">English Standard</div>
              <div className="text-[10px] text-slate-500 font-mono">URI & Cough</div>
            </div>
            <FileAudio className="w-4 h-4 text-slate-500 shrink-0" />
          </button>

          <button
            onClick={() => onTriggerDemo('malayalam_pure')}
            disabled={disabled}
            className="flex items-center justify-between p-2.5 rounded-xl text-left border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 transition-all text-xs"
          >
            <div>
              <div className="font-bold text-slate-800">മലയാളം (Pure)</div>
              <div className="text-[10px] text-slate-500 font-mono">Headache & Fatigue</div>
            </div>
            <FileAudio className="w-4 h-4 text-slate-500 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
