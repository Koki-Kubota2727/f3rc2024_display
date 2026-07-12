const express = require('express');
const store = require('../store');
const router = express.Router();

// ボナペティの自動判定
function getAutoBonaApetit(pine, choco, bread) {
  return pine === 5 && choco === 5 && bread === 3;
}

// GET /api/state - 現在の試合状態を返す
router.get('/', (req, res) => {
  try {
    res.json(store.getState());
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Error' });
  }
});

// POST /api/state - 試合状態を更新（部分更新可能）
router.post('/', (req, res) => {
  try {
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // ボナペティを自動判定
    if (updates.left_pine !== undefined || updates.left_choco !== undefined || updates.left_bread !== undefined) {
      const currentState = store.getState();
      const pine = updates.left_pine ?? currentState.left_pine;
      const choco = updates.left_choco ?? currentState.left_choco;
      const bread = updates.left_bread ?? currentState.left_bread;
      updates.left_bon = getAutoBonaApetit(pine, choco, bread);
    }

    if (updates.right_pine !== undefined || updates.right_choco !== undefined || updates.right_bread !== undefined) {
      const currentState = store.getState();
      const pine = updates.right_pine ?? currentState.right_pine;
      const choco = updates.right_choco ?? currentState.right_choco;
      const bread = updates.right_bread ?? currentState.right_bread;
      updates.right_bon = getAutoBonaApetit(pine, choco, bread);
    }

    const newState = store.setState(updates);

    // WebSocket でブロードキャスト
    req.app.locals.broadcast({ type: 'state_update', data: newState });

    res.json(newState);
  } catch (err) {
    console.error('POST /api/state error:', err);
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;
