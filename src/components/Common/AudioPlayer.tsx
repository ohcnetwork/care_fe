import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  src: string;
  className?: string;
}

function AudioPlayer({ src, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 24 * 60 * 60; // Seek to 24 hours
    }
  }, []);

  const handleDurationChange = useCallback(() => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, []);

  useEffect(() => {
    // Create the audio element
    const audio = new Audio(src);
    audio.preload = "metadata";

    // Add event listeners
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", () => setIsPlaying(false));

    // Set the ref
    audioRef.current = audio;

    // Cleanup
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", () => setIsPlaying(false));
      audio.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleSliderChange = useCallback((value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const Player = () => (
    <div
      className={cn(
        "flex flex-row items-center p-2 rounded-md bg-secondary-300 border border-secondary-200 m-3",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className="size-6"
      >
        <CareIcon icon={isPlaying ? "l-pause" : "l-play"} />
      </Button>
      <div className="flex flex-1 items-center gap-2">
        <span className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <Slider
          defaultValue={[0]}
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
          disabled={isLoading}
          className="flex-1"
        />
        <CareIcon
          icon={isMuted ? "l-volume-mute" : "l-volume"}
          onClick={toggleMute}
          className="cursor-pointer"
        />
      </div>
    </div>
  );

  return { Player, isPlaying, isLoading, stopPlayback };
}

export default AudioPlayer;
