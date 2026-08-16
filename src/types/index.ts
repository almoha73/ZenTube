export interface InvidiousThumbnail {
  quality: string;
  url: string;
  width: number;
  height: number;
}

export interface InvidiousFormatStream {
  url: string;
  itag: string;
  type: string;
  quality: string;
  qualityLabel: string;
  container: string;
  encoding: string;
  resolution?: string;
  size?: string;
  fps?: number;
}

export interface InvidiousAdaptiveFormat {
  init?: string;
  index?: string;
  bitrate: string;
  url: string;
  itag: string;
  type: string;
  qualityLabel?: string;
  resolution?: string;
  container: string;
  encoding: string;
  fps?: number;
  audioQuality?: string;
  audioSampleRate?: number;
  audioChannels?: number;
}

export interface InvidiousCaption {
  label: string;
  languageCode: string;
  url: string;
}

export interface InvidiousVideoSummary {
  type?: 'video' | 'shortVideo';
  title: string;
  videoId: string;
  author: string;
  authorId: string;
  authorUrl?: string;
  authorThumbnails?: InvidiousThumbnail[];
  videoThumbnails: InvidiousThumbnail[];
  description?: string;
  descriptionHtml?: string;
  viewCount: number;
  published: number;
  publishedText: string;
  lengthSeconds: number;
  liveNow?: boolean;
  premium?: boolean;
  isUpcoming?: boolean;
}

export interface SearchCorrection {
  type: 'showing_results_for' | 'did_you_mean';
  correctedQuery: string;
  originalQuery?: string;
}

export interface SearchResultData {
  videos: InvidiousVideoSummary[];
  correction?: SearchCorrection | null;
}

export interface ChannelPlaylist {
  playlistId: string;
  title: string;
  videoCount?: string;
  thumbnailUrl?: string;
  firstVideoId?: string;
}

export interface PlaylistDetail {
  playlistId: string;
  title: string;
  author: string;
  authorId?: string;
  thumbnailUrl?: string;
  videoCount?: number;
  videos: InvidiousVideoSummary[];
}

export interface ChannelData {
  author: string;
  authorId: string;
  authorHandle?: string;
  authorThumbnail?: string;
  authorBanner?: string;
  subCountText?: string;
  description?: string;
  videos: InvidiousVideoSummary[];
  playlists?: ChannelPlaylist[];
  continuationToken?: string | null;
  apiKey?: string;
}

export interface InvidiousVideoDetail extends InvidiousVideoSummary {
  keywords?: string[];
  genre?: string;
  genreUrl?: string;
  authorThumbnail?: string;
  subCountText?: string;
  likeCount?: number;
  dislikeCount?: number;
  rating?: number;
  isFamilyFriendly?: boolean;
  allowedRegions?: string[];
  isListed?: boolean;
  isLiveContent?: boolean;
  formatStreams: InvidiousFormatStream[];
  adaptiveFormats: InvidiousAdaptiveFormat[];
  recommendedVideos: InvidiousVideoSummary[];
  captions?: InvidiousCaption[];
}

export interface InvidiousComment {
  author: string;
  authorUrl: string;
  authorThumbnails: InvidiousThumbnail[];
  authorId: string;
  authorVerified?: boolean;
  content: string;
  contentHtml: string;
  published: number;
  publishedText: string;
  likeCount: number;
  commentId: string;
  authorIsChannelOwner?: boolean;
  replies?: {
    replyCount: number;
    continuation: string;
  };
}

export interface InvidiousInstanceInfo {
  uri: string;
  name: string;
  api: boolean;
  type: string;
  cors?: boolean;
  health?: string;
  ping?: number;
  region?: string;
  flag?: string;
  isCustom?: boolean;
}

export interface WatchHistoryItem {
  videoId: string;
  title: string;
  author: string;
  authorId: string;
  thumbnailUrl: string;
  lengthSeconds: number;
  watchedAt: number;
  currentTime: number;
  progressPercent: number;
}

export interface FavoriteItem {
  videoId: string;
  title: string;
  author: string;
  authorId: string;
  thumbnailUrl: string;
  lengthSeconds: number;
  savedAt: number;
  viewCount?: number;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export type VideoCategory =
  | 'trending'
  | 'music'
  | 'gaming'
  | 'news'
  | 'movies'
  | 'favorites'
  | 'history';

export interface PlayerQualityOption {
  label: string;
  url: string;
  resolution?: string;
  type: string;
  isDirect: boolean;
}
