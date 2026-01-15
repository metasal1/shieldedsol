import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Fetch TVL from DeFiLlama
  let tvl = '$--';
  let change = '';
  let changeColor = '#666';
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

    // Calculate 24h change
    const history = data?.chainTvls?.Solana?.tvl || data?.tvl || [];
    if (history.length >= 2) {
      const current = history[history.length - 1]?.totalLiquidityUSD || 0;
      const yesterday = history[history.length - 2]?.totalLiquidityUSD || 0;
      if (yesterday > 0) {
        const pct = ((current - yesterday) / yesterday) * 100;
        const arrow = pct >= 0 ? '\u2191' : '\u2193';
        change = `${arrow} ${Math.abs(pct).toFixed(2)}% (24h)`;
        changeColor = pct >= 0 ? '#22c55e' : '#ef4444';
      }
    }
  } catch (e) {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '80px',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#9945FF',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              marginRight: '20px',
            }}
          >
            S
          </div>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
            Shielded Sol
          </span>
        </div>

        <div style={{ fontSize: '24px', color: '#666', marginBottom: '80px' }}>
          Solana Privacy Pools
        </div>

        <div style={{ fontSize: '18px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>
          Total Value Locked
        </div>

        <div style={{ fontSize: '96px', fontWeight: 'bold', color: '#9945FF', marginBottom: '10px' }}>
          {tvl}
        </div>

        <div style={{ fontSize: '24px', color: changeColor, marginBottom: '50px' }}>
          {change}
        </div>

        <div style={{ fontSize: '24px', color: '#444', marginBottom: '30px' }}>
          {protocols} protocols tracked
        </div>

        <div style={{ fontSize: '18px', color: '#333' }}>
          shieldedsol.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
