const express = require('express');
const store = require('../store');
const router = express.Router();

// POST /api/timer - タイマー状態のみを更新
router.post('/', (req, res) => {
  try {
    const { timer_state } = req.body;

    if (timer_state === undefined) {
      return res.status(400).json({ error: 'timer_state is required' });
    }

    const newState = store.setState({ timer_state });

    // WebSocket でブロードキャスト
    req.app.locals.broadcast({ type: 'timer_update', data: newState });

    res.json(newState);
  } catch (err) {
    console.error('POST /api/timer error:', err);
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;
