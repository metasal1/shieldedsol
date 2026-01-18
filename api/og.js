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
        const sign = pct >= 0 ? '%2B' : ''; // URL encoded +
        change = `${sign}${pct.toFixed(1)}%25 24h`; // %25 is URL encoded %
      }
    }
  } catch (e) {
    console.error('Failed to fetch TVL:', e);
  }

  // Build Cloudinary URL with text overlays
  // Using a solid color base image
  const baseUrl = 'https://res.cloudinary.com/demo/image/upload';

  // Text overlays - Cloudinary's l_text syntax
  const title = 'l_text:Arial_60_bold:Shielded%20Sol,co_white,g_north_west,x_80,y_80';
  const subtitle = 'l_text:Arial_28:Solana%20Privacy%20Pools,co_rgb:666666,g_north_west,x_80,y_160';
  const label = 'l_text:Arial_20:TOTAL%20VALUE%20LOCKED,co_rgb:666666,g_north_west,x_80,y_280';
  const tvlText = `l_text:Arial_90_bold:${encodeURIComponent(tvl)},co_rgb:9945FF,g_north_west,x_80,y_320`;
  const changeText = `l_text:Arial_32:${change},co_rgb:${change.includes('-') ? 'ef4444' : '22c55e'},g_north_west,x_80,y_440`;
  const cta = 'l_text:Arial_22_bold:Track%20Live%20TVL,co_white,g_south_east,x_100,y_60';
  const footer = 'l_text:Arial_20:shieldedsol.com,co_rgb:666666,g_south_west,x_80,y_60';

  // Solid dark background
  const imageUrl = `${baseUrl}/w_1200,h_630,c_fill,b_rgb:0f0f1a/${title}/${subtitle}/${label}/${tvlText}/${changeText}/${cta}/${footer}/sample.png`;

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

  // Fallback - simple placeholder
  const fallbackUrl = `https://placehold.co/1200x630/0f0f1a/9945FF/png?text=Shielded+Sol%0ATVL:+${encodeURIComponent(tvl)}`;
  res.redirect(307, fallbackUrl);
}
