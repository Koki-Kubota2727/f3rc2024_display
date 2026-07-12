// DOM要素
const point1Elem = document.getElementById('point1');
const point2Elem = document.getElementById('point2');
const timerElem = document.getElementById('timer');
const leftUnivElem = document.getElementById('leftUniversity');
const rightUnivElem = document.getElementById('rightUniversity');
const bon1Elem = document.getElementById('bon1');
const bon2Elem = document.getElementById('bon2');
const musicElem = document.getElementById('music');

// アイコン要素
const chocoLeftElems = document.querySelectorAll('.choco-left');
const chocoRightElems = document.querySelectorAll('.choco-right');
const pineLeftElems = document.querySelectorAll('.pine-left');
const pineRightElems = document.querySelectorAll('.pine-right');
const breadLeftElems = document.querySelectorAll('.bread-left');
const breadRightElems = document.querySelectorAll('.bread-right');

// WebSocket接続
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);

let lastTimerState = null;
let timerCountdown = 0;
let timerInterval = null;

// WebSocket接続成功
ws.addEventListener('open', () => {
  console.log('WebSocket connected');
  // 初期データを取得
  fetchCurrentState();
});

// WebSocket メッセージ受信
ws.addEventListener('message', (event) => {
  try {
    const msg = JSON.parse(event.data);
    if (msg.type === 'state_update' || msg.type === 'timer_update') {
      updateDisplay(msg.data);
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

// 初期データ取得
async function fetchCurrentState() {
  try {
    const response = await fetch('/api/state');
    const data = await response.json();
    updateDisplay(data);
  } catch (err) {
    console.error('Failed to fetch initial state:', err);
  }
}

// 画面更新
function updateDisplay(state) {
  // スコア更新（サーバーから受け取った値をそのまま使用）
  point1Elem.innerText = state.left_score || '0';
  point2Elem.innerText = state.right_score || '0';

  // チーム名更新
  leftUnivElem.innerText = state.left_university || '';
  rightUnivElem.innerText = state.right_university || '';

  // アイコン表示更新
  updateItemDisplay(pineLeftElems, state.left_pine);
  updateItemDisplay(pineRightElems, state.right_pine);
  updateItemDisplay(chocoLeftElems, state.left_choco);
  updateItemDisplay(chocoRightElems, state.right_choco);
  updateItemDisplay(breadLeftElems, state.left_bread);
  updateItemDisplay(breadRightElems, state.right_bread);

  // ボナペティ表示（全アイテムが上限に達したら表示）
  const leftBonAuto = isAutoBonaApetit(state.left_pine, state.left_choco, state.left_bread);
  const rightBonAuto = isAutoBonaApetit(state.right_pine, state.right_choco, state.right_bread);
  
  bon1Elem.style.display = leftBonAuto ? 'inline-block' : 'none';
  bon2Elem.style.display = rightBonAuto ? 'inline-block' : 'none';

  // タイマー状態更新（状態が変わった場合のみ）
  if (state.timer_state !== lastTimerState) {
    lastTimerState = state.timer_state;
    handleTimerStateChange(state.timer_state);
  }
}

// アイテム数に応じて表示/非表示を制御
function updateItemDisplay(elements, count) {
  // すべて表示
  elements.forEach((elem) => {
    elem.style.display = 'inline-block';
  });

  // 必要な数分だけ非表示
  for (let i = count; i < elements.length; i++) {
    elements[i].style.display = 'none';
  }
}

// タイマー状態の処理
function handleTimerStateChange(timerState) {
  // 既存のタイマーをクリア
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  switch (timerState) {
    case 1:
      // set - 待機表示
      timerElem.innerText = 'set';
      break;

    case 2:
      // setting - セッティングタイマー60秒カウントダウン
      timerCountdown = 60;
      timerElem.innerText = '1:00';
      startTimerCountdown(60, 2);
      break;

    case 3:
      // stop - 停止表示
      timerElem.innerText = 'stop';
      break;

    case 4:
      // ready - レディ表示
      timerElem.innerText = 'ready';
      break;

    case 5:
      // running - 3→2→1→GO!→3:00カウントダウン
      startCountdownSequence();
      break;

    default:
      timerElem.innerText = '';
  }
}

// カウントダウン実行
function startTimerCountdown(seconds, timerState) {
  let remaining = seconds;

  timerInterval = setInterval(() => {
    const minutes = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timeStr = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;

    timerElem.innerText = timeStr;

    remaining--;

    if (remaining < 0) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }, 1000);
}

// カウントダウンシーケンス（3→2→1→GO!→3:00→...）
async function startCountdownSequence() {
  // 3→2→1のカウント
  for (let i = 3; i >= 1; i--) {
    timerElem.innerText = i.toString();
    await sleep(1000);
  }

  // GO!表示
  timerElem.innerText = 'GO!';
  musicElem.play().catch(() => {}); // 音声再生
  await sleep(1000);

  // 3:00からのカウントダウン
  startTimerCountdown(180, 5);
}

// スリープ関数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ページロード完了時の初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('Display page loaded');
});
