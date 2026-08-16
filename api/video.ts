export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const videoId = req.query?.id;

  if (!videoId) {
    res.status(400).json({ error: 'Video ID parameter id is required' });
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

      res.status(200).json({
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
      });
      return;
    }

    throw new Error('Video player response not found');
  } catch (error: any) {
    res.status(502).json({ error: error.message || 'Video details failed' });
  }
}
