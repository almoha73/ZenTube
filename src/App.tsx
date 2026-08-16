import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Flame,
  Heart,
  Clock,
  Share2,
  Check,
  ShieldCheck,
  Zap,
  Radio,
  Lock,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Header } from './components/Header';
import { CategoryPills } from './components/CategoryPills';
import { SearchFilterBar } from './components/SearchFilterBar';
import { VideoGrid } from './components/VideoGrid';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoDetails } from './components/VideoDetails';
import { FavoritesView } from './components/FavoritesView';
import { HistoryView } from './components/HistoryView';
import { ChannelView } from './components/ChannelView';
import { InstanceModal } from './components/InstanceModal';
import { PlayerSkeleton } from './components/Skeletons';
import { ToastContainer, ToastMessage } from './components/Toast';
import { useInvidious } from './hooks/useInvidious';
import { useLocalStorage } from './hooks/useLocalStorage';
import { FavoriteItem, InvidiousVideoSummary, WatchHistoryItem } from './types';
import { getBestThumbnailUrl } from './utils/formatters';

export function App() {
  const {
    currentInstance,
    latency,
    activeCategory,
    searchQuery,
    searchDate,
    setSearchDate,
    searchSortBy,
    setSearchSortBy,
    searchContinuationToken,
    isLoadingMoreSearch,
    loadMoreSearchResults,
    searchCorrection,
    videos,
    isLoadingVideos,
    videosError,
    selectedVideoId,
    videoDetails,
    isLoadingDetails,
    detailsError,
    selectedChannelId,
    channelData,
    isLoadingChannel,
    comments,
    isLoadingComments,
    playVideo,
    closeVideo,
    openChannel,
    closeChannel,
    handleSearch,
    handleSelectCategory,
    switchInstance,
    retryFetchVideos,
  } = useInvidious();

  // Local Storage States
  const [favorites, setFavorites] = useLocalStorage<FavoriteItem[]>('zentube_favorites', []);
  const [history, setHistory] = useLocalStorage<WatchHistoryItem[]>('zentube_history', []);
  const [subscriptions, setSubscriptions] = useLocalStorage<string[]>('zentube_subscriptions', []);
  const [isAutoplay, setIsAutoplay] = useLocalStorage<boolean>('zentube_autoplay', true);

  // Playback Queue & UI state
  const [activeQueue, setActiveQueue] = useState<InvidiousVideoSummary[]>([]);
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [resumeTime, setResumeTime] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add toast helper
  const addToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handler to play video with optional seek time and active queue context
  const handlePlayVideo = useCallback(
    (videoId: string, seek = 0, queueContext?: InvidiousVideoSummary[]) => {
      if (queueContext && queueContext.length > 0) {
        setActiveQueue(queueContext);
      } else if (videos.length > 0 && activeQueue.length === 0) {
        setActiveQueue(videos);
      }

      if (seek === 0) {
        const existing = history.find((h) => h.videoId === videoId);
        if (existing && existing.currentTime > 5 && existing.progressPercent < 95) {
          setResumeTime(existing.currentTime);
        } else {
          setResumeTime(0);
        }
      } else {
        setResumeTime(seek);
      }
      playVideo(videoId);
    },
    [history, playVideo, videos, activeQueue]
  );

  // Compute Next and Previous Video based on active context
  const nextVideo: InvidiousVideoSummary | undefined = useMemo(() => {
    if (!selectedVideoId) return undefined;

    // 1. Check in activeQueue first
    const queueIdx = activeQueue.findIndex((v) => v.videoId === selectedVideoId);
    if (queueIdx !== -1 && queueIdx + 1 < activeQueue.length) {
      return activeQueue[queueIdx + 1];
    }

    // 2. Check in recommended videos
    if (videoDetails?.recommendedVideos && videoDetails.recommendedVideos.length > 0) {
      return videoDetails.recommendedVideos[0];
    }

    // 3. Check in main videos list
    const gridIdx = videos.findIndex((v) => v.videoId === selectedVideoId);
    if (gridIdx !== -1 && gridIdx + 1 < videos.length) {
      return videos[gridIdx + 1];
    }

    return undefined;
  }, [selectedVideoId, activeQueue, videoDetails, videos]);

  const prevVideo: InvidiousVideoSummary | undefined = useMemo(() => {
    if (!selectedVideoId) return undefined;

    // 1. Check in activeQueue
    const queueIdx = activeQueue.findIndex((v) => v.videoId === selectedVideoId);
    if (queueIdx > 0) {
      return activeQueue[queueIdx - 1];
    }

    // 2. Check in watch history
    const histIdx = history.findIndex((h) => h.videoId === selectedVideoId);
    if (histIdx !== -1 && histIdx + 1 < history.length) {
      const hItem = history[histIdx + 1];
      return {
        videoId: hItem.videoId,
        title: hItem.title,
        author: hItem.author,
        authorId: hItem.authorId,
        videoThumbnails: [{ url: hItem.thumbnailUrl, quality: 'medium', width: 320, height: 180 }],
        viewCount: 0,
        published: 0,
        publishedText: '',
        lengthSeconds: hItem.lengthSeconds,
      };
    }

    return undefined;
  }, [selectedVideoId, activeQueue, history]);

  // Next / Previous / Autoplay Handlers
  const handleNextVideo = useCallback(() => {
    if (nextVideo) {
      handlePlayVideo(nextVideo.videoId);
      addToast('info', `Morceau suivant : ${nextVideo.title}`);
    }
  }, [nextVideo, handlePlayVideo, addToast]);

  const handlePreviousVideo = useCallback(() => {
    if (prevVideo) {
      handlePlayVideo(prevVideo.videoId);
      addToast('info', `Morceau précédent : ${prevVideo.title}`);
    }
  }, [prevVideo, handlePlayVideo, addToast]);

  const handleVideoEnd = useCallback(() => {
    if (isAutoplay && nextVideo) {
      handlePlayVideo(nextVideo.videoId);
      addToast('info', `Lecture auto : ${nextVideo.title}`);
    }
  }, [isAutoplay, nextVideo, handlePlayVideo, addToast]);

  // Toggle Favorite
  const handleToggleFavorite = useCallback(
    (video: InvidiousVideoSummary) => {
      const exists = favorites.some((f) => f.videoId === video.videoId);
      if (exists) {
        setFavorites((prev) => prev.filter((f) => f.videoId !== video.videoId));
        addToast('info', 'Vidéo retirée de vos favoris.');
      } else {
        const newItem: FavoriteItem = {
          videoId: video.videoId,
          title: video.title,
          author: video.author,
          authorId: video.authorId,
          thumbnailUrl: getBestThumbnailUrl(video.videoThumbnails, video.videoId),
          lengthSeconds: video.lengthSeconds,
          savedAt: Date.now(),
          viewCount: video.viewCount,
        };
        setFavorites((prev) => [newItem, ...prev]);
        addToast('success', 'Vidéo ajoutée à vos favoris !');
      }
    },
    [favorites, setFavorites, addToast]
  );

  // Remove Favorite
  const handleRemoveFavorite = useCallback(
    (videoId: string) => {
      setFavorites((prev) => prev.filter((f) => f.videoId !== videoId));
      addToast('info', 'Vidéo retirée de vos favoris.');
    },
    [setFavorites, addToast]
  );

  // Toggle local Channel Subscription
  const handleToggleSubscribe = useCallback(
    (authorId: string, authorName: string) => {
      const isSub = subscriptions.includes(authorId);
      if (isSub) {
        setSubscriptions((prev) => prev.filter((id) => id !== authorId));
        addToast('info', `Désabonné de ${authorName}.`);
      } else {
        setSubscriptions((prev) => [...prev, authorId]);
        addToast('success', `Abonné à ${authorName} (sauvegardé localement) !`);
      }
    },
    [subscriptions, setSubscriptions, addToast]
  );

  // Share handler
  const handleShare = useCallback(
    (idOrUrl: string, title: string) => {
      const url = idOrUrl.startsWith('http')
        ? idOrUrl
        : `https://www.youtube.com/watch?v=${idOrUrl}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        addToast('success', 'Lien copié dans le presse-papier !');
      } else {
        window.open(url, '_blank');
      }
    },
    [addToast]
  );

  // Progress update when watching video to persist in history
  const handleProgressUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (!videoDetails) return;

      const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.videoId !== videoDetails.videoId);
        const updatedItem: WatchHistoryItem = {
          videoId: videoDetails.videoId,
          title: videoDetails.title,
          author: videoDetails.author,
          authorId: videoDetails.authorId,
          thumbnailUrl: getBestThumbnailUrl(videoDetails.videoThumbnails, videoDetails.videoId),
          lengthSeconds: duration || videoDetails.lengthSeconds,
          watchedAt: Date.now(),
          currentTime: Math.floor(currentTime),
          progressPercent,
        };
        return [updatedItem, ...filtered.slice(0, 49)];
      });
    },
    [videoDetails, setHistory]
  );

  // Auto record history when videoDetails finishes loading
  useEffect(() => {
    if (videoDetails) {
      setHistory((prev) => {
        const existing = prev.find((item) => item.videoId === videoDetails.videoId);
        const filtered = prev.filter((item) => item.videoId !== videoDetails.videoId);
        const item: WatchHistoryItem = {
          videoId: videoDetails.videoId,
          title: videoDetails.title,
          author: videoDetails.author,
          authorId: videoDetails.authorId,
          thumbnailUrl: getBestThumbnailUrl(videoDetails.videoThumbnails, videoDetails.videoId),
          lengthSeconds: videoDetails.lengthSeconds || 0,
          watchedAt: Date.now(),
          currentTime: existing?.currentTime || 0,
          progressPercent: existing?.progressPercent || 0,
        };
        return [item, ...filtered.slice(0, 49)];
      });
    }
  }, [videoDetails, setHistory]);

  // Remove single history item
  const handleRemoveHistoryItem = useCallback(
    (videoId: string) => {
      setHistory((prev) => prev.filter((h) => h.videoId !== videoId));
      addToast('info', 'Élément retiré de votre historique.');
    },
    [setHistory, addToast]
  );

  // Clear all history
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    addToast('info', 'Historique de visionnage effacé.');
  }, [setHistory, addToast]);

  // Clear all favorites
  const handleClearFavorites = useCallback(() => {
    setFavorites([]);
    addToast('info', 'Tous vos favoris ont été effacés.');
  }, [setFavorites, addToast]);

  const favoriteIds = favorites.map((f) => f.videoId);
  const isCurrentVideoFavorite = selectedVideoId ? favoriteIds.includes(selectedVideoId) : false;
  const isCurrentAuthorSubscribed = videoDetails?.authorId
    ? subscriptions.includes(videoDetails.authorId)
    : false;

  return (
    <div className="min-h-screen bg-zen-bg text-zen-text flex flex-col selection:bg-brand/30 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Header */}
      <Header
        onSearch={handleSearch}
        onPlayVideo={(id) => handlePlayVideo(id)}
        onSelectCategory={handleSelectCategory}
        activeCategory={activeCategory}
        currentInstance={currentInstance}
        latency={latency}
        onOpenInstanceModal={() => setIsInstanceModalOpen(true)}
        favoritesCount={favorites.length}
        initialQuery={searchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* 1. Selected Video Player View */}
        {selectedVideoId ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Back button */}
            <div className="flex items-center justify-between">
              <button
                onClick={closeVideo}
                className="flex items-center gap-2 px-3.5 py-2 bg-zen-card hover:bg-zen-surface border border-zen-border rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour aux vidéos</span>
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Flux direct Invidious sécurisé sans pub</span>
              </div>
            </div>

            {/* Player or Skeleton */}
            {isLoadingDetails ? (
              <PlayerSkeleton />
            ) : detailsError ? (
              <div className="p-8 rounded-3xl bg-zen-card border border-zen-border text-center flex flex-col items-center gap-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
                  <Flame className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Impossible de charger cette vidéo</h3>
                <p className="text-xs text-slate-400 max-w-md">{detailsError}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePlayVideo(selectedVideoId)}
                    className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={() => setIsInstanceModalOpen(true)}
                    className="px-4 py-2 bg-zen-surface border border-zen-border text-white text-xs font-semibold rounded-xl"
                  >
                    Changer d'instance
                  </button>
                </div>
              </div>
            ) : videoDetails ? (
              <div className="flex flex-col gap-6">
                {/* HTML5 Video Player */}
                <VideoPlayer
                  video={videoDetails}
                  initialTime={resumeTime}
                  onTimeUpdate={handleProgressUpdate}
                  onVideoEnd={handleVideoEnd}
                  isTheaterMode={isTheaterMode}
                  onToggleTheater={() => setIsTheaterMode(!isTheaterMode)}
                  onSwitchInstance={() => setIsInstanceModalOpen(true)}
                  currentInstance={currentInstance}
                  onNextVideo={handleNextVideo}
                  onPreviousVideo={handlePreviousVideo}
                  hasNextVideo={!!nextVideo}
                  hasPreviousVideo={!!prevVideo}
                  isAutoplay={isAutoplay}
                  onToggleAutoplay={() => {
                    const nextVal = !isAutoplay;
                    setIsAutoplay(nextVal);
                    addToast(
                      'info',
                      nextVal
                        ? 'Lecture automatique activée (enchaîne au morceau suivant)'
                        : 'Lecture automatique désactivée'
                    );
                  }}
                />

                {/* Details & Comments & Related */}
                <VideoDetails
                  video={videoDetails}
                  comments={comments}
                  isLoadingComments={isLoadingComments}
                  onSelectVideo={(id) => handlePlayVideo(id)}
                  onChannelClick={(chId, chName) => openChannel(chId, chName)}
                  isFavorite={isCurrentVideoFavorite}
                  onToggleFavorite={handleToggleFavorite}
                  isSubscribed={isCurrentAuthorSubscribed}
                  onToggleSubscribe={handleToggleSubscribe}
                  onShare={handleShare}
                  nextVideo={nextVideo}
                />
              </div>
            ) : null}
          </div>
        ) : selectedChannelId ? (
          /* 2. Channel View */
          <ChannelView
            channel={channelData}
            isLoading={isLoadingChannel}
            onSelectVideo={(id, queue) => handlePlayVideo(id, 0, queue)}
            onBack={closeChannel}
            isSubscribed={subscriptions.includes(selectedChannelId)}
            onToggleSubscribe={handleToggleSubscribe}
            onShare={handleShare}
            favorites={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          /* 3. Grid Views (Trending / Categories / Favorites / History) */
          <div className="flex flex-col gap-6">
            {/* Category Filter Pills & Search status */}
            <div className="flex flex-col gap-3">
              {searchQuery ? (
                <div className="flex flex-col gap-3 pb-2 border-b border-zen-border/60">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                      Résultats pour « <span className="text-brand">{searchQuery}</span> »
                    </h2>
                    <button
                      onClick={() => handleSearch('')}
                      className="text-xs text-slate-400 hover:text-brand transition-colors cursor-pointer"
                    >
                      Effacer la recherche
                    </button>
                  </div>

                  {/* Search Filter Bar (Période, Tri, etc.) */}
                  <SearchFilterBar
                    dateFilter={searchDate}
                    onDateChange={setSearchDate}
                    sortFilter={searchSortBy}
                    onSortChange={setSearchSortBy}
                    resultCount={videos.length}
                  />

                  {/* Spelling correction banner */}
                  {searchCorrection && (
                    <div className="flex items-center justify-between p-3.5 bg-brand/10 border border-brand/25 rounded-2xl animate-fade-in text-xs sm:text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-brand text-white shrink-0 shadow-sm">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          {searchCorrection.type === 'showing_results_for' ? (
                            <span>
                              Résultats affichés pour{' '}
                              <strong
                                onClick={() => handleSearch(searchCorrection.correctedQuery)}
                                className="text-white font-bold underline cursor-pointer hover:text-brand transition-colors"
                              >
                                {searchCorrection.correctedQuery}
                              </strong>
                              {searchCorrection.originalQuery && (
                                <span className="text-slate-400 ml-1.5">
                                  (au lieu de « {searchCorrection.originalQuery} »)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span>
                              Essayez avec cette orthographe :{' '}
                              <button
                                onClick={() => handleSearch(searchCorrection.correctedQuery)}
                                className="text-brand hover:text-brand-300 font-bold underline ml-1 cursor-pointer"
                              >
                                {searchCorrection.correctedQuery}
                              </button>
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSearch(searchCorrection.correctedQuery)}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-md shadow-brand/20 ml-2"
                      >
                        <span>Rechercher</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <CategoryPills
                  activeCategory={activeCategory}
                  onSelectCategory={handleSelectCategory}
                  favoritesCount={favorites.length}
                />
              )}
            </div>

            {/* View Switching */}
            {activeCategory === 'favorites' && !searchQuery ? (
              <FavoritesView
                favorites={favorites}
                onSelectVideo={(id) => handlePlayVideo(id)}
                onRemoveFavorite={handleRemoveFavorite}
                onClearAll={handleClearFavorites}
              />
            ) : activeCategory === 'history' && !searchQuery ? (
              <HistoryView
                history={history}
                onSelectVideo={(id, time) => handlePlayVideo(id, time)}
                onRemoveItem={handleRemoveHistoryItem}
                onClearHistory={handleClearHistory}
              />
            ) : (
              <VideoGrid
                videos={videos}
                isLoading={isLoadingVideos}
                error={videosError}
                onSelectVideo={(id) => handlePlayVideo(id)}
                onChannelClick={(chId, chName) => openChannel(chId, chName)}
                onRetry={retryFetchVideos}
                onOpenInstanceModal={() => setIsInstanceModalOpen(true)}
                favorites={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onShare={handleShare}
                hasMore={!!searchContinuationToken && !!searchQuery}
                isLoadingMore={isLoadingMoreSearch}
                onLoadMore={loadMoreSearchResults}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zen-border/40 bg-zen-card/40 py-8 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-brand flex items-center justify-center text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">ZenTube</span>
            <span>— Lecteur YouTube Libre, Épuré & Sans Publicité via Invidious.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsInstanceModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 text-brand" />
              Instance : {currentInstance.replace(/^https?:\/\//, '')}
            </button>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Vie privée garantie</span>
          </div>
        </div>
      </footer>

      {/* Invidious Instance Switcher & Ping Modal */}
      <InstanceModal
        isOpen={isInstanceModalOpen}
        onClose={() => setIsInstanceModalOpen(false)}
        currentInstance={currentInstance}
        onSelectInstance={(inst) => {
          switchInstance(inst);
          addToast('success', `Instance basculée sur ${inst.replace(/^https?:\/\//, '')}`);
        }}
      />
    </div>
  );
}

export default App;
