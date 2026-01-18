export default async function handler(req, res) {
  // Fetch TVL from DeFiLlama
  let tvl = '--';
  let change = '';

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
        const arrow = pct >= 0 ? '+' : '';
        change = `${arrow}${pct.toFixed(1)}%`;
      }
    }
  } catch (e) {
    console.error('Failed to fetch TVL:', e);
  }

  // Use dummyimage.com which renders text properly
  const text = `SHIELDED SOL|TVL: ${tvl}|24h: ${change}|Track at shieldedsol.com`;
  const encodedText = encodeURIComponent(text);
  const imageUrl = `https://dummyimage.com/1200x630/0f0f1a/9945ff.png&text=${encodedText}`;

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
    console.error('Image generation failed:', e);
  }

  // Fallback redirect
  res.redirect(307, imageUrl);
}
