import React from 'react';
import { Clock, Play, Trash2, RotateCcw } from 'lucide-react';
import { WatchHistoryItem } from '../types';
import { formatDuration, formatPublishedDate } from '../utils/formatters';

interface HistoryViewProps {
  history: WatchHistoryItem[];
  onSelectVideo: (videoId: string, seekTime?: number) => void;
  onRemoveItem: (videoId: string) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectVideo,
  onRemoveItem,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-zen-card/40 border border-zen-border/40 my-6 animate-fade-in">
        <div className="p-4 rounded-2xl bg-zen-surface text-slate-400 mb-4">
          <Clock className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Historique vide</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Les vidéos que vous visionnez sur ZenTube apparaîtront ici avec la progression exacte mémorisée.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zen-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand/10 text-brand">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Historique de visionnage</h2>
            <p className="text-xs text-slate-400">
              {history.length} vidéo{history.length > 1 ? 's' : ''} visionnée{history.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Effacer l'historique</span>
        </button>
      </div>

      {/* History Items List */}
      <div className="flex flex-col gap-3">
        {history.map((item) => {
          const progress = Math.min(Math.max(item.progressPercent || 0, 0), 100);

          return (
            <div
              key={item.videoId}
              onClick={() => onSelectVideo(item.videoId, item.currentTime)}
              className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-2xl bg-zen-card/50 hover:bg-zen-card border border-zen-border/40 hover:border-zen-border transition-all cursor-pointer"
            >
              {/* Thumbnail with progress bar */}
              <div className="relative aspect-video w-full sm:w-56 rounded-xl overflow-hidden bg-zen-surface shrink-0">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-slate-100 text-xs font-mono font-medium backdrop-blur-sm">
                  {formatDuration(item.lengthSeconds)}
                </div>

                {/* Progress bar line at bottom of thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div
                    style={{ width: `${progress}%` }}
                    className="h-full bg-brand shadow-[0_0_8px_rgba(255,0,51,0.8)]"
                  />
                </div>

                {/* Hover Play Button */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="flex flex-col justify-between flex-1 min-w-0 w-full gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1">{item.author}</div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zen-border/30 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="text-brand font-medium">
                      Progression : {formatDuration(item.currentTime)} / {formatDuration(item.lengthSeconds)} ({Math.round(progress)}%)
                    </span>
                    <span>•</span>
                    <span>Vu {formatPublishedDate(item.watchedAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVideo(item.videoId, item.currentTime);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-lg font-semibold transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reprendre
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.videoId);
                      }}
                      title="Supprimer de l'historique"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-zen-surface transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
