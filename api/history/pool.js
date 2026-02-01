import { getPoolHistory } from '../../db/client.js';

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  const { protocol, asset, range = '24h' } = req.query;

  if (!protocol || !asset) {
    return res.status(400).json({ error: 'Protocol and asset are required' });
  }

  // Calculate start date based on range
  const now = new Date();
  let startDate;

  switch (range) {
    case '1h':
      startDate = new Date(now - 60 * 60 * 1000);
      break;
    case '6h':
      startDate = new Date(now - 6 * 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 24 * 60 * 60 * 1000);
  }

  try {
    const poolData = await getPoolHistory(
      protocol,
      asset,
      startDate.toISOString(),
      now.toISOString()
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json({
      protocol,
      asset,
      range,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      dataPoints: poolData.length,
      history: poolData.map(row => ({
        timestamp: row.timestamp,
        balance: row.balance,
        usdValue: row.usd_value
      }))
    });
  } catch (error) {
    console.error('Error fetching pool history:', error);
    res.status(500).json({ error: 'Failed to fetch pool history' });
  }
}
