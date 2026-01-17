import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Fetch TVL from DeFiLlama
  let tvl = '--';
  let change = '';
  let changeColor = '#888888';
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
        const arrow = isPositive ? '↑' : '↓';
        change = `${arrow} ${Math.abs(pct).toFixed(1)}%`;
        changeColor = isPositive ? '#22c55e' : '#ef4444';
      }
    }
  } catch (e) {
    console.error('Failed to fetch TVL:', e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1025 100%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header with Logo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          {/* Solana Shield Logo */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 500 500"
            style={{ marginRight: '24px' }}
          >
            <path
              d="M43.3934 115.601C44.8259 108.227 76.0746 90.9703 142.199 61.0331C195.388 36.9467 244.347 17.1336 250.995 17.0007C257.644 16.8677 306.603 36.4511 359.792 60.5133L456.5 104.274L455.551 152.368C454.36 212.46 435.333 290.201 410.334 337.098C388.986 377.148 327.147 439.168 282.419 465.382L253.8 482.148L222.237 465.212C204.878 455.892 171.441 429.231 147.935 405.961C102.355 360.84 80.1001 321.945 64.2884 259.792C53.04 215.573 40.6191 129.871 43.3934 115.601Z"
              fill="#000"
            />
            <path
              d="M351.916 274.073L317.744 310.489C317.005 311.28 316.11 311.912 315.114 312.344C314.119 312.776 313.045 312.999 311.959 313H149.97C149.198 313 148.442 312.775 147.796 312.354C147.149 311.934 146.641 311.335 146.332 310.631C146.023 309.927 145.927 309.149 146.056 308.392C146.185 307.635 146.533 306.932 147.059 306.368L181.192 269.952C181.931 269.161 182.826 268.53 183.821 268.098C184.817 267.666 185.891 267.442 186.977 267.441H348.965C349.745 267.425 350.512 267.639 351.17 268.055C351.828 268.471 352.347 269.071 352.662 269.78C352.978 270.489 353.075 271.275 352.942 272.039C352.81 272.803 352.452 273.51 351.916 274.073ZM317.744 200.722C317.002 199.935 316.106 199.306 315.112 198.874C314.117 198.443 313.044 198.217 311.959 198.211H149.97C149.198 198.212 148.442 198.436 147.796 198.857C147.149 199.278 146.641 199.877 146.332 200.581C146.023 201.284 145.927 202.062 146.056 202.819C146.185 203.576 146.533 204.28 147.059 204.843L181.192 241.279C181.934 242.066 182.83 242.695 183.824 243.126C184.819 243.558 185.892 243.784 186.977 243.79H348.965C349.736 243.786 350.489 243.558 351.133 243.136C351.776 242.714 352.282 242.115 352.589 241.412C352.895 240.709 352.989 239.932 352.86 239.177C352.73 238.422 352.382 237.72 351.858 237.158L317.744 200.722ZM149.97 174.56H311.959C313.045 174.559 314.119 174.335 315.114 173.903C316.11 173.471 317.005 172.84 317.744 172.049L351.916 135.632C352.316 135.212 352.618 134.708 352.801 134.158C352.982 133.607 353.04 133.024 352.968 132.449C352.897 131.874 352.699 131.322 352.388 130.832C352.077 130.342 351.661 129.926 351.169 129.614C350.512 129.198 349.745 128.985 348.965 129.001H186.977C185.891 129.002 184.817 129.226 183.821 129.658C182.826 130.09 181.931 130.721 181.192 131.512L147.059 167.928C146.533 168.491 146.185 169.195 146.056 169.952C145.927 170.709 146.023 171.487 146.332 172.191C146.641 172.895 147.149 173.493 147.796 173.914C148.442 174.335 149.198 174.559 149.97 174.56Z"
              fill="white"
            />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
              Shielded Sol
            </span>
            <span style={{ fontSize: '24px', color: '#666666' }}>
              Solana Privacy Pools
            </span>
          </div>
        </div>

        {/* TVL Label */}
        <div
          style={{
            fontSize: '18px',
            color: '#666666',
            letterSpacing: '3px',
            marginTop: '40px',
            marginBottom: '16px',
          }}
        >
          TOTAL VALUE LOCKED
        </div>

        {/* TVL Value */}
        <div
          style={{
            fontSize: '96px',
            fontWeight: 'bold',
            color: '#9945FF',
            marginBottom: '16px',
          }}
        >
          {tvl}
        </div>

        {/* 24h Change */}
        <div
          style={{
            fontSize: '32px',
            color: changeColor,
            marginBottom: '40px',
          }}
        >
          {change} (24h)
        </div>

        {/* Footer with CTA */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginTop: 'auto',
          }}
        >
          <span style={{ fontSize: '20px', color: '#444444' }}>
            shieldedsol.com
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#9945FF',
              padding: '12px 24px',
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '18px', color: 'white', fontWeight: '600' }}>
              Track Live TVL →
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
