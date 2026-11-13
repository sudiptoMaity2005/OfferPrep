"use client";

import { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  isRecording: boolean;
}

export function AudioVisualizer({ isRecording }: AudioVisualizerProps) {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording) {
      // Clean up audio context and media stream when recording stops
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioLevel(0);
      return;
    }

    let isMounted = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStreamRef.current = stream;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.5;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!isMounted || !analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalize to roughly 0 - 100
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(normalized);

          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (err) {
        console.warn("Could not initialize audio visualizer analyser:", err);
      }
    }

    initAudio();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [isRecording]);

  if (!isRecording) return null;

  // 4 visualizer bars scaling dynamically with real microphone levels
  const barHeights = [
    Math.max(15, Math.min(100, audioLevel * 1.1)),
    Math.max(20, Math.min(100, audioLevel * 1.5)),
    Math.max(25, Math.min(100, audioLevel * 1.8)),
    Math.max(15, Math.min(100, audioLevel * 1.2)),
  ];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 animate-in fade-in duration-300">
      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
      <span className="text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400">
        Live Mic
      </span>
      <div className="flex items-center gap-1 h-5 w-12 justify-center">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="w-1 bg-rose-500 rounded-full transition-all duration-75"
            style={{
              height: `${h}%`,
              opacity: audioLevel > 5 ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

