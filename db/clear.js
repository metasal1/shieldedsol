import 'dotenv/config';
import { getDbClient } from './client.js';

async function clearDatabase() {
  try {
    const db = getDbClient();

    console.log('🗑️  Clearing database...\n');

    await db.execute('DELETE FROM tvl_snapshots');
    await db.execute('DELETE FROM pool_balances');
    await db.execute('DELETE FROM token_prices');

    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearDatabase();
