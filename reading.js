(function () {
  'use strict';
  const lessons = window.READING_DATA || [];
  const words = (window.QUIZ_CATEGORIES || []).flatMap(c => c.topics.flatMap(t => t.words));
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('jlpt_n3_reading') || '{}') || {}; } catch (_) { /* Fresh progress if damaged. */ }
  const stages = [...new Set(lessons.map(l=>l.stage).filter(Boolean))].sort((a,b)=>b-a);
  const latestStage = stages[0] || 0;
  const resumed = lessons.find(l=>l.id===saved.current);
  let current = (resumed || lessons.find(l=>l.stage===latestStage) || lessons[0])?.id;
  let stage = String(resumed ? resumed.stage || 0 : latestStage), filter = 'all', ruby = false, api;
  const answers = {};
  const recallAnswers = {}, checkedRecall = new Set();
  const recall = saved.recall && typeof saved.recall === 'object' ? saved.recall : {};
  const progress = saved.results && typeof saved.results === 'object' ? saved.results : {};
  function persist() {
    try { localStorage.setItem('jlpt_n3_reading', JSON.stringify({current, results:progress,recall})); }
    catch (_) { document.getElementById('readingStatus').textContent = 'Trình duyệt chưa lưu được kết quả. Bạn vẫn có thể tiếp tục đọc.'; }
  }
  function targets(lesson) { return lesson.vocabulary ? lesson.vocabulary.map(ref=>words.find(w=>w.id===ref.id)).filter(Boolean) : lesson.words.map(k => words.find(w => w.kanji === k)).filter(Boolean); }
  function filteredLessons() {
    return lessons.filter(l => (stage === 'all' || Number(stage) === (l.stage || 0)) && (filter === 'all' || l.level === filter || (filter === 'review' && (targets(l).some(w => api.storage.mistakes[w.id]) || l.grammar.some(g=>api.storage.gMistakes.has(g.id))))));
  }
  function renderCoverage() {
    const grammar = window.GRAMMAR_DATA || [];
    const readyWords = new Set(lessons.flatMap(l=>targets(l).map(w=>w.id)));
    const readyGrammar = new Set(lessons.flatMap(l=>l.grammar.map(g=>g.id)));
    const completed = lessons.filter(l=>progress[l.id]);
    const seenWords = new Set(completed.flatMap(l=>targets(l).map(w=>w.id)));
    const seenGrammar = new Set(completed.flatMap(l=>l.grammar.map(g=>g.id)));
    const correct = type => Object.entries(recall).filter(([key,r])=>key.startsWith(type+':') && r?.correct).length;
    const plan = window.READING_PLAN || [];
    const readySummary = [...stages].reverse().map(s=>{
      const group=lessons.filter(l=>l.stage===s);
      return `Chặng ${s}: ${group.length} bài, ${new Set(group.flatMap(l=>l.newWordIds)).size} từ trọng tâm và ${new Set(group.map(l=>l.focusGrammarId)).size} mẫu trọng tâm`;
    }).join('; ');
    document.getElementById('readingCoverage').innerHTML = `<div class="reading-metrics">${[
      ['Đã có trong bài',`${readyWords.size}/880 từ`,`${readyGrammar.size}/62 ngữ pháp`],
      ['Đã gặp qua bài đã làm',`${seenWords.size}/880 từ`,`${seenGrammar.size}/62 ngữ pháp`],
      ['Đúng lần kiểm tra gần nhất',`${correct('word')}/880 từ`,`${correct('grammar')}/62 ngữ pháp`]
    ].map(([label,w,g])=>`<div><span>${label}</span><strong>${w}</strong><small>${g}</small></div>`).join('')}</div>
    <details class="reading-detail"><summary>Độ phủ & kế hoạch toàn bộ lộ trình</summary><p>Đã phân bổ ${new Set(plan.flatMap(p=>p.wordIds)).size}/880 từ và ${new Set(plan.flatMap(p=>p.grammarIds)).size}/62 mẫu vào ${plan.length} bài dự kiến. Số bài có thể điều chỉnh khi biên soạn. Đã có: ${readySummary}. Các chặng sau mới là kế hoạch, chưa có nội dung. Bộ khởi động được tính riêng trong độ phủ bài đã có.</p><p>“Đã gặp” chỉ tăng khi kiểm tra đọc hiểu xong; không có nghĩa là đã thuộc. Kết quả ghi nhớ chỉ dựa trên các câu kiểm tra bạn thực sự trả lời, không tự đánh dấu toàn bộ từ của bài.</p><details><summary>Từ chưa có trong bài · ${words.length-readyWords.size}</summary><p class="reading-missing">${words.filter(w=>!readyWords.has(w.id)).map(w=>`#${w.id} ${escape(w.kanji)}`).join(' · ')}</p></details><details><summary>Ngữ pháp chưa có trong bài · ${grammar.length-readyGrammar.size}</summary><p>${grammar.filter(g=>!readyGrammar.has(g.id)).map(g=>`#${g.id} ${escape(g.pattern)}`).join(' · ')}</p></details></details>`;
  }
  function annotated(lesson) {
    const list = lesson.vocabulary ? lesson.vocabulary.flatMap(ref=>ref.forms.map(f=>({...f,id:ref.id}))) : targets(lesson).map(w=>({id:w.id,text:w.kanji,reading:w.hiragana}));
    list.sort((a,b)=>b.text.length-a.text.length);
    if (!list.length) return lesson.text.split('\n').map(p=>`<p>${escape(p)}</p>`).join('');
    const pattern = new RegExp(list.map(w => w.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    return lesson.text.split('\n').map(p => {
      let result = '', start = 0;
      for (const match of p.matchAll(pattern)) {
        const w = list.find(w => w.text === match[0]);
        result += escape(p.slice(start, match.index));
        result += `<button class="reading-word" data-word="${w.id}" aria-label="Tra từ ${escape(w.text)}"><ruby>${escape(w.text)}<rt${ruby ? '' : ' hidden'}>${escape(w.reading)}</rt></ruby></button>`;
        start = match.index + match[0].length;
      }
      return `<p>${result + escape(p.slice(start))}</p>`;
    }).join('');
  }
  function renderList() {
    const visible = filteredLessons();
    document.getElementById('readingList').innerHTML = visible.length ? visible.map(l => {
      const count = targets(l).filter(w => api.storage.mistakes[w.id]).length;
      return `<button class="reading-lesson ${l.id === current ? 'selected' : ''}" data-lesson="${l.id}" aria-current="${l.id === current ? 'true':'false'}"><span class="reading-kicker">${l.stage ? `Chặng ${l.stage} · ${String(l.order).padStart(2,'0')}` : 'Khởi động'} · ${l.topic}</span><strong>${l.title}</strong><span>${progress[l.id] ? `✓ Đã làm · ${progress[l.id].score}/${l.questions.length} đúng` : `${l.text.replace(/\s/g,'').length} ký tự`} ${count ? `· ${count} từ cần ôn` : ''}</span></button>`;
    }).join('') : '<p class="reading-empty">Chưa có bài phù hợp. Hãy chọn bộ lọc khác; các bài có từ bạn làm sai sẽ xuất hiện ở đây.</p>';
    document.getElementById('readingProgress').textContent = `${lessons.filter(l => progress[l.id]).length}/${lessons.length} bài đã làm`;
    renderCoverage();
  }
  function renderArticle() {
    const l = lessons.find(l => l.id === current);
    if (!l) { document.getElementById('readingArticle').innerHTML = '<p>Chưa có bài phù hợp với bộ lọc này. Hãy chọn bộ lọc khác.</p>'; return; }
    const picks = answers[l.id] || {};
    const available = filteredLessons();
    document.getElementById('readingArticle').innerHTML = `
      <div class="reading-kicker">読解 / JLPT N3 · ${l.stage ? `Chặng ${l.stage} / Bài ${l.order} · ${l.format}` : 'Khởi động'} · ${l.text.replace(/\s/g,'').length} ký tự</div>
      <h2 lang="ja">${l.jaTitle}</h2><p class="reading-subtitle">${l.title}</p>
      ${l.stage ? `<p class="reading-objectives">${l.newWordIds.length} từ trọng tâm · ${l.reviewWordIds.length} từ ôn lại · ${l.grammar.length} mẫu ngữ pháp<br>Đọc → trả lời → tra cứu → kiểm tra từ/ngữ pháp → ôn lại mục sai</p>` : ''}
      <div class="reading-tools"><button class="btn-secondary" id="readingRuby" aria-pressed="${ruby}">${ruby ? 'Ẩn' : 'Hiện'} cách đọc từ mục tiêu</button><button class="btn-secondary" id="readingSpeak">🔊 Nghe bài</button><button class="btn-secondary" id="readingStop">Dừng đọc</button></div>
      <p class="reading-hint">Đọc để hiểu ý chính trước. Bấm vào từ có gạch chân để tra nghĩa và lưu vào sổ tay.</p>
      <div class="reading-prose" lang="ja">${annotated(l)}</div>
      <section class="reading-lookup" id="readingLookup" aria-live="polite">Chọn một từ được gạch chân trong bài để xem giải nghĩa.</section>
      <details class="reading-detail"><summary>Bản dịch tiếng Việt</summary><div>${l.translation.split('\n').map(p => `<p>${escape(p)}</p>`).join('')}</div></details>
      <details class="reading-detail"><summary>Ngữ pháp trong bài · ${l.grammar.length} mẫu</summary><div>${l.grammar.map(g => {
        const item = (window.GRAMMAR_DATA || []).find(x => x.id === g.id);
        return `<div class="reading-grammar"><span class="reading-kicker">${g.id === l.focusGrammarId ? 'Trọng tâm' : 'Kết hợp / ôn lại'}</span><br><strong>${escape(item?.pattern || '')}</strong><blockquote lang="ja">${escape(g.quote)}</blockquote><p>${escape(g.note)}</p>${item ? `<details><summary>Cấu trúc & cách dùng</summary><p class="reading-pre">${escape(item.formation)}\n\n${escape(item.usage)}</p></details><button class="btn-secondary" data-grammar="${g.id}">${api.storage.gStarred.has(g.id) ? '✓ Đã đánh dấu ngữ pháp' : '☆ Đánh dấu để ôn ngữ pháp'}</button>` : ''}</div>`;
      }).join('')}</div></details>
      <details class="reading-detail"><summary>Từ vựng mục tiêu · ${targets(l).length} từ</summary><div class="reading-vocab">${targets(l).map(w => `<button class="btn-secondary" data-word="${w.id}"><strong lang="ja">${escape(w.kanji)}</strong> · ${escape(w.nghia)} ${l.newWordIds ? `<small>(${l.newWordIds.includes(w.id) ? 'trọng tâm' : 'ôn lại'})</small>` : ''}</button>`).join('')}</div></details>
      <details class="reading-detail"><summary>Chú giải thêm ngoài bộ từ vựng</summary><div><p class="reading-hint">Các từ hỗ trợ dưới đây chưa thuộc bộ 880 từ; sổ Cần ôn dùng cho các từ mục tiêu bên trên.</p>${(window.READING_GLOSSARY || []).filter(w => l.text.includes(w[0])).map(w => `<p><strong lang="ja">${escape(w[0])}</strong> <span lang="ja">（${escape(w[1])}）</span> · ${escape(w[2])}</p>`).join('')}</div></details>
      <section class="reading-questions"><h3>Kiểm tra đọc hiểu</h3><p>Chọn đáp án cho tất cả câu hỏi rồi kiểm tra. Bạn có thể làm lại để ôn.</p>${l.questions.map((q,i) => `<fieldset><legend>${i+1}. ${escape(q.q)}</legend>${q.options.map((o,j) => `<label><input type="radio" name="reading-q-${i}" value="${j}" data-question="${i}" ${picks[i] === j ? 'checked' : ''}> <span lang="ja">${escape(o)}</span></label>`).join('')}<div id="reading-feedback-${i}" class="reading-feedback"></div></fieldset>`).join('')}
      <div class="reading-tools"><button class="btn-primary" id="readingCheck">Kiểm tra đáp án</button><button class="btn-secondary" id="readingRetry">Làm lại</button><button class="btn-secondary" id="readingNext" ${available.indexOf(l) === available.length-1 ? 'disabled' : ''}>Bài tiếp theo →</button></div><p id="readingResult" role="status"></p></section>
      ${l.stage ? `<details class="reading-detail" id="readingRecall"><summary>Kiểm tra ghi nhớ · ${l.newWordIds.length} từ + 1 mẫu ngữ pháp</summary><p>Hãy thử làm sau khi đọc. Mỗi câu đúng/sai cập nhật riêng mục tương ứng vào Đã thuộc/Cần ôn. Đọc hiểu không tự đánh dấu thuộc từ.</p><div id="readingRecallBody">${renderRecall(l)}</div></details>` : ''}`;
  }
  function recallQuestions(l) {
    if (!l.newWordIds) return [];
    return [...l.newWordIds.map(id=>{
      const w = words.find(w=>w.id===id);
      const other = words.filter(x=>x.nghia !== w.nghia);
      const distractors = [...new Set(other.map(x=>x.nghia))];
      const correct = id % 3;
      const options = [distractors[(id*7)%distractors.length],distractors[(id*7+1)%distractors.length]];
      options.splice(correct,0,w.nghia);
      return {key:`word:${id}`,id,type:'word',prompt:`${w.kanji} — nghĩa nào đúng?`,options,answer:correct,explanation:`${w.kanji}（${w.hiragana}）: ${w.nghia}`};
    }),{...l.grammarCheck,key:`grammar:${l.focusGrammarId}`,id:l.focusGrammarId,type:'grammar'}];
  }
  function renderRecall(l) {
    const checked = checkedRecall.has(l.id), picks = recallAnswers[l.id] || {};
    return recallQuestions(l).map((q,i)=>`<fieldset class="reading-recall-question"><legend>${i+1}. ${escape(q.prompt)}</legend>${q.options.map((o,j)=>`<label><input type="radio" name="recall-${q.key}" data-recall="${q.key}" value="${j}" ${picks[q.key]===j?'checked':''} ${checked?'disabled':''}> ${escape(o)}</label>`).join('')}${checked ? `<p class="reading-feedback ${picks[q.key]===q.answer?'right':'wrong'}">${picks[q.key]===q.answer?'✓ Chính xác.':'✗ Cần ôn lại.'} ${escape(q.explanation)}</p>` : ''}</fieldset>`).join('')+`<div class="reading-tools"><button class="btn-primary" id="readingRecallCheck" ${checked?'disabled':''}>Kiểm tra ghi nhớ</button><button class="btn-secondary" id="readingRecallRetry">Làm lại phần ghi nhớ</button></div><p id="readingRecallResult" role="status">${checked?'Đã lưu kết quả từng mục. Những mục sai đã được thêm vào Cần ôn.':''}</p>`;
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
      root.innerHTML = `<div class="reading-heading"><div><div class="reading-kicker">読む・学ぶ・覚える</div><h1>Lộ trình luyện đọc N3</h1><p>Đã có ${stages.length} chặng · ${lessons.filter(l=>l.stage).length} bài trong lộ trình. Đích đến: 880 từ & 62 mẫu.</p></div><span id="readingProgress"></span></div><section id="readingCoverage" class="reading-coverage" aria-label="Độ phủ và tiến độ"></section><div class="reading-layout"><aside class="reading-sidebar"><label for="readingStage">Chọn chặng</label><select id="readingStage" class="custom-select">${stages.map(s=>`<option value="${s}" ${stage===String(s)?'selected':''}>Chặng ${s} · ${lessons.filter(l=>l.stage===s).length} bài${s===latestStage?' · Mới':''}</option>`).join('')}<option value="0" ${stage==='0'?'selected':''}>Khởi động · ${lessons.filter(l=>!l.stage).length} bài cũ</option><option value="all">Tất cả ${lessons.length} bài đã có</option></select><label for="readingFilter">Lọc bài đọc</label><select id="readingFilter" class="custom-select"><option value="all">Tất cả bài trong chặng</option><option value="short">Bài ngắn</option><option value="medium">Bài vừa</option><option value="review">Có từ / ngữ pháp cần ôn</option></select><nav id="readingList" aria-label="Danh sách bài đọc"></nav><p class="reading-hint">Bài tự biên soạn ở mức N3, không phải đề thi chính thức. Cách đọc chỉ hỗ trợ các từ mục tiêu. Dạng chia của từ được liên kết về đúng từ gốc.</p></aside><article id="readingArticle" class="reading-paper"></article></div><p id="readingStatus" role="status"></p>`;
      root.addEventListener('change', e => {
        if (e.target.id === 'readingStage' || e.target.id === 'readingFilter') {
          api.stop();
          stage = document.getElementById('readingStage').value;
          filter = document.getElementById('readingFilter').value;
          const visible = filteredLessons();
          if (!visible.some(l=>l.id===current)) current = visible[0]?.id || null;
          persist(); renderList(); renderArticle();
        }
        if (e.target.matches('[data-question]')) { (answers[current] ||= {})[e.target.dataset.question] = Number(e.target.value); }
        if (e.target.matches('[data-recall]')) { (recallAnswers[current] ||= {})[e.target.dataset.recall] = Number(e.target.value); }
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
        if (!l) return;
        if (b.id === 'readingRuby') { ruby = !ruby; renderArticle(); }
        if (b.id === 'readingSpeak') api.speak(l.text);
        if (b.id === 'readingStop') api.stop();
        if (b.id === 'readingNext') { const available=filteredLessons(); current = available[available.indexOf(l)+1]?.id || current; api.stop(); persist(); renderList(); renderArticle(); document.getElementById('readingArticle').scrollIntoView({block:'start'}); }
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
        if (b.id === 'readingRecallCheck' && !checkedRecall.has(current)) {
          const questions = recallQuestions(l), picks = recallAnswers[current] || {};
          if (questions.some(q=>picks[q.key]===undefined)) { document.getElementById('readingRecallResult').textContent = 'Hãy trả lời tất cả câu hỏi ghi nhớ trước khi kiểm tra.'; return; }
          questions.forEach(q=>{
            const correct = picks[q.key]===q.answer;
            recall[q.key] = {correct,at:new Date().toISOString(),lesson:current};
            if (q.type==='word') { if(correct) api.storage.addMastered(q.id); else api.storage.addMistake(q.id); }
            else { if(correct) api.storage.addGrammarMastered(q.id); else api.storage.addGrammarMistake(q.id); }
          });
          checkedRecall.add(current); persist(); api.update(); renderList();
          document.getElementById('readingRecallBody').innerHTML = renderRecall(l);
        }
        if (b.id === 'readingRecallRetry') { checkedRecall.delete(current); delete recallAnswers[current]; document.getElementById('readingRecallBody').innerHTML = renderRecall(l); }
      });
    }
    renderList(); renderArticle();
  };
})();
