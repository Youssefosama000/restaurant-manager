const TARGET = 'https://slyce-b2bmh0gzajd8fufu.westeurope-01.azurewebsites.net';

export default async function handler(req, res) {
  const url = `${TARGET}${req.url}`;

  const headers = {};
  const forward = ['content-type', 'authorization', 'cookie', 'x-restaurant-id'];
  for (const key of forward) {
    if (req.headers[key]) headers[key] = req.headers[key];
  }
  // Spoof Host so the Azure backend accepts the request (same as Vite's changeOrigin: true)
  headers['host'] = 'slyce-b2bmh0gzajd8fufu.westeurope-01.azurewebsites.net';

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  const response = await fetch(url, {
    method: req.method,
    headers,
    body: hasBody && req.body ? JSON.stringify(req.body) : undefined,
  });

  const skip = new Set(['content-encoding', 'transfer-encoding', 'connection', 'keep-alive']);
  for (const [key, value] of response.headers.entries()) {
    if (!skip.has(key.toLowerCase())) res.setHeader(key, value);
  }

  const data = await response.arrayBuffer();
  res.status(response.status).send(Buffer.from(data));
}
