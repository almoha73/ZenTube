import { InvidiousThumbnail } from '../types';

/**
 * Format seconds into HH:MM:SS or MM:SS string
 */
export function formatDuration(seconds: number | undefined | null): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';

  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const paddedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    const paddedMins = mins.toString().padStart(2, '0');
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }

  return `${mins}:${paddedSecs}`;
}

/**
 * Format view count into human-readable compact format (e.g., 1.2M vues, 45K vues)
 */
export function formatViews(views: number | undefined | null): string {
  if (views === undefined || views === null || isNaN(views)) return '0 vue';

  if (views >= 1_000_000_000) {
    return `${(views / 1_000_000_000).toFixed(1).replace('.0', '')} Md de vues`;
  }
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace('.0', '')} M de vues`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1).replace('.0', '')} k vues`;
  }

  return `${views} vue${views > 1 ? 's' : ''}`;
}

/**
 * Format subscriber count text
 */
export function formatSubscribers(subs: string | number | undefined | null): string {
  if (!subs) return '';
  if (typeof subs === 'string') return subs;
  if (subs >= 1_000_000) {
    return `${(subs / 1_000_000).toFixed(2)} M abonnés`;
  }
  if (subs >= 1_000) {
    return `${(subs / 1_000).toFixed(1)} k abonnés`;
  }
  return `${subs} abonnés`;
}

/**
 * Format timestamp (seconds or milliseconds or ISO string) to relative date in French
 */
export function formatPublishedDate(published: number | string | undefined | null, publishedText?: string): string {
  if (publishedText && publishedText.trim().length > 0) {
    // If it's already translated or descriptive, check if we can improve it
    return publishedText;
  }

  if (!published) return 'Date inconnue';

  let timestampMs: number;
  if (typeof published === 'number') {
    // Check if timestamp is in seconds or milliseconds
    timestampMs = published < 10000000000 ? published * 1000 : published;
  } else {
    timestampMs = new Date(published).getTime();
  }

  if (isNaN(timestampMs) || timestampMs <= 0) return 'Récemment';

  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);

  if (diffSec < 60) return "À l'instant";
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `Il y a ${mins} min${mins > 1 ? 's' : ''}`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
  if (diffSec < 2592000) {
    const weeks = Math.floor(diffSec / 604800);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  if (diffSec < 31536000) {
    const months = Math.floor(diffSec / 2592000);
    return `Il y a ${months} mois`;
  }

  const years = Math.floor(diffSec / 31536000);
  return `Il y a ${years} an${years > 1 ? 's' : ''}`;
}

/**
 * Extract YouTube Video ID from any URL or input string
 * Supports:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 * - https://yewtu.be/watch?v=dQw4w9WgXcQ
 * - dQw4w9WgXcQ (11 alphanumeric characters)
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    // If it's a URL
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);

    // youtu.be/VIDEO_ID
    if (url.hostname.includes('youtu.be')) {
      const pathname = url.pathname.replace(/^\//, '').split('/')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(pathname)) {
        return pathname;
      }
    }

    // youtube.com/watch?v=VIDEO_ID
    const vParam = url.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    // /shorts/VIDEO_ID or /embed/VIDEO_ID or /v/VIDEO_ID or /watch/VIDEO_ID
    const pathParts = url.pathname.split('/');
    const targetIdx = pathParts.findIndex(p => ['shorts', 'embed', 'v', 'watch'].includes(p));
    if (targetIdx !== -1 && pathParts[targetIdx + 1]) {
      const candidate = pathParts[targetIdx + 1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
        return candidate;
      }
    }
  } catch {
    // Fallback regex match across any text
    const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get highest resolution thumbnail URL with fallbacks
 */
export function getBestThumbnailUrl(thumbnails: InvidiousThumbnail[] | undefined, videoId?: string): string {
  if (thumbnails && thumbnails.length > 0) {
    // Sort by height or pick maxresdefault/hqdefault
    const sorted = [...thumbnails].sort((a, b) => (b.height || 0) - (a.height || 0));
    const best = sorted[0]?.url;
    if (best) {
      if (best.startsWith('//')) return `https:${best}`;
      return best;
    }
  }

  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
}
