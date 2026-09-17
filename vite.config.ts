import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

// Custom Vite plugin providing search, metadata, suggestions, channel details, playlists, channel search & Invidious proxy endpoints
function invidiousProxyPlugin(): Plugin {
  return {
    name: 'invidious-proxy',
    configureServer(server) {
      // 1. Live Auto-suggestions Endpoint /api/suggest?q=...
      server.middlewares.use('/api/suggest', async (req: any, res: any) => {
        const host = req.headers?.host || 'localhost:5173';
        const urlObj = new URL(req.url || '', `http://${host}`);
        const query = urlObj.searchParams.get('q');

        if (!query || !query.trim()) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify([]));
          return;
        }

        try {
          const encodedQ = encodeURIComponent(query.trim());
          const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=fr&q=${encodedQ}`;
          const response = await fetch(suggestUrl, {
            signal: AbortSignal.timeout(3000),
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(suggestions));
            return;
          }
          throw new Error('Suggestion response not ok');
        } catch {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify([]));
        }
      });

      // Google Drive Status Endpoint /api/gdrive-status
      server.middlewares.use('/api/gdrive-status', (_req: any, res: any) => {
        console.log('>>> HIT /api/gdrive-status');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ available: true }));
      });

      // Google Drive Sync Endpoint /api/gdrive-sync
      server.middlewares.use('/api/gdrive-sync', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const backupDir = path.join(process.env.HOME || '/home/agnes', '.local/share/zentube');
            if (!fs.existsSync(backupDir)) {
              fs.mkdirSync(backupDir, { recursive: true });
            }

            const jsonPath = path.join(backupDir, 'zentube-favoris.json');
            fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

            // Generate an elegant mobile-friendly HTML file with clickable links
            const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mes Favoris ZenTube</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0f17; color: #f1f5f9; padding: 24px; max-width: 900px; margin: 0 auto; }
    h1 { color: #ff0033; display: flex; align-items: center; gap: 10px; font-size: 24px; }
    h2 { font-size: 18px; margin-top: 32px; border-bottom: 1px solid #1e293b; padding-bottom: 8px; color: #94a3b8; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 16px; }
    .card { background: #151a28; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; transition: transform 0.2s, border-color 0.2s; display: flex; flex-direction: column; }
    .card:hover { transform: translateY(-2px); border-color: #ff0033; }
    .thumb { width: 100%; aspect-ratio: 16/9; object-fit: cover; background: #000; }
    .info { padding: 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .title { font-size: 14px; font-weight: 600; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .author { font-size: 12px; color: #94a3b8; }
    .badge { display: inline-block; font-size: 10px; font-weight: bold; background: #ff0033; color: white; padding: 2px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 4px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <h1>🎬 Mes Favoris ZenTube</h1>
  <p style="color: #94a3b8; font-size: 14px;">Sauvegarde synchronisée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>

  <h2>📺 Vidéos Favorites (${data.favorites?.length || 0})</h2>
  <div class="grid">
    ${(data.favorites || [])
      .map(
        (v: any) => `
      <a href="https://www.youtube.com/watch?v=${v.videoId}" target="_blank" rel="noopener" class="card">
        <img class="thumb" src="${v.thumbnailUrl || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`}" loading="lazy" alt="" />
        <div class="info">
          <span class="title">${v.title || 'Vidéo'}</span>
          <span class="author">${v.author || ''}</span>
        </div>
      </a>`
      )
      .join('')}
  </div>

  <h2>📋 Playlists Favorites (${data.favoritePlaylists?.length || 0})</h2>
  <div class="grid">
    ${(data.favoritePlaylists || [])
      .map(
        (p: any) => `
      <a href="https://www.youtube.com/playlist?list=${p.playlistId}" target="_blank" rel="noopener" class="card">
        <img class="thumb" src="${p.thumbnailUrl || ''}" loading="lazy" alt="" />
        <div class="info">
          <span class="badge">PLAYLIST (${p.videoCount || 0})</span>
          <span class="title">${p.title || 'Playlist'}</span>
          <span class="author">${p.author || ''}</span>
        </div>
      </a>`
      )
      .join('')}
  </div>

  <h2>📺 Chaînes & Abonnements (${data.subscriptions?.length || 0})</h2>
  <div class="grid">
    ${(data.subscriptions || [])
      .map((s: any) => {
        const id = typeof s === 'string' ? s : s.authorId || '';
        const name = typeof s === 'string' ? (s.startsWith('@') ? s : 'Chaîne ' + s.slice(0, 8)) : s.author || 'Chaîne';
        const thumb = typeof s === 'object' && s.authorThumbnail ? s.authorThumbnail : 'https://www.youtube.com/s/desktop/28dd0306/img/logos/favicon_144x144.png';
        const link = id.startsWith('@') ? `https://www.youtube.com/${id}` : `https://www.youtube.com/channel/${id}`;
        return `
      <a href="${link}" target="_blank" rel="noopener" class="card" style="flex-direction: row; align-items: center; padding: 12px; gap: 12px;">
        <img src="${thumb}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: #242b3d;" loading="lazy" alt="" />
        <div style="display: flex; flex-direction: column;">
          <span class="title" style="font-size: 14px;">${name}</span>
          <span style="font-size: 11px; color: #94a3b8;">${id}</span>
        </div>
      </a>`;
      })
      .join('')}
  </div>

  <div class="footer">
    ZenTube - Sauvegardé automatiquement dans Google Drive / ZenTube
  </div>
</body>
</html>`;

            const htmlPath = path.join(backupDir, 'Mes_Favoris_ZenTube.html');
            fs.writeFileSync(htmlPath, htmlContent, 'utf-8');

            // Copy to Google Drive using rclone
            exec(`rclone copy "${backupDir}" "gdrive:ZenTube/"`, (err) => {
              if (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ error: "Échec de l'envoi vers Google Drive." }));
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(
                JSON.stringify({
                  success: true,
                  message: 'Favoris synchronisés sur Google Drive avec succès !',
                })
              );
            });
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });

      // Google Drive Restore Endpoint /api/gdrive-restore
      server.middlewares.use('/api/gdrive-restore', async (_req: any, res: any) => {
        exec(
          'rclone cat "gdrive:ZenTube/zentube-favoris.json"',
          { maxBuffer: 10 * 1024 * 1024 },
          (err, stdout) => {
            if (err) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(
                JSON.stringify({ error: 'Aucune sauvegarde trouvée dans le dossier Google Drive ZenTube.' })
              );
              return;
            }

            try {
              const data = JSON.parse(stdout);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true, data }));
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ error: 'Données de sauvegarde invalides.' }));
            }
          }
        );
      });

      // 2. Direct Search Endpoint with Multi-batch Aggregation, Filters & Spelling Correction /api/search?q=...&date=...&sort=...
      server.middlewares.use('/api/search', async (req: any, res: any, next: any) => {
        const host = req.headers?.host || 'localhost:5173';
        const urlObj = new URL(req.url || '', `http://${host}`);

        if (urlObj.pathname === '/more') {
          return next();
        }

        const query = urlObj.searchParams.get('q');
        const dateFilter = urlObj.searchParams.get('date') || 'all';
        const sortFilter = urlObj.searchParams.get('sort') || 'relevance';

        if (!query) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Query parameter q is required' }));
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

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ videos, correction, continuationToken, apiKey }));
            return;
          }

          throw new Error('No search results parser match');
        } catch (error: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: error.message || 'Search failed', videos: [] }));
        }
      });

      // 3. Search Load More Videos Endpoint /api/search/more?token=...&apiKey=...
      server.middlewares.use('/api/search/more', async (req: any, res: any) => {
        const host = req.headers?.host || 'localhost:5173';
        const urlObj = new URL(req.url || '', `http://${host}`);
        const token = urlObj.searchParams.get('token');
        const apiKey = urlObj.searchParams.get('apiKey') || '';

        if (!token) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Continuation token required' }));
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

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ videos, nextContinuation }));
        } catch (error: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({ error: error.message || 'Search load more failed', videos: [] })
          );
        }
      });

      // 3. Channel Details & Initial Videos Endpoint /api/channel?id=...
      server.middlewares.use('/api/channel', async (req: any, res: any, next: any) => {
        const host = req.headers?.host || 'localhost:5173';
        const urlObj = new URL(req.url || '', `http://${host}`);

        // Check if this is a subpath
        if (
          urlObj.pathname === '/more' ||
          urlObj.pathname === '/playlists' ||
          urlObj.pathname === '/search'
        ) {
          return next();
        }

        const channelId = urlObj.searchParams.get('id');

        if (!channelId || !channelId.trim()) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Channel ID is required' }));
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

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({
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
            })
          );
        } catch (error: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: error.message || 'Channel failed', videos: [] }));
        }
      });

      // 4. Channel Load More Videos Endpoint /api/channel/more
      server.middlewares.use('/api/channel/more', async (req: any, res: any) => {
        const host = req.headers?.host || 'localhost:5173';
        const urlObj = new URL(req.url || '', `http://${host}`);
        const token = urlObj.searchParams.get('token');
        const apiKey = urlObj.searchParams.get('apiKey') || '';
        const author = urlObj.searchParams.get('author') || 'Chaîne';
        const authorId = urlObj.searchParams.get('authorId') || '';

        if (!token) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Continuation token required' }));
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

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ videos, nextContinuation }));
        } catch (error: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: error.message || 'Load more failed', videos: [] }));
        }
      });

      // 5. Channel Playlists Endpoint /api/channel/playlists?id=...
      server.middlewares.use('/api/channel/playlists', async (req: any, res: any) => {
        const host = req.headers?.host || 'localhost:5173';
        const urlObj = new URL(req.url || '', `http://${host}`);
        const channelId = urlObj.searchParams.get('id');

        if (!channelId || !channelId.trim()) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Channel ID is required' }));
          return;
        }

        try {
          const rawId = channelId.trim().replace(/^\/channel\//, '').replace(/^\/c\//, '').replace(/^\/user\//, '');
          let targetUrl = rawId.startsWith('@')
            ? `https://www.youtube.com/${rawId}/playlists`
            : rawId.startsWith('UC')
            ? `https://www.youtube.com/channel/${rawId}/playlists`
            : `https://www.youtube.com/@${rawId.replace(/\s+/g, '')}/playlists`;

          const ytRes = await fetch(targetUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            signal: AbortSignal.timeout(6000),
          });

          const html = await ytRes.text();
          const match =
            html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s) ||
            html.match(/var ytInitialData\s*=\s*({.+?});/s);

          if (!match) {
            throw new Error('Channel playlists data not found');
          }

          const data = JSON.parse(match[1]);
          const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
          const playlistsTab =
            tabs.find((t: any) => t.tabRenderer?.selected) ||
            tabs.find((t: any) =>
              t.tabRenderer?.title?.toLowerCase().includes('playlist')
            );
          const sectionList =
            playlistsTab?.tabRenderer?.content?.sectionListRenderer?.contents || [];

          const playlists: any[] = [];
          for (const s of sectionList) {
            const gridItems =
              s.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items || [];
            for (const item of gridItems) {
              const lockup = item.lockupViewModel;
              const gpr = item.gridPlaylistRenderer;
              if (lockup && lockup.contentId) {
                const title =
                  lockup.metadata?.lockupMetadataViewModel?.title?.content ||
                  'Playlist';
                const thumb =
                  lockup.contentImage?.collectionThumbnailViewModel
                    ?.primaryThumbnail?.thumbnailViewModel?.image?.sources?.slice(
                      -1
                    )[0]?.url;
                const count =
                  lockup.contentImage?.collectionThumbnailViewModel
                    ?.primaryThumbnail?.thumbnailBadgeViewModel?.text ||
                  'Playlist';
                const firstVideoId =
                  lockup.itemPlayback?.inlinePlayerData?.onSelect
                    ?.innertubeCommand?.watchEndpoint?.videoId;
                playlists.push({
                  playlistId: lockup.contentId,
                  title,
                  videoCount: count,
                  thumbnailUrl: thumb,
                  firstVideoId,
                });
              } else if (gpr && gpr.playlistId) {
                playlists.push({
                  playlistId: gpr.playlistId,
                  title:
                    gpr.title?.runs?.[0]?.text ||
                    gpr.title?.simpleText ||
                    'Playlist',
                  videoCount:
                    gpr.videoCountText?.runs?.[0]?.text ||
                    gpr.videoCountShortText?.simpleText ||
                    'Playlist',
                  thumbnailUrl: gpr.thumbnail?.thumbnails?.slice(-1)[0]?.url,
                  firstVideoId: gpr.navigationEndpoint?.watchEndpoint?.videoId,
                });
              }
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ playlists }));
        } catch (error: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({ error: error.message || 'Playlists failed', playlists: [] })
          );
        }
      });

      // 6. Channel Search Endpoint /api/channel/search?id=...&q=...
      server.middlewares.use('/api/channel/search', async (req: any, res: any) => {
        const host = req.headers?.host || 'localhost:5173';
        const urlObj = new URL(req.url || '', `http://${host}`);
        const channelId = urlObj.searchParams.get('id');
        const query = urlObj.searchParams.get('q');

        if (!channelId || !query || !query.trim()) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Channel ID and query q are required' }));
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
                  videoId,
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

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ videos }));
        } catch (error: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: error.message || 'Channel search failed', videos: [] }));
        }
      });

      // 7. Single Playlist Videos Endpoint /api/playlist?id=...
      server.middlewares.use('/api/playlist', async (req: any, res: any) => {
        const host = req.headers?.host || 'localhost:5173';
        const urlObj = new URL(req.url || '', `http://${host}`);
        const playlistId = urlObj.searchParams.get('id');

        if (!playlistId || !playlistId.trim()) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Playlist ID is required' }));
          return;
        }

        try {
          const ytRes = await fetch(
            `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId.trim())}`,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
              },
              signal: AbortSignal.timeout(6000),
            }
          );

          const html = await ytRes.text();
          const match =
            html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s) ||
            html.match(/var ytInitialData\s*=\s*({.+?});/s);

          if (!match) {
            throw new Error('Playlist data not found');
          }

          const data = JSON.parse(match[1]);
          const header =
            data.header?.playlistHeaderRenderer || data.header?.pageHeaderRenderer;
          const title =
            data.metadata?.playlistMetadataRenderer?.title ||
            header?.title?.simpleText ||
            header?.content?.pageHeaderViewModel?.title?.dynamicTextViewModel?.text
              ?.content ||
            'Playlist';
          const author =
            header?.ownerText?.runs?.[0]?.text ||
            header?.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel
              ?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content ||
            '';

          const isrContents =
            data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
              ?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer
              ?.contents || [];

          const videos: any[] = [];
          for (const item of isrContents) {
            const lockup = item.lockupViewModel;
            const vr = item.playlistVideoRenderer || item.videoRenderer;
            if (lockup && lockup.contentId) {
              const videoId = lockup.contentId;
              const vTitle =
                lockup.metadata?.lockupMetadataViewModel?.title?.content || 'Vidéo';
              const thumb =
                lockup.contentImage?.thumbnailViewModel?.image?.sources?.slice(
                  -1
                )[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              const metadataRows =
                lockup.metadata?.lockupMetadataViewModel?.metadata
                  ?.contentMetadataViewModel?.metadataRows || [];
              let vAuthor = author;
              for (const row of metadataRows) {
                for (const part of row.metadataParts || []) {
                  if (part.text?.content && !part.text.content.includes('vues') && !part.text.content.includes('views') && !part.text.content.includes('il y a')) {
                    vAuthor = part.text.content;
                  }
                }
              }
              videos.push({
                type: 'video',
                videoId,
                title: vTitle,
                author: vAuthor,
                videoThumbnails: [
                  { quality: 'high', url: thumb, width: 480, height: 360 },
                ],
                description: '',
                viewCount: 0,
                published: 0,
                publishedText: 'Playlist',
                lengthSeconds: 240,
              });
            } else if (vr && vr.videoId) {
              videos.push({
                type: 'video',
                videoId: vr.videoId,
                title:
                  vr.title?.runs?.[0]?.text || vr.title?.simpleText || 'Vidéo',
                author: vr.shortBylineText?.runs?.[0]?.text || author,
                videoThumbnails: [
                  {
                    quality: 'high',
                    url:
                      vr.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                      `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
                    width: 480,
                    height: 360,
                  },
                ],
                description: '',
                viewCount: 0,
                published: 0,
                publishedText: 'Playlist',
                lengthSeconds: 240,
              });
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({
              playlistId,
              title,
              author,
              videos,
            })
          );
        } catch (error: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({ error: error.message || 'Playlist failed', videos: [] })
          );
        }
      });

      // 8. Video Details Endpoint /api/video?id=...
      server.middlewares.use('/api/video', async (req: any, res: any) => {
        const host = req.headers?.host || 'localhost:5173';
        const urlObj = new URL(req.url || '', `http://${host}`);
        const videoId = urlObj.searchParams.get('id');

        if (!videoId) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Video ID parameter id is required' }));
          return;
        }

        try {
          const ytRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            signal: AbortSignal.timeout(6000),
          });

          const html = await ytRes.text();
          const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);

          if (playerMatch) {
            const player = JSON.parse(playerMatch[1]);
            const details = player.videoDetails;

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(
              JSON.stringify({
                videoId: details.videoId || videoId,
                title: details.title || 'Sans titre',
                author: details.author || 'Chaîne',
                authorId: details.channelId || '',
                description: details.shortDescription || '',
                viewCount: parseInt(details.viewCount || '0', 10),
                lengthSeconds: parseInt(details.lengthSeconds || '0', 10),
                videoThumbnails: details.thumbnail?.thumbnails || [
                  {
                    quality: 'high',
                    url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    width: 480,
                    height: 360,
                  },
                ],
                genre: 'Musique',
                keywords: details.keywords || [],
              })
            );
            return;
          }

          throw new Error('Video player response not found');
        } catch (error: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: error.message || 'Video details failed' }));
        }
      });

      // 9. Generic Invidious Proxy /api/proxy?url=...
      server.middlewares.use('/api/proxy', async (req: any, res: any) => {
        const host = req.headers?.host || 'localhost:5173';
        const urlObj = new URL(req.url || '', `http://${host}`);
        const targetUrl = urlObj.searchParams.get('url');

        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/json',
            },
          });

          clearTimeout(timeout);

          const data = await response.text();
          res.statusCode = response.status;
          res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.end(data);
        } catch (error: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: error.message || 'Proxy request failed' }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), invidiousProxyPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
