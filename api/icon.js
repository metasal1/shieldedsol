export default function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const size = parseInt(url.searchParams.get('size') || '192');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <rect fill="#000" width="${size}" height="${size}" rx="${size * 0.16}"/>
    <text x="${size / 2}" y="${size * 0.65}" font-family="monospace" font-size="${size * 0.52}" text-anchor="middle" fill="#9945FF" font-weight="bold">S</text>
  </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(svg);
}
