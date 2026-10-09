/* Share dim sum, then serve one cup of tea at a time. */
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
  const cups = ['left', 'right', 'front'];
  function createGame() {
    let state;
    function reset() { state = { phase: 'arrival', selected: null, shared: [], filled: [], pouring: null, potSelected: false }; }
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
      beginTea() {
        if (!['sharing', 'ready'].includes(state.phase)) return false;
        state.phase = 'tea'; state.selected = null;
        return true;
      },
      selectPot() {
        if (state.phase !== 'tea') return false;
        state.potSelected = !state.potSelected;
        return true;
      },
      beginPour(id) {
        if (state.phase !== 'tea' || !cups.includes(id) || state.filled.includes(id)) return false;
        state.phase = 'pouring'; state.pouring = id; state.potSelected = false;
        return true;
      },
      finishPour() {
        if (state.phase !== 'pouring') return false;
        state.filled.push(state.pouring); state.pouring = null;
        state.phase = state.filled.length === cups.length ? 'served' : 'tea';
        return true;
      },
      cancelPour() {
        if (state.phase !== 'pouring') return false;
        state.phase = 'tea'; state.pouring = null; state.potSelected = false;
        return true;
      },
      read() {
        if (state.phase === 'served') { state.phase = 'story'; return true; }
        return state.phase === 'story';
      },
      returnToTable() {
        if (state.phase === 'story') state.phase = 'served';
      }
    };
  }
  return { dishes, cups, createGame };
});
