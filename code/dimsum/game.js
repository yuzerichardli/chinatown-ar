/* One interaction, like the herbal-soup scene: bring four items together. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DimSumGame = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const dishes = [
    { id: 'har-gow', en: 'Har gow', zh: '虾饺', asset: 'har-gow-3d.png' },
    { id: 'siu-mai', en: 'Siu mai', zh: '烧卖', asset: 'siu-mai-3d.png' },
    { id: 'char-siu-bao', en: 'Char siu bao', zh: '叉烧包', asset: 'char-siu-bao-3d.png' },
    { id: 'egg-tart', en: 'Egg tart', zh: '蛋挞', asset: 'egg-tart-3d.png' }
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
      read() {
        if (['sharing', 'ready'].includes(state.phase)) { state.phase = 'story'; state.selected = null; }
      },
      returnToTable() {
        if (state.phase === 'story') state.phase = state.shared.length === dishes.length ? 'ready' : 'sharing';
      }
    };
  }
  return { dishes, createGame };
});
