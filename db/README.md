# Turso Database Integration

This directory contains the Turso database setup for storing historical TVL and pool balance data.

## Database Setup

The database is hosted on Turso at:
```
libsql://shieldedsol-metasal1.aws-ap-northeast-1.turso.io
```

### Environment Variables

Add these to your `.env` file:
```env
TURSO_DATABASE_URL=libsql://shieldedsol-metasal1.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=your-read-write-token
```

## Database Schema

### Tables

1. **tvl_snapshots** - Historical TVL data for all protocols
   - `id` - Auto-increment primary key
   - `timestamp` - ISO timestamp
   - `protocol_name` - Protocol name
   - `tvl_usd` - Total Value Locked in USD
   - `created_at` - Record creation time

2. **pool_balances** - Granular pool data for each protocol
   - `id` - Auto-increment primary key
   - `timestamp` - ISO timestamp
   - `protocol_name` - Protocol name
   - `asset` - Asset symbol (SOL, USDC, etc.)
   - `address` - Pool address
   - `balance` - Token balance
   - `usd_value` - USD value
   - `created_at` - Record creation time

3. **token_prices** - Historical token prices
   - `id` - Auto-increment primary key
   - `timestamp` - ISO timestamp
   - `symbol` - Token symbol
   - `usd_price` - Price in USD
   - `created_at` - Record creation time

## Scripts

```bash
# Initialize database (create tables and indexes)
npm run db:init

# Check database statistics and latest data
npm run db:check
```

## API Integration

### Data Collection

The `/api/protocols` endpoint automatically saves data to Turso on each request:
- Token prices (SOL, BONK, ORE, RADR)
- TVL snapshots for all protocols
- Pool balances for each asset

Data is saved asynchronously without blocking the API response.

### History APIs

Query historical data using these endpoints:

1. **Total TVL History**
   ```
   GET /api/history/tvl?range=24h
   ```
   - Ranges: `1h`, `6h`, `24h`, `7d`, `30d`, `90d`
   - Returns aggregated TVL across all protocols

2. **Protocol TVL History**
   ```
   GET /api/history/protocol?protocol=Privacy%20Cash&range=7d
   ```
   - Get TVL history for a specific protocol

3. **Pool Balance History**
   ```
   GET /api/history/pool?protocol=Radr%20Labs&asset=SOL&range=30d
   ```
   - Get balance history for a specific pool

## Client Functions

Available in `db/client.js`:

### Write Operations
- `saveTvlSnapshot(timestamp, protocolName, tvlUsd)`
- `savePoolBalance(timestamp, protocolName, asset, address, balance, usdValue)`
- `saveTokenPrice(timestamp, symbol, usdPrice)`

### Read Operations
- `getTvlHistory(protocolName, startDate, endDate)`
- `getAllProtocolsTvlHistory(startDate, endDate)`
- `getPoolHistory(protocolName, asset, startDate, endDate)`
- `getLatestTvlByProtocol()`

## Example Usage

```javascript
import { saveTvlSnapshot, getLatestTvlByProtocol } from './db/client.js';

// Save a TVL snapshot
await saveTvlSnapshot(
  new Date().toISOString(),
  'Privacy Cash',
  150000
);

// Get latest TVL for all protocols
const latestTvl = await getLatestTvlByProtocol();
console.log(latestTvl);
```
