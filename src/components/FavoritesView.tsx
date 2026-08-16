import React, { useState } from 'react';
import { Heart, Search, Trash2, Play, VideoOff, Clock } from 'lucide-react';
import { FavoriteItem } from '../types';
import { formatDuration, formatPublishedDate } from '../utils/formatters';

interface FavoritesViewProps {
  favorites: FavoriteItem[];
  onSelectVideo: (videoId: string) => void;
  onRemoveFavorite: (videoId: string) => void;
  onClearAll: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  onSelectVideo,
  onRemoveFavorite,
  onClearAll,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredFavorites = favorites.filter(
    (item) =>
      item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-zen-card/40 border border-zen-border/40 my-6 animate-fade-in">
        <div className="p-4 rounded-2xl bg-brand/10 text-brand mb-4 ring-1 ring-brand/20">
          <Heart className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Aucun favori enregistré</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Cliquez sur le bouton « Favoris » ou sur le cœur d'une vidéo pour la sauvegarder localement et la retrouver ici à tout moment.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header with Title, Search and Clear */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zen-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand/10 text-brand">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mes Favoris</h2>
            <p className="text-xs text-slate-400">
              {favorites.length} vidéo{favorites.length > 1 ? 's' : ''} enregistrée{favorites.length > 1 ? 's' : ''} sur cet appareil
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search inside favorites */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrer mes favoris..."
              className="w-full pl-9 pr-3 py-2 bg-zen-card border border-zen-border rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand"
            />
          </div>

          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tout effacer</span>
          </button>
        </div>
      </div>

      {/* Grid of Favorites */}
      {filteredFavorites.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          Aucun résultat pour « {filterQuery} ».
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredFavorites.map((item) => (
            <div
              key={item.videoId}
              onClick={() => onSelectVideo(item.videoId)}
              className="group flex flex-col gap-3 rounded-2xl p-2.5 bg-zen-card/60 hover:bg-zen-card border border-zen-border/40 hover:border-zen-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zen-surface">
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

                {/* Hover Play Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(item.videoId);
                  }}
                  title="Supprimer des favoris"
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Info */}
              <div className="flex flex-col px-1">
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <span className="text-xs text-slate-400 mt-1">{item.author}</span>
                <span className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Ajouté {formatPublishedDate(item.savedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
