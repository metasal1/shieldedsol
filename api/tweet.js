export const config = {
  maxDuration: 30,
};

async function fetchTVL() {
  let privacyCashTvl = 0;
  let turbineTvl = 0;
  let solPrice = 180;
  let change = '';

  // Fetch SOL price
  try {
    const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const priceData = await priceRes.json();
    solPrice = priceData?.solana?.usd || 180;
  } catch (e) {
    console.error('Failed to fetch SOL price:', e);
  }

  // Fetch Privacy Cash TVL from DeFiLlama
  try {
    const apiRes = await fetch('https://api.llama.fi/protocol/privacy-cash');
    const data = await apiRes.json();
    privacyCashTvl = data?.currentChainTvls?.Solana || 0;

    // Calculate 24h change
    const history = data?.chainTvls?.Solana?.tvl || data?.tvl || [];
    if (history.length >= 2) {
      const current = history[history.length - 1]?.totalLiquidityUSD || 0;
      const yesterday = history[history.length - 2]?.totalLiquidityUSD || 0;
      if (yesterday > 0) {
        const pct = ((current - yesterday) / yesterday) * 100;
        const arrow = pct >= 0 ? '↑' : '↓';
        change = `${arrow}${Math.abs(pct).toFixed(1)}%`;
      }
    }
  } catch (e) {
    console.error('Failed to fetch Privacy Cash TVL:', e);
  }

  // Fetch Turbine ZSOL supply
  try {
    const rpcRes = await fetch('https://cassandra-bq5oqs-fast-mainnet.helius-rpc.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenSupply',
        params: ['zso1EF4k8HNteye34aD8w2Fm6pYVWMDgkgWCUrMLip1']
      })
    });
    const rpcData = await rpcRes.json();
    const zsolSupply = parseFloat(rpcData?.result?.value?.uiAmountString || '0');
    turbineTvl = zsolSupply * solPrice;
  } catch (e) {
    console.error('Failed to fetch Turbine ZSOL:', e);
  }

  const totalTvl = privacyCashTvl + turbineTvl;

  // Format TVL
  let tvlFormatted;
  if (totalTvl >= 1e6) {
    tvlFormatted = '$' + (totalTvl / 1e6).toFixed(2) + 'M';
  } else if (totalTvl >= 1e3) {
    tvlFormatted = '$' + (totalTvl / 1e3).toFixed(2) + 'K';
  } else {
    tvlFormatted = '$' + totalTvl.toFixed(2);
  }

  return { tvlFormatted, change, totalTvl };
}

async function postTweet(text) {
  const apiKey = process.env.TWEETAPI;
  const authToken = process.env.TWITTER_AUTH_TOKEN;

  if (!apiKey || !authToken) {
    throw new Error('TweetAPI credentials not configured');
  }

  const response = await fetch('https://api.tweetapi.com/tw-v2/interaction/create-post', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      authToken: authToken,
      text: text,
      proxy: process.env.TWEET_PROXY || ''
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`TweetAPI error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  // Verify this is a cron request or has proper authorization
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  // Allow Vercel cron or manual trigger with secret
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { tvlFormatted, change } = await fetchTVL();

    const tweetText = `Solana Privacy Pools TVL: ${tvlFormatted}${change ? ` (${change} 24h)` : ''}

Track privacy protocols live at shieldedsol.com`;

    const result = await postTweet(tweetText);

    console.log('Tweet posted successfully:', result);
    return res.status(200).json({
      success: true,
      tweet: tweetText,
      result: result
    });
  } catch (error) {
    console.error('Failed to post tweet:', error);
    return res.status(500).json({
      error: 'Failed to post tweet',
      message: error.message
    });
  }
}
