// WebSocket接続
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);

let currentTimerState = null;

// WebSocket接続成功
ws.addEventListener('open', () => {
  console.log('WebSocket connected');
  fetchCurrentState();
});

// WebSocket メッセージ受信
ws.addEventListener('message', (event) => {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'state_update' || msg.type === 'timer_update') {
      updateStatus(msg.data);
    }
  } catch (err) {
    console.error('WebSocket message parse error:', err);
  }
});

ws.addEventListener('error', (err) => {
  console.error('WebSocket error:', err);
});

ws.addEventListener('close', () => {
  console.log('WebSocket disconnected, retrying in 3s...');
  setTimeout(() => {
    location.reload();
  }, 3000);
});

// 初期状態を取得
async function fetchCurrentState() {
  try {
    const response = await fetch('/api/state');
    const data = await response.json();
    updateStatus(data);
  } catch (err) {
    console.error('Failed to fetch initial state:', err);
  }
}

// ステータス表示を更新
function updateStatus(state) {
  currentTimerState = state.timer_state;
  const stateNames = {
    1: '⏳ SET - 待機',
    2: '⏱️ SETTING - 60秒',
    3: '⏹️ STOP - 停止',
    4: '⏱️ READY - レディ',
    5: '▶️ 本番 - 実行中',
  };

  const statusDisplay = document.getElementById('currentStatus');
  statusDisplay.innerText = stateNames[state.timer_state] || '不明';
}

// タイマー状態を設定
async function setTimerState(newState) {
  try {
    const response = await fetch('/api/timer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timer_state: newState }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    updateStatus(data);

    showStatus('✅ タイマー状態を更新しました', 'success');
  } catch (err) {
    console.error('Timer state change error:', err);
    showStatus('❌ 更新に失敗しました', 'error');
  }
}

// 試合全体をリセット
async function resetMatch() {
  if (!confirm('試合をリセットしてもよろしいですか？\nすべてのスコアと状態がリセットされます。')) {
    return;
  }

  try {
    const response = await fetch('/api/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    updateStatus(data);

    showStatus('✅ 試合をリセットしました', 'success');
  } catch (err) {
    console.error('Reset error:', err);
    showStatus('❌ リセットに失敗しました', 'error');
  }
}

// ステータスメッセージを表示
function showStatus(message, type) {
  const statusMsg = document.getElementById('statusMessage');
  statusMsg.innerText = message;
  statusMsg.className = `status-message ${type}`;

  setTimeout(() => {
    statusMsg.innerText = '';
    statusMsg.className = 'status-message';
  }, 3000);
}

// ページロード完了時の初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('Control page loaded');
});
