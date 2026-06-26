// A throwaway "project" to point vibe at while testing: `node test/dummy-server.js`
import http from 'node:http';

const port = Number(process.argv[2]) || 3000;

http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!doctype html><html><head><meta charset="utf-8"><title>my cool app</title>
<style>body{font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;
background:#0c0a1a;color:#ece9ff}h1{font-size:3rem}</style></head>
<body><div><h1>🚀 my localhost</h1><p>and now my friends can see it. path: ${req.url}</p></div></body></html>`);
  })
  .listen(port, () => console.log(`dummy app on http://localhost:${port}`));
