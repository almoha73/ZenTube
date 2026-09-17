import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  Share2,
  Users,
  Video,
  ListMusic,
  Play,
  Search,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Layers,
  X,
  Heart,
  Shuffle,
} from 'lucide-react';
import { ChannelData, ChannelPlaylist, InvidiousVideoSummary, PlaylistDetail } from '../types';
import { VideoCard } from './VideoCard';
import { VideoGridSkeleton } from './Skeletons';
import { invidiousApi } from '../services/invidiousApi';

interface ChannelViewProps {
  channel: ChannelData | null;
  isLoading: boolean;
  onSelectVideo: (videoId: string, queue?: InvidiousVideoSummary[]) => void;
  onBack: () => void;
  isSubscribed: boolean;
  onToggleSubscribe: (authorId: string, authorName: string, authorThumbnail?: string) => void;
  onShare: (title: string, url: string) => void;
  favorites: string[];
  onToggleFavorite: (video: InvidiousVideoSummary) => void;
  favoritePlaylistIds?: string[];
  onToggleFavoritePlaylist?: (playlist: ChannelPlaylist | PlaylistDetail) => void;
}

export const ChannelView: React.FC<ChannelViewProps> = ({
  channel,
  isLoading,
  onSelectVideo,
  onBack,
  isSubscribed,
  onToggleSubscribe,
  onShare,
  favorites,
  onToggleFavorite,
  favoritePlaylistIds = [],
  onToggleFavoritePlaylist,
}) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'playlists'>('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Video catalog & pagination state
  const [videosList, setVideosList] = useState<InvidiousVideoSummary[]>([]);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Server-side channel search results
  const [channelSearchResults, setChannelSearchResults] = useState<InvidiousVideoSummary[]>([]);
  const [isSearchingChannel, setIsSearchingChannel] = useState(false);

  // Playlists state
  const [playlists, setPlaylists] = useState<ChannelPlaylist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistDetail | null>(null);
  const [isLoadingPlaylistVideos, setIsLoadingPlaylistVideos] = useState(false);

  useEffect(() => {
    if (channel) {
      setVideosList(channel.videos || []);
      setContinuationToken(channel.continuationToken || null);
      setBannerError(false);
      setAvatarError(false);
      setSelectedPlaylist(null);
      setActiveTab('videos');
      setSearchQuery('');
      setActiveSearchQuery('');
      setChannelSearchResults([]);

      // Fetch channel playlists in background
      if (channel.authorId) {
        setIsLoadingPlaylists(true);
        invidiousApi
          .getChannelPlaylists(channel.authorId)
          .then((p) => {
            setPlaylists(p);
            setIsLoadingPlaylists(false);
          })
          .catch(() => {
            setPlaylists([]);
            setIsLoadingPlaylists(false);
          });
      }
    }
  }, [channel]);

  // Handle Channel Search (deep search across the entire channel)
  const handlePerformChannelSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      setActiveSearchQuery(trimmed);

      if (!trimmed || !channel) {
        setChannelSearchResults([]);
        return;
      }

      setIsSearchingChannel(true);
      try {
        const results = await invidiousApi.searchChannel(channel.authorId, trimmed);
        setChannelSearchResults(results);
      } catch (err) {
        console.warn('Channel search error:', err);
        // Local fallback filter
        const localMatches = (channel.videos || []).filter((v) =>
          v.title.toLowerCase().includes(trimmed.toLowerCase())
        );
        setChannelSearchResults(localMatches);
      } finally {
        setIsSearchingChannel(false);
      }
    },
    [channel]
  );

  // Debounced live search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() !== activeSearchQuery) {
        handlePerformChannelSearch(searchQuery);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, activeSearchQuery, handlePerformChannelSearch]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchQuery('');
    setChannelSearchResults([]);
  };

  const handleLoadMore = async () => {
    if (!continuationToken || isLoadingMore || !channel) return;

    setIsLoadingMore(true);
    try {
      const res = await invidiousApi.loadMoreChannelVideos(
        continuationToken,
        channel.apiKey,
        channel.author,
        channel.authorId
      );

      if (res.videos.length > 0) {
        setVideosList((prev) => [...prev, ...res.videos]);
        setContinuationToken(res.nextContinuation);
      } else {
        setContinuationToken(null);
      }
    } catch {
      setContinuationToken(null);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleOpenPlaylist = async (playlist: ChannelPlaylist) => {
    setIsLoadingPlaylistVideos(true);
    try {
      const details = await invidiousApi.getPlaylistDetails(playlist.playlistId);
      setSelectedPlaylist(details);
    } catch {
      if (playlist.firstVideoId) {
        onSelectVideo(playlist.firstVideoId);
      }
    } finally {
      setIsLoadingPlaylistVideos(false);
    }
  };

  // Automatic Infinite Scroll for Channel Videos
  const channelSentinelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!continuationToken || !handleLoadMore || isLoadingMore || activeTab !== 'videos' || activeSearchQuery)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && continuationToken && !isLoadingMore) {
          handleLoadMore();
        }
      },
      {
        rootMargin: '500px',
        threshold: 0.05,
      }
    );

    const currentSentinel = channelSentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [continuationToken, isLoadingMore, activeTab, activeSearchQuery, handleLoadMore]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        {/* Banner Skeleton */}
        <div className="w-full h-40 sm:h-56 bg-zen-card/80 rounded-3xl animate-shimmer" />

        {/* Header Skeleton */}
        <div className="flex items-center gap-4 px-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zen-card animate-shimmer shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="w-48 h-6 bg-zen-card rounded-lg animate-shimmer" />
            <div className="w-32 h-4 bg-zen-card rounded-lg animate-shimmer" />
          </div>
        </div>

        {/* Videos Grid Skeleton */}
        <VideoGridSkeleton count={8} />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="p-4 rounded-3xl bg-zen-card border border-zen-border text-slate-400">
          <Info className="w-8 h-8 text-brand" />
        </div>
        <h3 className="text-xl font-bold text-white">Chaîne introuvable</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Impossible de charger les données de cette chaîne.
        </p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-zen-surface hover:bg-brand text-white rounded-2xl text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
      </div>
    );
  }

  const initial = (channel.author || 'C').charAt(0).toUpperCase();

  // Matching playlists when search is active
  const matchingPlaylists = playlists.filter((p) =>
    p.title.toLowerCase().includes(activeSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={selectedPlaylist ? () => setSelectedPlaylist(null) : onBack}
          className="flex items-center gap-2 px-4 py-2 bg-zen-surface hover:bg-zen-card border border-zen-border hover:border-slate-600 text-slate-200 hover:text-white rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{selectedPlaylist ? 'Retour aux playlists' : 'Retour'}</span>
        </button>

        <button
          onClick={() =>
            onShare(
              channel.author,
              `https://www.youtube.com/channel/${channel.authorId}`
            )
          }
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zen-surface hover:bg-zen-card border border-zen-border text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Partager la chaîne</span>
        </button>
      </div>

      {/* Channel Hero Header Card (shown when not viewing a single playlist) */}
      {!selectedPlaylist && (
        <div className="relative overflow-hidden bg-zen-card/80 backdrop-blur-xl border border-zen-border rounded-3xl shadow-2xl">
          {/* Banner image or stylized gradient */}
          <div className="relative w-full h-36 sm:h-52 bg-gradient-to-r from-slate-950 via-rose-950/30 to-slate-950 overflow-hidden">
            {channel.authorBanner && !bannerError ? (
              <img
                src={channel.authorBanner}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setBannerError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-30 bg-gradient-to-br from-brand/20 via-zen-card to-slate-900">
                <Sparkles className="w-24 h-24 text-brand/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zen-card via-transparent to-black/30" />
          </div>

          {/* Channel Details Section */}
          <div className="relative px-6 pb-6 pt-0 -mt-12 sm:-mt-16 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative group shrink-0">
                {channel.authorThumbnail && !avatarError ? (
                  <img
                    src={channel.authorThumbnail}
                    alt={channel.author}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-zen-card bg-zen-surface shadow-2xl"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-zen-card bg-gradient-to-tr from-brand to-rose-600 shadow-2xl flex items-center justify-center text-3xl font-black text-white">
                    {initial}
                  </div>
                )}
              </div>

              {/* Title & Stats */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {channel.author}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {channel.authorHandle && (
                    <span className="font-mono text-slate-300">
                      {channel.authorHandle}
                    </span>
                  )}
                  {channel.subCountText && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-brand" />
                      {channel.subCountText}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-400">
                    <Video className="w-3.5 h-3.5 text-slate-500" />
                    {videosList.length} vidéos
                  </span>
                  {playlists.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <ListMusic className="w-3.5 h-3.5 text-slate-500" />
                      {playlists.length} playlists
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto pt-2 sm:pt-0">
              <button
                onClick={() => onToggleSubscribe(channel.authorId, channel.author, channel.authorThumbnail)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg ${
                  isSubscribed
                    ? 'bg-zen-surface hover:bg-rose-500/20 text-slate-200 hover:text-rose-400 border border-zen-border hover:border-rose-500/30'
                    : 'bg-brand hover:bg-brand-600 text-white shadow-brand/25'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Abonné</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>S'abonner</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expandable Channel Description */}
          {channel.description && (
            <div className="px-6 pb-6 pt-2 border-t border-zen-border/40">
              <div
                className={`text-xs text-slate-400 leading-relaxed transition-all duration-300 whitespace-pre-line ${
                  showFullDesc ? '' : 'line-clamp-2'
                }`}
              >
                {channel.description}
              </div>

              {channel.description.length > 120 && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="mt-1 text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{showFullDesc ? 'Moins' : 'Plus de détails'}</span>
                  {showFullDesc ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* If a single playlist is selected, display the playlist view */}
      {selectedPlaylist ? (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Playlist Banner Header */}
          <div className="p-6 bg-gradient-to-r from-zen-card via-brand/10 to-zen-card border border-zen-border rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand/20 text-brand flex items-center justify-center shadow-inner">
                <ListMusic className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-white">{selectedPlaylist.title}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Par {selectedPlaylist.author || channel.author}</span>
                  <span>•</span>
                  <span>{selectedPlaylist.videos.length} vidéos</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {onToggleFavoritePlaylist && (
                <button
                  type="button"
                  onClick={() => onToggleFavoritePlaylist(selectedPlaylist)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                    favoritePlaylistIds.includes(selectedPlaylist.playlistId)
                      ? 'bg-brand text-white border-brand shadow-lg shadow-brand/25 hover:bg-brand-600'
                      : 'bg-zen-surface hover:bg-brand/15 text-slate-200 border-zen-border hover:border-brand/40 hover:text-white'
                  }`}
                  title={
                    favoritePlaylistIds.includes(selectedPlaylist.playlistId)
                      ? 'Retirer de mes favoris'
                      : 'Mettre cette playlist en favoris'
                  }
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favoritePlaylistIds.includes(selectedPlaylist.playlistId)
                        ? 'fill-current text-white'
                        : 'text-brand'
                    }`}
                  />
                  <span>
                    {favoritePlaylistIds.includes(selectedPlaylist.playlistId)
                      ? 'Enregistrée'
                      : 'Mettre en favoris'}
                  </span>
                </button>
              )}

              {selectedPlaylist.videos.length > 0 && (
                <>
                  <button
                    onClick={() => onSelectVideo(selectedPlaylist.videos[0].videoId, selectedPlaylist.videos)}
                    className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-600 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-brand/25 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Tout lire</span>
                  </button>

                  <button
                    onClick={() => {
                      const shuffled = [...selectedPlaylist.videos].sort(() => Math.random() - 0.5);
                      onSelectVideo(shuffled[0].videoId, shuffled);
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-zen-surface hover:bg-zen-card border border-zen-border hover:border-brand/40 text-slate-200 hover:text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    title="Lire en mode aléatoire"
                  >
                    <Shuffle className="w-4 h-4 text-brand" />
                    <span>Aléatoire</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Playlist Videos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {selectedPlaylist.videos.map((video) => (
              <VideoCard
                key={video.videoId}
                video={video}
                onSelectVideo={(id) => onSelectVideo(id, selectedPlaylist.videos)}
                onChannelClick={() => {}}
                isFavorite={favorites.includes(video.videoId)}
                onToggleFavorite={onToggleFavorite}
                onShare={onShare}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Channel Navigation Tabs & Grids */
        <div className="flex flex-col gap-6">
          {/* Tabs bar (Vidéos | Playlists) + Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zen-border/60">
            {/* Tabs Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('videos');
                  handleClearSearch();
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'videos' && !activeSearchQuery
                    ? 'bg-brand text-white shadow-md shadow-brand/25'
                    : 'bg-zen-card hover:bg-zen-surface text-slate-300 hover:text-white border border-zen-border'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Vidéos</span>
                <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.5 rounded-full bg-black/20">
                  {videosList.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('playlists');
                  handleClearSearch();
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'playlists' && !activeSearchQuery
                    ? 'bg-brand text-white shadow-md shadow-brand/25'
                    : 'bg-zen-card hover:bg-zen-surface text-slate-300 hover:text-white border border-zen-border'
                }`}
              >
                <ListMusic className="w-4 h-4" />
                <span>Playlists</span>
                {playlists.length > 0 && (
                  <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.5 rounded-full bg-black/20">
                    {playlists.length}
                  </span>
                )}
              </button>
            </div>

            {/* Dedicated Channel Deep Search input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePerformChannelSearch(searchQuery);
                  }
                }}
                placeholder={`Rechercher dans ${channel.author}...`}
                className="w-full pl-9 pr-9 py-2.5 bg-zen-card/80 border border-zen-border rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE CHANNEL SEARCH VIEW */}
          {activeSearchQuery ? (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex items-center justify-between bg-zen-card/70 border border-zen-border p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <Search className="w-4 h-4 text-brand" />
                  <span>
                    Résultats pour « <strong className="text-white font-bold">{activeSearchQuery}</strong> » dans {channel.author}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({channelSearchResults.length} vidéos trouvées)
                  </span>
                </div>
                <button
                  onClick={handleClearSearch}
                  className="text-xs text-brand hover:text-brand-300 font-semibold cursor-pointer"
                >
                  Effacer le filtre
                </button>
              </div>

              {/* Matching Playlists section if any */}
              {matchingPlaylists.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-brand" />
                    <span>Playlists correspondantes ({matchingPlaylists.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {matchingPlaylists.map((playlist) => (
                      <div
                        key={playlist.playlistId}
                        onClick={() => handleOpenPlaylist(playlist)}
                        className="group flex items-center gap-3 p-3 bg-zen-card border border-zen-border hover:border-brand rounded-2xl cursor-pointer transition-all hover:shadow-lg"
                      >
                        <div className="relative w-16 h-12 rounded-xl bg-zen-surface overflow-hidden shrink-0">
                          {playlist.thumbnailUrl ? (
                            <img
                              src={playlist.thumbnailUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <ListMusic className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-white truncate group-hover:text-brand">
                            {playlist.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {playlist.videoCount || 'Playlist'}
                          </span>
                        </div>
                        {onToggleFavoritePlaylist && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavoritePlaylist(playlist);
                            }}
                            title={
                              favoritePlaylistIds.includes(playlist.playlistId)
                                ? 'Retirer des favoris'
                                : 'Mettre en favoris'
                            }
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                              favoritePlaylistIds.includes(playlist.playlistId)
                                ? 'text-brand bg-brand/10'
                                : 'text-slate-400 hover:text-white hover:bg-zen-surface'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                favoritePlaylistIds.includes(playlist.playlistId) ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search results videos grid */}
              {isSearchingChannel ? (
                <VideoGridSkeleton count={8} />
              ) : channelSearchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {channelSearchResults.map((video) => (
                    <VideoCard
                      key={video.videoId}
                      video={video}
                      onSelectVideo={(id) => onSelectVideo(id, channelSearchResults)}
                      onChannelClick={() => {}}
                      isFavorite={favorites.includes(video.videoId)}
                      onToggleFavorite={onToggleFavorite}
                      onShare={onShare}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 bg-zen-card/40 rounded-3xl border border-zen-border/40">
                  <Video className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-sm font-medium text-slate-300">
                    Aucune vidéo trouvée pour « {activeSearchQuery} » sur cette chaîne.
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="mt-3 px-4 py-2 bg-zen-surface hover:bg-brand text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Voir toutes les vidéos
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'videos' ? (
            /* TAB 1: ALL VIDEOS WITH PAGINATION */
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {videosList.map((video) => (
                  <VideoCard
                    key={video.videoId}
                    video={video}
                    onSelectVideo={(id) => onSelectVideo(id, videosList)}
                    onChannelClick={() => {}}
                    isFavorite={favorites.includes(video.videoId)}
                    onToggleFavorite={onToggleFavorite}
                    onShare={onShare}
                  />
                ))}
              </div>

              {/* Infinite Scroll Sentinel & Loading Indicator */}
              <div ref={channelSentinelRef} className="flex justify-center items-center pt-4 pb-10">
                {continuationToken ? (
                  isLoadingMore ? (
                    <div className="flex items-center gap-3 px-6 py-3 bg-zen-card/90 backdrop-blur-md border border-zen-border rounded-2xl shadow-xl animate-fade-in">
                      <Loader2 className="w-5 h-5 animate-spin text-brand" />
                      <span className="text-xs font-semibold text-slate-200">
                        Chargement automatique de la suite (+30)...
                      </span>
                    </div>
                  ) : (
                    <div className="h-6 w-full flex justify-center items-center text-xs text-slate-600 opacity-40">
                      <span>Faites défiler pour charger plus de vidéos</span>
                    </div>
                  )
                ) : videosList.length > 0 ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-zen-card/50 border border-zen-border/50 rounded-2xl text-xs font-semibold text-slate-400">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Toutes les vidéos ont été chargées ({videosList.length} au total)</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            /* TAB 2: PLAYLISTS */
            <div className="flex flex-col gap-6 animate-fade-in">
              {isLoadingPlaylists ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="h-64 rounded-2xl bg-zen-card/80 animate-shimmer"
                    />
                  ))}
                </div>
              ) : playlists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {playlists.map((playlist) => {
                    const isFav = favoritePlaylistIds.includes(playlist.playlistId);
                    return (
                      <div
                        key={playlist.playlistId}
                        onClick={() => handleOpenPlaylist(playlist)}
                        className="group flex flex-col bg-zen-card border border-zen-border hover:border-brand/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative"
                      >
                        {/* Playlist Thumbnail with Stacking Effect */}
                        <div className="relative aspect-video w-full bg-zen-surface overflow-hidden">
                          {playlist.thumbnailUrl ? (
                            <img
                              src={playlist.thumbnailUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                              <ListMusic className="w-12 h-12" />
                            </div>
                          )}

                          {/* Stacking layer badge overlay */}
                          <div className="absolute right-2 bottom-2 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 border border-white/10 shadow-lg">
                            <Layers className="w-3.5 h-3.5 text-brand" />
                            <span>{playlist.videoCount || 'Playlist'}</span>
                          </div>

                          {/* Hover Overlay "Ouvrir la playlist" */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[2px]">
                            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/50">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                            <span>Ouvrir la playlist</span>
                          </div>

                          {/* Quick Favorite Button */}
                          {onToggleFavoritePlaylist && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavoritePlaylist(playlist);
                              }}
                              title={isFav ? 'Retirer des favoris' : 'Mettre cette playlist en favoris'}
                              className={`absolute top-2 right-2 p-2 rounded-xl backdrop-blur-md transition-all z-10 cursor-pointer ${
                                isFav
                                  ? 'bg-brand text-white shadow-md shadow-brand/30'
                                  : 'bg-black/70 hover:bg-brand text-slate-200 hover:text-white opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Playlist Info */}
                        <div className="p-4 flex flex-col gap-1.5 flex-1 justify-between">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 group-hover:text-brand transition-colors">
                            {playlist.title}
                          </h3>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>{channel.author}</span>
                            <span className="text-brand font-semibold">Afficher →</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 bg-zen-card/40 rounded-3xl border border-zen-border/40">
                  <ListMusic className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-sm font-medium text-slate-300">
                    Aucune playlist disponible pour cette chaîne.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
