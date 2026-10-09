/* One interaction, like the herbal-soup scene: bring four items together. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DimSumGame = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const dishes = [
    { id: 'har-gow', en: 'Har gow', zh: '虾饺' },
    { id: 'siu-mai', en: 'Siu mai', zh: '烧卖' },
    { id: 'char-siu-bao', en: 'Char siu bao', zh: '叉烧包' },
    { id: 'egg-tart', en: 'Egg tart', zh: '蛋挞' }
  ];
  function createGame() {
    let state;
    function reset() { state = { phase: 'arrival', selected: null, shared: [] }; }
    reset();
    return {
      get state() { return state; },
      reset,
      start() { if (state.phase === 'arrival') state.phase = 'sharing'; },
      select(id) {
        if (state.phase !== 'sharing' || state.shared.includes(id) || !dishes.some(d => d.id === id)) return false;
        state.selected = state.selected === id ? null : id;
        return true;
      },
      share(id) {
        if (state.phase !== 'sharing' || state.shared.includes(id) || !dishes.some(d => d.id === id)) return false;
        state.shared.push(id); state.selected = null;
        if (state.shared.length === dishes.length) state.phase = 'ready';
        return true;
      },
      read() { if (state.phase === 'ready') state.phase = 'story'; },
      returnToTable() { if (state.phase === 'story') state.phase = 'ready'; }
    };
  }
  return { dishes, createGame };
});
