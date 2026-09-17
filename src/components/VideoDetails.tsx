import React, { useState } from 'react';
import {
  Heart,
  Share2,
  Download,
  ThumbsUp,
  Bell,
  BellRing,
  ChevronDown,
  ChevronUp,
  Check,
  Calendar,
  Eye,
  ExternalLink,
  Sparkles,
  SkipForward,
} from 'lucide-react';
import { InvidiousComment, InvidiousVideoDetail, InvidiousVideoSummary } from '../types';
import {
  formatDuration,
  formatPublishedDate,
  formatSubscribers,
  formatViews,
  getBestThumbnailUrl,
} from '../utils/formatters';
import { CommentsList } from './CommentsList';
import { VideoCard } from './VideoCard';
import { DownloadModal } from './DownloadModal';

interface VideoDetailsProps {
  video: InvidiousVideoDetail;
  comments: InvidiousComment[];
  isLoadingComments: boolean;
  onSelectVideo: (videoId: string) => void;
  onChannelClick?: (authorId: string, authorName: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (video: InvidiousVideoSummary) => void;
  isSubscribed: boolean;
  onToggleSubscribe: (authorId: string, authorName: string, authorThumbnail?: string) => void;
  onShare: (videoId: string, title: string) => void;
  nextVideo?: InvidiousVideoSummary | null;
}

export const VideoDetails: React.FC<VideoDetailsProps> = ({
  video,
  comments,
  isLoadingComments,
  onSelectVideo,
  onChannelClick,
  isFavorite,
  onToggleFavorite,
  isSubscribed,
  onToggleSubscribe,
  onShare,
  nextVideo,
}) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const authorAvatar =
    video.authorThumbnail ||
    (video.authorThumbnails && video.authorThumbnails.length > 0
      ? video.authorThumbnails[video.authorThumbnails.length - 1].url
      : null);

  const handleChannelClick = () => {
    if (onChannelClick) {
      onChannelClick(video.authorId || video.author, video.author);
    }
  };

  // Convert description text with clickable timestamps or URLs
  const renderFormattedDescription = (text: string | undefined) => {
    if (!text) return 'Aucune description fournie.';

    // Split text by URLs and Timestamps (e.g. 01:23 or 1:23:45)
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      // Find URLs and timestamps
      const tokens = line.split(/(https?:\/\/[^\s]+|\b\d{1,2}:\d{2}(?::\d{2})?\b)/g);

      return (
        <p key={lineIdx} className="min-h-[1.2rem] leading-relaxed">
          {tokens.map((token, tokenIdx) => {
            if (/^https?:\/\//.test(token)) {
              return (
                <a
                  key={tokenIdx}
                  href={token}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline inline-flex items-center gap-0.5 break-all"
                >
                  {token}
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              );
            }
            if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(token)) {
              return (
                <span
                  key={tokenIdx}
                  className="text-sky-400 font-mono font-semibold hover:underline cursor-pointer bg-sky-400/10 px-1 py-0.5 rounded"
                >
                  {token}
                </span>
              );
            }
            return token;
          })}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-slate-100 leading-tight">
        {video.title}
      </h1>

      {/* Channel Header & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zen-border/60">
        {/* Left: Channel Info & Subscribe button */}
        <div className="flex items-center gap-3.5">
          <div
            onClick={handleChannelClick}
            title={`Voir la chaîne de ${video.author}`}
            className="cursor-pointer hover:opacity-85 transition-opacity hover:scale-105 transform duration-200"
          >
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt=""
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover bg-zen-surface border border-zen-border hover:border-brand shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zen-surface border border-zen-border hover:border-brand flex items-center justify-center font-bold text-base text-brand">
                {video.author?.charAt(0)?.toUpperCase() || 'Y'}
              </div>
            )}
          </div>

          <div
            onClick={handleChannelClick}
            title={`Voir la chaîne de ${video.author}`}
            className="flex flex-col cursor-pointer group"
          >
            <h2 className="text-base font-bold text-white group-hover:text-brand transition-colors leading-snug">
              {video.author}
            </h2>
            <span className="text-xs text-slate-400 group-hover:text-slate-300">
              {video.subCountText ? formatSubscribers(video.subCountText) : 'Voir la chaîne'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onToggleSubscribe(video.authorId || video.author, video.author, authorAvatar || undefined)}
            className={`ml-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-md cursor-pointer ${
              isSubscribed
                ? 'bg-zen-surface hover:bg-zen-hover text-slate-300 border border-zen-border'
                : 'bg-white hover:bg-slate-200 text-black shadow-white/10'
            }`}
          >
            {isSubscribed ? (
              <>
                <BellRing className="w-4 h-4 text-brand" />
                <span>Abonné</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>S'abonner</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Actions (Likes, Favorites, Share, Download) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Likes badge */}
          {video.likeCount !== undefined && video.likeCount > 0 && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-zen-card border border-zen-border/60 rounded-xl text-xs font-semibold text-slate-200">
              <ThumbsUp className="w-4 h-4 text-brand" />
              <span>{formatViews(video.likeCount).replace('vues', '').trim()}</span>
            </div>
          )}

          {/* Favorite toggle */}
          <button
            type="button"
            onClick={() => onToggleFavorite(video)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isFavorite
                ? 'bg-brand text-white shadow-lg shadow-brand/25'
                : 'bg-zen-card hover:bg-zen-surface text-slate-200 border border-zen-border/60 hover:border-slate-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            <span>{isFavorite ? 'Enregistré' : 'Favoris'}</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => onShare(video.videoId, video.title)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zen-card hover:bg-zen-surface text-slate-200 border border-zen-border/60 hover:border-slate-600 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager</span>
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={() => setDownloadModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zen-card hover:bg-zen-surface text-slate-200 border border-zen-border/60 hover:border-slate-600 transition-colors cursor-pointer"
            title="Télécharger la vidéo ou l'audio MP3"
          >
            <Download className="w-4 h-4 text-brand" />
            <span className="hidden sm:inline">Télécharger</span>
          </button>
        </div>
      </div>

      {/* Description Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zen-card/60 border border-zen-border/60 flex flex-col gap-3 text-sm">
        {/* Meta Header */}
        <div className="flex items-center gap-4 flex-wrap text-xs font-semibold text-slate-300 pb-2 border-b border-zen-border/40">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-brand" />
            <span>{formatViews(video.viewCount)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Publié le {formatPublishedDate(video.published, video.publishedText)}</span>
          </div>

          {video.genre && (
            <span className="px-2 py-0.5 rounded-md bg-zen-surface text-slate-400 text-[11px]">
              {video.genre}
            </span>
          )}
        </div>

        {/* Description Body */}
        <div
          className={`text-slate-300 text-xs sm:text-sm font-normal overflow-hidden transition-all ${
            isDescExpanded ? 'max-h-none' : 'max-h-24 line-clamp-3'
          }`}
        >
          {renderFormattedDescription(video.description)}
        </div>

        {/* Expand / Collapse button */}
        <button
          onClick={() => setIsDescExpanded(!isDescExpanded)}
          className="self-start text-xs font-bold text-brand hover:text-brand-400 flex items-center gap-1 mt-1 transition-colors cursor-pointer"
        >
          <span>{isDescExpanded ? 'Moins afficher' : 'Afficher plus'}</span>
          {isDescExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Up Next Banner if available */}
      {nextVideo && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-zen-card via-brand/10 to-zen-card border border-zen-border shadow-lg animate-fade-in">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              onClick={() => onSelectVideo(nextVideo.videoId)}
              className="relative w-24 h-14 rounded-xl overflow-hidden bg-zen-surface shrink-0 cursor-pointer group"
            >
              <img
                src={getBestThumbnailUrl(nextVideo.videoThumbnails, nextVideo.videoId)}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              {nextVideo.lengthSeconds > 0 && (
                <div className="absolute right-1 bottom-1 px-1 rounded bg-black/80 text-[10px] font-mono text-white">
                  {formatDuration(nextVideo.lengthSeconds)}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>À suivre ensuite</span>
              </div>
              <span
                onClick={() => onSelectVideo(nextVideo.videoId)}
                className="text-xs sm:text-sm font-bold text-white truncate hover:text-brand transition-colors cursor-pointer"
              >
                {nextVideo.title}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {nextVideo.author}
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelectVideo(nextVideo.videoId)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand/25 shrink-0 cursor-pointer ml-3"
          >
            <span>Lire</span>
            <SkipForward className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      )}

      {/* Comments Section */}
      <CommentsList comments={comments} isLoading={isLoadingComments} />

      {/* Recommended / Related Videos Section */}
      {video.recommendedVideos && video.recommendedVideos.length > 0 && (
        <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-zen-border/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" />
            <h3 className="text-lg font-bold text-white">Vidéos recommandées</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {video.recommendedVideos.slice(0, 8).map((rec) => (
              <VideoCard
                key={rec.videoId}
                video={rec}
                onSelectVideo={onSelectVideo}
                onChannelClick={onChannelClick}
                isFavorite={false}
                onToggleFavorite={onToggleFavorite}
                onShare={onShare}
              />
            ))}
          </div>
        </div>
      )}

      {/* Download Modal */}
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        video={video}
      />
    </div>
  );
};
