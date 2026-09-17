import React from 'react';
import { ArrowLeft, Play, Heart, Share2, ListMusic, Layers, User, Shuffle } from 'lucide-react';
import { InvidiousVideoSummary, PlaylistDetail } from '../types';
import { VideoCard } from './VideoCard';

interface PlaylistViewProps {
  playlist: PlaylistDetail;
  onBack: () => void;
  onSelectVideo: (videoId: string, queue?: InvidiousVideoSummary[]) => void;
  onPlayShuffle?: (videos: InvidiousVideoSummary[]) => void;
  onChannelClick?: (authorId: string, authorName: string) => void;
  isFavorite: boolean;
  onToggleFavoritePlaylist: (playlist: PlaylistDetail) => void;
  onShare: (urlOrId: string, title: string) => void;
  favorites: string[];
  onToggleFavoriteVideo: (video: InvidiousVideoSummary) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist,
  onBack,
  onSelectVideo,
  onPlayShuffle,
  onChannelClick,
  isFavorite,
  onToggleFavoritePlaylist,
  onShare,
  favorites,
  onToggleFavoriteVideo,
}) => {
  const coverUrl =
    playlist.thumbnailUrl ||
    (playlist.videos.length > 0 && playlist.videos[0].videoThumbnails?.[0]?.url) ||
    '';

  const handlePlayAll = () => {
    if (playlist.videos.length > 0) {
      onSelectVideo(playlist.videos[0].videoId, playlist.videos);
    }
  };

  const handlePlayShuffle = () => {
    if (playlist.videos.length > 0) {
      if (onPlayShuffle) {
        onPlayShuffle(playlist.videos);
      } else {
        const shuffled = [...playlist.videos].sort(() => Math.random() - 0.5);
        onSelectVideo(shuffled[0].videoId, shuffled);
      }
    }
  };

  const handleSharePlaylist = () => {
    const url = `https://www.youtube.com/playlist?list=${playlist.playlistId}`;
    onShare(url, playlist.title);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-zen-card hover:bg-zen-surface border border-zen-border rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <div className="text-xs text-slate-400 font-medium">
          Playlist • {playlist.videos.length} vidéo{playlist.videos.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Playlist Hero Banner Card */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-zen-card via-brand/10 to-zen-card border border-zen-border rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 z-10">
          {/* Cover Thumbnail / Icon */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-zen-surface border border-zen-border/80 shrink-0 shadow-lg group">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={playlist.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand">
                <ListMusic className="w-12 h-12" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
              <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                <Layers className="w-3 h-3 text-brand" />
                {playlist.videos.length}
              </span>
            </div>
          </div>

          {/* Title & Info */}
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/15 border border-brand/30 text-brand text-[10px] font-bold uppercase tracking-wider w-fit">
              <ListMusic className="w-3 h-3" />
              <span>Playlist complète</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight line-clamp-2">
              {playlist.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400">
              {playlist.author && (
                <button
                  type="button"
                  onClick={() => {
                    if (onChannelClick && playlist.authorId) {
                      onChannelClick(playlist.authorId, playlist.author);
                    }
                  }}
                  className={`flex items-center gap-1.5 font-semibold text-slate-300 ${
                    onChannelClick && playlist.authorId
                      ? 'hover:text-brand transition-colors cursor-pointer underline-offset-2 hover:underline'
                      : ''
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{playlist.author}</span>
                </button>
              )}

              <span>•</span>
              <span className="text-slate-300 font-medium">
                {playlist.videos.length} vidéo{playlist.videos.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 z-10 w-full sm:w-auto">
          {/* Play All button */}
          {playlist.videos.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-600 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-brand/30 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Tout lire</span>
            </button>
          )}

          {/* Shuffle button */}
          {playlist.videos.length > 0 && (
            <button
              onClick={handlePlayShuffle}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-zen-surface hover:bg-zen-card text-slate-200 hover:text-white border border-zen-border hover:border-brand/40 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
              title="Lire en mode aléatoire"
            >
              <Shuffle className="w-4 h-4 text-brand" />
              <span>Aléatoire</span>
            </button>
          )}

          {/* Favorite button */}
          <button
            onClick={() => onToggleFavoritePlaylist(playlist)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
              isFavorite
                ? 'bg-brand text-white border-brand shadow-lg shadow-brand/25 hover:bg-brand-600'
                : 'bg-zen-surface hover:bg-brand/10 text-slate-200 border-zen-border hover:border-brand/40 hover:text-white'
            }`}
            title={isFavorite ? 'Retirer des favoris' : 'Enregistrer cette playlist en favoris'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-white' : 'text-brand'}`} />
            <span>{isFavorite ? 'Enregistrée' : 'Mettre en favoris'}</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleSharePlaylist}
            className="p-3 bg-zen-surface hover:bg-zen-card text-slate-300 hover:text-white border border-zen-border rounded-2xl transition-colors cursor-pointer"
            title="Partager le lien de la playlist"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      {playlist.videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 bg-zen-card/40 rounded-3xl border border-zen-border/40">
          <ListMusic className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-300">
            Aucune vidéo trouvée dans cette playlist.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {playlist.videos.map((video, idx) => (
            <div key={video.videoId || idx} className="relative">
              {/* Index track badge */}
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-slate-300 border border-white/10 shadow-md pointer-events-none">
                #{idx + 1}
              </div>

              <VideoCard
                video={video}
                onSelectVideo={(id) => onSelectVideo(id, playlist.videos.slice(idx))}
                onChannelClick={onChannelClick}
                isFavorite={favorites.includes(video.videoId)}
                onToggleFavorite={onToggleFavoriteVideo}
                onShare={onShare}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
