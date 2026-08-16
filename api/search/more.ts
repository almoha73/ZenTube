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

  if (!token) {
    sendJson(res, 400, { error: 'Continuation token required', videos: [] });
    return;
  }

  try {
    const moreRes = await fetch(
      `https://www.youtube.com/youtubei/v1/search?key=${apiKey}`,
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

    const sData = await moreRes.json();
    const actions =
      sData.onResponseReceivedCommands || sData.onResponseReceivedActions || [];
    const videos: any[] = [];
    let nextContinuation: string | null = null;

    for (const a of actions) {
      const contItems = a.appendContinuationItemsAction?.continuationItems || [];
      for (const ci of contItems) {
        if (ci.continuationItemRenderer) {
          nextContinuation =
            ci.continuationItemRenderer.continuationEndpoint
              ?.continuationCommand?.token || null;
        }

        const subItems = ci.itemSectionRenderer?.contents || [ci];
        for (const sub of subItems) {
          if (sub.continuationItemRenderer) {
            nextContinuation =
              sub.continuationItemRenderer.continuationEndpoint
                ?.continuationCommand?.token || null;
          }

          if (sub.videoRenderer) {
            const v = sub.videoRenderer;
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

            const chThumb =
              v.channelThumbnailSupportedRenderers
                ?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails || [];

            videos.push({
              type: 'video',
              videoId: v.videoId,
              title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'Sans titre',
              author: v.ownerText?.runs?.[0]?.text || 'Auteur inconnu',
              authorId:
                v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
              authorUrl: `/channel/${v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || ''}`,
              authorThumbnails: chThumb,
              videoThumbnails: [
                { quality: 'high', url: thumb, width: 480, height: 360 },
              ],
              description:
                v.detailedMetadataSnippets?.[0]?.snippetText?.runs
                  ?.map((r: any) => r.text)
                  .join('') || '',
              viewCount: views,
              published: 0,
              publishedText: v.publishedTimeText?.simpleText || 'Récemment',
              lengthSeconds: lengthSec,
              liveNow: !!v.badges?.some(
                (b: any) =>
                  b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW'
              ),
            });
          }
        }
      }
    }

    sendJson(res, 200, { videos, nextContinuation });
  } catch (error: any) {
    sendJson(res, 502, { error: error.message || 'Search load more failed', videos: [] });
  }
}
