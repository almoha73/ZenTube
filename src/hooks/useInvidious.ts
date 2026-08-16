import { useState, useEffect, useCallback } from 'react';
import {
  ChannelData,
  InvidiousComment,
  InvidiousVideoDetail,
  InvidiousVideoSummary,
  SearchCorrection,
  VideoCategory,
} from '../types';
import { invidiousApi } from '../services/invidiousApi';

export function useInvidious() {
  const [currentInstance, setCurrentInstance] = useState<string>(() => invidiousApi.getCurrentInstance());
  const [latency, setLatency] = useState<number>(() => invidiousApi.getCurrentLatency());

  const [activeCategory, setActiveCategory] = useState<VideoCategory>('trending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchCorrection, setSearchCorrection] = useState<SearchCorrection | null>(null);
  const [videos, setVideos] = useState<InvidiousVideoSummary[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(true);
  const [videosError, setVideosError] = useState<string | null>(null);

  // Selected video view
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<InvidiousVideoDetail | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Channel View state
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedChannelName, setSelectedChannelName] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [isLoadingChannel, setIsLoadingChannel] = useState<boolean>(false);

  // Comments
  const [comments, setComments] = useState<InvidiousComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);

  // Subscribe to instance changes & latency updates
  useEffect(() => {
    const unsubscribe = invidiousApi.subscribe((instance, lat) => {
      setCurrentInstance(instance);
      setLatency(lat);
    });
    return unsubscribe;
  }, []);

  // Fetch videos based on search or category
  const fetchVideos = useCallback(async () => {
    if (activeCategory === 'favorites' || activeCategory === 'history') {
      setIsLoadingVideos(false);
      return;
    }

    setIsLoadingVideos(true);
    setVideosError(null);

    try {
      let results: InvidiousVideoSummary[] = [];

      if (searchQuery.trim()) {
        const res = await invidiousApi.searchVideos(searchQuery.trim());
        results = res.videos;
        setSearchCorrection(res.correction || null);
      } else {
        setSearchCorrection(null);
        switch (activeCategory) {
          case 'music':
            results = await invidiousApi.getTrending('FR', 'Music');
            break;
          case 'gaming':
            results = await invidiousApi.getTrending('FR', 'Gaming');
            break;
          case 'news':
            results = await invidiousApi.getTrending('FR', 'News');
            break;
          case 'movies':
            results = await invidiousApi.getTrending('FR', 'Movies');
            break;
          case 'trending':
          default:
            results = await invidiousApi.getTrending('FR');
            break;
        }
      }

      setVideos(results);
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setVideosError(err.message || 'Impossible de charger les vidéos. Veuillez réessayer.');
      setVideos([]);
    } finally {
      setIsLoadingVideos(false);
    }
  }, [activeCategory, searchQuery]);

  // Refetch videos when category or search query changes
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Fetch single video details & comments when a video is selected
  useEffect(() => {
    if (!selectedVideoId) {
      setVideoDetails(null);
      setComments([]);
      return;
    }

    let isMounted = true;
    setIsLoadingDetails(true);
    setDetailsError(null);
    setIsLoadingComments(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    invidiousApi
      .getVideoDetails(selectedVideoId)
      .then((details) => {
        if (isMounted) {
          setVideoDetails(details);
          setIsLoadingDetails(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error loading video details:', err);
          setDetailsError(err.message || 'Erreur lors du chargement de la vidéo.');
          setIsLoadingDetails(false);
        }
      });

    invidiousApi
      .getComments(selectedVideoId)
      .then((c) => {
        if (isMounted) {
          setComments(c);
          setIsLoadingComments(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setComments([]);
          setIsLoadingComments(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedVideoId]);

  // Fetch channel details & videos when a channel is opened
  useEffect(() => {
    if (!selectedChannelId) {
      setChannelData(null);
      return;
    }

    let isMounted = true;
    setIsLoadingChannel(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    invidiousApi
      .getChannelDetails(selectedChannelId, selectedChannelName || undefined)
      .then((data) => {
        if (isMounted) {
          setChannelData(data);
          setIsLoadingChannel(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error loading channel details:', err);
          setIsLoadingChannel(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedChannelId, selectedChannelName]);

  const playVideo = useCallback((videoId: string) => {
    setSelectedVideoId(videoId);
    // Don't clear channel so we can go back if needed, or close video returns to channel
  }, []);

  const closeVideo = useCallback(() => {
    setSelectedVideoId(null);
    setVideoDetails(null);
  }, []);

  const openChannel = useCallback((channelId: string, channelName?: string) => {
    setSelectedChannelId(channelId);
    setSelectedChannelName(channelName || null);
    setSelectedVideoId(null); // Close video player if watching
  }, []);

  const closeChannel = useCallback(() => {
    setSelectedChannelId(null);
    setSelectedChannelName(null);
    setChannelData(null);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setActiveCategory('trending');
      setSelectedVideoId(null);
      setSelectedChannelId(null);
    }
  }, []);

  const handleSelectCategory = useCallback((cat: VideoCategory) => {
    setActiveCategory(cat);
    setSearchQuery('');
    setSearchCorrection(null);
    setSelectedVideoId(null);
    setSelectedChannelId(null);
  }, []);

  const switchInstance = useCallback((newInstance: string) => {
    invidiousApi.setActiveInstance(newInstance);
    setCurrentInstance(newInstance);
    if (selectedVideoId) {
      setIsLoadingDetails(true);
      setDetailsError(null);
      invidiousApi
        .getVideoDetails(selectedVideoId)
        .then(setVideoDetails)
        .catch((err) => setDetailsError(err.message))
        .finally(() => setIsLoadingDetails(false));
    } else {
      fetchVideos();
    }
  }, [selectedVideoId, fetchVideos]);

  return {
    currentInstance,
    latency,
    activeCategory,
    searchQuery,
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
    retryFetchVideos: fetchVideos,
  };
}
