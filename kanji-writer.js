/* Stroke data: KanjiVG © Ulrich Apel and contributors, CC BY-SA 3.0.
 * Geometry/order unchanged. Attribution is displayed by every mounted viewer.
 * Standalone component; application entry points are added in step 3.
 */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const defaultDataUrl = new URL('data/kanji/strokes.json', document.currentScript.src).href;
  const palette = ['#1686cf', '#de705e', '#282c34', '#28ad70', '#e4a600', '#9956ca', '#e579ad', '#1686cf'];
  const datasets = new Map();
  function load(url) {
    if (!datasets.has(url)) {
      const pending = fetch(url).then(response => {
        if (!response.ok) throw new Error('Cannot load stroke data');
        return response.json();
      }).then(data => {
        if (data.schemaVersion !== 1 || !data.characters) throw new Error('Invalid stroke data');
        return data.characters;
      }).catch(error => { datasets.delete(url); throw error; });
      datasets.set(url, pending);
    }
    return datasets.get(url);
  }
  function svgNode(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }
  function kanjiIn(text) {
    // 々, kana and punctuation must never become selectable stroke characters.
    return [...new Set([...String(text)].filter(c => /\p{Unified_Ideograph}/u.test(c)))];
  }
  function mount(host, {word = '', dataUrl = defaultDataUrl} = {}) {
    if (!(host instanceof HTMLElement)) throw new TypeError('A host element is required');
    const panel = document.createElement('section');
    panel.className = 'kanji-writer';
    panel.setAttribute('aria-label', 'Hướng dẫn viết kanji');
    panel.innerHTML = `<div class="kw-heading"><span class="kw-kicker">THỨ TỰ NÉT</span><h2 class="kw-word" lang="ja"></h2></div>
      <div class="kw-characters" role="group" aria-label="Chọn chữ kanji"></div>
      <div class="kw-board"><svg class="kw-canvas" viewBox="0 0 109 109" role="img"></svg>
        <p class="kw-message"></p><button type="button" class="kw-replay" aria-label="Phát lại cách viết" title="Phát lại cách viết">↻</button></div>
      <p class="kw-status" role="status" aria-live="polite"></p>
      <p class="kw-credit">Nét viết: <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noopener noreferrer">KanjiVG</a> · © Ulrich Apel và cộng sự · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a></p>`;
    host.append(panel);
    const canvas = panel.querySelector('.kw-canvas'), choices = panel.querySelector('.kw-characters');
    const message = panel.querySelector('.kw-message'), status = panel.querySelector('.kw-status');
    const replay = panel.querySelector('.kw-replay');
    let destroyed = false, epoch = 0, animation = null, glyphs = null, current = '', currentWord = '';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function stop() {
      ++epoch;
      if (animation) { animation.cancel(); animation = null; }
    }
    function resetCanvas() {
      canvas.replaceChildren();
      for (const [x1, y1, x2, y2] of [[54.5, 0, 54.5, 109], [0, 54.5, 109, 54.5]]) {
        canvas.append(svgNode('line', {x1, y1, x2, y2, class: 'kw-guide'}));
      }
    }
    function unavailable(text) {
      resetCanvas(); canvas.setAttribute('aria-label', text);
      message.textContent = text; status.textContent = text;
      panel.dataset.state = 'unavailable'; replay.disabled = true;
    }
    async function play() {
      stop();
      const run = epoch;
      const glyph = glyphs?.[current];
      if (!glyph) { unavailable(`Chưa có dữ liệu nét viết cho chữ ${current}.`); return; }
      resetCanvas(); canvas.setAttribute('viewBox', glyph.viewBox);
      canvas.setAttribute('aria-label', `Cách viết chữ ${current}, ${glyph.strokeCount} nét`);
      message.textContent = ''; replay.disabled = false;
      panel.dataset.state = 'playing';
      status.textContent = `${current} · ${glyph.strokeCount} nét`;
      const nodes = glyph.strokes.map((d, i) => {
        const path = svgNode('path', {d, class: 'kw-stroke', stroke: palette[i % palette.length]});
        path.style.visibility = 'hidden';
        canvas.append(path);
        const label = svgNode('text', {transform: glyph.labels[i].transform, class: 'kw-number', fill: palette[i % palette.length]});
        label.textContent = glyph.labels[i].number; label.style.visibility = 'hidden';
        canvas.append(label);
        return {path, label};
      });
      for (const {path, label} of nodes) {
        if (run !== epoch || destroyed) return;
        path.style.visibility = label.style.visibility = 'visible';
        const length = path.getTotalLength();
        if (!reduced.matches) {
          path.style.strokeDasharray = `${length} ${length}`;
          path.style.strokeDashoffset = String(length);
          const active = path.animate([{strokeDashoffset: length}, {strokeDashoffset: 0}], {
            duration: Math.min(650, Math.max(240, length * 6)), easing: 'linear', fill: 'forwards'
          });
          animation = active;
          try { await active.finished; } catch (_) { return; } // Replay/switch/destroy cancels the old run.
          if (run !== epoch || destroyed) return;
          path.style.strokeDashoffset = '0'; active.cancel(); animation = null;
        }
      }
      if (run === epoch && !destroyed) panel.dataset.state = 'complete';
    }
    function select(char) {
      current = char;
      for (const button of choices.children) button.setAttribute('aria-pressed', String(button.textContent === char));
      return play();
    }
    async function setWord(value) {
      if (destroyed) return;
      stop(); const run = epoch;
      currentWord = String(value); current = '';
      panel.querySelector('.kw-word').textContent = currentWord;
      choices.replaceChildren(); resetCanvas();
      const characters = kanjiIn(currentWord);
      if (!characters.length) { unavailable('Từ này không có chữ kanji cần hướng dẫn.'); return; }
      panel.dataset.state = 'loading'; message.textContent = 'Đang tải nét viết…';
      status.textContent = 'Đang tải nét viết…'; replay.disabled = true;
      try { glyphs = await load(dataUrl); }
      catch (_) {
        if (destroyed || run !== epoch) return;
        panel.dataset.state = 'error'; message.textContent = 'Chưa tải được dữ liệu nét viết.';
        canvas.setAttribute('aria-label', message.textContent);
        status.textContent = 'Bấm ↻ để thử tải lại.'; replay.disabled = false; return;
      }
      if (destroyed || run !== epoch) return;
      for (const char of characters) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'kw-character'; button.lang = 'ja';
        button.textContent = char; button.setAttribute('aria-label', `Xem cách viết chữ ${char}`);
        button.addEventListener('click', () => select(char)); choices.append(button);
      }
      // Loading completes once rendering starts; callers need not await the animation.
      select(characters[0]);
    }
    replay.addEventListener('click', () => panel.dataset.state === 'error' ? setWord(currentWord) : play());
    const onMotion = () => { if (current && glyphs?.[current]) play(); };
    reduced.addEventListener('change', onMotion);
    const ready = setWord(word);
    return {ready, setWord, destroy() {
      destroyed = true; stop(); reduced.removeEventListener('change', onMotion); panel.remove();
    }};
  }
  window.KanjiWriter = Object.freeze({mount, kanjiIn});
})();
