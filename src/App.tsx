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
  ListMusic,
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
import { PlaylistView } from './components/PlaylistView';
import { InstanceModal } from './components/InstanceModal';
import { PlayerSkeleton } from './components/Skeletons';
import { ToastContainer, ToastMessage } from './components/Toast';
import { useInvidious } from './hooks/useInvidious';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  ChannelPlaylist,
  FavoriteItem,
  FavoritePlaylistItem,
  InvidiousVideoSummary,
  PlaylistDetail,
  SubscriptionItem,
  WatchHistoryItem,
} from './types';
import { invidiousApi } from './services/invidiousApi';
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
  const [favoritePlaylists, setFavoritePlaylists] = useLocalStorage<FavoritePlaylistItem[]>(
    'zentube_favorite_playlists',
    []
  );
  const [history, setHistory] = useLocalStorage<WatchHistoryItem[]>('zentube_history', []);
  const [subscriptions, setSubscriptions] = useLocalStorage<SubscriptionItem[]>(
    'zentube_subscriptions',
    []
  );
  const [isAutoplay, setIsAutoplay] = useLocalStorage<boolean>('zentube_autoplay', true);
  const [isShuffle, setIsShuffle] = useLocalStorage<boolean>('zentube_shuffle', false);

  // Auto-migrate subscriptions if old format (string[]) was stored
  useEffect(() => {
    if (Array.isArray(subscriptions) && subscriptions.length > 0) {
      const hasOldFormat = subscriptions.some((s: any) => typeof s === 'string');
      if (hasOldFormat) {
        setSubscriptions((prev: any) =>
          prev.map((s: any) =>
            typeof s === 'string'
              ? { authorId: s, author: s, subscribedAt: Date.now() }
              : s
          )
        );
      }
    }
  }, [subscriptions, setSubscriptions]);

  // Helper to shuffle an array
  const shuffleArray = useCallback(<T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, []);

  // Playback Queue & UI state
  const [activeQueue, setActiveQueue] = useState<InvidiousVideoSummary[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistDetail | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
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

  // Toggle Shuffle
  const handleToggleShuffle = useCallback(() => {
    const nextVal = !isShuffle;
    setIsShuffle(nextVal);
    addToast(
      'info',
      nextVal
        ? 'Lecture aléatoire activée (les morceaux s’enchaînent au hasard)'
        : 'Lecture aléatoire désactivée'
    );
  }, [isShuffle, setIsShuffle, addToast]);

  // Next / Previous / Autoplay Handlers
  const handleNextVideo = useCallback(() => {
    if (isShuffle && activeQueue.length > 1) {
      const candidates = activeQueue.filter((v) => v.videoId !== selectedVideoId);
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        handlePlayVideo(pick.videoId, 0);
        addToast('info', `Aléatoire : ${pick.title}`);
        return;
      }
    }

    if (nextVideo) {
      handlePlayVideo(nextVideo.videoId);
      addToast('info', `Morceau suivant : ${nextVideo.title}`);
    }
  }, [isShuffle, activeQueue, selectedVideoId, nextVideo, handlePlayVideo, addToast]);

  const handlePreviousVideo = useCallback(() => {
    if (prevVideo) {
      handlePlayVideo(prevVideo.videoId);
      addToast('info', `Morceau précédent : ${prevVideo.title}`);
    }
  }, [prevVideo, handlePlayVideo, addToast]);

  const handleVideoEnd = useCallback(() => {
    if (isAutoplay) {
      if (isShuffle && activeQueue.length > 1) {
        const candidates = activeQueue.filter((v) => v.videoId !== selectedVideoId);
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          handlePlayVideo(pick.videoId, 0);
          addToast('info', `Lecture aléatoire auto : ${pick.title}`);
          return;
        }
      }

      if (nextVideo) {
        handlePlayVideo(nextVideo.videoId);
        addToast('info', `Lecture auto : ${nextVideo.title}`);
      }
    }
  }, [isAutoplay, isShuffle, activeQueue, selectedVideoId, nextVideo, handlePlayVideo, addToast]);

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

  // Open Playlist handler
  const handleOpenPlaylist = useCallback(
    async (playlistId: string) => {
      setIsLoadingPlaylist(true);
      closeVideo();
      try {
        const details = await invidiousApi.getPlaylistDetails(playlistId);
        setSelectedPlaylist(details);
      } catch (e: any) {
        addToast(
          'error',
          `Erreur lors du chargement de la playlist : ${e?.message || 'inaccessible'}`
        );
      } finally {
        setIsLoadingPlaylist(false);
      }
    },
    [closeVideo, addToast]
  );

  const handleClosePlaylist = useCallback(() => {
    setSelectedPlaylist(null);
  }, []);

  // Play an entire playlist directly (starts playback with first video and sets active queue)
  const handlePlayPlaylist = useCallback(
    async (playlist: FavoritePlaylistItem) => {
      if (playlist.videos && playlist.videos.length > 0) {
        handlePlayVideo(playlist.videos[0].videoId, 0, playlist.videos);
        addToast('info', `Lecture de la playlist : ${playlist.title}`);
        return;
      }

      setIsLoadingPlaylist(true);
      try {
        const details = await invidiousApi.getPlaylistDetails(playlist.playlistId);
        setSelectedPlaylist(details);
        if (details.videos && details.videos.length > 0) {
          handlePlayVideo(details.videos[0].videoId, 0, details.videos);
          addToast('info', `Lecture de la playlist : ${playlist.title}`);
        } else {
          addToast('error', 'Cette playlist ne contient aucune vidéo.');
        }
      } catch (e: any) {
        addToast('error', `Impossible de lire la playlist : ${e?.message || 'erreur'}`);
      } finally {
        setIsLoadingPlaylist(false);
      }
    },
    [handlePlayVideo, addToast]
  );

  // Toggle Favorite Playlist
  const handleToggleFavoritePlaylist = useCallback(
    (playlist: ChannelPlaylist | PlaylistDetail | FavoritePlaylistItem) => {
      const exists = favoritePlaylists.some((p) => p.playlistId === playlist.playlistId);
      if (exists) {
        setFavoritePlaylists((prev) => prev.filter((p) => p.playlistId !== playlist.playlistId));
        addToast('info', 'Playlist retirée de vos favoris.');
      } else {
        const author =
          'author' in playlist && playlist.author
            ? playlist.author
            : channelData?.author || 'YouTube';
        const authorId =
          'authorId' in playlist && playlist.authorId
            ? playlist.authorId
            : channelData?.authorId;
        const pVideos = 'videos' in playlist ? playlist.videos : undefined;
        const videoCount =
          pVideos && pVideos.length > 0
            ? `${pVideos.length} vidéo${pVideos.length > 1 ? 's' : ''}`
            : playlist.videoCount || 'Playlist';
        const thumbnailUrl =
          playlist.thumbnailUrl ||
          (pVideos && pVideos[0]?.videoThumbnails?.[0]?.url) ||
          '';
        const firstVideoId =
          'firstVideoId' in playlist && playlist.firstVideoId
            ? playlist.firstVideoId
            : pVideos && pVideos[0]?.videoId
            ? pVideos[0].videoId
            : undefined;

        const newItem: FavoritePlaylistItem = {
          playlistId: playlist.playlistId,
          title: playlist.title || 'Playlist',
          author,
          authorId,
          thumbnailUrl,
          videoCount,
          savedAt: Date.now(),
          firstVideoId,
        };
        setFavoritePlaylists((prev) => [newItem, ...prev]);
        addToast('success', 'Playlist ajoutée à vos favoris !');
      }
    },
    [favoritePlaylists, setFavoritePlaylists, channelData, addToast]
  );

  // Remove Favorite Playlist
  const handleRemoveFavoritePlaylist = useCallback(
    (playlistId: string) => {
      setFavoritePlaylists((prev) => prev.filter((p) => p.playlistId !== playlistId));
      addToast('info', 'Playlist retirée de vos favoris.');
    },
    [setFavoritePlaylists, addToast]
  );

  // Clear all Favorite Playlists
  const handleClearFavoritePlaylists = useCallback(() => {
    setFavoritePlaylists([]);
    addToast('info', 'Toutes vos playlists favorites ont été effacées.');
  }, [setFavoritePlaylists, addToast]);

  // Play all favorite videos in shuffle mode
  const handlePlayShuffleVideos = useCallback(
    (favItems: FavoriteItem[]) => {
      if (favItems.length === 0) return;
      const summaries: InvidiousVideoSummary[] = favItems.map((item) => ({
        videoId: item.videoId,
        title: item.title,
        author: item.author,
        authorId: item.authorId,
        videoThumbnails: [{ url: item.thumbnailUrl, quality: 'medium', width: 320, height: 180 }],
        viewCount: item.viewCount || 0,
        published: 0,
        publishedText: '',
        lengthSeconds: item.lengthSeconds,
      }));
      const shuffled = shuffleArray(summaries);
      setIsShuffle(true);
      handlePlayVideo(shuffled[0].videoId, 0, shuffled);
      addToast('success', 'Lecture aléatoire de vos favoris lancée !');
    },
    [shuffleArray, handlePlayVideo, setIsShuffle, addToast]
  );

  // Play a playlist in shuffle mode
  const handlePlayShufflePlaylist = useCallback(
    async (playlistOrVideos: FavoritePlaylistItem | PlaylistDetail | InvidiousVideoSummary[]) => {
      setIsLoadingPlaylist(true);
      try {
        let vids: InvidiousVideoSummary[] = [];
        let title = 'Playlist';

        if (Array.isArray(playlistOrVideos)) {
          vids = playlistOrVideos;
        } else if ('videos' in playlistOrVideos && playlistOrVideos.videos && playlistOrVideos.videos.length > 0) {
          vids = playlistOrVideos.videos;
          title = playlistOrVideos.title;
        } else if ('playlistId' in playlistOrVideos) {
          title = playlistOrVideos.title;
          const details = await invidiousApi.getPlaylistDetails(playlistOrVideos.playlistId);
          vids = details.videos;
          setSelectedPlaylist(details);
        }

        if (vids.length > 0) {
          const shuffled = shuffleArray(vids);
          setIsShuffle(true);
          handlePlayVideo(shuffled[0].videoId, 0, shuffled);
          addToast('success', `Lecture aléatoire lancée : ${title}`);
        } else {
          addToast('error', 'Cette playlist ne contient aucune vidéo.');
        }
      } catch (e: any) {
        addToast('error', `Impossible de charger la playlist : ${e?.message || 'erreur'}`);
      } finally {
        setIsLoadingPlaylist(false);
      }
    },
    [shuffleArray, handlePlayVideo, setIsShuffle, addToast]
  );

  // Toggle local Channel Subscription
  const handleToggleSubscribe = useCallback(
    (authorId: string, authorName?: string, authorThumbnail?: string) => {
      const isSub = subscriptions.some((s) => (typeof s === 'string' ? s : s.authorId) === authorId);
      if (isSub) {
        setSubscriptions((prev) => prev.filter((s) => (typeof s === 'string' ? s : s.authorId) !== authorId));
        addToast('info', `Désabonné de ${authorName || 'la chaîne'}.`);
      } else {
        const newSub: SubscriptionItem = {
          authorId,
          author: authorName || authorId,
          authorThumbnail,
          subscribedAt: Date.now(),
        };
        setSubscriptions((prev) => [...prev, newSub]);
        addToast('success', `Abonné à ${authorName || authorId} (sauvegardé localement) !`);
      }
    },
    [subscriptions, setSubscriptions, addToast]
  );

  // Clear all subscriptions
  const handleClearSubscriptions = useCallback(() => {
    if (subscriptions.length === 0) return;
    if (confirm('Voulez-vous vraiment supprimer tous vos abonnements enregistrés ?')) {
      setSubscriptions([]);
      addToast('info', 'Tous les abonnements ont été supprimés.');
    }
  }, [subscriptions.length, setSubscriptions, addToast]);

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
    addToast('info', 'Toutes vos vidéos favorites ont été effacées.');
  }, [setFavorites, addToast]);

  // Export all favorites & playlists as JSON backup
  const handleExportData = useCallback(() => {
    const data = {
      app: 'ZenTube',
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites,
      favoritePlaylists,
      subscriptions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `zentube-favoris-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', 'Sauvegarde téléchargée avec succès !');
  }, [favorites, favoritePlaylists, subscriptions, addToast]);

  // Import favorites & playlists from JSON backup
  const handleImportData = useCallback(
    (imported: any) => {
      if (!imported || typeof imported !== 'object') {
        addToast('error', 'Fichier de sauvegarde invalide.');
        return;
      }

      let addedVideos = 0;
      let addedPlaylists = 0;

      // Handle raw array of videos or full backup object
      const importedVideos: FavoriteItem[] = Array.isArray(imported)
        ? imported
        : Array.isArray(imported.favorites)
        ? imported.favorites
        : [];

      const importedPlaylists: FavoritePlaylistItem[] = Array.isArray(imported.favoritePlaylists)
        ? imported.favoritePlaylists
        : [];

      if (importedVideos.length > 0) {
        setFavorites((prev) => {
          const existingIds = new Set(prev.map((item) => item.videoId));
          const newItems = importedVideos.filter(
            (item) => item && item.videoId && !existingIds.has(item.videoId)
          );
          addedVideos = newItems.length;
          return [...newItems, ...prev];
        });
      }

      if (importedPlaylists.length > 0) {
        setFavoritePlaylists((prev) => {
          const existingIds = new Set(prev.map((p) => p.playlistId));
          const newItems = importedPlaylists.filter(
            (p) => p && p.playlistId && !existingIds.has(p.playlistId)
          );
          addedPlaylists = newItems.length;
          return [...newItems, ...prev];
        });
      }

      let addedSubs = 0;
      if (Array.isArray(imported.subscriptions) && imported.subscriptions.length > 0) {
        setSubscriptions((prev) => {
          const currentIds = new Set(prev.map((s) => (typeof s === 'string' ? s : s.authorId)));
          const validSubs: SubscriptionItem[] = imported.subscriptions
            .map((s: any) => {
              if (typeof s === 'string') {
                return { authorId: s, author: s, subscribedAt: Date.now() };
              }
              if (s && s.authorId) {
                return s as SubscriptionItem;
              }
              return null;
            })
            .filter((s: any): s is SubscriptionItem => s !== null && !currentIds.has(s.authorId));
          addedSubs = validSubs.length;
          return [...prev, ...validSubs];
        });
      }

      if (addedVideos === 0 && addedPlaylists === 0 && addedSubs === 0) {
        if (importedVideos.length > 0 || importedPlaylists.length > 0 || (imported.subscriptions && imported.subscriptions.length > 0)) {
          addToast('info', 'Tous les éléments du fichier sont déjà enregistrés.');
        } else {
          addToast('error', 'Aucun favori valide trouvé dans ce fichier.');
        }
      } else {
        const parts: string[] = [];
        if (addedVideos > 0) parts.push(`${addedVideos} vidéo(s)`);
        if (addedPlaylists > 0) parts.push(`${addedPlaylists} playlist(s)`);
        if (addedSubs > 0) parts.push(`${addedSubs} abonnement(s)`);
        addToast('success', `Importation réussie : ${parts.join(', ')} ajouté(s) !`);
      }
    },
    [setFavorites, setFavoritePlaylists, setSubscriptions, addToast]
  );

  // Google Drive state & automatic check
  const [isGdriveAvailable, setIsGdriveAvailable] = useState(false);
  const [isSyncingGdrive, setIsSyncingGdrive] = useState(false);

  useEffect(() => {
    fetch('/api/gdrive-status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.available) {
          setIsGdriveAvailable(true);
        }
      })
      .catch(() => setIsGdriveAvailable(false));
  }, []);

  // Sync to Google Drive /ZenTube folder
  const handleSyncGdrive = useCallback(async () => {
    setIsSyncingGdrive(true);
    try {
      const payload = {
        app: 'ZenTube',
        version: 1,
        exportedAt: new Date().toISOString(),
        favorites,
        favoritePlaylists,
        subscriptions,
      };

      const res = await fetch('/api/gdrive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        addToast('success', 'Favoris synchronisés dans le dossier « ZenTube » de votre Google Drive !');
      } else {
        throw new Error(json.error || 'Erreur inconnue');
      }
    } catch (err: any) {
      addToast('error', `Erreur Google Drive : ${err.message || err}`);
    } finally {
      setIsSyncingGdrive(false);
    }
  }, [favorites, favoritePlaylists, subscriptions, addToast]);

  // Restore from Google Drive /ZenTube folder
  const handleRestoreGdrive = useCallback(async () => {
    setIsSyncingGdrive(true);
    try {
      const res = await fetch('/api/gdrive-restore');
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        handleImportData(json.data);
      } else {
        throw new Error(json.error || 'Aucune sauvegarde trouvée.');
      }
    } catch (err: any) {
      addToast('error', `Erreur Google Drive : ${err.message || err}`);
    } finally {
      setIsSyncingGdrive(false);
    }
  }, [handleImportData, addToast]);

  const onSearchQuery = useCallback(
    (query: string) => {
      setSelectedPlaylist(null);
      handleSearch(query);
    },
    [handleSearch]
  );

  const onSelectCategoryWrapper = useCallback(
    (cat: any) => {
      setSelectedPlaylist(null);
      handleSelectCategory(cat);
    },
    [handleSelectCategory]
  );

  const favoriteIds = favorites.map((f) => f.videoId);
  const isCurrentVideoFavorite = selectedVideoId ? favoriteIds.includes(selectedVideoId) : false;
  const isCurrentAuthorSubscribed = videoDetails?.authorId
    ? subscriptions.some((s) => (typeof s === 'string' ? s : s.authorId) === videoDetails.authorId)
    : false;

  return (
    <div className="min-h-screen bg-zen-bg text-zen-text flex flex-col selection:bg-brand/30 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Header */}
      <Header
        onSearch={onSearchQuery}
        onPlayVideo={(id) => handlePlayVideo(id)}
        onOpenPlaylist={handleOpenPlaylist}
        onSelectCategory={onSelectCategoryWrapper}
        activeCategory={activeCategory}
        currentInstance={currentInstance}
        latency={latency}
        onOpenInstanceModal={() => setIsInstanceModalOpen(true)}
        favoritesCount={favorites.length + favoritePlaylists.length}
        initialQuery={searchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Loading playlist state */}
        {isLoadingPlaylist ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-brand/20 text-brand flex items-center justify-center animate-bounce shadow-lg shadow-brand/20">
              <ListMusic className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-200">Chargement de la playlist...</p>
          </div>
        ) : selectedVideoId ? (
          /* 1. Selected Video Player View */
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
                    className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={() => setIsInstanceModalOpen(true)}
                    className="px-4 py-2 bg-zen-surface border border-zen-border text-white text-xs font-semibold rounded-xl cursor-pointer"
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
                  hasNextVideo={isShuffle ? activeQueue.length > 1 || !!nextVideo : !!nextVideo}
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
                  isShuffle={isShuffle}
                  onToggleShuffle={handleToggleShuffle}
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
        ) : selectedPlaylist ? (
          /* 2. Playlist View */
          <PlaylistView
            playlist={selectedPlaylist}
            onBack={handleClosePlaylist}
            onSelectVideo={(id, queue) => handlePlayVideo(id, 0, queue)}
            onPlayShuffle={(videos) => handlePlayShufflePlaylist(videos)}
            onChannelClick={(chId, chName) => {
              handleClosePlaylist();
              openChannel(chId, chName);
            }}
            isFavorite={favoritePlaylists.some((p) => p.playlistId === selectedPlaylist.playlistId)}
            onToggleFavoritePlaylist={handleToggleFavoritePlaylist}
            onShare={handleShare}
            favorites={favoriteIds}
            onToggleFavoriteVideo={handleToggleFavorite}
          />
        ) : selectedChannelId ? (
          /* 3. Channel View */
          <ChannelView
            channel={channelData}
            isLoading={isLoadingChannel}
            onSelectVideo={(id, queue) => handlePlayVideo(id, 0, queue)}
            onBack={closeChannel}
            isSubscribed={subscriptions.some((s) => (typeof s === 'string' ? s : s.authorId) === selectedChannelId)}
            onToggleSubscribe={handleToggleSubscribe}
            onShare={handleShare}
            favorites={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            favoritePlaylistIds={favoritePlaylists.map((p) => p.playlistId)}
            onToggleFavoritePlaylist={handleToggleFavoritePlaylist}
          />
        ) : (
          /* 4. Grid Views (Trending / Categories / Favorites / History) */
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
                  onSelectCategory={onSelectCategoryWrapper}
                  favoritesCount={favorites.length + favoritePlaylists.length + subscriptions.length}
                />
              )}
            </div>

            {/* View Switching */}
            {activeCategory === 'favorites' && !searchQuery ? (
              <FavoritesView
                favorites={favorites}
                favoritePlaylists={favoritePlaylists}
                subscriptions={subscriptions}
                onSelectVideo={(id) => handlePlayVideo(id)}
                onOpenPlaylist={handleOpenPlaylist}
                onPlayPlaylist={handlePlayPlaylist}
                onPlayShuffleVideos={handlePlayShuffleVideos}
                onPlayShufflePlaylist={handlePlayShufflePlaylist}
                onRemoveFavorite={handleRemoveFavorite}
                onRemoveFavoritePlaylist={handleRemoveFavoritePlaylist}
                onClearAll={handleClearFavorites}
                onClearPlaylists={handleClearFavoritePlaylists}
                onOpenChannel={(chId, chName) => openChannel(chId, chName)}
                onUnsubscribe={(chId, chName) => handleToggleSubscribe(chId, chName)}
                onClearSubscriptions={handleClearSubscriptions}
                onExportData={handleExportData}
                onImportData={handleImportData}
                isGdriveAvailable={isGdriveAvailable}
                isSyncingGdrive={isSyncingGdrive}
                onSyncGdrive={handleSyncGdrive}
                onRestoreGdrive={handleRestoreGdrive}
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
