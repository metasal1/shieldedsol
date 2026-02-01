import 'dotenv/config';
import { getDbClient, getLatestTvlByProtocol } from './client.js';

async function checkDatabase() {
  try {
    const db = getDbClient();

    // Check total records
    const counts = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM tvl_snapshots) as tvl_count,
        (SELECT COUNT(*) FROM pool_balances) as pool_count,
        (SELECT COUNT(*) FROM token_prices) as price_count
    `);

    console.log('\n📊 Database Statistics:');
    console.log('=====================');
    console.log(`TVL Snapshots: ${counts.rows[0].tvl_count}`);
    console.log(`Pool Balances: ${counts.rows[0].pool_count}`);
    console.log(`Token Prices: ${counts.rows[0].price_count}`);

    // Get latest TVL by protocol
    const latestTvl = await getLatestTvlByProtocol();

    if (latestTvl.length > 0) {
      console.log('\n💰 Latest TVL by Protocol:');
      console.log('===========================');
      latestTvl.forEach(row => {
        console.log(`${row.protocol_name}: $${Math.floor(row.tvl_usd).toLocaleString()}`);
      });
      console.log(`\nLast updated: ${latestTvl[0].timestamp}`);
    } else {
      console.log('\n⚠️  No data found in database yet.');
      console.log('Run the /api/protocols endpoint to start collecting data.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDatabase();
