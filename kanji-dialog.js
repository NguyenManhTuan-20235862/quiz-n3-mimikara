// Shared entry point for flashcards and reading word lookup.
(function () {
  'use strict';
  const dialog = document.createElement('dialog');
  dialog.className = 'kanji-dialog';
  dialog.id = 'kanjiDialog';
  dialog.setAttribute('aria-label', 'Cách viết kanji');
  dialog.innerHTML = '<button type="button" class="kw-close" aria-label="Đóng hướng dẫn viết" autofocus>✕</button><div class="kw-dialog-content"></div>';
  document.body.append(dialog);
  let writer = null, opener = null;
  function cleanup() {
    writer?.destroy(); writer = null;
    document.body.classList.remove('kanji-dialog-open');
    if (opener?.isConnected) opener.focus({preventScroll:true});
    opener = null;
  }
  function close() { if (dialog.open) { dialog.close(); cleanup(); } }
  // A native close event is queued; don't let an old event tear down a new open.
  dialog.addEventListener('close', () => { if (!dialog.open) cleanup(); });
  dialog.querySelector('.kw-close').addEventListener('click', close);
  // Native dialog traps focus and Escape closes it; leave app shortcuts alone.
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-kanji-word]');
    if (!button || button.disabled) return;
    event.preventDefault();
    writer?.destroy();
    opener = button;
    writer = window.KanjiWriter.mount(dialog.querySelector('.kw-dialog-content'), {word:button.dataset.kanjiWord});
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('kanji-dialog-open');
    dialog.querySelector('.kw-close').focus();
  });
})();
