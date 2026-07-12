// シンプルなメモリ + ファイルストレージ版
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../data.json');

// 初期データ
const initialState = {
  id: 1,
  left_university: '',
  right_university: '',
  left_score: 0,
  right_score: 0,
  left_pine: 0,
  right_pine: 0,
  left_choco: 0,
  right_choco: 0,
  left_bread: 0,
  right_bread: 0,
  left_bon: false,
  right_bon: false,
  timer_state: 1,
  updated_at: new Date().toISOString(),
};

// ファイルから読み込み、なければ初期化
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
  } catch (err) {
    console.warn('Failed to load data file:', err.message);
  }
  return { ...initialState };
}

// ファイルに保存
function saveData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save data file:', err);
  }
}

// メモリ上の状態
let matchState = loadData();

// クエリインターフェース互換性
const mockDb = {
  query: async (queryStr, params) => {
    if (queryStr.includes('SELECT * FROM match_state WHERE id = 1')) {
      return { rows: [{ ...matchState }] };
    }

    if (queryStr.includes('UPDATE match_state SET')) {
      // UPDATE クエリを解析
      const updates = {};
      const parts = queryStr.split('SET ')[1].split('WHERE')[0].split(',');

      parts.forEach((part, idx) => {
        const [key] = part.trim().split(' = ');
        if (params[idx] !== undefined) {
          updates[key] = params[idx];
        }
      });

      matchState = { ...matchState, ...updates, updated_at: new Date().toISOString() };
      saveData(matchState);

      return { rows: [{ ...matchState }] };
    }

    return { rows: [] };
  },
};

console.log('✅ メモリ + ファイルストレージモード');
module.exports = mockDb;
