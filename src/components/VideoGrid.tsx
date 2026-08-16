import React, { useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw, Server, VideoOff, Loader2 } from 'lucide-react';
import { InvidiousVideoSummary } from '../types';
import { VideoCard } from './VideoCard';
import { VideoGridSkeleton } from './Skeletons';

interface VideoGridProps {
  videos: InvidiousVideoSummary[];
  isLoading: boolean;
  error: string | null;
  onSelectVideo: (videoId: string) => void;
  onChannelClick?: (authorId: string, authorName: string) => void;
  onRetry?: () => void;
  onOpenInstanceModal?: () => void;
  favorites?: string[]; // array of favorite videoIds
  onToggleFavorite?: (video: InvidiousVideoSummary) => void;
  onShare?: (videoId: string, title: string) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  isLoading,
  error,
  onSelectVideo,
  onChannelClick,
  onRetry,
  onOpenInstanceModal,
  favorites = [],
  onToggleFavorite,
  onShare,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Automatic Infinite Scroll with IntersectionObserver
  useEffect(() => {
    if (!hasMore || !onLoadMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      {
        rootMargin: '500px', // Preload ahead of reaching the very bottom
        threshold: 0.05,
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, onLoadMore, isLoadingMore]);

  if (isLoading) {
    return <VideoGridSkeleton count={12} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl bg-zen-card/50 border border-zen-border my-6">
        <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 mb-4 ring-1 ring-rose-500/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Erreur de connexion</h3>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          )}

          {onOpenInstanceModal && (
            <button
              onClick={onOpenInstanceModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-zen-surface hover:bg-zen-hover border border-zen-border text-slate-200 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              <Server className="w-4 h-4 text-brand" />
              Changer d'instance Invidious
            </button>
          )}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-zen-card/30 border border-zen-border/40 my-6">
        <div className="p-4 rounded-2xl bg-zen-surface text-slate-400 mb-4">
          <VideoOff className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-1">Aucune vidéo trouvée</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Essayez un autre mot-clé ou modifiez vos filtres de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {videos.map((video) => (
          <VideoCard
            key={video.videoId}
            video={video}
            onSelectVideo={onSelectVideo}
            onChannelClick={onChannelClick}
            isFavorite={favorites.includes(video.videoId)}
            onToggleFavorite={onToggleFavorite}
            onShare={onShare}
          />
        ))}
      </div>

      {/* Infinite Scroll Sentinel & Subtle Loading Indicator */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center items-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center gap-3 px-6 py-3 bg-zen-card/90 backdrop-blur-md border border-zen-border rounded-2xl shadow-xl animate-fade-in">
              <Loader2 className="w-5 h-5 text-brand animate-spin" />
              <span className="text-xs font-semibold text-slate-200">
                Chargement automatique de la suite...
              </span>
            </div>
          ) : (
            <div className="h-6 w-full flex justify-center items-center text-xs text-slate-600 opacity-40">
              <span>Faites défiler pour voir plus de vidéos</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
