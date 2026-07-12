// 共有状態管理
let matchState = {
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

module.exports = {
  getState: () => ({ ...matchState }),

  setState: (updates) => {
    const validFields = [
      'left_university',
      'right_university',
      'left_score',
      'right_score',
      'left_pine',
      'right_pine',
      'left_choco',
      'right_choco',
      'left_bread',
      'right_bread',
      'left_bon',
      'right_bon',
      'timer_state',
    ];

    validFields.forEach((field) => {
      if (field in updates) {
        matchState[field] = updates[field];
      }
    });

    matchState.updated_at = new Date().toISOString();
    return { ...matchState };
  },

  resetState: () => {
    matchState = {
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
    return { ...matchState };
  },
};
