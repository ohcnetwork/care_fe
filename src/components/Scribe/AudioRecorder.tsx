import { useMutation } from "@tanstack/react-query";
import {
  FileAudio,
  Loader2,
  Mic,
  Pause,
  Play,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import scribeApi, {
  BundleProcessRequest,
  createScribeFormData,
  ScribeProcessResponse,
} from "@/components/Scribe/scribeApi";

import mutate from "@/Utils/request/mutate";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AudioRecorderProps {
  encounterId: string;
  onClose: () => void;
}

type RecordingState = "idle" | "recording" | "paused" | "stopped";

// Use window object to store timer state - survives HMR and Strict Mode
const TIMER_KEY = "__audio_recorder_timer__";
const STARTED_KEY = "__audio_recorder_started__";
const START_TIME_KEY = "__audio_recorder_start_time__";
const ACCUMULATED_KEY = "__audio_recorder_accumulated__";

interface WindowWithTimer extends Window {
  [TIMER_KEY]?: number;
  [STARTED_KEY]?: boolean;
  [START_TIME_KEY]?: number;
  [ACCUMULATED_KEY]?: number;
}

function clearGlobalTimer() {
  const win = window as WindowWithTimer;
  if (win[TIMER_KEY] !== undefined) {
    window.clearInterval(win[TIMER_KEY]);
    win[TIMER_KEY] = undefined;
  }
}

function getHasStarted(): boolean {
  return (window as WindowWithTimer)[STARTED_KEY] === true;
}

function setHasStarted(value: boolean) {
  (window as WindowWithTimer)[STARTED_KEY] = value;
}

export function AudioRecorder({ encounterId, onClose }: AudioRecorderProps) {
  const { t } = useTranslation();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup timer on unmount - but don't reset hasStarted
  // (Strict Mode will remount and we don't want to start twice)
  useEffect(() => {
    return () => {
      clearGlobalTimer();
    };
  }, []);

  const startRecording = useCallback(async () => {
    // Prevent duplicate starts using window-level variable
    if (getHasStarted()) {
      return;
    }
    // Also check if a timer is already running (extra safety)
    const win = window as WindowWithTimer;
    if (win[TIMER_KEY] !== undefined) {
      return;
    }
    setHasStarted(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setRecordingState("recording");
      setDuration(0);
      // Use timestamp-based timing - immune to callback timing issues
      const win = window as WindowWithTimer;
      win[START_TIME_KEY] = Date.now();
      win[ACCUMULATED_KEY] = 0;
      // Start timer using window-stored timer ID
      clearGlobalTimer();
      const timerId = window.setInterval(() => {
        const w = window as WindowWithTimer;
        const startTime = w[START_TIME_KEY] || Date.now();
        const accumulated = w[ACCUMULATED_KEY] || 0;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(accumulated + elapsed);
      }, 1000);
      (window as WindowWithTimer)[TIMER_KEY] = timerId;
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      // Save accumulated time when pausing
      const win = window as WindowWithTimer;
      const startTime = win[START_TIME_KEY] || Date.now();
      const previousAccumulated = win[ACCUMULATED_KEY] || 0;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      win[ACCUMULATED_KEY] = previousAccumulated + elapsed;
      clearGlobalTimer();
      setRecordingState("paused");
    }
  }, [recordingState]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      // Reset start time for new segment
      const win = window as WindowWithTimer;
      win[START_TIME_KEY] = Date.now();
      clearGlobalTimer();
      const timerId = window.setInterval(() => {
        const w = window as WindowWithTimer;
        const startTime = w[START_TIME_KEY] || Date.now();
        const accumulated = w[ACCUMULATED_KEY] || 0;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(accumulated + elapsed);
      }, 1000);
      (window as WindowWithTimer)[TIMER_KEY] = timerId;
      setRecordingState("recording");
    }
  }, [recordingState]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      clearGlobalTimer();
      setRecordingState("stopped");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, []);

  const discardRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingState("idle");
    setDuration(0);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    audioChunksRef.current = [];
    setHasStarted(false);
  }, [audioUrl]);

  const handleClose = useCallback(() => {
    clearGlobalTimer();
    setHasStarted(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    onClose();
  }, [audioUrl, onClose]);

  // Bundle process mutation
  const { mutate: processBundle, isPending: isProcessingBundle } = useMutation({
    mutationFn: mutate(scribeApi.processBundle),
    onSuccess: () => {
      toast.success(t("scribe_bundle_saved"));
      discardRecording();
      location.reload();
    },
    onError: (error) => {
      toast.error(t("scribe_bundle_save_error"));
      console.error("Bundle process error:", error);
    },
  });

  // Upload mutation
  const { mutate: uploadAudio, isPending: isUploading } = useMutation<
    ScribeProcessResponse,
    Error,
    FormData
  >({
    mutationFn: mutate(scribeApi.process),
    onSuccess: (data) => {
      toast.success(t("scribe_upload_success"));

      console.log("Scribe response:", data);

      // If we have a bundle, process it
      if (data?.bundle) {
        const bundleRequest: BundleProcessRequest = {
          encounter: encounterId,
          fail_on_error: true,
          bundle: data.bundle,
        };
        processBundle(bundleRequest);
      } else {
        discardRecording();
      }
    },
    onError: (error) => {
      toast.error(t("scribe_upload_error"));
      console.error("Scribe upload error:", error);
    },
  });

  const handleUpload = useCallback(() => {
    if (!audioBlob) {
      toast.error(t("no_audio_to_upload"));
      return;
    }
    const formData = createScribeFormData(audioBlob);
    uploadAudio(formData);
  }, [audioBlob, uploadAudio, t]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("audio/")) {
        toast.error(t("invalid_audio_file"));
        return;
      }

      // Create blob URL for playback
      const url = URL.createObjectURL(file);
      setAudioBlob(file);
      setAudioUrl(url);
      setRecordingState("stopped");
      setDuration(0);
    },
    [t],
  );

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Auto-start recording when component mounts
  useEffect(() => {
    startRecording();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          {t("audio_scribe")}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={handleClose}
          aria-label={t("close")}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Recording indicator */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div
          className={cn(
            "size-3 rounded-full",
            recordingState === "recording" && "bg-red-500 animate-pulse",
            recordingState === "paused" && "bg-yellow-500",
            recordingState === "stopped" && "bg-gray-400",
            recordingState === "idle" && "bg-gray-300",
          )}
        />
        <span className="text-2xl font-mono text-gray-700">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Recording controls */}
      {recordingState !== "stopped" && (
        <div className="flex items-center justify-center gap-2">
          {/* Hidden file input for audio upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label={t("upload_audio_file")}
          />

          {recordingState === "recording" ? (
            <Button variant="outline" size="icon" onClick={pauseRecording}>
              <Pause className="size-4" />
            </Button>
          ) : recordingState === "paused" ? (
            <Button
              variant="outline"
              size="icon"
              onClick={resumeRecording}
              aria-label={t("resume")}
            >
              <Play className="size-4" />
            </Button>
          ) : (
            <>
              <Button variant="primary" size="icon" onClick={startRecording}>
                <Mic className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={triggerFileUpload}
                aria-label={t("upload_audio_file")}
              >
                <FileAudio className="size-4" />
              </Button>
            </>
          )}

          {(recordingState === "recording" || recordingState === "paused") && (
            <Button
              variant="destructive"
              size="icon"
              onClick={stopRecording}
              aria-label={t("stop")}
            >
              <Square className="size-4" />
            </Button>
          )}
        </div>
      )}

      {/* Playback controls */}
      {recordingState === "stopped" && audioUrl && (
        <div className="flex flex-col gap-3">
          <audio controls className="w-full" src={audioUrl}>
            <track kind="captions" />
            {t("audio_not_supported")}
          </audio>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={discardRecording}
              disabled={isUploading || isProcessingBundle}
              className="flex items-center gap-2"
            >
              <Trash2 className="size-4" />
              {t("discard")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              disabled={isUploading || isProcessingBundle}
              className="flex items-center gap-2"
            >
              {isUploading || isProcessingBundle ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {isUploading
                ? t("uploading")
                : isProcessingBundle
                  ? t("processing")
                  : t("upload")}
            </Button>
          </div>
        </div>
      )}

      {/* Status text */}
      <p className="text-xs text-gray-500 text-center mt-3">
        {recordingState === "recording" && t("recording_in_progress")}
        {recordingState === "paused" && t("recording_paused")}
        {recordingState === "stopped" && t("recording_complete")}
        {recordingState === "idle" && t("ready_to_record")}
      </p>
    </Card>
  );
}
