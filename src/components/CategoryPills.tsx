import React from 'react';
import { Flame, Music, Gamepad2, Newspaper, Film, Heart, Clock } from 'lucide-react';
import { VideoCategory } from '../types';

interface CategoryPillsProps {
  activeCategory: VideoCategory;
  onSelectCategory: (cat: VideoCategory) => void;
  favoritesCount?: number;
}

interface CategoryOption {
  id: VideoCategory;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'trending', label: 'Tendances', icon: <Flame className="w-4 h-4" /> },
  { id: 'music', label: 'Musique', icon: <Music className="w-4 h-4" /> },
  { id: 'gaming', label: 'Gaming', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'news', label: 'Actualités', icon: <Newspaper className="w-4 h-4" /> },
  { id: 'movies', label: 'Cinéma', icon: <Film className="w-4 h-4" /> },
  { id: 'favorites', label: 'Mes Favoris', icon: <Heart className="w-4 h-4" /> },
  { id: 'history', label: 'Historique', icon: <Clock className="w-4 h-4" /> },
];

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  activeCategory,
  onSelectCategory,
  favoritesCount = 0,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-none no-scrollbar">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-brand text-white shadow-lg shadow-brand/25 scale-[1.02]'
                : 'bg-zen-card hover:bg-zen-surface text-slate-300 hover:text-white border border-zen-border/60 hover:border-slate-600'
            }`}
          >
            <span className={isActive ? 'text-white' : 'text-slate-400'}>{cat.icon}</span>
            <span>{cat.label}</span>
            {cat.id === 'favorites' && favoritesCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-brand/20 text-brand'
                }`}
              >
                {favoritesCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
