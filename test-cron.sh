#!/bin/bash

# Test the daily collection cron endpoint locally
# Usage: ./test-cron.sh [url]
# Default URL: http://localhost:3000/api/cron/collect-daily

URL="${1:-http://localhost:3000/api/cron/collect-daily}"

# Load CRON_SECRET from .env
if [ -f .env ]; then
  export $(grep CRON_SECRET .env | xargs)
fi

if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not found in .env"
  exit 1
fi

echo "🔐 Testing cron endpoint with authentication..."
echo "URL: $URL"
echo ""

curl -X GET "$URL" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "✅ Test complete!"
