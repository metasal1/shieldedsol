import { createCanvas } from 'canvas';

export default async function handler(req, res) {
  // Fetch TVL from DeFiLlama
  let tvl = '--';
  let change = '';
  let changeColor = '#888888';

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
        const arrow = pct >= 0 ? '↑' : '↓';
        change = `${arrow}${Math.abs(pct).toFixed(1)}%`;
        changeColor = pct >= 0 ? '#22c55e' : '#ef4444';
      }
    }
  } catch (e) {
    console.error('Failed to fetch TVL:', e);
  }

  // Create canvas
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0f0f1a');
  gradient.addColorStop(1, '#1a1025');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw logo (shield with Solana logo inside)
  ctx.save();
  ctx.translate(80, 60);
  ctx.scale(0.18, 0.18);

  // Shield outline
  ctx.beginPath();
  ctx.fillStyle = '#9945FF';
  ctx.moveTo(43.39, 115.6);
  ctx.bezierCurveTo(44.83, 108.23, 76.07, 90.97, 142.2, 61.03);
  ctx.bezierCurveTo(195.39, 36.95, 244.35, 17.13, 251, 17);
  ctx.bezierCurveTo(257.64, 16.87, 306.6, 36.45, 359.79, 60.51);
  ctx.lineTo(456.5, 104.27);
  ctx.lineTo(455.55, 152.37);
  ctx.bezierCurveTo(454.36, 212.46, 435.33, 290.2, 410.33, 337.1);
  ctx.bezierCurveTo(388.99, 377.15, 327.15, 439.17, 282.42, 465.38);
  ctx.lineTo(253.8, 482.15);
  ctx.lineTo(222.24, 465.21);
  ctx.bezierCurveTo(204.88, 455.89, 171.44, 429.23, 147.94, 405.96);
  ctx.bezierCurveTo(102.36, 360.84, 80.1, 321.95, 64.29, 259.79);
  ctx.bezierCurveTo(53.04, 215.57, 40.62, 129.87, 43.39, 115.6);
  ctx.closePath();
  ctx.fill();

  // Solana logo stripes (white)
  ctx.fillStyle = '#ffffff';
  // Top stripe
  ctx.beginPath();
  ctx.moveTo(149.97, 174.56);
  ctx.lineTo(311.96, 174.56);
  ctx.bezierCurveTo(313.05, 174.56, 314.12, 174.34, 315.11, 173.9);
  ctx.bezierCurveTo(316.11, 173.47, 317.01, 172.84, 317.74, 172.05);
  ctx.lineTo(351.92, 135.63);
  ctx.bezierCurveTo(352.32, 135.21, 352.62, 134.71, 352.8, 134.16);
  ctx.bezierCurveTo(352.98, 133.61, 353.04, 133.02, 352.97, 132.45);
  ctx.bezierCurveTo(352.9, 131.87, 352.7, 131.32, 352.39, 130.83);
  ctx.bezierCurveTo(352.08, 130.34, 351.66, 129.93, 351.17, 129.61);
  ctx.bezierCurveTo(350.51, 129.2, 349.75, 128.99, 348.97, 129);
  ctx.lineTo(186.98, 129);
  ctx.bezierCurveTo(185.89, 129, 184.82, 129.23, 183.82, 129.66);
  ctx.bezierCurveTo(182.83, 130.09, 181.93, 130.72, 181.19, 131.51);
  ctx.lineTo(147.06, 167.93);
  ctx.bezierCurveTo(146.53, 168.49, 146.19, 169.2, 146.06, 169.95);
  ctx.bezierCurveTo(145.93, 170.71, 146.02, 171.49, 146.33, 172.19);
  ctx.bezierCurveTo(146.64, 172.9, 147.15, 173.49, 147.8, 173.91);
  ctx.bezierCurveTo(148.44, 174.34, 149.2, 174.56, 149.97, 174.56);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('Shielded Sol', 180, 110);

  ctx.fillStyle = '#666666';
  ctx.font = '22px sans-serif';
  ctx.fillText('Solana Privacy Pools Tracker', 180, 150);

  // TVL Label
  ctx.fillStyle = '#666666';
  ctx.font = '16px sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('TOTAL VALUE LOCKED', 80, 260);

  // TVL Value
  ctx.fillStyle = '#9945FF';
  ctx.font = 'bold 100px sans-serif';
  ctx.fillText(tvl, 80, 370);

  // 24h Change
  ctx.fillStyle = changeColor;
  ctx.font = '32px sans-serif';
  ctx.fillText(`${change} (24h)`, 80, 430);

  // CTA Button
  ctx.fillStyle = '#9945FF';
  ctx.beginPath();
  ctx.roundRect(900, 520, 220, 50, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Track Live TVL', 1010, 552);

  // Footer
  ctx.textAlign = 'left';
  ctx.fillStyle = '#444444';
  ctx.font = '18px sans-serif';
  ctx.fillText('shieldedsol.com', 80, 555);

  // Convert to PNG
  const buffer = canvas.toBuffer('image/png');

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).send(buffer);
}
