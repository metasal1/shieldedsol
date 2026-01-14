export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Fetch TVL from DeFiLlama
  let tvl = '$--';
  let protocols = 6;
  try {
    const res = await fetch('https://api.llama.fi/protocol/privacy-cash');
    const data = await res.json();
    const tvlVal = data?.currentChainTvls?.Solana || 0;
    if (tvlVal >= 1e6) {
      tvl = '$' + (tvlVal / 1e6).toFixed(2) + 'M';
    } else if (tvlVal >= 1e3) {
      tvl = '$' + (tvlVal / 1e3).toFixed(2) + 'K';
    } else if (tvlVal > 0) {
      tvl = '$' + tvlVal.toFixed(2);
    }
  } catch (e) {}

  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0f"/>
          <stop offset="100%" style="stop-color:#1a1a2e"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect x="80" y="80" width="80" height="80" rx="20" fill="#9945FF"/>
      <text x="120" y="140" font-family="monospace" font-size="48" fill="white" text-anchor="middle" font-weight="bold">S</text>
      <text x="180" y="140" font-family="monospace" font-size="48" fill="white" font-weight="bold">Shielded Sol</text>
      <text x="80" y="200" font-family="monospace" font-size="24" fill="#666">Solana Privacy Pools</text>
      <text x="80" y="320" font-family="monospace" font-size="18" fill="#666" text-transform="uppercase" letter-spacing="2">Total Value Locked</text>
      <text x="80" y="400" font-family="monospace" font-size="96" fill="#9945FF" font-weight="bold">${tvl}</text>
      <text x="80" y="500" font-family="monospace" font-size="24" fill="#444">${protocols} protocols tracked</text>
      <text x="80" y="570" font-family="monospace" font-size="18" fill="#333">shieldedsol.vercel.app</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
