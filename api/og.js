export default async function handler(req, res) {
  // Fetch TVL from DeFiLlama
  let tvl = '--';
  let change = '';
  let isPositive = true;

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
        isPositive = pct >= 0;
        change = `${isPositive ? '+' : ''}${pct.toFixed(1)}% 24h`;
      }
    }
  } catch (e) {
    console.error('Failed to fetch TVL:', e);
  }

  // Use placehold.co with proper formatting
  const line1 = 'SHIELDED SOL';
  const line2 = `TVL: ${tvl}`;
  const line3 = change || '';
  const line4 = 'shieldedsol.com';

  // Combine lines with newlines
  const text = encodeURIComponent(`${line1}\n\n${line2}\n${line3}\n\n${line4}`);

  // placehold.co supports newlines and custom fonts
  const imageUrl = `https://placehold.co/1200x630/0f0f1a/9945FF.png?text=${text}&font=roboto`;

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

  // Fallback redirect
  res.redirect(307, imageUrl);
}
