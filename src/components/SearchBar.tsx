import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  History,
  Trash2,
  ArrowRight,
  Play,
  Link as LinkIcon,
  Sparkles,
  TrendingUp,
  CornerDownLeft,
} from 'lucide-react';
import { extractYouTubeVideoId } from '../utils/formatters';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SearchHistoryItem } from '../types';
import { invidiousApi } from '../services/invidiousApi';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onPlayVideo: (videoId: string) => void;
  initialQuery?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onPlayVideo,
  initialQuery = '',
}) => {
  const [input, setInput] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>(
    'zentube_search_history',
    []
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detectedVideoId = extractYouTubeVideoId(input);

  useEffect(() => {
    setInput(initialQuery);
  }, [initialQuery]);

  // Fetch live suggestions when input changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = input.trim();
    if (!trimmed || detectedVideoId) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    setIsLoadingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const list = await invidiousApi.getSearchSuggestions(trimmed);
        setSuggestions(list.slice(0, 8));
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 120);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [input, detectedVideoId]);

  // Handle outside click to close suggestions/history dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const executeSearch = useCallback(
    (query: string) => {
      const q = query.trim();
      if (!q) return;

      const extractedId = extractYouTubeVideoId(q);
      if (extractedId) {
        onPlayVideo(extractedId);
        setIsFocused(false);
        setSuggestions([]);
        return;
      }

      // Add to search history
      setSearchHistory((prev) => {
        const filtered = prev.filter((item) => item.query.toLowerCase() !== q.toLowerCase());
        return [{ query: q, timestamp: Date.now() }, ...filtered.slice(0, 9)];
      });

      setInput(q);
      onSearch(q);
      setIsFocused(false);
      setSuggestions([]);
    },
    [onPlayVideo, onSearch, setSearchHistory]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      executeSearch(suggestions[selectedIndex]);
    } else {
      executeSearch(input);
    }
  };

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isFocused) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setSelectedIndex(-1);
    }
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    setSearchHistory((prev) => prev.filter((item) => item.query !== query));
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
  };

  // Check if first suggestion is an orthographic correction
  const topSuggestion = suggestions[0];
  const isSpellingCorrection =
    topSuggestion &&
    topSuggestion.toLowerCase() !== input.toLowerCase().trim() &&
    input.trim().length > 3;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* Search input container */}
        <div
          className={`relative flex items-center w-full bg-zen-surface border rounded-2xl transition-all duration-200 shadow-inner ${
            isFocused
              ? 'border-brand ring-2 ring-brand/20 bg-zen-card'
              : 'border-zen-border hover:border-slate-600'
          }`}
        >
          {/* Left Icon */}
          <div className="pl-4 pr-2 text-slate-400">
            {detectedVideoId ? (
              <LinkIcon className="w-4 h-4 text-brand animate-pulse" />
            ) : (
              <Search className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSelectedIndex(-1);
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher (ex: Paul McCartney) ou coller un lien YouTube..."
            className="w-full py-2.5 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Clear button */}
          {input.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setInput('');
                setSuggestions([]);
                setSelectedIndex(-1);
              }}
              className="p-1.5 mr-1 text-slate-400 hover:text-white rounded-lg hover:bg-zen-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Direct URL play pill badge */}
          {detectedVideoId && (
            <button
              type="button"
              onClick={() => {
                onPlayVideo(detectedVideoId);
                setIsFocused(false);
              }}
              className="hidden sm:flex items-center gap-1.5 mr-2 px-2.5 py-1 bg-brand text-white rounded-xl text-xs font-semibold hover:bg-brand-600 transition-colors shadow-md"
            >
              <Play className="w-3 h-3 fill-current" />
              Lire directement
            </button>
          )}

          {/* Submit Search Button */}
          <button
            type="submit"
            className="px-4 py-2.5 bg-zen-surface hover:bg-brand text-slate-300 hover:text-white border-l border-zen-border rounded-r-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center cursor-pointer"
            title={detectedVideoId ? 'Lire la vidéo' : 'Rechercher'}
          >
            {detectedVideoId ? (
              <Play className="w-4 h-4 fill-current text-brand group-hover:text-white" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Dropdown for Live Suggestions & Search History */}
      {isFocused && !detectedVideoId && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-zen-card/95 backdrop-blur-xl border border-zen-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-up">
          {/* Live Suggestions Section */}
          {suggestions.length > 0 ? (
            <div className="flex flex-col py-1.5">
              {/* Spelling Suggestion Banner if detected */}
              {isSpellingCorrection && (
                <div
                  onClick={() => executeSearch(topSuggestion)}
                  className="mx-2 mb-1.5 p-2.5 bg-brand/10 hover:bg-brand/20 border border-brand/25 rounded-xl flex items-center justify-between cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 text-brand">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>
                      Orthographe suggérée : <strong className="text-white underline">{topSuggestion}</strong>
                    </span>
                  </div>
                  <CornerDownLeft className="w-3.5 h-3.5 text-brand" />
                </div>
              )}

              <div className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-brand" />
                Suggestions
              </div>

              {suggestions.map((item, idx) => {
                const isSelected = selectedIndex === idx;

                return (
                  <div
                    key={item}
                    onClick={() => executeSearch(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand/15 text-white font-medium pl-5'
                        : 'text-slate-300 hover:bg-zen-surface hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Search className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-brand' : 'text-slate-500'}`} />
                      <span className="truncate">{item}</span>
                    </div>

                    <CornerDownLeft className={`w-3 h-3 text-slate-500 ${isSelected ? 'opacity-100 text-brand' : 'opacity-0'}`} />
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Recent Searches Section */}
          {searchHistory.length > 0 && (
            <div className={`${suggestions.length > 0 ? 'border-t border-zen-border/60' : ''}`}>
              <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Recherches récentes
                </span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  Effacer tout
                </button>
              </div>

              <div className="flex flex-col py-1 max-h-48 overflow-y-auto">
                {searchHistory.slice(0, 6).map((item) => (
                  <div
                    key={item.query}
                    onClick={() => executeSearch(item.query)}
                    className="flex items-center justify-between px-4 py-2 hover:bg-zen-surface text-sm text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{item.query}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistoryItem(e, item.query)}
                      title="Supprimer de l'historique"
                      className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-zen-hover transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
