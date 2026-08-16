import React, { useState } from 'react';
import { SlidersHorizontal, Calendar, ArrowUpDown, Check, X, RotateCcw } from 'lucide-react';
import { SearchDateFilter, SearchSortFilter } from '../types';

interface SearchFilterBarProps {
  dateFilter: SearchDateFilter;
  onDateChange: (date: SearchDateFilter) => void;
  sortFilter: SearchSortFilter;
  onSortChange: (sort: SearchSortFilter) => void;
  resultCount?: number;
}

const DATE_OPTIONS: { id: SearchDateFilter; label: string }[] = [
  { id: 'all', label: 'Toutes les dates' },
  { id: 'hour', label: 'Dernière heure' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: 'Cette semaine' },
  { id: 'month', label: 'Ce mois-ci' },
  { id: 'year', label: 'Cette année' },
];

const SORT_OPTIONS: { id: SearchSortFilter; label: string }[] = [
  { id: 'relevance', label: 'Pertinence' },
  { id: 'upload_date', label: 'Plus récentes' },
  { id: 'view_count', label: 'Nombre de vues' },
  { id: 'rating', label: 'Mieux notées' },
];

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  dateFilter,
  onDateChange,
  sortFilter,
  onSortChange,
  resultCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = dateFilter !== 'all' || sortFilter !== 'relevance';

  const resetFilters = () => {
    onDateChange('all');
    onSortChange('relevance');
  };

  const getActiveSummary = () => {
    const parts = [];
    const dOpt = DATE_OPTIONS.find((d) => d.id === dateFilter);
    if (dOpt && dateFilter !== 'all') parts.push(dOpt.label);
    const sOpt = SORT_OPTIONS.find((s) => s.id === sortFilter);
    if (sOpt && sortFilter !== 'relevance') parts.push(sOpt.label);
    return parts.join(' • ');
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Top Filter Trigger Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
              isOpen || hasActiveFilters
                ? 'bg-brand/15 text-brand border-brand/40 shadow-sm'
                : 'bg-zen-card hover:bg-zen-surface text-slate-300 border-zen-border'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtres de recherche</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            )}
          </button>

          {/* Quick Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand font-medium hidden sm:inline bg-brand/10 px-2.5 py-1 rounded-lg border border-brand/20">
                {getActiveSummary()}
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-zen-card hover:bg-zen-surface border border-zen-border rounded-lg transition-colors cursor-pointer"
                title="Réinitialiser les filtres"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Réinitialiser</span>
              </button>
            </div>
          )}
        </div>

        {typeof resultCount === 'number' && (
          <span className="text-xs text-slate-400 font-medium">
            {resultCount} vidéo{resultCount > 1 ? 's' : ''} trouvée{resultCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Expanded Filter Panel */}
      {isOpen && (
        <div className="p-4 bg-zen-card/80 backdrop-blur-md border border-zen-border rounded-2xl animate-slide-up grid grid-cols-1 md:grid-cols-2 gap-4 shadow-xl">
          {/* 1. Date d'ajout / Période */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              <span>Date d'ajout (Période)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DATE_OPTIONS.map((opt) => {
                const isSelected = dateFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onDateChange(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-brand text-white border-brand shadow-md shadow-brand/20 font-semibold'
                        : 'bg-zen-surface text-slate-300 hover:text-white hover:bg-zen-hover border-zen-border/60'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Trier par */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-brand" />
              <span>Trier par</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSortChange(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-brand text-white border-brand shadow-md shadow-brand/20 font-semibold'
                        : 'bg-zen-surface text-slate-300 hover:text-white hover:bg-zen-hover border-zen-border/60'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
