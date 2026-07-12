const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const store = require('./store');
const { setupWebSocket } = require('./ws');
const stateRoutes = require('./routes/state');
const timerRoutes = require('./routes/timer');

const app = express();
const server = http.createServer(app);
const { broadcast } = setupWebSocket(server);

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// グローバル broadcast 関数を設定
app.locals.broadcast = broadcast;

// ルート
app.use('/api/state', stateRoutes);
app.use('/api/timer', timerRoutes);

// リセット API
app.post('/api/reset', (req, res) => {
  try {
    const resetState = store.resetState();
    broadcast({ type: 'state_update', data: resetState });
    res.json(resetState);
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Error' });
  }
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Access from phone: http://[YOUR_IP]:${PORT}`);
});
