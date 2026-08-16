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

  if (!channelId || !channelId.trim()) {
    sendJson(res, 400, { error: 'Channel ID is required', videos: [] });
    return;
  }

  try {
    const rawId = channelId.trim().replace(/^\/channel\//, '').replace(/^\/c\//, '').replace(/^\/user\//, '');
    let targetUrl = rawId.startsWith('@')
      ? `https://www.youtube.com/${rawId}/videos`
      : rawId.startsWith('UC')
      ? `https://www.youtube.com/channel/${rawId}/videos`
      : `https://www.youtube.com/@${rawId.replace(/\s+/g, '')}/videos`;

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
      throw new Error('Channel data not found in page');
    }

    const keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    const apiKey = keyMatch ? keyMatch[1] : '';

    const data = JSON.parse(match[1]);
    let author = '';
    let authorHandle = '';
    let authorThumbnail = '';
    let authorBanner = '';
    let subCountText = '';
    let description = '';

    // Header parser
    if (data.header?.pageHeaderRenderer) {
      const ph = data.header.pageHeaderRenderer;
      author =
        ph.pageTitle ||
        ph.content?.pageHeaderViewModel?.title?.dynamicTextViewModel?.text?.content ||
        'Chaîne';
      const avatarModels =
        ph.content?.pageHeaderViewModel?.image?.decoratedAvatarViewModel?.avatar
          ?.avatarViewModel?.image?.sources;
      if (avatarModels?.length)
        authorThumbnail = avatarModels[avatarModels.length - 1].url;
      const bannerModels =
        ph.content?.pageHeaderViewModel?.banner?.imageBannerViewModel?.image?.sources;
      if (bannerModels?.length)
        authorBanner = bannerModels[bannerModels.length - 1].url;
      const metadataRows =
        ph.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel?.metadataRows ||
        [];
      for (const row of metadataRows) {
        for (const item of row.metadataParts || []) {
          const t = item.text?.content || '';
          if (t.includes('abonn') || t.includes('subscribers')) subCountText = t;
          if (t.startsWith('@')) authorHandle = t;
        }
      }
      description =
        ph.content?.pageHeaderViewModel?.description?.descriptionPreviewViewModel
          ?.description?.content || '';
    } else if (data.header?.c4TabbedHeaderRenderer) {
      const c4 = data.header.c4TabbedHeaderRenderer;
      author = c4.title || 'Chaîne';
      authorThumbnail =
        c4.avatar?.thumbnails?.[c4.avatar.thumbnails.length - 1]?.url || '';
      authorBanner =
        c4.banner?.thumbnails?.[c4.banner.thumbnails.length - 1]?.url || '';
      subCountText = c4.subscriberCountText?.simpleText || '';
    }

    // Video extractor
    const videos: any[] = [];
    const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    const videosTab =
      tabs.find((t: any) => t.tabRenderer?.selected) ||
      tabs.find((t: any) =>
        t.tabRenderer?.title?.toLowerCase().includes('vid')
      ) ||
      tabs[1] ||
      tabs[0];

    const contents =
      videosTab?.tabRenderer?.content?.richGridRenderer?.contents ||
      videosTab?.tabRenderer?.content?.sectionListRenderer?.contents ||
      [];

    let continuationToken: string | null = null;

    for (const item of contents) {
      if (item.continuationItemRenderer) {
        continuationToken =
          item.continuationItemRenderer.continuationEndpoint
            ?.continuationCommand?.token || null;
      }

      const lockup = item.richItemRenderer?.content?.lockupViewModel;
      if (lockup && lockup.contentId) {
        const videoId = lockup.contentId;
        const title =
          lockup.metadata?.lockupMetadataViewModel?.title?.content || 'Vidéo';
        const metadataRows =
          lockup.metadata?.lockupMetadataViewModel?.metadata
            ?.contentMetadataViewModel?.metadataRows || [];
        let viewCountText = '';
        let publishedText = 'Récemment';
        for (const row of metadataRows) {
          const parts = row.metadataParts || [];
          if (parts[0]?.text?.content) viewCountText = parts[0].text.content;
          if (parts[1]?.text?.content) publishedText = parts[1].text.content;
        }

        let views = 0;
        const numMatch = viewCountText
          .replace(/[\s\u202F\u00A0,.]/g, '')
          .match(/\d+/);
        if (numMatch) {
          if (viewCountText.includes('k') || viewCountText.includes('K'))
            views = parseInt(numMatch[0], 10) * 1000;
          else if (viewCountText.includes('M') || viewCountText.includes('m'))
            views = parseInt(numMatch[0], 10) * 1000000;
          else views = parseInt(numMatch[0], 10);
        }

        let lengthSec = 240;
        const overlays = lockup.contentImage?.thumbnailViewModel?.overlays || [];
        for (const ov of overlays) {
          const badge =
            ov.thumbnailOverlayBadgeViewModel?.thumbnailBadges?.[0]
              ?.thumbnailBadgeViewModel?.text;
          if (badge && badge.includes(':')) {
            const parts = badge.split(':').map(Number);
            if (parts.length === 2) lengthSec = parts[0] * 60 + parts[1];
            else if (parts.length === 3)
              lengthSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        }

        const thumb =
          lockup.contentImage?.thumbnailViewModel?.image?.sources?.slice(
            -1
          )[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        videos.push({
          type: 'video',
          videoId,
          title,
          author: author || 'Chaîne',
          authorId: rawId,
          authorThumbnails: authorThumbnail
            ? [{ quality: 'high', url: authorThumbnail, width: 88, height: 88 }]
            : [],
          videoThumbnails: [
            { quality: 'high', url: thumb, width: 480, height: 360 },
          ],
          description: '',
          viewCount: views,
          published: 0,
          publishedText,
          lengthSeconds: lengthSec,
        });
      }

      const vr = item.richItemRenderer?.content?.videoRenderer;
      if (vr && vr.videoId) {
        const videoId = vr.videoId;
        const title =
          vr.title?.runs?.[0]?.text || vr.title?.simpleText || 'Vidéo';
        const thumb =
          vr.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        videos.push({
          type: 'video',
          videoId,
          title,
          author: author || 'Chaîne',
          authorId: rawId,
          authorThumbnails: authorThumbnail
            ? [{ quality: 'high', url: authorThumbnail, width: 88, height: 88 }]
            : [],
          videoThumbnails: [
            { quality: 'high', url: thumb, width: 480, height: 360 },
          ],
          description: '',
          viewCount: 0,
          published: 0,
          publishedText: vr.publishedTimeText?.simpleText || 'Récemment',
          lengthSeconds: 240,
        });
      }
    }

    sendJson(res, 200, {
      author: author || 'Chaîne YouTube',
      authorId: rawId,
      authorHandle,
      authorThumbnail: authorThumbnail || '',
      authorBanner,
      subCountText: subCountText || '',
      description,
      videos,
      continuationToken,
      apiKey,
    });
  } catch (error: any) {
    sendJson(res, 502, { error: error.message || 'Channel failed', videos: [] });
  }
}
