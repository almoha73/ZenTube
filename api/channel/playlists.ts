export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const channelId = req.query?.id;

  if (!channelId || !channelId.trim()) {
    res.status(400).json({ error: 'Channel ID is required', playlists: [] });
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

    res.status(200).json({ playlists });
  } catch (error: any) {
    res.status(502).json({ error: error.message || 'Playlists failed', playlists: [] });
  }
}
