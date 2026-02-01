import { getAllProtocolsTvlHistory } from '../../db/client.js';

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  const { range = '24h' } = req.query;

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
    const data = await getAllProtocolsTvlHistory(
      startDate.toISOString(),
      now.toISOString()
    );

    // Group by timestamp and aggregate TVL
    const aggregated = {};
    data.forEach(row => {
      const timestamp = row.timestamp;
      if (!aggregated[timestamp]) {
        aggregated[timestamp] = {
          timestamp,
          totalTvl: 0,
          protocols: {}
        };
      }
      aggregated[timestamp].totalTvl += row.tvl_usd;
      aggregated[timestamp].protocols[row.protocol_name] = row.tvl_usd;
    });

    const history = Object.values(aggregated).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json({
      range,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      dataPoints: history.length,
      history
    });
  } catch (error) {
    console.error('Error fetching TVL history:', error);
    res.status(500).json({ error: 'Failed to fetch TVL history' });
  }
}
