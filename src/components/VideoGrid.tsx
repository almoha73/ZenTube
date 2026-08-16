import React from 'react';
import { AlertCircle, RefreshCw, Server, VideoOff, ChevronDown, Loader2 } from 'lucide-react';
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
    <div className="flex flex-col gap-8">
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

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4 pb-8">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-8 py-3 bg-zen-card hover:bg-zen-surface border border-zen-border hover:border-brand/40 text-slate-200 hover:text-white rounded-2xl text-sm font-semibold transition-all shadow-lg hover:shadow-brand/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 text-brand animate-spin" />
                <span>Chargement des vidéos suivantes...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-brand" />
                <span>Afficher plus de vidéos (+20)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
