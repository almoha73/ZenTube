export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const playlistId = req.query?.id;

  if (!playlistId || !playlistId.trim()) {
    res.status(400).json({ error: 'Playlist ID is required', videos: [] });
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

    res.status(200).json({
      playlistId,
      title,
      author,
      videos,
    });
  } catch (error: any) {
    res.status(502).json({ error: error.message || 'Playlist failed', videos: [] });
  }
}
