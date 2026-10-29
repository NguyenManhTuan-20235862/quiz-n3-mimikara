(function () {
  'use strict';
  const lessons = window.READING_DATA || [];
  const words = (window.QUIZ_CATEGORIES || []).flatMap(c => c.topics.flatMap(t => t.words));
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('jlpt_n3_reading') || '{}') || {}; } catch (_) { /* Fresh progress if damaged. */ }
  let current = lessons.some(l => l.id === saved.current) ? saved.current : lessons[0]?.id;
  let filter = 'all', ruby = false, api;
  const answers = {};
  const progress = saved.results && typeof saved.results === 'object' ? saved.results : {};
  function persist() {
    try { localStorage.setItem('jlpt_n3_reading', JSON.stringify({current, results:progress})); }
    catch (_) { document.getElementById('readingStatus').textContent = 'Trình duyệt chưa lưu được kết quả. Bạn vẫn có thể tiếp tục đọc.'; }
  }
  function targets(lesson) { return lesson.words.map(k => words.find(w => w.kanji === k)).filter(Boolean); }
  function annotated(lesson) {
    const list = targets(lesson).sort((a,b) => b.kanji.length - a.kanji.length);
    const pattern = new RegExp(list.map(w => w.kanji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    return lesson.text.split('\n').map(p => {
      let result = '', start = 0;
      for (const match of p.matchAll(pattern)) {
        const w = list.find(w => w.kanji === match[0]);
        result += escape(p.slice(start, match.index));
        result += `<button class="reading-word" data-word="${w.id}" aria-label="Tra từ ${escape(w.kanji)}"><ruby>${escape(w.kanji)}<rt${ruby ? '' : ' hidden'}>${escape(w.hiragana)}</rt></ruby></button>`;
        start = match.index + match[0].length;
      }
      return `<p>${result + escape(p.slice(start))}</p>`;
    }).join('');
  }
  function renderList() {
    const visible = lessons.filter(l => filter === 'all' || l.level === filter || (filter === 'review' && targets(l).some(w => api.storage.mistakes[w.id])));
    document.getElementById('readingList').innerHTML = visible.length ? visible.map(l => {
      const count = targets(l).filter(w => api.storage.mistakes[w.id]).length;
      return `<button class="reading-lesson ${l.id === current ? 'selected' : ''}" data-lesson="${l.id}" aria-current="${l.id === current ? 'true':'false'}"><span class="reading-kicker">${String(lessons.indexOf(l)+1).padStart(2,'0')} · ${l.level === 'short' ? 'Ngắn' : 'Vừa'} · ${l.topic}</span><strong>${l.title}</strong><span>${progress[l.id] ? `✓ Đã làm · ${progress[l.id].score}/${l.questions.length} đúng` : `${l.text.replace(/\s/g,'').length} ký tự`} ${count ? `· ${count} từ cần ôn` : ''}</span></button>`;
    }).join('') : '<p class="reading-empty">Chưa có bài phù hợp. Hãy chọn bộ lọc khác; các bài có từ bạn làm sai sẽ xuất hiện ở đây.</p>';
    document.getElementById('readingProgress').textContent = `${lessons.filter(l => progress[l.id]).length}/${lessons.length} bài đã làm`;
  }
  function renderArticle() {
    const l = lessons.find(l => l.id === current);
    const picks = answers[l.id] || {};
    document.getElementById('readingArticle').innerHTML = `
      <div class="reading-kicker">読解 / JLPT N3 · ${l.topic} · ${l.text.replace(/\s/g,'').length} ký tự</div>
      <h2 lang="ja">${l.jaTitle}</h2><p class="reading-subtitle">${l.title}</p>
      <div class="reading-tools"><button class="btn-secondary" id="readingRuby" aria-pressed="${ruby}">${ruby ? 'Ẩn' : 'Hiện'} cách đọc từ mục tiêu</button><button class="btn-secondary" id="readingSpeak">🔊 Nghe bài</button><button class="btn-secondary" id="readingStop">Dừng đọc</button></div>
      <p class="reading-hint">Đọc để hiểu ý chính trước. Bấm vào từ có gạch chân để tra nghĩa và lưu vào sổ tay.</p>
      <div class="reading-prose" lang="ja">${annotated(l)}</div>
      <section class="reading-lookup" id="readingLookup" aria-live="polite">Chọn một từ được gạch chân trong bài để xem giải nghĩa.</section>
      <details class="reading-detail"><summary>Bản dịch tiếng Việt</summary><div>${l.translation.split('\n').map(p => `<p>${escape(p)}</p>`).join('')}</div></details>
      <details class="reading-detail"><summary>Ngữ pháp trong bài · ${l.grammar.length} mẫu</summary><div>${l.grammar.map(g => {
        const item = (window.GRAMMAR_DATA || []).find(x => x.id === g.id);
        return `<div class="reading-grammar"><strong>${escape(item?.pattern || '')}</strong><blockquote lang="ja">${escape(g.quote)}</blockquote><p>${escape(g.note)}</p>${item ? `<details><summary>Cấu trúc & cách dùng</summary><p class="reading-pre">${escape(item.formation)}\n\n${escape(item.usage)}</p></details><button class="btn-secondary" data-grammar="${g.id}">${api.storage.gStarred.has(g.id) ? '✓ Đã đánh dấu ngữ pháp' : '☆ Đánh dấu để ôn ngữ pháp'}</button>` : ''}</div>`;
      }).join('')}</div></details>
      <details class="reading-detail"><summary>Từ vựng mục tiêu · ${targets(l).length} từ</summary><div class="reading-vocab">${targets(l).map(w => `<button class="btn-secondary" data-word="${w.id}"><strong lang="ja">${escape(w.kanji)}</strong> · ${escape(w.nghia)}</button>`).join('')}</div></details>
      <details class="reading-detail"><summary>Chú giải thêm ngoài bộ từ vựng</summary><div><p class="reading-hint">Các từ hỗ trợ dưới đây chưa thuộc bộ 880 từ; sổ Cần ôn dùng cho các từ mục tiêu bên trên.</p>${(window.READING_GLOSSARY || []).filter(w => l.text.includes(w[0])).map(w => `<p><strong lang="ja">${escape(w[0])}</strong> <span lang="ja">（${escape(w[1])}）</span> · ${escape(w[2])}</p>`).join('')}</div></details>
      <section class="reading-questions"><h3>Kiểm tra đọc hiểu</h3><p>Chọn đáp án cho tất cả câu hỏi rồi kiểm tra. Bạn có thể làm lại để ôn.</p>${l.questions.map((q,i) => `<fieldset><legend>${i+1}. ${escape(q.q)}</legend>${q.options.map((o,j) => `<label><input type="radio" name="reading-q-${i}" value="${j}" data-question="${i}" ${picks[i] === j ? 'checked' : ''}> <span lang="ja">${escape(o)}</span></label>`).join('')}<div id="reading-feedback-${i}" class="reading-feedback"></div></fieldset>`).join('')}
      <div class="reading-tools"><button class="btn-primary" id="readingCheck">Kiểm tra đáp án</button><button class="btn-secondary" id="readingRetry">Làm lại</button><button class="btn-secondary" id="readingNext" ${lessons.indexOf(l) === lessons.length-1 ? 'disabled' : ''}>Bài tiếp theo →</button></div><p id="readingResult" role="status"></p></section>`;
  }
  function lookup(id, focus = false) {
    const w = words.find(w => w.id === id);
    if (!w) return;
    const box = document.getElementById('readingLookup');
    box.innerHTML = `<strong lang="ja">${escape(w.kanji)}</strong> <span lang="ja">${escape(w.hiragana)}</span><p>${escape(w.hanViet || '')} · ${escape(w.nghia)}</p><div class="reading-tools"><button class="btn-secondary" data-pronounce="${w.id}">🔊 Nghe từ</button><button class="btn-secondary" data-review-word="${w.id}" ${api.storage.mistakes[id] ? 'disabled' : ''}>${api.storage.mistakes[id] ? '✓ Đã có trong Cần ôn' : '+ Thêm vào Cần ôn'}</button></div>`;
    if (focus) box.scrollIntoView({block:'nearest', behavior:'smooth'});
  }
  window.initReading = function (bridge) {
    api = bridge;
    const root = document.getElementById('readingAppSection');
    if (!root.dataset.ready) {
      root.dataset.ready = 'true';
      root.innerHTML = `<div class="reading-heading"><div><div class="reading-kicker">読む・学ぶ・覚える</div><h1>Luyện đọc mỗi ngày</h1><p>Mười câu chuyện đời thường để ôn từ vựng và ngữ pháp N3.</p></div><span id="readingProgress"></span></div><div class="reading-layout"><aside class="reading-sidebar"><label for="readingFilter">Chọn bài đọc</label><select id="readingFilter" class="custom-select"><option value="all">Tất cả 10 bài</option><option value="short">Bài ngắn · khởi động</option><option value="medium">Bài vừa · thử sức</option><option value="review">Có từ trong sổ Cần ôn</option></select><nav id="readingList" aria-label="Danh sách bài đọc"></nav><p class="reading-hint">Bài tự biên soạn ở mức N3, không phải đề thi chính thức. Cách đọc chỉ hỗ trợ các từ mục tiêu.</p></aside><article id="readingArticle" class="reading-paper"></article></div><p id="readingStatus" role="status"></p>`;
      root.addEventListener('change', e => {
        if (e.target.id === 'readingFilter') { filter = e.target.value; renderList(); }
        if (e.target.matches('[data-question]')) { (answers[current] ||= {})[e.target.dataset.question] = Number(e.target.value); }
      });
      root.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.lesson) { current = b.dataset.lesson; api.stop(); persist(); renderList(); renderArticle(); }
        if (b.dataset.word) lookup(Number(b.dataset.word), true);
        if (b.dataset.pronounce) api.speak(words.find(w => w.id === Number(b.dataset.pronounce)).hiragana);
        if (b.dataset.reviewWord) { const id = Number(b.dataset.reviewWord); if (!api.storage.mistakes[id]) api.storage.addMistake(id); api.update(); lookup(id); renderList(); }
        if (b.dataset.grammar) { const id = Number(b.dataset.grammar); const marked = api.storage.toggleGrammarStarred(id); b.textContent = marked ? '✓ Đã đánh dấu ngữ pháp' : '☆ Đánh dấu để ôn ngữ pháp'; b.setAttribute('aria-pressed', String(marked)); api.update(); }
        const l = lessons.find(l => l.id === current);
        if (b.id === 'readingRuby') { ruby = !ruby; renderArticle(); }
        if (b.id === 'readingSpeak') api.speak(l.text);
        if (b.id === 'readingStop') api.stop();
        if (b.id === 'readingNext') { current = lessons[lessons.indexOf(l)+1]?.id || current; api.stop(); persist(); renderList(); renderArticle(); document.getElementById('readingArticle').scrollIntoView({block:'start'}); }
        if (b.id === 'readingRetry') { delete answers[current]; renderArticle(); }
        if (b.id === 'readingCheck') {
          const picks = answers[current] || {};
          const result = document.getElementById('readingResult');
          if (l.questions.some((_,i) => picks[i] === undefined)) { result.textContent = 'Hãy chọn đáp án cho tất cả câu hỏi trước khi kiểm tra.'; return; }
          let score = 0;
          l.questions.forEach((q,i) => {
            const correct = picks[i] === q.answer; if (correct) score++;
            const feedback = document.getElementById(`reading-feedback-${i}`);
            feedback.className = `reading-feedback ${correct ? 'right' : 'wrong'}`;
            feedback.textContent = `${correct ? '✓ Chính xác.' : `✗ Đáp án đúng: ${q.options[q.answer]}.`} ${q.explanation}`;
          });
          progress[current] = {score, at:new Date().toISOString()}; persist(); renderList();
          result.textContent = `Bạn trả lời đúng ${score}/${l.questions.length} câu. Kết quả gần nhất được lưu trên trình duyệt này.`;
        }
      });
    }
    renderList(); renderArticle();
  };
})();
