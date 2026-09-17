import React from 'react';
import { Play, Heart, Clock, Compass, Shield, Sparkles } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { StatusBadge } from './StatusBadge';
import { VideoCategory } from '../types';

interface HeaderProps {
  onSearch: (query: string) => void;
  onPlayVideo: (videoId: string) => void;
  onOpenPlaylist?: (playlistId: string) => void;
  onSelectCategory: (cat: VideoCategory) => void;
  activeCategory: VideoCategory;
  currentInstance: string;
  latency: number;
  onOpenInstanceModal: () => void;
  favoritesCount?: number;
  initialQuery?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onPlayVideo,
  onOpenPlaylist,
  onSelectCategory,
  activeCategory,
  currentInstance,
  latency,
  onOpenInstanceModal,
  favoritesCount = 0,
  initialQuery = '',
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-zen-bg/90 backdrop-blur-xl border-b border-zen-border/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div
          onClick={() => onSelectCategory('trending')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-brand to-rose-600 flex items-center justify-center shadow-lg shadow-brand/30 group-hover:scale-105 transition-transform duration-200">
            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-zen-bg" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white font-sans">
                Zen<span className="text-brand">Tube</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-brand/10 text-brand border border-brand/20">
                0 Pub
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search Bar with YouTube link detection */}
        <div className="flex-1 max-w-xl mx-auto hidden sm:block">
          <SearchBar
            onSearch={onSearch}
            onPlayVideo={onPlayVideo}
            onOpenPlaylist={onOpenPlaylist}
            initialQuery={initialQuery}
          />
        </div>

        {/* Right: Quick Tabs + Instance Status Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Nav for desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onSelectCategory('trending')}
              className={`p-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'trending'
                  ? 'bg-zen-surface text-white border border-zen-border'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-zen-surface/60'
              }`}
              title="Tendances"
            >
              <Compass className="w-4 h-4" />
              <span>Explorer</span>
            </button>

            <button
              onClick={() => onSelectCategory('favorites')}
              className={`p-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer relative ${
                activeCategory === 'favorites'
                  ? 'bg-zen-surface text-white border border-zen-border'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-zen-surface/60'
              }`}
              title="Mes Favoris"
            >
              <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'text-brand' : ''}`} />
              <span>Favoris</span>
              {favoritesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-brand absolute top-1 right-1" />
              )}
            </button>

            <button
              onClick={() => onSelectCategory('history')}
              className={`p-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'history'
                  ? 'bg-zen-surface text-white border border-zen-border'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-zen-surface/60'
              }`}
              title="Historique"
            >
              <Clock className="w-4 h-4" />
              <span>Historique</span>
            </button>
          </nav>

          {/* Instance Status Badge */}
          <StatusBadge
            instance={currentInstance}
            latency={latency}
            onClick={onOpenInstanceModal}
          />
        </div>
      </div>

      {/* Mobile Search Bar Row (visible on small mobile screens) */}
      <div className="sm:hidden px-4 pb-3 pt-1 border-t border-zen-border/40">
        <SearchBar
          onSearch={onSearch}
          onPlayVideo={onPlayVideo}
          initialQuery={initialQuery}
        />
      </div>
    </header>
  );
};
