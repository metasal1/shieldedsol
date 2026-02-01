import { getTvlHistory, getPoolHistory } from '../../db/client.js';

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  const { protocol, range = '24h', includePoolData = 'false' } = req.query;

  if (!protocol) {
    return res.status(400).json({ error: 'Protocol name is required' });
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
    const tvlData = await getTvlHistory(
      protocol,
      startDate.toISOString(),
      now.toISOString()
    );

    const response = {
      protocol,
      range,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      dataPoints: tvlData.length,
      history: tvlData.map(row => ({
        timestamp: row.timestamp,
        tvl: row.tvl_usd
      }))
    };

    // Include pool-level data if requested
    if (includePoolData === 'true') {
      // Get unique assets from the current protocol
      // Note: This would require fetching current protocol data or having a separate query
      // For now, we'll return a placeholder
      response.poolData = [];
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching protocol history:', error);
    res.status(500).json({ error: 'Failed to fetch protocol history' });
  }
}
