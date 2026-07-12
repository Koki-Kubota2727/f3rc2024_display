// スコアリング設定
// 各アイテムの点数定義
const SCORING = {
  PINE: 20,        // パイナップル 1個 = 20点
  CHOCO: 10,       // チョコレート 1個 = 10点
  BREAD: 5,        // パンケーキ 1個 = 5点
};

// 上限設定
const LIMITS = {
  PINE: 5,         // パイナップル最大5個
  CHOCO: 5,        // チョコレート最大5個
  BREAD: 3,        // パンケーキ最大3個
};

// チーム名リスト
const TEAMS = [
  '東京大学',
  '京都大学',
  '大阪大学',
  '東北大学',
  '名古屋大学',
  '九州大学',
  '北海道大学',
  '東工大',
  '一橋大学',
  '神戸大学',
  '広島大学',
  '早稲田大学',
  '慶應大学',
  '明治大学',
  '立教大学',
  '中央大学',
  '法政大学',
];

// スコア計算関数
function calculateScore(pine, choco, bread) {
  return pine * SCORING.PINE + choco * SCORING.CHOCO + bread * SCORING.BREAD;
}

// ボナペティの自動判定（全アイテムが上限に達したら自動ON）
function isAutoBonaApetit(pine, choco, bread) {
  return pine === LIMITS.PINE && choco === LIMITS.CHOCO && bread === LIMITS.BREAD;
}
