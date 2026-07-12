// フォームデータのステート
const formState = {
  leftUniversity: '',
  rightUniversity: '',
  leftPine: 0,
  rightPine: 0,
  leftChoco: 0,
  rightChoco: 0,
  leftBread: 0,
  rightBread: 0,
};

// シンク状態（同期中かどうか）
let isSyncing = false;
let syncTimeout = null;

// チーム名セレクトボックスの初期化
function initializeTeamSelects() {
  const leftSelect = document.getElementById('leftUniversity');
  const rightSelect = document.getElementById('rightUniversity');

  TEAMS.forEach((team) => {
    // 左チーム
    const leftOption = document.createElement('option');
    leftOption.value = team;
    leftOption.textContent = team;
    leftSelect.appendChild(leftOption);

    // 右チーム
    const rightOption = document.createElement('option');
    rightOption.value = team;
    rightOption.textContent = team;
    rightSelect.appendChild(rightOption);
  });
}

// チーム名選択時の処理
function handleTeamChange(side) {
  const selectId = side === 'left' ? 'leftUniversity' : 'rightUniversity';
  const fieldName = side === 'left' ? 'leftUniversity' : 'rightUniversity';
  
  const selectedValue = document.getElementById(selectId).value;
  formState[fieldName] = selectedValue;
  
  autoSync();
}

// DOMロード完了時
document.addEventListener('DOMContentLoaded', () => {
  initializeTeamSelects();
  loadFormState();
  attachEventListeners();
  fetchCurrentState();
});

// 初期状態を取得
async function fetchCurrentState() {
  try {
    const response = await fetch('/api/state');
    const data = await response.json();

    // サーバーから取得したデータでフォームを更新
    formState.leftUniversity = data.left_university || '';
    formState.rightUniversity = data.right_university || '';
    formState.leftPine = data.left_pine || 0;
    formState.rightPine = data.right_pine || 0;
    formState.leftChoco = data.left_choco || 0;
    formState.rightChoco = data.right_choco || 0;
    formState.leftBread = data.left_bread || 0;
    formState.rightBread = data.right_bread || 0;

    updateUI();
  } catch (err) {
    console.error('Failed to fetch current state:', err);
  }
}

// イベントリスナー設定
function attachEventListeners() {
  // セレクトボックスのイベントハンドラはHTML内で設定済み (onchange)
}

// アイテム変更（リアルタイム送信）
function changeItem(field, delta) {
  let maxValue = 5;

  // パンケーキは最大3
  if (field.includes('Bread')) {
    maxValue = 3;
  }

  formState[field] = Math.max(0, Math.min(maxValue, formState[field] + delta));
  updateUI();
  autoSync(); // 自動送信
}

// UIを更新（スコアを計算して表示）
function updateUI() {
  // チーム名表示（セレクトボックスの値を更新）
  document.getElementById('leftUniversity').value = formState.leftUniversity;
  document.getElementById('rightUniversity').value = formState.rightUniversity;

  // アイテム数表示
  document.getElementById('leftPineDisplay').innerText = formState.leftPine;
  document.getElementById('rightPineDisplay').innerText = formState.rightPine;

  document.getElementById('leftChocoDisplay').innerText = formState.leftChoco;
  document.getElementById('rightChocoDisplay').innerText = formState.rightChoco;

  document.getElementById('leftBreadDisplay').innerText = formState.leftBread;
  document.getElementById('rightBreadDisplay').innerText = formState.rightBread;

  // スコア計算と表示
  const leftScore = calculateScore(
    formState.leftPine,
    formState.leftChoco,
    formState.leftBread
  );
  const rightScore = calculateScore(
    formState.rightPine,
    formState.rightChoco,
    formState.rightBread
  );

  document.getElementById('leftScoreDisplay').innerText = leftScore;
  document.getElementById('rightScoreDisplay').innerText = rightScore;

  saveFormState();
}

// ローカルストレージに保存
function saveFormState() {
  localStorage.setItem('inputFormState', JSON.stringify(formState));
}

// ローカルストレージから復元
function loadFormState() {
  const saved = localStorage.getItem('inputFormState');
  if (saved) {
    try {
      Object.assign(formState, JSON.parse(saved));
    } catch (err) {
      console.error('Failed to load form state:', err);
    }
  }
}

// 自動送信（デバウンス付き）
function autoSync() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // 300ms 後に送信
  syncTimeout = setTimeout(() => {
    submitData();
  }, 300);
}

// ボナペティの自動判定（全アイテムが上限に達したら ON）
function getAutoBonaApetit(side) {
  const pineField = side === 'left' ? 'leftPine' : 'rightPine';
  const chocoField = side === 'left' ? 'leftChoco' : 'rightChoco';
  const breadField = side === 'left' ? 'leftBread' : 'rightBread';

  return isAutoBonaApetit(
    formState[pineField],
    formState[chocoField],
    formState[breadField]
  );
}

// データ送信
async function submitData() {
  try {
    isSyncing = true;
    showSyncIndicator();

    const leftScore = calculateScore(
      formState.leftPine,
      formState.leftChoco,
      formState.leftBread
    );
    const rightScore = calculateScore(
      formState.rightPine,
      formState.rightChoco,
      formState.rightBread
    );

    // ボナペティを自動判定
    const leftBon = getAutoBonaApetit('left');
    const rightBon = getAutoBonaApetit('right');

    const response = await fetch('/api/state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        left_university: formState.leftUniversity,
        right_university: formState.rightUniversity,
        left_score: leftScore,
        right_score: rightScore,
        left_pine: formState.leftPine,
        right_pine: formState.rightPine,
        left_choco: formState.leftChoco,
        right_choco: formState.rightChoco,
        left_bread: formState.leftBread,
        right_bread: formState.rightBread,
        left_bon: leftBon,
        right_bon: rightBon,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    showStatus('✅ 同期完了', 'sync');
    isSyncing = false;
  } catch (err) {
    console.error('Submit error:', err);
    showStatus('❌ 同期失敗', 'error');
    isSyncing = false;
  }
}

// ステータスメッセージ表示
function showStatus(message, type) {
  const statusMsg = document.getElementById('statusMessage');
  statusMsg.innerText = message;
  statusMsg.className = `status-message ${type}`;

  setTimeout(() => {
    statusMsg.innerText = '';
    statusMsg.className = 'status-message';
  }, 2000);
}

// 同期インジケータ表示
function showSyncIndicator() {
  const indicator = document.getElementById('syncIndicator');
  indicator.classList.add('show');

  setTimeout(() => {
    indicator.classList.remove('show');
  }, 1500);
}

// フォームリセット
function resetForm() {
  if (!confirm('入力内容をリセットしてもよろしいですか？')) {
    return;
  }

  Object.assign(formState, {
    leftUniversity: '',
    rightUniversity: '',
    leftPine: 0,
    rightPine: 0,
    leftChoco: 0,
    rightChoco: 0,
    leftBread: 0,
    rightBread: 0,
  });

  updateUI();
  submitData();

  showStatus('🔄 リセットしました', 'sync');
}
