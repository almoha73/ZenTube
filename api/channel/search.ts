function sendJson(res: any, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.end(JSON.stringify(data));
}

function getQueryParams(req: any) {
  if (req.query && Object.keys(req.query).length > 0) {
    return req.query;
  }
  try {
    const host = req.headers?.host || 'localhost';
    const urlObj = new URL(req.url || '', `http://${host}`);
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.end();
    return;
  }

  const params = getQueryParams(req);
  const channelId = params.id;
  const query = params.q;

  if (!channelId || !query || !query.trim()) {
    sendJson(res, 400, { error: 'Channel ID and query q are required', videos: [] });
    return;
  }

  try {
    const rawId = channelId.trim().replace(/^\/channel\//, '').replace(/^\/c\//, '').replace(/^\/user\//, '');
    let targetUrl = rawId.startsWith('@')
      ? `https://www.youtube.com/${rawId}/search?query=${encodeURIComponent(query.trim())}`
      : rawId.startsWith('UC')
      ? `https://www.youtube.com/channel/${rawId}/search?query=${encodeURIComponent(query.trim())}`
      : `https://www.youtube.com/@${rawId.replace(/\s+/g, '')}/search?query=${encodeURIComponent(query.trim())}`;

    const ytRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cookie': 'SOCS=CAESEwgDEgk2ODE4NDMzMjEaAmZyIAEaBgiA_L20Bg; CONSENT=PENDING+999; YES+cb.20210328-17-p0.fr+FX+999',
      },
      signal: AbortSignal.timeout(6000),
    });

    const html = await ytRes.text();
    const match =
      html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s) ||
      html.match(/var ytInitialData\s*=\s*({.+?});/s);

    if (!match) {
      throw new Error('Channel search data not found');
    }

    const data = JSON.parse(match[1]);
    const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    const searchTab =
      tabs.find((t: any) => t.expandableTabRenderer?.selected) ||
      tabs.find((t: any) => t.tabRenderer?.selected) ||
      tabs[tabs.length - 1];

    const contents =
      searchTab?.expandableTabRenderer?.content?.sectionListRenderer?.contents ||
      searchTab?.tabRenderer?.content?.sectionListRenderer?.contents ||
      data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
      [];

    const videos: any[] = [];
    for (const section of contents) {
      const items = section.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item.videoRenderer;
        const lockup = item.lockupViewModel;

        if (v && v.videoId) {
          let lengthSec = 0;
          const durText = v.lengthText?.simpleText || '';
          if (durText) {
            const parts = durText.split(':').map(Number);
            if (parts.length === 2) lengthSec = parts[0] * 60 + parts[1];
            else if (parts.length === 3)
              lengthSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }

          let views = 0;
          const viewStr = v.viewCountText?.simpleText || '';
          const numMatch = viewStr.replace(/[\s\u202F\u00A0,.]/g, '').match(/\d+/);
          if (numMatch) views = parseInt(numMatch[0], 10);

          const thumb =
            v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
            `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

          videos.push({
            type: 'video',
            videoId: v.videoId,
            title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'Sans titre',
            author: v.ownerText?.runs?.[0]?.text || 'Chaîne',
            authorId: rawId,
            videoThumbnails: [
              { quality: 'high', url: thumb, width: 480, height: 360 },
            ],
            description: '',
            viewCount: views,
            published: 0,
            publishedText: v.publishedTimeText?.simpleText || 'Récemment',
            lengthSeconds: lengthSec,
          });
        } else if (lockup && lockup.contentId) {
          const videoId = lockup.contentId;
          const title =
            lockup.metadata?.lockupMetadataViewModel?.title?.content || 'Vidéo';
          const thumb =
            lockup.contentImage?.thumbnailViewModel?.image?.sources?.slice(
              -1
            )[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          videos.push({
            type: 'video',
            videoId: videoId,
            title,
            author: 'Chaîne',
            authorId: rawId,
            videoThumbnails: [
              { quality: 'high', url: thumb, width: 480, height: 360 },
            ],
            description: '',
            viewCount: 0,
            published: 0,
            publishedText: 'Récemment',
            lengthSeconds: 240,
          });
        }
      }
    }

    sendJson(res, 200, { videos });
  } catch (error: any) {
    sendJson(res, 502, { error: error.message || 'Channel search failed', videos: [] });
  }
}
