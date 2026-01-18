export default async function handler(req, res) {
  // Fetch TVL from DeFiLlama
  let tvl = '--';
  let change = '';
  let changeColor = '22c55e';

  try {
    const apiRes = await fetch('https://api.llama.fi/protocol/privacy-cash');
    const data = await apiRes.json();
    const tvlVal = data?.currentChainTvls?.Solana || 0;
    if (tvlVal >= 1e6) {
      tvl = '$' + (tvlVal / 1e6).toFixed(2) + 'M';
    } else if (tvlVal >= 1e3) {
      tvl = '$' + (tvlVal / 1e3).toFixed(2) + 'K';
    } else if (tvlVal > 0) {
      tvl = '$' + tvlVal.toFixed(2);
    }

    const history = data?.chainTvls?.Solana?.tvl || data?.tvl || [];
    if (history.length >= 2) {
      const current = history[history.length - 1]?.totalLiquidityUSD || 0;
      const yesterday = history[history.length - 2]?.totalLiquidityUSD || 0;
      if (yesterday > 0) {
        const pct = ((current - yesterday) / yesterday) * 100;
        const isPositive = pct >= 0;
        change = `${isPositive ? '%2B' : ''}${pct.toFixed(1)}%25%2024h`;
        changeColor = isPositive ? '22c55e' : 'ef4444';
      }
    }
  } catch (e) {
    console.error('Failed to fetch TVL:', e);
  }

  // Use Cloudinary to fetch base image and overlay text
  // Base image URL (hosted logo on dark background)
  const baseImageUrl = 'https://shieldedsol.com/og-base.png';

  // Cloudinary transformations for text overlay
  const cloudinaryBase = 'https://res.cloudinary.com/demo/image/fetch';

  // Text overlays
  const tvlOverlay = `l_text:Arial_80_bold:${encodeURIComponent(tvl)},co_rgb:9945FF,g_west,x_80,y_50`;
  const changeOverlay = `l_text:Arial_28:${change},co_rgb:${changeColor},g_west,x_80,y_130`;

  const imageUrl = `${cloudinaryBase}/${tvlOverlay}/${changeOverlay}/${encodeURIComponent(baseImageUrl)}`;

  try {
    const pngRes = await fetch(imageUrl);
    if (pngRes.ok) {
      const pngBuffer = await pngRes.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.status(200).send(Buffer.from(pngBuffer));
      return;
    }
  } catch (e) {
    console.error('Image fetch failed:', e);
  }

  // Fallback to placehold.co
  const fallbackText = encodeURIComponent(`SHIELDED SOL\n\nTVL: ${tvl}\n${change.replace(/%2B/g, '+').replace(/%25/g, '%').replace(/%20/g, ' ')}\n\nshieldedsol.com`);
  const fallbackUrl = `https://placehold.co/1200x630/0f0f1a/9945FF.png?text=${fallbackText}&font=roboto`;
  res.redirect(307, fallbackUrl);
}
