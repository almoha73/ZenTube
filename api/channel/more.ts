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
  const token = params.token;
  const apiKey = params.apiKey || '';
  const author = params.author || 'Chaîne';
  const authorId = params.authorId || '';

  if (!token) {
    sendJson(res, 400, { error: 'Continuation token required', videos: [] });
    return;
  }

  try {
    const browseRes = await fetch(
      `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cookie': 'SOCS=CAESEwgDEgk2ODE4NDMzMjEaAmZyIAEaBgiA_L20Bg; CONSENT=PENDING+999; YES+cb.20210328-17-p0.fr+FX+999',
          'X-YouTube-Client-Name': '1',
          'X-YouTube-Client-Version': '2.20260813.05.00',
        },
        body: JSON.stringify({
          context: {
            client: {
              hl: 'fr',
              gl: 'FR',
              clientName: 'WEB',
              clientVersion: '2.20260813.05.00',
            },
          },
          continuation: token,
        }),
        signal: AbortSignal.timeout(6000),
      }
    );

    const browseData = await browseRes.json();
    const items =
      browseData.onResponseReceivedActions?.[0]?.appendContinuationItemsAction
        ?.continuationItems || [];

    const videos: any[] = [];
    let nextContinuation: string | null = null;

    for (const item of items) {
      if (item.continuationItemRenderer) {
        nextContinuation =
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
          author,
          authorId,
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
    }

    sendJson(res, 200, { videos, nextContinuation });
  } catch (error: any) {
    sendJson(res, 502, { error: error.message || 'Load more failed', videos: [] });
  }
}
