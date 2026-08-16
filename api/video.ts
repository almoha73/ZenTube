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
  const videoId = params.id;

  if (!videoId) {
    sendJson(res, 400, { error: 'Video ID parameter id is required' });
    return;
  }

  try {
    const ytRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cookie': 'SOCS=CAESEwgDEgk2ODE4NDMzMjEaAmZyIAEaBgiA_L20Bg; CONSENT=PENDING+999; YES+cb.20210328-17-p0.fr+FX+999',
      },
      signal: AbortSignal.timeout(6000),
    });

    const html = await ytRes.text();
    const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);

    if (playerMatch) {
      const player = JSON.parse(playerMatch[1]);
      const details = player.videoDetails;

      sendJson(res, 200, {
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
    sendJson(res, 502, { error: error.message || 'Video details failed' });
  }
}
