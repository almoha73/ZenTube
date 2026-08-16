export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query?.q || '';

  if (!query || !query.trim()) {
    res.status(200).json([]);
    return;
  }

  try {
    const encodedQ = encodeURIComponent(query.trim());
    const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=fr&q=${encodedQ}`;
    const response = await fetch(suggestUrl, {
      signal: AbortSignal.timeout(3500),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
      res.status(200).json(suggestions);
      return;
    }
    throw new Error('Suggestion response not ok');
  } catch {
    res.status(200).json([]);
  }
}
