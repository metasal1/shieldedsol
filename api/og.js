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
        change = ` (${arrow}${pct.toFixed(1)}%)`;
      }
    }
  } catch (e) {}

  // Generate image using placehold.co and proxy it
  const text = encodeURIComponent(`Shielded Sol\\nTVL: ${tvl}${change}\\n\\nSolana Privacy Pools`);
  const imageUrl = `https://placehold.co/1200x630/0f0f1a/9945FF.png?text=${text}&font=source-code-pro`;

  try {
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error('Image fetch failed');
    const imageBuffer = await imageRes.arrayBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).send(Buffer.from(imageBuffer));
  } catch (e) {
    // Fallback - return a basic placeholder
    const fallbackUrl = 'https://placehold.co/1200x630/0f0f1a/9945FF.png?text=Shielded+Sol&font=source-code-pro';
    res.redirect(307, fallbackUrl);
  }
}
