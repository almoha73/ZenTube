import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  RotateCw,
  Repeat,
  PictureInPicture,
  Download,
  AlertCircle,
  RefreshCw,
  Server,
  Tv,
  Check,
  Sparkles,
} from 'lucide-react';
import { InvidiousFormatStream, InvidiousVideoDetail } from '../types';
import { formatDuration } from '../utils/formatters';

interface VideoPlayerProps {
  video: InvidiousVideoDetail;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onVideoEnd?: () => void;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
  onSwitchInstance?: () => void;
  currentInstance: string;
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
  hasNextVideo?: boolean;
  hasPreviousVideo?: boolean;
  isAutoplay?: boolean;
  onToggleAutoplay?: () => void;
}

// Robust helper functions for true OS native fullscreen across all browser engines
const getFullscreenElement = (): Element | null => {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  );
};

const enterNativeFullscreen = async (element: HTMLElement) => {
  const options = { navigationUI: 'hide' as const };
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen(options);
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    }
  } catch (err) {
    console.warn('Container requestFullscreen failed, trying documentElement:', err);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen(options);
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
    } catch (e2) {
      console.warn('DocumentElement fallback failed:', e2);
    }
  }
};

const exitNativeFullscreen = async () => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
  } catch (err) {
    console.warn('exitFullscreen error:', err);
  }
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  initialTime = 0,
  onTimeUpdate,
  onVideoEnd,
  isTheaterMode = false,
  onToggleTheater,
  onSwitchInstance,
  currentInstance,
  onNextVideo,
  onPreviousVideo,
  hasNextVideo = false,
  hasPreviousVideo = false,
  isAutoplay = true,
  onToggleAutoplay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stream format selection
  const [selectedFormat, setSelectedFormat] = useState<InvidiousFormatStream | null>(null);
  const [availableFormats, setAvailableFormats] = useState<InvidiousFormatStream[]>([]);
  const [triedFormatUrls, setTriedFormatUrls] = useState<string[]>([]);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.lengthSeconds || 0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('zentube_player_volume');
      return saved ? parseFloat(saved) : 1;
    } catch {
      return 1;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Menu toggles
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsSubmenu, setSettingsSubmenu] = useState<'main' | 'quality' | 'speed'>('main');

  // Compute available streams
  useEffect(() => {
    setStreamError(null);
    setTriedFormatUrls([]);
    setUseIframeFallback(false);

    const streams = (video.formatStreams || []).filter((s) => s.url);

    if (streams.length > 0) {
      setAvailableFormats(streams);
      const best = streams.find((s) => s.qualityLabel === '720p' || s.resolution === '720p') || streams[0];
      setSelectedFormat(best);
    } else {
      setUseIframeFallback(true);
    }
  }, [video, currentInstance]);

  // Initial time seek when video metadata loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || video.lengthSeconds || 0);
      if (initialTime > 0 && initialTime < (videoRef.current.duration || video.lengthSeconds)) {
        videoRef.current.currentTime = initialTime;
      }
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.volume = isMuted ? 0 : volume;

      // Autoplay
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        // Autoplay policy prevented playback, keep paused
        setIsPlaying(false);
      });
    }
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Time update
  const handleTimeUpdate = () => {
    if (!videoRef.current || isScrubbing) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    if (onTimeUpdate) {
      onTimeUpdate(curr, duration || video.lengthSeconds);
    }

    // Update buffer progress
    if (videoRef.current.buffered.length > 0) {
      setBufferedEnd(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }
  };

  // Skip time (+/- seconds)
  const skipTime = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
  }, [duration]);

  // Volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    try {
      localStorage.setItem('zentube_player_volume', newVolume.toString());
    } catch {}
  };

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    if (isMuted || volume === 0) {
      const restored = volume === 0 ? 0.8 : volume;
      setIsMuted(false);
      setVolume(restored);
      videoRef.current.muted = false;
      videoRef.current.volume = restored;
    } else {
      setIsMuted(true);
      videoRef.current.muted = true;
    }
  }, [isMuted, volume]);

  // Speed change
  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettingsMenu(false);
    setSettingsSubmenu('main');
  };

  // Quality switch (retains current playback time)
  // Quality switch (retains current playback time)
  const handleQualityChange = (format: InvidiousFormatStream) => {
    if (!videoRef.current || selectedFormat?.url === format.url) return;
    const cur = videoRef.current.currentTime;
    const wasPlaying = !videoRef.current.paused;

    setSelectedFormat(format);
    setShowSettingsMenu(false);
    setSettingsSubmenu('main');

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = cur;
        if (wasPlaying) {
          videoRef.current.play().catch(console.warn);
        }
      }
    }, 100);
  };

  // Fullscreen change listener across all browser engines
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsElem = getFullscreenElement();
      setIsFullscreen(fsElem !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Fullscreen toggle (invokes native OS Fullscreen API hiding browser bars)
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!getFullscreenElement()) {
      await enterNativeFullscreen(containerRef.current);
    } else {
      await exitNativeFullscreen();
    }
  }, []);

  // Single click (Play/Pause) vs Double click (Plein écran)
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVideoClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
        toggleFullscreen();
      } else {
        clickTimeoutRef.current = setTimeout(() => {
          togglePlay();
          clickTimeoutRef.current = null;
        }, 240);
      }
    },
    [togglePlay, toggleFullscreen]
  );

  // PiP toggle
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (e) {
      console.warn('PiP error', e);
    }
  };

  // Scrubber scrubbing
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    const targetTime = pos * duration;
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      // Shift + N -> Next video
      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (onNextVideo) onNextVideo();
        return;
      }

      // Shift + P -> Previous video
      if (e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (onPreviousVideo) onPreviousVideo();
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'j':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'l':
          e.preventDefault();
          skipTime(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          skipTime(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          skipTime(5);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 0.1, 1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 0.1, 0));
          break;
        case 't':
          e.preventDefault();
          if (onToggleTheater) onToggleTheater();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, skipTime, volume, onToggleTheater, onNextVideo, onPreviousVideo]);

  // Hide controls on idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettingsMenu) {
        setShowControls(false);
      }
    }, 2800);
  };

  // Video error handler with fallback
  const handleVideoError = () => {
    if (!selectedFormat) {
      setUseIframeFallback(true);
      return;
    }

    const currentUrl = selectedFormat.url;
    setTriedFormatUrls((prev) => {
      const updated = prev.includes(currentUrl) ? prev : [...prev, currentUrl];
      const nextFormat = availableFormats.find((f) => !updated.includes(f.url));

      if (nextFormat) {
        setSelectedFormat(nextFormat);
      } else {
        // All direct streams exhausted -> seamlessly switch to clean ad-free embed!
        setUseIframeFallback(true);
      }
      return updated;
    });
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !showSettingsMenu && setShowControls(false)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        toggleFullscreen();
      }}
      className={`relative select-none bg-black overflow-hidden group shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 w-screen h-screen z-[99999] rounded-none max-h-none shadow-none m-0 p-0'
          : isTheaterMode
          ? 'w-full aspect-[21/9] sm:aspect-video max-h-[80vh] rounded-3xl'
          : 'w-full aspect-video rounded-3xl'
      }`}
    >
      {/* Video Element OR Embed Fallback */}
      {!useIframeFallback && selectedFormat ? (
        <video
          ref={videoRef}
          src={selectedFormat.url}
          onClick={handleVideoClick}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setIsPlaying(false);
            if (onVideoEnd) onVideoEnd();
          }}
          onError={handleVideoError}
          loop={isLooping}
          playsInline
          className={`w-full h-full object-contain cursor-pointer ${isFullscreen ? 'rounded-none' : ''}`}
        />
      ) : (
        <div className="relative w-full h-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}&hl=fr`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="w-full h-full border-0"
          />
          {/* Floating Fullscreen button for embed mode */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/75 hover:bg-brand text-white border border-white/10 shadow-xl backdrop-blur-md transition-all cursor-pointer z-20"
            title={isFullscreen ? 'Quitter le plein écran (F / Echap)' : 'Vrai plein écran complet (F)'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Stream Error Modal Overlay */}
      {streamError && !useIframeFallback && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 mb-3">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-white mb-1">Flux vidéo non disponible</h4>
          <p className="text-xs text-slate-400 max-w-md mb-5">{streamError}</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setUseIframeFallback(true)}
              className="px-4 py-2 bg-brand hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-lg shadow-brand/25"
            >
              Basculer sur le lecteur Embed
            </button>

            {onSwitchInstance && (
              <button
                onClick={onSwitchInstance}
                className="flex items-center gap-1.5 px-4 py-2 bg-zen-surface hover:bg-zen-hover border border-zen-border text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                <Server className="w-3.5 h-3.5 text-brand" />
                Changer d'instance Invidious
              </button>
            )}
          </div>
        </div>
      )}

      {/* Center Big Play/Pause Ripple on Click */}
      {!useIframeFallback && (
        <div
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand/90 backdrop-blur-md text-white flex items-center justify-center shadow-2xl shadow-brand/50 transform transition-transform group-hover:scale-110">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {!useIframeFallback && (
        <div
          className={`absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/90 via-transparent to-black/40 transition-opacity duration-300 pointer-events-none ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Top Bar: Title & Instance info */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2 max-w-xl truncate">
              <span className="px-2 py-0.5 rounded-md bg-brand text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                ZenTube Sans Pub
              </span>
              <h2 className="text-sm font-semibold text-slate-100 truncate drop-shadow-md">
                {video.title}
              </h2>
            </div>

            {selectedFormat && (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-[11px] font-mono text-slate-300 backdrop-blur-sm">
                <span>{selectedFormat.qualityLabel || selectedFormat.resolution || 'Direct MP4'}</span>
              </div>
            )}
          </div>

          {/* Bottom Bar: Timeline Scrubber + Controls */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            {/* Scrubber Timeline */}
            <div
              ref={timelineRef}
              onClick={handleTimelineClick}
              onMouseMove={handleTimelineMouseMove}
              onMouseLeave={() => setHoverTime(null)}
              className="relative h-2 hover:h-3 w-full bg-white/20 rounded-full cursor-pointer transition-all duration-150 group/timeline flex items-center"
            >
              {/* Buffer progress */}
              <div
                style={{ width: `${bufferPercent}%` }}
                className="absolute left-0 top-0 bottom-0 bg-white/30 rounded-full transition-all duration-300"
              />

              {/* Played progress */}
              <div
                style={{ width: `${progressPercent}%` }}
                className="absolute left-0 top-0 bottom-0 bg-brand rounded-full shadow-[0_0_10px_rgba(255,0,51,0.7)]"
              />

              {/* Scrubber Thumb */}
              <div
                style={{ left: `${progressPercent}%` }}
                className="absolute -translate-x-1/2 w-3.5 h-3.5 bg-brand rounded-full border-2 border-white shadow-md opacity-0 group-hover/timeline:opacity-100 transition-opacity"
              />

              {/* Hover Tooltip */}
              {hoverTime !== null && (
                <div
                  style={{ left: `${hoverPosition}%` }}
                  className="absolute bottom-full mb-2 -translate-x-1/2 px-2 py-1 bg-zen-card/95 border border-zen-border text-white text-xs font-mono rounded-md shadow-xl pointer-events-none whitespace-nowrap"
                >
                  {formatDuration(hoverTime)}
                </div>
              )}
            </div>

            {/* Bottom Control Bar */}
            <div className="flex items-center justify-between text-slate-100 pt-1">
              {/* Left group: Previous, Play/Pause, Next, Rewind, Forward, Volume, Time */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Previous track / video button */}
                <button
                  type="button"
                  onClick={onPreviousVideo}
                  disabled={!hasPreviousVideo}
                  className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title={hasPreviousVideo ? 'Morceau / Vidéo précédente (Maj+P)' : 'Aucune vidéo précédente'}
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                {/* Play / Pause button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-white"
                  title={isPlaying ? 'Pause (Espace/K)' : 'Lecture (Espace/K)'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                {/* Next track / video button */}
                <button
                  type="button"
                  onClick={onNextVideo}
                  disabled={!hasNextVideo}
                  className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title={hasNextVideo ? 'Morceau / Vidéo suivante (Maj+N)' : 'Aucune vidéo suivante'}
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>

                {/* 10s Rewind */}
                <button
                  type="button"
                  onClick={() => skipTime(-10)}
                  className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-slate-300 hover:text-white hidden sm:flex"
                  title="Reculer de 10s (J)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* 10s Forward */}
                <button
                  type="button"
                  onClick={() => skipTime(10)}
                  className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-slate-300 hover:text-white hidden sm:flex"
                  title="Avancer de 10s (L)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Volume Slider Group */}
                <div className="flex items-center group/volume gap-1.5 pl-1">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-slate-300 hover:text-white"
                    title={isMuted ? 'Activer le son (M)' : 'Couper le son (M)'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-rose-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-0 group-hover/volume:w-20 transition-all duration-200 h-1 bg-white/30 rounded-lg"
                  />
                </div>

                {/* Time Display */}
                <div className="text-xs font-mono text-slate-300 pl-2">
                  <span>{formatDuration(currentTime)}</span>
                  <span className="mx-1 text-slate-500">/</span>
                  <span className="text-slate-400">{formatDuration(duration)}</span>
                </div>
              </div>

              {/* Right group: Autoplay, Loop, Settings, Theater, PiP, Fullscreen */}
              <div className="relative flex items-center gap-1 sm:gap-2">
                {/* Autoplay Toggle */}
                {onToggleAutoplay && (
                  <button
                    type="button"
                    onClick={onToggleAutoplay}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                      isAutoplay
                        ? 'text-brand bg-brand/15 ring-1 ring-brand/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/15'
                    }`}
                    title={
                      isAutoplay
                        ? 'Lecture automatique activée (enchaîne au morceau suivant)'
                        : 'Activer la lecture automatique'
                    }
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden xl:inline text-[10px] uppercase font-bold tracking-wider">
                      Auto
                    </span>
                  </button>
                )}

                {/* Loop toggle */}
                <button
                  type="button"
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                    isLooping ? 'text-brand bg-brand/10' : 'text-slate-300 hover:text-white hover:bg-white/15'
                  }`}
                  title="Lecture en boucle"
                >
                  <Repeat className="w-4 h-4" />
                </button>

                {/* Settings Dropdown Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsMenu(!showSettingsMenu);
                      setSettingsSubmenu('main');
                    }}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      showSettingsMenu ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white hover:bg-white/15'
                    }`}
                    title="Paramètres (Qualité, Vitesse)"
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  {/* Settings Popup Menu */}
                  {showSettingsMenu && (
                    <div className="absolute right-0 bottom-full mb-3 w-56 bg-zen-card/95 backdrop-blur-xl border border-zen-border rounded-2xl shadow-2xl p-2 z-50 text-xs animate-slide-up">
                      {settingsSubmenu === 'main' && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setSettingsSubmenu('quality')}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-zen-surface text-slate-200 hover:text-white transition-colors"
                          >
                            <span>Qualité vidéo</span>
                            <span className="font-semibold text-brand">
                              {selectedFormat?.qualityLabel || selectedFormat?.resolution || 'Auto'}
                            </span>
                          </button>

                          <button
                            onClick={() => setSettingsSubmenu('speed')}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-zen-surface text-slate-200 hover:text-white transition-colors"
                          >
                            <span>Vitesse de lecture</span>
                            <span className="font-semibold text-brand">
                              {playbackRate === 1 ? 'Normale' : `${playbackRate}x`}
                            </span>
                          </button>

                          {selectedFormat?.url && (
                            <a
                              href={selectedFormat.url}
                              target="_blank"
                              rel="noreferrer"
                              download={`${video.title}.mp4`}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-zen-surface text-slate-300 hover:text-white transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                Télécharger le flux
                              </span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Quality Submenu */}
                      {settingsSubmenu === 'quality' && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setSettingsSubmenu('main')}
                            className="text-left font-bold text-slate-400 p-1.5 border-b border-zen-border/60 hover:text-white"
                          >
                            ← Qualité
                          </button>
                          <div className="max-h-48 overflow-y-auto flex flex-col gap-1 pt-1">
                            {availableFormats.map((fmt, idx) => {
                              const isSelected = selectedFormat?.url === fmt.url;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleQualityChange(fmt)}
                                  className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                                    isSelected
                                      ? 'bg-brand/10 text-brand font-bold'
                                      : 'hover:bg-zen-surface text-slate-300'
                                  }`}
                                >
                                  <span>{fmt.qualityLabel || fmt.resolution || `Stream #${idx + 1}`}</span>
                                  <span className="text-[10px] text-slate-500 uppercase">{fmt.container}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Speed Submenu */}
                      {settingsSubmenu === 'speed' && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setSettingsSubmenu('main')}
                            className="text-left font-bold text-slate-400 p-1.5 border-b border-zen-border/60 hover:text-white"
                          >
                            ← Vitesse de lecture
                          </button>
                          <div className="flex flex-col gap-1 pt-1">
                            {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => {
                              const isSelected = playbackRate === rate;
                              return (
                                <button
                                  key={rate}
                                  onClick={() => handleRateChange(rate)}
                                  className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                                    isSelected
                                      ? 'bg-brand/10 text-brand font-bold'
                                      : 'hover:bg-zen-surface text-slate-300'
                                  }`}
                                >
                                  <span>{rate === 1 ? 'Normale (1x)' : `${rate}x`}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Theater Mode toggle */}
                {onToggleTheater && (
                  <button
                    type="button"
                    onClick={onToggleTheater}
                    className={`hidden md:block p-1.5 rounded-xl transition-colors cursor-pointer ${
                      isTheaterMode ? 'text-brand bg-brand/10' : 'text-slate-300 hover:text-white hover:bg-white/15'
                    }`}
                    title={
                      isTheaterMode
                        ? 'Quitter le mode Cinéma (T)'
                        : 'Mode Cinéma / Grand écran (T) — Pour le plein écran complet, appuyez sur F ou cliquez sur Plein Écran'
                    }
                  >
                    <Tv className="w-4 h-4" />
                  </button>
                )}

                {/* PiP */}
                <button
                  type="button"
                  onClick={togglePiP}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                    isPiPActive ? 'text-brand bg-brand/10' : 'text-slate-300 hover:text-white hover:bg-white/15'
                  }`}
                  title="Incrustation d'image (PiP)"
                >
                  <PictureInPicture className="w-4 h-4" />
                </button>

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer text-slate-300 hover:text-white"
                  title={
                    isFullscreen
                      ? 'Quitter le plein écran (F / Échap)'
                      : 'Vrai plein écran complet (F / Double-clic)'
                  }
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
