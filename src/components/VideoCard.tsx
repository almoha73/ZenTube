import React, { useState } from 'react';
import { Play, Heart, Share2, Check, Radio } from 'lucide-react';
import { InvidiousVideoSummary } from '../types';
import { formatDuration, formatPublishedDate, formatViews, getBestThumbnailUrl } from '../utils/formatters';

interface VideoCardProps {
  video: InvidiousVideoSummary;
  onSelectVideo: (videoId: string) => void;
  onChannelClick?: (authorId: string, authorName: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (video: InvidiousVideoSummary) => void;
  onShare?: (videoId: string, title: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onSelectVideo,
  onChannelClick,
  isFavorite = false,
  onToggleFavorite,
  onShare,
}) => {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  const thumbnailUrl = imgError
    ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
    : getBestThumbnailUrl(video.videoThumbnails, video.videoId);

  const authorAvatar =
    video.authorThumbnails && video.authorThumbnails.length > 0
      ? video.authorThumbnails[video.authorThumbnails.length - 1].url
      : null;

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(video.videoId, video.title);
    } else {
      navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.videoId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(video);
    }
  };

  const handleChannelSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChannelClick) {
      onChannelClick(video.authorId || video.author, video.author);
    }
  };

  return (
    <div
      onClick={() => onSelectVideo(video.videoId)}
      className="group relative flex flex-col gap-3 rounded-2xl p-2.5 bg-zen-card/60 hover:bg-zen-card border border-zen-border/40 hover:border-zen-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zen-surface">
        <img
          src={thumbnailUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Dark gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          {/* Centered glowing play button */}
          <div className="w-12 h-12 rounded-full bg-brand/90 text-white flex items-center justify-center shadow-lg shadow-brand/40 scale-75 group-hover:scale-100 transition-all duration-300">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Duration / Live Badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
          {video.liveNow ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand text-white text-[11px] font-bold uppercase tracking-wider animate-pulse">
              <Radio className="w-3 h-3" />
              Direct
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-black/85 text-slate-100 text-xs font-mono font-medium backdrop-blur-sm shadow-md">
              {formatDuration(video.lengthSeconds)}
            </span>
          )}
        </div>

        {/* Quick action overlay buttons on top right */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFavClick}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className={`p-2 rounded-xl backdrop-blur-md transition-colors shadow-lg cursor-pointer ${
                isFavorite
                  ? 'bg-brand text-white'
                  : 'bg-black/70 hover:bg-black text-slate-200 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={handleShareClick}
            title="Copier le lien"
            className="p-2 rounded-xl bg-black/70 hover:bg-black text-slate-200 hover:text-white backdrop-blur-md transition-colors shadow-lg cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Video Details section */}
      <div className="flex gap-3 px-1">
        {/* Author Avatar or Initial (Clickable) */}
        <div
          onClick={handleChannelSelect}
          title={`Voir la chaîne de ${video.author}`}
          className="shrink-0 mt-0.5 hover:opacity-80 transition-opacity hover:scale-105 transform duration-200"
        >
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt=""
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover bg-zen-surface border border-zen-border hover:border-brand"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-zen-surface border border-zen-border hover:border-brand flex items-center justify-center font-bold text-xs text-brand">
              {video.author?.charAt(0)?.toUpperCase() || 'Y'}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-col min-w-0 flex-1">
          <h3
            className="text-sm font-semibold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-2 leading-snug"
            title={video.title}
          >
            {video.title}
          </h3>

          <div
            onClick={handleChannelSelect}
            title={`Voir la chaîne de ${video.author}`}
            className="text-xs text-slate-400 mt-1 truncate hover:text-brand hover:underline cursor-pointer transition-colors"
          >
            {video.author}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <span>{formatViews(video.viewCount)}</span>
            <span>•</span>
            <span>{formatPublishedDate(video.published, video.publishedText)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
