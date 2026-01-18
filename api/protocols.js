export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  let solPrice = 180;
  let bonkPrice = 0;

  // Fetch SOL and BONK prices in one call
  try {
    const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,bonk&vs_currencies=usd');
    const priceData = await priceRes.json();
    solPrice = priceData?.solana?.usd || 180;
    bonkPrice = priceData?.bonk?.usd || 0;
  } catch (e) {
    console.error('Price fetch error:', e);
  }

  // Fetch Turbine ZSOL supply
  let turbineZsol = 0;
  try {
    const turbineRes = await fetch('https://cassandra-bq5oqs-fast-mainnet.helius-rpc.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'getTokenSupply',
        jsonrpc: '2.0',
        params: ['zso1EF4k8HNteye34aD8w2Fm6pYVWMDgkgWCUrMLip1'],
        id: '1'
      })
    });
    const turbineData = await turbineRes.json();
    turbineZsol = turbineData?.result?.value?.uiAmount || 0;
  } catch (e) {
    console.error('Turbine fetch error:', e);
  }

  // Radr pool addresses and their expected token mints
  const radrPools = {
    SOL: { address: 'ApfNmzrNXLUQ5yWpQVmrCB4MNsaRqjsFrLXViBq2rBU', mint: 'So11111111111111111111111111111111111111112' },
    USDC: { address: '6F3Z4qkEdHBhAysGapn4XFCboAyFQJ9fri7WM111bRhg', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    USD1: { address: '14kbizF6VZjSFLS21FjvgPYHz45oLzQBomhpiN89xFqv', mint: 'USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB' },
    BONK: { address: '5Dgqzu1RvX4U1dgpDosaXvzGKyqCwRLX41GcmhBfQTaD', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
    RADR: { address: 'HexBg3QDHTE5SKniXZgDARybQwnoEioDKxoUKBsxhtbT', mint: 'CzFvsLdUazabdiu9TYXujj4EY495fG7VgJJ3vQs6bonk' }
  };

  // Fetch all Radr pool balances in parallel
  const radrBalances = {};
  try {
    const balancePromises = Object.entries(radrPools).map(async ([asset, { address, mint }]) => {
      try {
        if (asset === 'SOL') {
          // SOL pool holds native SOL
          const res = await fetch('https://cassandra-bq5oqs-fast-mainnet.helius-rpc.com/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'getBalance', jsonrpc: '2.0', params: [address], id: '1' })
          });
          const data = await res.json();
          return { asset, balance: (data?.result?.value || 0) / 1e9 };
        } else if (asset === 'BONK') {
          // BONK is a standard token account
          const res = await fetch('https://cassandra-bq5oqs-fast-mainnet.helius-rpc.com/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'getTokenAccountBalance', jsonrpc: '2.0', params: [address], id: '1' })
          });
          const data = await res.json();
          return { asset, balance: data?.result?.value?.uiAmount || 0 };
        } else {
          // Other pools own token accounts - use getTokenAccountsByOwner
          const res = await fetch('https://cassandra-bq5oqs-fast-mainnet.helius-rpc.com/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'getTokenAccountsByOwner',
              jsonrpc: '2.0',
              params: [address, { mint }, { encoding: 'jsonParsed' }],
              id: '1'
            })
          });
          const data = await res.json();
          const tokenAccount = data?.result?.value?.[0];
          const balance = parseFloat(tokenAccount?.account?.data?.parsed?.info?.tokenAmount?.uiAmountString || '0');
          return { asset, balance };
        }
      } catch (e) {
        console.error(`Radr ${asset} fetch error:`, e);
        return { asset, balance: 0 };
      }
    });
    const results = await Promise.all(balancePromises);
    results.forEach(r => radrBalances[r.asset] = r.balance);
  } catch (e) {
    console.error('Radr balances fetch error:', e);
  }

  // Fetch Privacy Cash TVL from DeFiLlama
  let privacyCashTvl = 0;
  let privacyCashTokens = {};
  try {
    const tvlRes = await fetch('https://api.llama.fi/protocol/privacy-cash');
    const tvlData = await tvlRes.json();
    privacyCashTvl = tvlData?.currentChainTvls?.Solana || 0;

    // Get token breakdown if available
    const latestTokens = tvlData?.currentChainTvls || {};
    if (tvlData?.tokensInUsd?.length > 0) {
      const latest = tvlData.tokensInUsd[tvlData.tokensInUsd.length - 1];
      privacyCashTokens = latest?.tokens || {};
    }
  } catch (e) {
    console.error('Privacy Cash fetch error:', e);
  }

  const protocols = [
    {
      name: 'Privacy Cash',
      status: 'live',
      url: 'https://privacycash.org',
      pools: [
        {
          asset: 'SOL',
          address: 'PCashXb7HnPsb5HE41i6TQ9xLJ6XxU49Cov2pBdxpump',
          balance: privacyCashTvl > 0 ? (privacyCashTvl * 0.7) / solPrice : 0,
          usd: privacyCashTvl * 0.7
        },
        {
          asset: 'USDC',
          address: 'PCashXb7HnPsb5HE41i6TQ9xLJ6XxU49Cov2pBdxpump',
          balance: privacyCashTvl * 0.3,
          usd: privacyCashTvl * 0.3
        },
        {
          asset: 'USDT',
          address: 'PCashXb7HnPsb5HE41i6TQ9xLJ6XxU49Cov2pBdxpump',
          balance: 0,
          usd: 0
        },
        {
          asset: 'ORE',
          address: 'PCashXb7HnPsb5HE41i6TQ9xLJ6XxU49Cov2pBdxpump',
          balance: 0,
          usd: 0
        }
      ],
      tvl: privacyCashTvl
    },
    {
      name: 'Radr Labs',
      status: 'live',
      url: 'https://radrlabs.io',
      pools: [
        {
          asset: 'SOL',
          address: radrPools.SOL.address,
          balance: radrBalances.SOL || 0,
          usd: (radrBalances.SOL || 0) * solPrice
        },
        {
          asset: 'USDC',
          address: radrPools.USDC.address,
          balance: radrBalances.USDC || 0,
          usd: radrBalances.USDC || 0
        },
        {
          asset: 'USD1',
          address: radrPools.USD1.address,
          balance: radrBalances.USD1 || 0,
          usd: radrBalances.USD1 || 0
        },
        {
          asset: 'BONK',
          address: radrPools.BONK.address,
          balance: radrBalances.BONK || 0,
          usd: (radrBalances.BONK || 0) * bonkPrice
        },
        {
          asset: 'RADR',
          address: radrPools.RADR.address,
          balance: radrBalances.RADR || 0,
          usd: 0 // RADR price not available
        }
      ],
      tvl: ((radrBalances.SOL || 0) * solPrice) + (radrBalances.USDC || 0) + (radrBalances.USD1 || 0) + ((radrBalances.BONK || 0) * bonkPrice)
    },
    {
      name: 'Umbra',
      status: 'upcoming',
      url: 'https://umbraprivacy.com',
      pools: [
        { asset: 'SOL', address: null, balance: 0, usd: 0 },
        { asset: 'USDC', address: null, balance: 0, usd: 0 }
      ],
      tvl: 0
    },
    {
      name: 'Light Protocol',
      status: 'live',
      url: 'https://lightprotocol.com',
      pools: [
        { asset: 'SOL', address: null, balance: 0, usd: 0 }
      ],
      tvl: 0
    },
    {
      name: 'Turbine',
      status: 'live',
      url: 'https://turbine.cash',
      pools: [
        {
          asset: 'ZSOL',
          address: 'zso1EF4k8HNteye34aD8w2Fm6pYVWMDgkgWCUrMLip1',
          balance: turbineZsol,
          usd: turbineZsol * solPrice
        }
      ],
      tvl: turbineZsol * solPrice
    },
    {
      name: 'Arcium',
      status: 'live',
      url: 'https://arcium.com',
      pools: [],
      tvl: 0
    },
    {
      name: 'Elusiv',
      status: 'sunset',
      url: 'https://elusiv.io',
      pools: [],
      tvl: 0
    }
  ];

  const totalTvl = protocols.reduce((sum, p) => sum + p.tvl, 0);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).json({
    solPrice,
    bonkPrice,
    totalTvl,
    protocols,
    updatedAt: new Date().toISOString()
  });
}
