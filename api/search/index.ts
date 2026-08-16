export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query?.q;
  const dateFilter = req.query?.date || 'all';
  const sortFilter = req.query?.sort || 'relevance';

  if (!query) {
    res.status(400).json({ error: 'Query parameter q is required', videos: [] });
    return;
  }

  try {
    let sp = '';
    if (sortFilter === 'upload_date') {
      if (dateFilter === 'today') sp = 'CAISBAgCEAE%3D';
      else if (dateFilter === 'week') sp = 'CAISBAgDEAE%3D';
      else if (dateFilter === 'month') sp = 'CAISBAgEEAE%3D';
      else if (dateFilter === 'year') sp = 'CAISBAgFEAE%3D';
      else sp = 'CAISAhAB';
    } else if (sortFilter === 'view_count') {
      sp = 'CAMSAhAB';
    } else if (sortFilter === 'rating') {
      sp = 'CAESAhAB';
    } else if (dateFilter === 'hour') {
      sp = 'EgIIAQ%3D%3D';
    } else if (dateFilter === 'today') {
      sp = 'EgIIAg%3D%3D';
    } else if (dateFilter === 'week') {
      sp = 'EgIIAw%3D%3D';
    } else if (dateFilter === 'month') {
      sp = 'EgIIBA%3D%3D';
    } else if (dateFilter === 'year') {
      sp = 'EgIIBQ%3D%3D';
    }

    const encodedQ = encodeURIComponent(query);
    const targetUrl = `https://www.youtube.com/results?search_query=${encodedQ}${sp ? `&sp=${sp}` : ''}`;
    const ytRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(6000),
    });

    const html = await ytRes.text();
    const keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    const apiKey = keyMatch ? keyMatch[1] : '';

    const match =
      html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s) ||
      html.match(/var ytInitialData\s*=\s*({.+?});/s);

    if (match) {
      const data = JSON.parse(match[1]);
      const sections =
        data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
          ?.contents || [];

      const videos: any[] = [];
      let correction: any = null;
      let continuationToken: string | null = null;

      for (const section of sections) {
        if (section.continuationItemRenderer) {
          continuationToken =
            section.continuationItemRenderer.continuationEndpoint
              ?.continuationCommand?.token || null;
        }

        const items = section.itemSectionRenderer?.contents || [];
        for (const item of items) {
          if (item.continuationItemRenderer) {
            continuationToken =
              item.continuationItemRenderer.continuationEndpoint
                ?.continuationCommand?.token || null;
          }

          if (item.showingResultsForRenderer) {
            const s = item.showingResultsForRenderer;
            const correctedText =
              s.correctedQuery?.runs?.map((r: any) => r.text).join('') ||
              s.correctedQueryEndpoint?.searchEndpoint?.query ||
              '';
            if (correctedText) {
              correction = {
                type: 'showing_results_for',
                correctedQuery: correctedText,
                originalQuery: s.originalQuery?.simpleText || query,
              };
            }
          }

          if (item.didYouMeanRenderer) {
            const d = item.didYouMeanRenderer;
            const correctedText =
              d.correctedQuery?.runs?.map((r: any) => r.text).join('') ||
              d.correctedQueryEndpoint?.searchEndpoint?.query ||
              '';
            if (correctedText) {
              correction = {
                type: 'did_you_mean',
                correctedQuery: correctedText,
                originalQuery: query,
              };
            }
          }

          if (item.videoRenderer) {
            const v = item.videoRenderer;

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
              v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer
                ?.thumbnail?.thumbnails || [];

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

        if (section.continuationItemRenderer) {
          continuationToken =
            section.continuationItemRenderer.continuationEndpoint
              ?.continuationCommand?.token || null;
        }
      }

      // Auto-fetch 2nd batch to return 30-40 rich results right away
      if (continuationToken && apiKey) {
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
                continuation: continuationToken,
              }),
              signal: AbortSignal.timeout(4000),
            }
          );

          if (moreRes.ok) {
            const sData = await moreRes.json();
            const actions =
              sData.onResponseReceivedCommands || sData.onResponseReceivedActions || [];
            continuationToken = null;

            for (const a of actions) {
              const contItems = a.appendContinuationItemsAction?.continuationItems || [];
              for (const ci of contItems) {
                if (ci.continuationItemRenderer) {
                  continuationToken =
                    ci.continuationItemRenderer.continuationEndpoint
                      ?.continuationCommand?.token || null;
                }

                const subItems = ci.itemSectionRenderer?.contents || [ci];
                for (const sub of subItems) {
                  if (sub.continuationItemRenderer) {
                    continuationToken =
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
          }
        } catch {}
      }

      res.status(200).json({ videos, correction, continuationToken, apiKey });
      return;
    }

    throw new Error('No search results parser match');
  } catch (error: any) {
    res.status(502).json({ error: error.message || 'Search failed', videos: [] });
  }
}
