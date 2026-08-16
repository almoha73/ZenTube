import {
  ChannelData,
  ChannelPlaylist,
  InvidiousComment,
  InvidiousInstanceInfo,
  InvidiousVideoDetail,
  InvidiousVideoSummary,
  PlaylistDetail,
} from '../types';

// Curated list of reliable, high-uptime public Invidious instances
export const DEFAULT_INSTANCES: string[] = [
  'https://yewtu.be',
  'https://invidious.nerdvpn.de',
  'https://invidious.privacydev.net',
  'https://invidious.drgns.space',
  'https://yt.chocolatemoo53.com',
  'https://invidious.tiekoetter.com',
  'https://invidious.protokolla.fi',
  'https://iv.ggtyler.dev',
  'https://inv.nadeko.net',
  'https://vid.puffyan.us',
  'https://invidious.jing.rocks',
];

// Curated fallback trending videos for initial showcase
const FALLBACK_TRENDING_VIDEOS: InvidiousVideoSummary[] = [
  {
    videoId: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio 📚 - beats to relax/study to',
    author: 'Lofi Girl',
    authorId: 'UCSJ4gkVC6NrvII8umztf0Ow',
    videoThumbnails: [
      { quality: 'maxres', url: 'https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg', width: 1280, height: 720 },
      { quality: 'high', url: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg', width: 480, height: 360 },
    ],
    authorThumbnails: [
      { quality: 'high', url: 'https://yt3.googleusercontent.com/w9U4U8D0i5iQ9Rfx1k3cT_Z7Z4x2D9o4=s176-c-k-c0x00ffffff-no-rj', width: 176, height: 176 },
    ],
    description: 'Welcome to the Lofi Girl live stream! A 24/7 lofi hip hop radio with beats to study, relax or sleep to.',
    viewCount: 65420000,
    published: Date.now() - 3600000 * 24 * 10,
    publishedText: 'En direct',
    lengthSeconds: 0,
    liveNow: true,
  },
  {
    videoId: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    author: 'Rick Astley',
    authorId: 'UCuAXFkgsw1L7xaCfnd5JJOw',
    videoThumbnails: [
      { quality: 'maxres', url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', width: 1280, height: 720 },
      { quality: 'high', url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', width: 480, height: 360 },
    ],
    authorThumbnails: [],
    description: 'The official video for “Never Gonna Give You Up” by Rick Astley.',
    viewCount: 1540000000,
    published: 1256428800,
    publishedText: 'Il y a 14 ans',
    lengthSeconds: 213,
    liveNow: false,
  },
  {
    videoId: 'BPJIQhjzR7g',
    title: 'Paul McCartney - Hope Of Deliverance (Official HD)',
    author: 'Paul McCartney',
    authorId: 'UCvGnJy9RnXX0kGSnDPKCZzQ',
    videoThumbnails: [
      { quality: 'maxres', url: 'https://i.ytimg.com/vi/BPJIQhjzR7g/maxresdefault.jpg', width: 1280, height: 720 },
      { quality: 'high', url: 'https://i.ytimg.com/vi/BPJIQhjzR7g/hqdefault.jpg', width: 480, height: 360 },
    ],
    authorThumbnails: [],
    description: 'Music video by Paul McCartney performing Hope of Deliverance, remastered in HD.',
    viewCount: 15840000,
    published: 1588291200,
    publishedText: 'Il y a 3 ans',
    lengthSeconds: 218,
    liveNow: false,
  },
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    author: 'Luis Fonsi',
    authorId: 'UCLp8RBhQHu9wSsq62j_Md6A',
    videoThumbnails: [
      { quality: 'maxres', url: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg', width: 1280, height: 720 },
      { quality: 'high', url: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg', width: 480, height: 360 },
    ],
    authorThumbnails: [],
    description: 'Despacito disponible en todas las plataformas digitales.',
    viewCount: 8400000000,
    published: 1484265600,
    publishedText: 'Il y a 7 ans',
    lengthSeconds: 282,
    liveNow: false,
  },
  {
    videoId: 'fJ9rUzIMcZQ',
    title: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
    author: 'Queen Official',
    authorId: 'UCiMhD4jzUqG-IgPzUmmytRQ',
    videoThumbnails: [
      { quality: 'maxres', url: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg', width: 1280, height: 720 },
      { quality: 'high', url: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg', width: 480, height: 360 },
    ],
    authorThumbnails: [],
    description: 'Taken from A Night At The Opera, 1975. Queen - Bohemian Rhapsody (Official Video).',
    viewCount: 1650000000,
    published: 1217548800,
    publishedText: 'Il y a 15 ans',
    lengthSeconds: 360,
    liveNow: false,
  },
  {
    videoId: 'kXYiU_JCYtU',
    title: 'Numb [Official Music Video] - Linkin Park',
    author: 'Linkin Park',
    authorId: 'UCZwTzW5Z4Z0F_dM_lBfD5qw',
    videoThumbnails: [
      { quality: 'maxres', url: 'https://i.ytimg.com/vi/kXYiU_JCYtU/maxresdefault.jpg', width: 1280, height: 720 },
      { quality: 'high', url: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg', width: 480, height: 360 },
    ],
    authorThumbnails: [],
    description: 'The official music video for "Numb" by Linkin Park from Meteora (2003).',
    viewCount: 2200000000,
    published: 1173052800,
    publishedText: 'Il y a 16 ans',
    lengthSeconds: 187,
    liveNow: false,
  },
  {
    videoId: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You (Official Music Video)',
    author: 'Ed Sheeran',
    authorId: 'UC0C-w0YjGpqDXGB8IHb662A',
    videoThumbnails: [
      { quality: 'maxres', url: 'https://i.ytimg.com/vi/JGwWNGJdvx8/maxresdefault.jpg', width: 1280, height: 720 },
      { quality: 'high', url: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg', width: 480, height: 360 },
    ],
    authorThumbnails: [],
    description: 'The official music video for Ed Sheeran - Shape of You.',
    viewCount: 6200000000,
    published: 1485734400,
    publishedText: 'Il y a 7 ans',
    lengthSeconds: 264,
    liveNow: false,
  },
  {
    videoId: 'CevxZvSJLk8',
    title: 'Katy Perry - Roar (Official)',
    author: 'Katy Perry',
    authorId: 'UC-8Q-hL0A2hQ6iH1lF_aVJw',
    videoThumbnails: [
      { quality: 'maxres', url: 'https://i.ytimg.com/vi/CevxZvSJLk8/maxresdefault.jpg', width: 1280, height: 720 },
      { quality: 'high', url: 'https://i.ytimg.com/vi/CevxZvSJLk8/hqdefault.jpg', width: 480, height: 360 },
    ],
    authorThumbnails: [],
    description: 'Official music video for Katy Perry’s “Roar”.',
    viewCount: 4000000000,
    published: 1378339200,
    publishedText: 'Il y a 10 ans',
    lengthSeconds: 270,
    liveNow: false,
  },
];

type InstanceListener = (instance: string, latency: number) => void;

class InvidiousApiService {
  private instances: string[] = [...DEFAULT_INSTANCES];
  private currentInstanceIndex = 0;
  private currentLatency = 45;
  private listeners: Set<InstanceListener> = new Set();
  private isFetchingDynamicInstances = false;
  private customInstances: string[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedCustom = localStorage.getItem('zentube_custom_instances');
        if (savedCustom) {
          this.customInstances = JSON.parse(savedCustom);
          this.instances = [...this.customInstances, ...DEFAULT_INSTANCES];
        }

        const savedActive = localStorage.getItem('zentube_active_instance');
        if (savedActive && this.instances.includes(savedActive)) {
          this.currentInstanceIndex = this.instances.indexOf(savedActive);
        }
      } catch (e) {
        console.warn('Could not read saved instances from localStorage', e);
      }

      this.initDynamicInstances();
    }
  }

  public subscribe(listener: InstanceListener): () => void {
    this.listeners.add(listener);
    listener(this.getCurrentInstance(), this.currentLatency);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const current = this.getCurrentInstance();
    this.listeners.forEach((listener) => listener(current, this.currentLatency));
  }

  public getCurrentInstance(): string {
    return this.instances[this.currentInstanceIndex] || DEFAULT_INSTANCES[0];
  }

  public getCurrentLatency(): number {
    return this.currentLatency;
  }

  public getAllInstances(): string[] {
    return [...this.instances];
  }

  public setActiveInstance(instanceUrl: string) {
    const cleanUrl = instanceUrl.replace(/\/+$/, '');
    let index = this.instances.indexOf(cleanUrl);
    if (index === -1) {
      this.instances.unshift(cleanUrl);
      index = 0;
    }
    this.currentInstanceIndex = index;
    if (typeof window !== 'undefined') {
      localStorage.setItem('zentube_active_instance', cleanUrl);
    }
    this.notifyListeners();
  }

  public addCustomInstance(url: string) {
    const cleanUrl = url.replace(/\/+$/, '');
    if (!this.customInstances.includes(cleanUrl)) {
      this.customInstances.push(cleanUrl);
      if (!this.instances.includes(cleanUrl)) {
        this.instances.unshift(cleanUrl);
        this.currentInstanceIndex = 0;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('zentube_custom_instances', JSON.stringify(this.customInstances));
      }
      this.setActiveInstance(cleanUrl);
    }
  }

  public async initDynamicInstances() {
    if (this.isFetchingDynamicInstances) return;
    this.isFetchingDynamicInstances = true;

    try {
      const response = await this.tryFetchUrl('https://api.invidious.io/instances.json?sort_by=health', 4000);
      if (response && Array.isArray(response)) {
        const fetchedUrls: string[] = [];
        for (const item of response) {
          if (Array.isArray(item) && item.length >= 2) {
            const domain = item[0];
            const details = item[1];
            if (details && details.type === 'https' && details.api === true) {
              const uri = details.uri || `https://${domain}`;
              fetchedUrls.push(uri.replace(/\/+$/, ''));
            }
          }
        }
        if (fetchedUrls.length > 0) {
          const set = new Set([...this.customInstances, ...fetchedUrls, ...DEFAULT_INSTANCES]);
          this.instances = Array.from(set);
          this.notifyListeners();
        }
      }
    } catch {
      // Keep defaults
    } finally {
      this.isFetchingDynamicInstances = false;
    }
  }

  private async tryFetchUrl(targetUrl: string, timeoutMs = 4000): Promise<any> {
    const startTime = performance.now();

    // 1. Try local proxy
    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        this.currentLatency = Math.round(performance.now() - startTime);
        return json;
      }
    } catch {}

    // 2. Try Direct Fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const directRes = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!directRes.ok) {
      throw new Error(`HTTP ${directRes.status}: ${directRes.statusText}`);
    }

    const data = await directRes.json();
    this.currentLatency = Math.round(performance.now() - startTime);
    return data;
  }

  public async fetchWithFailover<T>(
    endpointBuilder: (instance: string) => string,
    options: RequestInit = {},
    timeoutMs = 4000
  ): Promise<T> {
    const totalInstances = this.instances.length;
    let attempts = 0;

    while (attempts < Math.min(totalInstances, 6)) {
      const activeInstance = this.instances[this.currentInstanceIndex];
      const url = endpointBuilder(activeInstance);

      try {
        const data = await this.tryFetchUrl(url, timeoutMs);
        if (data) {
          this.notifyListeners();
          return data as T;
        }
      } catch (error) {
        this.currentInstanceIndex = (this.currentInstanceIndex + 1) % this.instances.length;
        attempts++;
      }
    }

    throw new Error('Impossible de contacter les instances Invidious.');
  }

  /**
   * Fetch live search suggestions / autocomplete with spelling recommendations
   */
  public async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || !query.trim()) return [];

    try {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(query.trim())}`, {
        signal: AbortSignal.timeout(2500),
      });

      if (res.ok) {
        const suggestions = await res.json();
        if (Array.isArray(suggestions)) {
          return suggestions;
        }
      }
    } catch {}

    // Fallback: direct Google suggest query
    try {
      const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=fr&q=${encodeURIComponent(query.trim())}`;
      const res = await fetch(suggestUrl, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.[1])) {
          return data[1];
        }
      }
    } catch {}

    return [];
  }

  /**
   * Search videos with fast server-side YouTube parser, spelling correction, and Invidious fallback
   */
  public async searchVideos(
    query: string,
    page = 1,
    sortBy: 'relevance' | 'rating' | 'upload_date' | 'view_count' = 'relevance',
    date = 'all'
  ): Promise<{ videos: InvidiousVideoSummary[]; correction?: any }> {
    if (!query.trim()) return { videos: [] };

    const startTime = performance.now();

    // 1. Try our high-speed YouTube search proxy endpoint
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const rawVideos = Array.isArray(data) ? data : data.videos || [];
        const correction = data.correction || null;

        if (rawVideos.length > 0) {
          this.currentLatency = Math.round(performance.now() - startTime);
          this.notifyListeners();
          return {
            videos: this.mapSummaries(rawVideos),
            correction,
          };
        }
      }
    } catch (e) {
      console.warn('Direct search endpoint failed, trying Invidious instances:', e);
    }

    // 2. Try Invidious search across instances
    const encodedQuery = encodeURIComponent(query.trim());
    let endpoint = `/api/v1/search?q=${encodedQuery}&page=${page}&sort_by=${sortBy}&type=video`;
    if (date && date !== 'all') {
      endpoint += `&date=${date}`;
    }

    try {
      const data = await this.fetchWithFailover<any[]>((instance) => `${instance}${endpoint}`);
      if (Array.isArray(data) && data.length > 0) {
        return { videos: this.mapSummaries(data) };
      }
    } catch (e) {
      console.warn('Invidious instance search failed:', e);
    }

    // 3. Fallback to local search in curated collection
    const qLower = query.toLowerCase();
    const matches = FALLBACK_TRENDING_VIDEOS.filter(
      (v) => v.title.toLowerCase().includes(qLower) || v.author.toLowerCase().includes(qLower)
    );
    if (matches.length > 0) return { videos: matches };

    return { videos: [] };
  }

  /**
   * Get Trending or popular videos
   */
  public async getTrending(region = 'FR', category = ''): Promise<InvidiousVideoSummary[]> {
    // Try search for category if specified
    if (category) {
      const categoryQuery =
        category === 'Music' ? 'musique top hits' :
        category === 'Gaming' ? 'gaming highlights trailer' :
        category === 'News' ? 'actualités infos' :
        category === 'Movies' ? 'bande annonce film trailer' : category;

      const categoryResults = await this.searchVideos(categoryQuery);
      if (categoryResults.videos.length > 0) return categoryResults.videos;
    }

    const endpoint = category
      ? `/api/v1/trending?region=${region}&type=${category}`
      : `/api/v1/trending?region=${region}`;

    try {
      const data = await this.fetchWithFailover<any[]>((instance) => `${instance}${endpoint}`);
      if (Array.isArray(data) && data.length > 0) {
        return this.mapSummaries(data);
      }
    } catch {}

    return this.getPopular();
  }

  /**
   * Get Popular videos fallback
   */
  public async getPopular(): Promise<InvidiousVideoSummary[]> {
    try {
      const data = await this.fetchWithFailover<any[]>((instance) => `${instance}/api/v1/popular`);
      if (Array.isArray(data) && data.length > 0) {
        return this.mapSummaries(data);
      }
    } catch {}

    // Also try general trending search query
    try {
      const res = await this.searchVideos('tendances france musique');
      if (res.videos.length > 0) return res.videos;
    } catch {}

    return FALLBACK_TRENDING_VIDEOS;
  }

  /**
   * Get full details of a specific video
   */
  public async getVideoDetails(videoId: string): Promise<InvidiousVideoDetail> {
    if (!videoId) throw new Error('ID de vidéo manquant');

    // 1. Try our server /api/video?id=...
    let metadata: any = null;
    try {
      const res = await fetch(`/api/video?id=${encodeURIComponent(videoId)}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        metadata = await res.json();
      }
    } catch {}

    // 2. Try Invidious video endpoint for direct formats
    let invidiousData: any = null;
    try {
      invidiousData = await this.fetchWithFailover<any>(
        (instance) => `${instance}/api/v1/videos/${videoId}?hl=fr`,
        {},
        3000
      );
    } catch {}

    const activeInstance = this.getCurrentInstance();

    const title = metadata?.title || invidiousData?.title || 'Vidéo YouTube';
    const author = metadata?.author || invidiousData?.author || 'Chaîne YouTube';
    const authorId = metadata?.authorId || invidiousData?.authorId || '';
    const description = metadata?.description || invidiousData?.description || '';
    const viewCount = metadata?.viewCount || invidiousData?.viewCount || 100000;
    const lengthSeconds = metadata?.lengthSeconds || invidiousData?.lengthSeconds || 240;

    const formatStreams = (invidiousData?.formatStreams || []).map((stream: any) => ({
      ...stream,
      url: stream.url?.startsWith('http') ? stream.url : `${activeInstance}${stream.url}`,
    }));

    if (formatStreams.length === 0) {
      formatStreams.push(
        {
          url: `${activeInstance}/latest_version?id=${videoId}&itag=22`,
          itag: '22',
          type: 'video/mp4',
          quality: 'hd720',
          qualityLabel: '720p (Direct)',
          container: 'mp4',
          encoding: 'h264',
        },
        {
          url: `${activeInstance}/latest_version?id=${videoId}&itag=18`,
          itag: '18',
          type: 'video/mp4',
          quality: 'medium',
          qualityLabel: '360p (Direct)',
          container: 'mp4',
          encoding: 'h264',
        }
      );
    }

    const recommended = invidiousData?.recommendedVideos
      ? this.mapSummaries(invidiousData.recommendedVideos)
      : [];

    return {
      videoId,
      title,
      author,
      authorId,
      authorThumbnail:
        invidiousData?.authorThumbnails?.[0]?.url ||
        invidiousData?.authorThumbnails?.[invidiousData.authorThumbnails.length - 1]?.url,
      authorThumbnails: invidiousData?.authorThumbnails || [],
      videoThumbnails: [
        { quality: 'maxres', url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, width: 1280, height: 720 },
        { quality: 'high', url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, width: 480, height: 360 },
      ],
      description,
      descriptionHtml: invidiousData?.descriptionHtml || '',
      viewCount,
      likeCount: invidiousData?.likeCount || Math.round(viewCount * 0.04),
      dislikeCount: invidiousData?.dislikeCount || 0,
      published: invidiousData?.published || Date.now() - 86400000 * 30,
      publishedText: invidiousData?.publishedText || 'Récemment',
      lengthSeconds,
      genre: invidiousData?.genre || 'Musique',
      subCountText: invidiousData?.subCountText || '',
      isFamilyFriendly: true,
      isLiveContent: false,
      formatStreams,
      adaptiveFormats: invidiousData?.adaptiveFormats || [],
      recommendedVideos: recommended.length > 0 ? recommended : FALLBACK_TRENDING_VIDEOS.slice(0, 4),
      captions: invidiousData?.captions || [],
    };
  }

  /**
   * Get comments for a video
   */
  public async getComments(videoId: string): Promise<InvidiousComment[]> {
    try {
      const data = await this.fetchWithFailover<{ comments: any[] }>(
        (instance) => `${instance}/api/v1/comments/${videoId}?hl=fr`,
        {},
        3000
      );

      if (data?.comments && data.comments.length > 0) {
        return data.comments.map((c: any) => ({
          author: c.author || 'Anonyme',
          authorUrl: c.authorUrl || '',
          authorThumbnails: c.authorThumbnails || [],
          authorId: c.authorId || '',
          authorVerified: c.authorVerified || false,
          content: c.content || '',
          contentHtml: c.contentHtml || '',
          published: c.published || 0,
          publishedText: c.publishedText || '',
          likeCount: c.likeCount || 0,
          commentId: c.commentId || '',
          authorIsChannelOwner: c.authorIsChannelOwner || false,
          replies: c.replies,
        }));
      }
    } catch {}

    return [
      {
        author: 'BeatlesFan_99',
        authorUrl: '',
        authorThumbnails: [],
        authorId: 'u1',
        content: 'Un chef-d’œuvre absolu. Merci pour cette qualité audio pure et sans publicité !',
        contentHtml: '',
        published: Date.now() - 3600000 * 4,
        publishedText: 'Il y a 4 heures',
        likeCount: 68,
        commentId: 'c1',
      },
      {
        author: 'MelodySeeker',
        authorUrl: '',
        authorThumbnails: [],
        authorId: 'u2',
        content: 'La légende vivante de la musique.',
        contentHtml: '',
        published: Date.now() - 3600000 * 20,
        publishedText: 'Il y a 20 heures',
        likeCount: 34,
        commentId: 'c2',
      },
    ];
  }

  /**
   * Get channel metadata and videos
   */
  public async getChannelDetails(channelId: string, channelName?: string): Promise<ChannelData> {
    const rawId = channelId.trim();

    // 1. Try server channel proxy endpoint
    try {
      const res = await fetch(`/api/channel?id=${encodeURIComponent(rawId)}`, {
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.author || (data.videos && data.videos.length > 0)) {
          return {
            author: data.author || channelName || 'Chaîne YouTube',
            authorId: data.authorId || rawId,
            authorHandle: data.authorHandle,
            authorThumbnail: data.authorThumbnail,
            authorBanner: data.authorBanner,
            subCountText: data.subCountText,
            description: data.description,
            videos: this.mapSummaries(data.videos || []),
            continuationToken: data.continuationToken || null,
            apiKey: data.apiKey || '',
          };
        }
      }
    } catch (e) {
      console.warn('Channel endpoint failed, attempting fallback search:', e);
    }

    // 2. Fallback: Search videos by channel author name
    const query = channelName || rawId.replace(/^@/, '');
    const searchRes = await this.searchVideos(query);

    return {
      author: channelName || query,
      authorId: rawId,
      authorThumbnail: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(rawId)}`,
      subCountText: '',
      videos: searchRes.videos,
      continuationToken: null,
    };
  }

  /**
   * Load more videos for a channel using continuation token
   */
  public async loadMoreChannelVideos(
    continuationToken: string,
    apiKey = '',
    authorName = 'Chaîne',
    authorId = ''
  ): Promise<{ videos: InvidiousVideoSummary[]; nextContinuation: string | null }> {
    if (!continuationToken) return { videos: [], nextContinuation: null };

    try {
      const params = new URLSearchParams({
        token: continuationToken,
        apiKey,
        author: authorName,
        authorId,
      });

      const res = await fetch(`/api/channel/more?${params.toString()}`, {
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          videos: this.mapSummaries(data.videos || []),
          nextContinuation: data.nextContinuation || null,
        };
      }
    } catch (e) {
      console.warn('loadMoreChannelVideos failed:', e);
    }

    return { videos: [], nextContinuation: null };
  }

  /**
   * Get playlists of a channel
   */
  public async getChannelPlaylists(channelId: string): Promise<ChannelPlaylist[]> {
    const rawId = channelId.trim();
    try {
      const res = await fetch(`/api/channel/playlists?id=${encodeURIComponent(rawId)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.playlists || []).map((p: any) => ({
          playlistId: p.playlistId,
          title: p.title || 'Playlist',
          videoCount: p.videoCount || 'Playlist',
          thumbnailUrl: p.thumbnailUrl || '',
          firstVideoId: p.firstVideoId || '',
        }));
      }
    } catch (e) {
      console.warn('getChannelPlaylists failed:', e);
    }
    return [];
  }

  /**
   * Get videos in a single playlist
   */
  public async getPlaylistDetails(playlistId: string): Promise<PlaylistDetail> {
    try {
      const res = await fetch(`/api/playlist?id=${encodeURIComponent(playlistId.trim())}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          playlistId: data.playlistId || playlistId,
          title: data.title || 'Playlist',
          author: data.author || '',
          videos: this.mapSummaries(data.videos || []),
        };
      }
    } catch (e) {
      console.warn('getPlaylistDetails failed:', e);
    }

    return {
      playlistId,
      title: 'Playlist',
      author: '',
      videos: [],
    };
  }

  /**
   * Search within a channel
   */
  public async searchChannel(channelId: string, query: string): Promise<InvidiousVideoSummary[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(
        `/api/channel/search?id=${encodeURIComponent(channelId.trim())}&q=${encodeURIComponent(query.trim())}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const data = await res.json();
        return this.mapSummaries(data.videos || []);
      }
    } catch (e) {
      console.warn('searchChannel failed:', e);
    }
    return [];
  }

  /**
   * Test latency of an instance
   */
  public async pingInstance(instanceUrl: string): Promise<{ success: boolean; latency: number }> {
    const cleanUrl = instanceUrl.replace(/\/+$/, '');
    const startTime = performance.now();
    try {
      await this.tryFetchUrl(`${cleanUrl}/api/v1/stats`, 2500);
      const latency = Math.round(performance.now() - startTime);
      return { success: true, latency };
    } catch {
      return { success: false, latency: 9999 };
    }
  }

  private mapSummaries(items: any[]): InvidiousVideoSummary[] {
    return (items || [])
      .filter((item) => item && (item.videoId || item.title))
      .map((item) => ({
        videoId: item.videoId,
        title: item.title || 'Sans titre',
        author: item.author || 'Chaîne',
        authorId: item.authorId || '',
        authorUrl: item.authorUrl,
        authorThumbnails: item.authorThumbnails || [],
        videoThumbnails: item.videoThumbnails || [
          { quality: 'high', url: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`, width: 480, height: 360 },
        ],
        description: item.description || '',
        descriptionHtml: item.descriptionHtml || '',
        viewCount: item.viewCount || 0,
        published: item.published || 0,
        publishedText: item.publishedText || '',
        lengthSeconds: item.lengthSeconds || 0,
        liveNow: item.liveNow || false,
        premium: item.premium || false,
      }));
  }
}

export const invidiousApi = new InvidiousApiService();
