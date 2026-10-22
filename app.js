/**
 * JLPT N3 Vocabulary Master - Interactive Web App
 * Features: Quiz, 3D Flashcard, Spelling, Timed Exam, Review/Favorites, Dictionary
 */

(function () {
  'use strict';

  // --- Audio Synthesizer (Web Audio API & Speech Synthesis) ---
  const soundManager = {
    enabled: true,
    audioCtx: null,

    init() {
      const saved = localStorage.getItem('jlpt_n3_sound');
      this.enabled = saved !== null ? JSON.parse(saved) : true;
    },

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    },

    playCorrect() {
      if (!this.enabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });
    },

    playWrong() {
      if (!this.enabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    },

    speak(text) {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ja-JP';
      utter.rate = 0.88;
      window.speechSynthesis.speak(utter);
    }
  };

  // --- Storage Manager ---
  const storage = {
    mastered: new Set(),
    mistakes: {}, // { wordId: count }
    favorites: new Set(),

    // Grammar Storage
    gMastered: new Set(),
    gMistakes: new Set(),
    gStarred: new Set(),

    load() {
      try {
        const m = localStorage.getItem('jlpt_n3_mastered');
        if (m) this.mastered = new Set(JSON.parse(m));

        const mist = localStorage.getItem('jlpt_n3_mistakes');
        if (mist) this.mistakes = JSON.parse(mist);

        const f = localStorage.getItem('jlpt_n3_favorites');
        if (f) this.favorites = new Set(JSON.parse(f));

        // Load Grammar
        const gm = localStorage.getItem('jlpt_n3_g_mastered');
        if (gm) this.gMastered = new Set(JSON.parse(gm));

        const gmist = localStorage.getItem('jlpt_n3_g_mistakes');
        if (gmist) this.gMistakes = new Set(JSON.parse(gmist));

        const gstar = localStorage.getItem('jlpt_n3_g_starred');
        if (gstar) this.gStarred = new Set(JSON.parse(gstar));
      } catch (e) {
        console.error('Failed to load local storage:', e);
      }
    },

    save() {
      try {
        localStorage.setItem('jlpt_n3_mastered', JSON.stringify([...this.mastered]));
        localStorage.setItem('jlpt_n3_mistakes', JSON.stringify(this.mistakes));
        localStorage.setItem('jlpt_n3_favorites', JSON.stringify([...this.favorites]));

        // Save Grammar
        localStorage.setItem('jlpt_n3_g_mastered', JSON.stringify([...this.gMastered]));
        localStorage.setItem('jlpt_n3_g_mistakes', JSON.stringify([...this.gMistakes]));
        localStorage.setItem('jlpt_n3_g_starred', JSON.stringify([...this.gStarred]));
      } catch (e) {
        console.error('Failed to save local storage:', e);
      }
    },

    addMistake(id) {
      this.mistakes[id] = (this.mistakes[id] || 0) + 1;
      this.mastered.delete(id);
      this.save();
    },

    removeMistake(id) {
      delete this.mistakes[id];
      this.save();
    },

    addMastered(id) {
      this.mastered.add(id);
      delete this.mistakes[id];
      this.save();
    },

    toggleFavorite(id) {
      if (this.favorites.has(id)) {
        this.favorites.delete(id);
      } else {
        this.favorites.add(id);
      }
      this.save();
      return this.favorites.has(id);
    },

    // Grammar helpers
    addGrammarMastered(id) {
      const numId = Number(id);
      this.gMastered.add(numId);
      this.gMistakes.delete(numId);
      this.save();
    },

    removeGrammarMastered(id) {
      this.gMastered.delete(Number(id));
      this.save();
    },

    addGrammarMistake(id) {
      const numId = Number(id);
      this.gMistakes.add(numId);
      this.gMastered.delete(numId);
      this.save();
    },

    removeGrammarMistake(id) {
      this.gMistakes.delete(Number(id));
      this.save();
    },

    toggleGrammarStarred(id) {
      const numId = Number(id);
      if (this.gStarred.has(numId)) {
        this.gStarred.delete(numId);
      } else {
        this.gStarred.add(numId);
      }
      this.save();
      return this.gStarred.has(numId);
    }
  };

  // --- Application State ---
  const appState = {
    categories: window.QUIZ_CATEGORIES || [],
    currentCategory: null,
    currentTopicId: 'all',
    wordsPool: [],
    
    // Quiz state
    quizWords: [],
    quizIndex: 0,
    quizScore: 0,
    quizStreak: 0,
    quizCurrentQ: null,
    quizAnswered: false,

    // Flashcard state
    fcWords: [],
    fcIndex: 0,
    fcFlipped: false,

    // Spelling state
    spellingWords: [],
    spellingIndex: 0,
    spellingCurrentWord: null,

    // Exam state
    examActive: false,
    examWords: [],
    examIndex: 0,
    examScore: 0,
    examTimer: null,
    examSecondsLeft: 25,
    examTimePerQ: 25,
    examMistakes: [],

    // Review subtab
    reviewTab: 'mistakes', // or 'favorites'

    // Dictionary hidden columns (che nội dung cột để dò bài)
    hiddenColumns: (() => {
      try {
        return JSON.parse(localStorage.getItem('jlpt_n3_hidden_cols')) || { kanji: false, hiragana: false, hanviet: false, nghia: false };
      } catch (e) {
        return { kanji: false, hiragana: false, hanviet: false, nghia: false };
      }
    })(),

    // App Mode: 'vocab' or 'grammar'
    appMode: localStorage.getItem('jlpt_n3_app_mode') || 'vocab',

    // Grammar State
    grammarCategories: window.GRAMMAR_CATEGORIES || [],
    grammarData: window.GRAMMAR_DATA || [],
    grammarTab: 'handbook', // 'handbook' | 'quiz' | 'flashcard' | 'review'
    grammarCategoryId: 'all',
    grammarSearch: '',
    grammarExpanded: new Set(),
    gReviewTab: 'mistakes', // 'mistakes' | 'mastered' | 'starred'

    // Grammar Quiz state
    gQuizQuestions: [],
    gQuizIndex: 0,
    gQuizScore: 0,
    gQuizStreak: 0,
    gQuizCurrentQ: null,
    gQuizAnswered: false,

    // Grammar Flashcard state
    gFcList: [],
    gFcIndex: 0,
    gFcFlipped: false
  };

  // --- DOM Elements ---
  const dom = {
    // Mode switcher
    appModeSwitch: document.getElementById('appModeSwitch'),
    modeBtnVocab: document.getElementById('modeBtnVocab'),
    modeBtnGrammar: document.getElementById('modeBtnGrammar'),
    vocabNavTabsWrapper: document.getElementById('vocabNavTabsWrapper'),
    grammarNavTabsWrapper: document.getElementById('grammarNavTabsWrapper'),
    vocabAppSection: document.getElementById('vocabAppSection'),
    grammarAppSection: document.getElementById('grammarAppSection'),
    brandMainTitle: document.getElementById('brandMainTitle'),
    brandSubTitle: document.getElementById('brandSubTitle'),

    categorySelect: document.getElementById('categorySelect'),
    categoryPills: document.getElementById('categoryPills'),
    topicSelect: document.getElementById('topicSelect'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    navTabBtns: document.querySelectorAll('.nav-tab-btn'),
    viewSections: document.querySelectorAll('.view-section'),

    currentWordCount: document.getElementById('currentWordCount'),
    masteredCount: document.getElementById('masteredCount'),
    mistakeCount: document.getElementById('mistakeCount'),
    statPillMastered: document.getElementById('statPillMastered'),
    statPillMistake: document.getElementById('statPillMistake'),
    reviewBadge: document.getElementById('reviewBadge'),
    dictTotalBadge: document.getElementById('dictTotalBadge'),

    // Quiz elements
    quizTopicBadge: document.getElementById('quizTopicBadge'),
    quizScoreText: document.getElementById('quizScoreText'),
    streakCount: document.getElementById('streakCount'),
    quizProgressFill: document.getElementById('quizProgressFill'),
    quizProgressText: document.getElementById('quizProgressText'),
    quizStarBtn: document.getElementById('quizStarBtn'),
    quizPromptType: document.getElementById('quizPromptType'),
    quizQuestionWord: document.getElementById('quizQuestionWord'),
    quizQuestionSub: document.getElementById('quizQuestionSub'),
    quizAudioBtn: document.getElementById('quizAudioBtn'),
    quizOptionsGrid: document.getElementById('quizOptionsGrid'),
    quizExplanation: document.getElementById('quizExplanation'),
    expKanji: document.getElementById('expKanji'),
    expHiragana: document.getElementById('expHiragana'),
    expHanViet: document.getElementById('expHanViet'),
    expNghia: document.getElementById('expNghia'),
    expStt: document.getElementById('expStt'),
    quizNextBtn: document.getElementById('quizNextBtn'),
    quizShuffleBtn: document.getElementById('quizShuffleBtn'),

    // Flashcard elements
    fcTopicBadge: document.getElementById('fcTopicBadge'),
    fcSttBadge: document.getElementById('fcSttBadge'),
    fcAudioBtn: document.getElementById('fcAudioBtn'),
    flashcardElement: document.getElementById('flashcardElement'),
    fcKanji: document.getElementById('fcKanji'),
    fcHanViet: document.getElementById('fcHanViet'),
    fcHiragana: document.getElementById('fcHiragana'),
    fcNghia: document.getElementById('fcNghia'),
    fcProgressFill: document.getElementById('fcProgressFill'),
    fcProgressText: document.getElementById('fcProgressText'),
    fcPrevBtn: document.getElementById('fcPrevBtn'),
    fcNextBtn: document.getElementById('fcNextBtn'),
    fcReviewBtn: document.getElementById('fcReviewBtn'),
    fcMasteredBtn: document.getElementById('fcMasteredBtn'),

    // Spelling elements
    spellingTopicBadge: document.getElementById('spellingTopicBadge'),
    spellingKanji: document.getElementById('spellingKanji'),
    spellingHanViet: document.getElementById('spellingHanViet'),
    spellingMeaning: document.getElementById('spellingMeaning'),
    spellingForm: document.getElementById('spellingForm'),
    spellingInput: document.getElementById('spellingInput'),
    spellingFeedback: document.getElementById('spellingFeedback'),
    spellingHintBtn: document.getElementById('spellingHintBtn'),
    spellingSkipBtn: document.getElementById('spellingSkipBtn'),
    spellingProgressFill: document.getElementById('spellingProgressFill'),
    spellingProgressText: document.getElementById('spellingProgressText'),

    // Exam elements
    examSetupCard: document.getElementById('examSetupCard'),
    examActiveCard: document.getElementById('examActiveCard'),
    examResultCard: document.getElementById('examResultCard'),
    examCountSelect: document.getElementById('examCountSelect'),
    examTimeSelect: document.getElementById('examTimeSelect'),
    examStartBtn: document.getElementById('examStartBtn'),
    examCounterText: document.getElementById('examCounterText'),
    examTimerValue: document.getElementById('examTimerValue'),
    examProgressFill: document.getElementById('examProgressFill'),
    examPromptType: document.getElementById('examPromptType'),
    examQuestionWord: document.getElementById('examQuestionWord'),
    examQuestionSub: document.getElementById('examQuestionSub'),
    examAudioBtn: document.getElementById('examAudioBtn'),
    examOptionsGrid: document.getElementById('examOptionsGrid'),
    examScorePercent: document.getElementById('examScorePercent'),
    examScoreFraction: document.getElementById('examScoreFraction'),
    examRankBadge: document.getElementById('examRankBadge'),
    examRetryBtn: document.getElementById('examRetryBtn'),
    examReviewMistakesBtn: document.getElementById('examReviewMistakesBtn'),

    // Review elements
    subtabMistakesBtn: document.getElementById('subtabMistakesBtn'),
    subtabMasteredBtn: document.getElementById('subtabMasteredBtn'),
    subtabFavoritesBtn: document.getElementById('subtabFavoritesBtn'),
    countMistakesTab: document.getElementById('countMistakesTab'),
    countMasteredTab: document.getElementById('countMasteredTab'),
    countFavoritesTab: document.getElementById('countFavoritesTab'),
    clearReviewBtn: document.getElementById('clearReviewBtn'),
    reviewListContainer: document.getElementById('reviewListContainer'),

    // Dictionary elements
    dictTable: document.getElementById('dictTable'),
    dictSearchInput: document.getElementById('dictSearchInput'),
    dictTopicSelect: document.getElementById('dictTopicSelect'),
    dictFilteredCount: document.getElementById('dictFilteredCount'),
    dictStatusText: document.getElementById('dictStatusText'),
    dictTableBody: document.getElementById('dictTableBody'),

    // Reset Modal elements
    resetStatsBtn: document.getElementById('resetStatsBtn'),
    resetModal: document.getElementById('resetModal'),
    resetMasteredBtn: document.getElementById('resetMasteredBtn'),
    resetMistakesBtn: document.getElementById('resetMistakesBtn'),
    resetAllStatsBtn: document.getElementById('resetAllStatsBtn'),
    closeResetModalBtn: document.getElementById('closeResetModalBtn'),

    // Grammar Navigation & Stats
    grammarCategoryPills: document.getElementById('grammarCategoryPills'),
    grammarCategorySelect: document.getElementById('grammarCategorySelect'),
    grammarTotalCount: document.getElementById('grammarTotalCount'),
    gMasteredCount: document.getElementById('gMasteredCount'),
    gReviewCount: document.getElementById('gReviewCount'),
    gStatPillMastered: document.getElementById('gStatPillMastered'),
    gStatPillReview: document.getElementById('gStatPillReview'),
    resetGrammarStatsBtn: document.getElementById('resetGrammarStatsBtn'),
    gHandbookBadge: document.getElementById('gHandbookBadge'),
    gReviewBadge: document.getElementById('gReviewBadge'),

    // Grammar Handbook
    grammarSearchInput: document.getElementById('grammarSearchInput'),
    grammarToggleAllBtn: document.getElementById('grammarToggleAllBtn'),
    toggleAllIcon: document.getElementById('toggleAllIcon'),
    toggleAllText: document.getElementById('toggleAllText'),
    grammarStatusText: document.getElementById('grammarStatusText'),
    grammarCardsList: document.getElementById('grammarCardsList'),

    // Grammar Quiz
    gQuizProgressFill: document.getElementById('gQuizProgressFill'),
    gQuizProgressText: document.getElementById('gQuizProgressText'),
    gQuizCategoryBadge: document.getElementById('gQuizCategoryBadge'),
    gQuizStreak: document.getElementById('gQuizStreak'),
    gQuizStarBtn: document.getElementById('gQuizStarBtn'),
    gQuizSentence: document.getElementById('gQuizSentence'),
    gQuizMeaning: document.getElementById('gQuizMeaning'),
    gQuizAudioBtn: document.getElementById('gQuizAudioBtn'),
    gQuizOptionsGrid: document.getElementById('gQuizOptionsGrid'),
    gQuizExplanation: document.getElementById('gQuizExplanation'),
    gQuizExpTitle: document.getElementById('gQuizExpTitle'),
    gQuizExpDetail: document.getElementById('gQuizExpDetail'),
    gQuizRestartBtn: document.getElementById('gQuizRestartBtn'),
    gQuizNextBtn: document.getElementById('gQuizNextBtn'),

    // Grammar Flashcard
    gFcProgressFill: document.getElementById('gFcProgressFill'),
    gFcProgressText: document.getElementById('gFcProgressText'),
    gFlashcardElement: document.getElementById('gFlashcardElement'),
    gFcCategoryBadge: document.getElementById('gFcCategoryBadge'),
    gFcCategoryBadgeBack: document.getElementById('gFcCategoryBadgeBack'),
    gFcNumberBadge: document.getElementById('gFcNumberBadge'),
    gFcPattern: document.getElementById('gFcPattern'),
    gFcFormation: document.getElementById('gFcFormation'),
    gFcMeaning: document.getElementById('gFcMeaning'),
    gFcUsage: document.getElementById('gFcUsage'),
    gFcExample: document.getElementById('gFcExample'),
    gFcAudioBtn: document.getElementById('gFcAudioBtn'),
    gFcReviewBtn: document.getElementById('gFcReviewBtn'),
    gFcMasteredBtn: document.getElementById('gFcMasteredBtn'),
    gFcPrevBtn: document.getElementById('gFcPrevBtn'),
    gFcNextBtn: document.getElementById('gFcNextBtn'),

    // Grammar Review
    gSubtabMistakesBtn: document.getElementById('gSubtabMistakesBtn'),
    gSubtabMasteredBtn: document.getElementById('gSubtabMasteredBtn'),
    gSubtabStarredBtn: document.getElementById('gSubtabStarredBtn'),
    gCountMistakesTab: document.getElementById('gCountMistakesTab'),
    gCountMasteredTab: document.getElementById('gCountMasteredTab'),
    gCountStarredTab: document.getElementById('gCountStarredTab'),
    gClearReviewBtn: document.getElementById('gClearReviewBtn'),
    gReviewListContainer: document.getElementById('gReviewListContainer')
  };

  // --- Helper Functions ---
  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getAllWordsFromCurrentCategory() {
    if (!appState.currentCategory) return [];
    const all = [];
    appState.currentCategory.topics.forEach(t => {
      all.push(...t.words);
    });
    return all;
  }

  function getAllWordsAcrossAllCategories() {
    const all = [];
    appState.categories.forEach(cat => {
      cat.topics.forEach(t => {
        all.push(...t.words);
      });
    });
    return all;
  }

  function getActiveWords() {
    if (!appState.currentCategory) return [];
    if (appState.currentTopicId === 'all') {
      return getAllWordsFromCurrentCategory();
    }
    const topic = appState.currentCategory.topics.find(t => t.id === Number(appState.currentTopicId));
    return topic ? topic.words : [];
  }

  function updateQuickStats() {
    const totalWords = getAllWordsFromCurrentCategory();
    dom.currentWordCount.textContent = getActiveWords().length;
    dom.masteredCount.textContent = storage.mastered.size;
    const mistakeCount = Object.keys(storage.mistakes).length;
    dom.mistakeCount.textContent = mistakeCount;
    dom.reviewBadge.textContent = mistakeCount + storage.favorites.size;
    dom.dictTotalBadge.textContent = totalWords.length;
    dom.countMistakesTab.textContent = mistakeCount;
    if (dom.countMasteredTab) dom.countMasteredTab.textContent = storage.mastered.size;
    dom.countFavoritesTab.textContent = storage.favorites.size;
  }

  function updateHeaderHeightVar() {
    const header = document.querySelector('header');
    if (header) {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    }
  }

  // --- Initialization ---
  function init() {
    soundManager.init();
    storage.load();

    // Theme initialization
    const savedTheme = localStorage.getItem('jlpt_n3_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    dom.themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    // Populate Category select & pills
    renderCategoryControls();

    populateTopics();
    bindEvents();
    switchTab('quiz');
    updateQuickStats();
    updateColumnVisibilityUI();
    updateHeaderHeightVar();

    // App Mode: Vocab vs Grammar
    switchAppMode(appState.appMode);
  }

  function renderCategoryControls() {
    if (appState.categories.length === 0) return;

    if (!appState.currentCategory) {
      appState.currentCategory = appState.categories[0];
    }

    // Dropdown
    dom.categorySelect.innerHTML = appState.categories
      .map(c => `<option value="${c.id}" ${c.id === appState.currentCategory.id ? 'selected' : ''}>${c.name}</option>`)
      .join('');

    // Pills
    if (dom.categoryPills) {
      dom.categoryPills.innerHTML = appState.categories.map(c => {
        let total = 0;
        c.topics.forEach(t => total += t.words.length);
        const icon = c.id === 'katakana' ? '🔤' : (c.id === 'tinh-tu' ? '✨' : (c.id === 'pho-tu' ? '⚡' : (c.id === 'dong-tu' ? '🏃' : '📖')));
        const isActive = c.id === appState.currentCategory.id;
        return `
          <button class="cat-pill ${isActive ? 'active' : ''}" data-cat="${c.id}">
            <span>${icon}</span>
            <span>${c.name}</span>
            <span style="font-size: 0.78rem; opacity: 0.85;">(${total})</span>
          </button>
        `;
      }).join('');

      dom.categoryPills.querySelectorAll('.cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const cat = appState.categories.find(c => c.id === btn.dataset.cat);
          if (cat && cat.id !== appState.currentCategory.id) {
            appState.currentCategory = cat;
            dom.categorySelect.value = cat.id;
            renderCategoryControls();
            populateTopics();
            onTopicOrCategoryChange();
          }
        });
      });
    }
  }

  function populateTopics() {
    if (!appState.currentCategory) return;
    const totalWordsCount = getAllWordsFromCurrentCategory().length;
    let html = `<option value="all">🌟 Tất cả các chủ đề (Tổng hợp ${totalWordsCount} từ)</option>`;
    appState.currentCategory.topics.forEach(t => {
      html += `<option value="${t.id}">${t.name} (${t.words.length} từ)</option>`;
    });
    dom.topicSelect.innerHTML = html;
    dom.topicSelect.value = 'all';
    appState.currentTopicId = 'all';

    if (dom.dictTopicSelect) {
      const allWordsCount = getAllWordsAcrossAllCategories().length;
      let dictHtml = `<option value="all">🌟 Tất cả chủ đề (${appState.currentCategory.name} - ${totalWordsCount} từ)</option>`;
      appState.currentCategory.topics.forEach(t => {
        dictHtml += `<option value="${t.id}">${t.name} (${t.words.length} từ)</option>`;
      });
      dictHtml += `<option value="all_categories">📚 Toàn bộ từ vựng (Tất cả 5 danh mục - ${allWordsCount} từ)</option>`;
      dom.dictTopicSelect.innerHTML = dictHtml;
      dom.dictTopicSelect.value = 'all';
    }
  }

  function onTopicOrCategoryChange() {
    updateQuickStats();
    initQuiz();
    initFlashcard();
    initSpelling();
    renderDictionary();
    renderReviewList();
  }

  // --- Tab Navigation ---
  function switchTab(tabId) {
    dom.navTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    dom.viewSections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${tabId}`);
    });

    if (tabId === 'quiz') initQuiz();
    if (tabId === 'flashcard') initFlashcard();
    if (tabId === 'spelling') initSpelling();
    if (tabId === 'exam') setupExamScreen();
    if (tabId === 'review') renderReviewList();
    if (tabId === 'dictionary') renderDictionary();
  }

  // =========================================================================
  // 1. QUIZ ENGINE
  // =========================================================================
  function initQuiz() {
    const active = getActiveWords();
    if (active.length === 0) return;
    appState.quizWords = shuffle(active);
    appState.quizIndex = 0;
    appState.quizScore = 0;
    appState.quizStreak = 0;
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (appState.quizIndex >= appState.quizWords.length) {
      appState.quizIndex = 0;
      appState.quizWords = shuffle(appState.quizWords);
    }

    const currentWord = appState.quizWords[appState.quizIndex];
    appState.quizCurrentQ = currentWord;
    appState.quizAnswered = false;

    // UI Updates
    dom.quizNextBtn.style.display = 'none';
    dom.quizExplanation.classList.remove('active');
    dom.quizTopicBadge.textContent = currentWord.topicName || 'Mimikara N3';
    dom.quizScoreText.textContent = `Điểm: ${appState.quizScore}`;
    dom.streakCount.textContent = `${appState.quizStreak} 🔥`;

    const progressPct = ((appState.quizIndex + 1) / appState.quizWords.length) * 100;
    dom.quizProgressFill.style.width = `${progressPct}%`;
    dom.quizProgressText.textContent = `${appState.quizIndex + 1} / ${appState.quizWords.length}`;

    // Star icon status
    dom.quizStarBtn.classList.toggle('active', storage.favorites.has(currentWord.id));

    const isKatakana = appState.currentCategory && appState.currentCategory.id === 'katakana';
    const pool = getAllWordsFromCurrentCategory().filter(w => w.id !== currentWord.id);
    const distractors = shuffle(pool).slice(0, 3);

    // Khung câu hỏi chỉ giữ Kanji/Katakana gốc để kiểm tra trí nhớ mặt chữ
    dom.quizPromptType.textContent = 'CHỌN NGHĨA TIẾNG VIỆT ĐÚNG:';
    dom.quizQuestionWord.textContent = currentWord.kanji;
    dom.quizQuestionSub.textContent = '';
    dom.quizQuestionSub.style.display = 'none';

    // Mỗi phương án chỉ hiển thị duy nhất nghĩa tiếng Việt để kiểm tra trí nhớ chuẩn xác
    const options = [
      { nghia: currentWord.nghia, isCorrect: true, word: currentWord },
      ...distractors.map(d => ({ nghia: d.nghia, isCorrect: false, word: d }))
    ];

    // Audio click for question word
    dom.quizAudioBtn.onclick = (e) => {
      e.stopPropagation();
      soundManager.speak(currentWord.kanji);
    };

    // Render Options (chỉ hiển thị nghĩa tiếng Việt)
    const shuffledOpts = shuffle(options);
    dom.quizOptionsGrid.innerHTML = shuffledOpts.map((opt, i) => `
      <button class="option-btn" data-correct="${opt.isCorrect}" data-index="${i}">
        <div class="option-content">
          <span class="option-meaning">${opt.nghia}</span>
        </div>
        <span class="option-key">${i + 1}</span>
      </button>
    `).join('');

    // Bind option clicks
    const btns = dom.quizOptionsGrid.querySelectorAll('.option-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => handleQuizAnswer(btn, btns, currentWord));
    });
  }

  function handleQuizAnswer(selectedBtn, allBtns, word) {
    if (appState.quizAnswered) return;
    appState.quizAnswered = true;

    const isCorrect = selectedBtn.dataset.correct === 'true';

    allBtns.forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.correct === 'true') {
        btn.classList.add('correct');
      }
    });

    if (isCorrect) {
      selectedBtn.classList.add('correct');
      soundManager.playCorrect();
      appState.quizScore += 10;
      appState.quizStreak += 1;
      storage.addMastered(word.id);
    } else {
      selectedBtn.classList.add('incorrect');
      soundManager.playWrong();
      appState.quizStreak = 0;
      storage.addMistake(word.id);
    }

    // Pronounce automatically on answer
    soundManager.speak(word.kanji);

    // Show Explanation
    dom.expKanji.textContent = word.kanji;
    dom.expHiragana.textContent = word.hiragana;
    dom.expHanViet.textContent = word.hanViet || '(Không có)';
    dom.expNghia.textContent = word.nghia;
    dom.expStt.textContent = `#${word.stt}`;
    dom.quizExplanation.classList.add('active');

    dom.quizNextBtn.style.display = 'inline-flex';
    updateQuickStats();
  }

  function nextQuiz() {
    appState.quizIndex++;
    renderQuizQuestion();
  }

  // =========================================================================
  // 2. FLASHCARD ENGINE
  // =========================================================================
  function initFlashcard() {
    const active = getActiveWords();
    if (active.length === 0) return;
    appState.fcWords = active;
    appState.fcIndex = 0;
    appState.fcFlipped = false;
    renderFlashcard();
  }

  function renderFlashcard() {
    if (appState.fcWords.length === 0) return;
    const w = appState.fcWords[appState.fcIndex];
    const isKatakana = appState.currentCategory && appState.currentCategory.id === 'katakana';
    appState.fcFlipped = false;
    dom.flashcardElement.classList.remove('flipped');

    dom.fcTopicBadge.textContent = w.topicName;
    dom.fcSttBadge.textContent = `#${w.stt}`;
    dom.fcKanji.textContent = w.kanji;
    dom.fcHanViet.textContent = isKatakana ? (w.hanViet ? `Gốc: ${w.hanViet}` : '') : (w.hanViet || '');
    dom.fcHiragana.textContent = w.hiragana;
    dom.fcNghia.textContent = w.nghia;

    const progressPct = ((appState.fcIndex + 1) / appState.fcWords.length) * 100;
    dom.fcProgressFill.style.width = `${progressPct}%`;
    dom.fcProgressText.textContent = `${appState.fcIndex + 1} / ${appState.fcWords.length}`;

    dom.fcAudioBtn.onclick = (e) => {
      e.stopPropagation();
      soundManager.speak(w.kanji);
    };
  }

  function flipFlashcard() {
    appState.fcFlipped = !appState.fcFlipped;
    dom.flashcardElement.classList.toggle('flipped', appState.fcFlipped);
    if (appState.fcFlipped) {
      const w = appState.fcWords[appState.fcIndex];
      soundManager.speak(w.kanji);
    }
  }

  function nextFlashcard() {
    if (appState.fcIndex < appState.fcWords.length - 1) {
      appState.fcIndex++;
      renderFlashcard();
    }
  }

  function prevFlashcard() {
    if (appState.fcIndex > 0) {
      appState.fcIndex--;
      renderFlashcard();
    }
  }

  // =========================================================================
  // 3. SPELLING / TYPING PRACTICE
  // =========================================================================
  function initSpelling() {
    const active = getActiveWords();
    if (active.length === 0) return;
    appState.spellingWords = shuffle(active);
    appState.spellingIndex = 0;
    renderSpellingQuestion();
  }

  function renderSpellingQuestion() {
    if (appState.spellingIndex >= appState.spellingWords.length) {
      appState.spellingIndex = 0;
      appState.spellingWords = shuffle(appState.spellingWords);
    }
    const w = appState.spellingWords[appState.spellingIndex];
    const isKatakana = appState.currentCategory && appState.currentCategory.id === 'katakana';
    appState.spellingCurrentWord = w;

    dom.spellingTopicBadge.textContent = w.topicName;
    dom.spellingKanji.textContent = w.kanji;
    dom.spellingHanViet.textContent = isKatakana 
      ? (w.hanViet ? `Gốc tiếng Anh: ${w.hanViet}` : '')
      : (w.hanViet ? `Âm Hán: ${w.hanViet}` : '');
    dom.spellingMeaning.textContent = w.nghia;
    dom.spellingInput.placeholder = isKatakana ? "Gõ Katakana, Hiragana hoặc tiếng Anh..." : "Gõ Hiragana (hoặc Romaji)...";
    dom.spellingInput.value = '';
    dom.spellingFeedback.textContent = '';
    dom.spellingFeedback.style.color = 'inherit';

    const pct = ((appState.spellingIndex + 1) / appState.spellingWords.length) * 100;
    dom.spellingProgressFill.style.width = `${pct}%`;
    dom.spellingProgressText.textContent = `${appState.spellingIndex + 1} / ${appState.spellingWords.length}`;
    dom.spellingInput.focus();
  }

  function checkSpelling() {
    const input = dom.spellingInput.value.trim().toLowerCase();
    if (!input) return;

    const w = appState.spellingCurrentWord;
    const correctHira = w.hiragana.trim().toLowerCase();

    // Clean comparison: handle slashes if any (e.g. いき / ゆき)
    const validAnswers = correctHira.split('/').map(s => s.trim());
    if (w.kanji) validAnswers.push(w.kanji.trim().toLowerCase());
    if (w.hanViet) validAnswers.push(w.hanViet.trim().toLowerCase());

    if (validAnswers.includes(input)) {
      dom.spellingFeedback.textContent = '🎉 Chính xác! Tuyệt vời!';
      dom.spellingFeedback.style.color = 'var(--success)';
      soundManager.playCorrect();
      soundManager.speak(w.kanji);
      storage.addMastered(w.id);
      updateQuickStats();
      setTimeout(() => {
        appState.spellingIndex++;
        renderSpellingQuestion();
      }, 1000);
    } else {
      dom.spellingFeedback.textContent = `❌ Chưa đúng. Đáp án: ${w.kanji} (${w.hiragana})`;
      dom.spellingFeedback.style.color = 'var(--danger)';
      soundManager.playWrong();
      storage.addMistake(w.id);
      updateQuickStats();
    }
  }

  // =========================================================================
  // 4. EXAM MODE
  // =========================================================================
  function setupExamScreen() {
    dom.examSetupCard.style.display = 'block';
    dom.examActiveCard.style.display = 'none';
    dom.examResultCard.style.display = 'none';
    clearInterval(appState.examTimer);
  }

  function startExam() {
    const active = getActiveWords();
    if (active.length === 0) return;

    const countVal = dom.examCountSelect.value;
    const numQ = countVal === 'all' ? active.length : Math.min(parseInt(countVal, 10), active.length);
    appState.examTimePerQ = parseInt(dom.examTimeSelect.value, 10);

    appState.examWords = shuffle(active).slice(0, numQ);
    appState.examIndex = 0;
    appState.examScore = 0;
    appState.examMistakes = [];
    appState.examActive = true;

    dom.examSetupCard.style.display = 'none';
    dom.examResultCard.style.display = 'none';
    dom.examActiveCard.style.display = 'block';

    renderExamQuestion();
  }

  function renderExamQuestion() {
    clearInterval(appState.examTimer);

    if (appState.examIndex >= appState.examWords.length) {
      finishExam();
      return;
    }

    const currentWord = appState.examWords[appState.examIndex];
    dom.examCounterText.textContent = `Câu ${appState.examIndex + 1} / ${appState.examWords.length}`;
    
    const pct = ((appState.examIndex + 1) / appState.examWords.length) * 100;
    dom.examProgressFill.style.width = `${pct}%`;

    dom.examPromptType.textContent = 'CHỌN NGHĨA TIẾNG VIỆT ĐÚNG:';
    dom.examQuestionWord.textContent = currentWord.kanji;
    dom.examQuestionSub.textContent = '';
    dom.examQuestionSub.style.display = 'none';

    dom.examAudioBtn.onclick = () => soundManager.speak(currentWord.kanji);

    const pool = getAllWordsFromCurrentCategory().filter(w => w.id !== currentWord.id);
    const distractors = shuffle(pool).slice(0, 3);
    const options = shuffle([
      { nghia: currentWord.nghia, isCorrect: true },
      ...distractors.map(d => ({ nghia: d.nghia, isCorrect: false }))
    ]);

    dom.examOptionsGrid.innerHTML = options.map((opt, i) => `
      <button class="option-btn" data-correct="${opt.isCorrect}">
        <div class="option-content">
          <span class="option-meaning">${opt.nghia}</span>
        </div>
        <span class="option-key">${i + 1}</span>
      </button>
    `).join('');

    const btns = dom.examOptionsGrid.querySelectorAll('.option-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => handleExamAnswer(btn, currentWord));
    });

    // Start Timer
    appState.examSecondsLeft = appState.examTimePerQ;
    dom.examTimerValue.textContent = `${appState.examSecondsLeft}s`;
    
    appState.examTimer = setInterval(() => {
      appState.examSecondsLeft--;
      dom.examTimerValue.textContent = `${appState.examSecondsLeft}s`;
      if (appState.examSecondsLeft <= 0) {
        clearInterval(appState.examTimer);
        handleExamAnswer(null, currentWord); // Timeout
      }
    }, 1000);
  }

  function handleExamAnswer(selectedBtn, word) {
    clearInterval(appState.examTimer);
    const isCorrect = selectedBtn && selectedBtn.dataset.correct === 'true';

    if (isCorrect) {
      appState.examScore++;
      soundManager.playCorrect();
      storage.addMastered(word.id);
    } else {
      soundManager.playWrong();
      appState.examMistakes.push(word);
      storage.addMistake(word.id);
    }

    updateQuickStats();

    // Show instant visual feedback briefly then next
    const btns = dom.examOptionsGrid.querySelectorAll('.option-btn');
    btns.forEach(b => {
      b.disabled = true;
      if (b.dataset.correct === 'true') b.classList.add('correct');
    });
    if (selectedBtn && !isCorrect) selectedBtn.classList.add('incorrect');

    setTimeout(() => {
      appState.examIndex++;
      renderExamQuestion();
    }, 900);
  }

  function finishExam() {
    clearInterval(appState.examTimer);
    appState.examActive = false;

    dom.examActiveCard.style.display = 'none';
    dom.examResultCard.style.display = 'block';

    const total = appState.examWords.length;
    const score = appState.examScore;
    const percent = Math.round((score / total) * 100);

    dom.examScorePercent.textContent = `${percent}%`;
    dom.examScoreFraction.textContent = `${score} / ${total} câu đúng`;

    let rankText = '';
    let rankBg = '';
    let rankColor = '';

    if (percent >= 90) {
      rankText = 'Xuất Sắc! 🏆 Cấp độ N3 Đạt Chuẩn';
      rankBg = 'var(--success-light)';
      rankColor = '#065f46';
    } else if (percent >= 75) {
      rankText = 'Khá Tốt! 🌟 Tiếp tục phát huy';
      rankBg = 'var(--primary-light)';
      rankColor = 'var(--primary)';
    } else if (percent >= 50) {
      rankText = 'Cần Cố Gắng Thêm! 📚 Ôn lại các câu sai';
      rankBg = 'var(--warning-light)';
      rankColor = '#b45309';
    } else {
      rankText = 'Cần Luyện Tập Thường Xuyên! 💪';
      rankBg = 'var(--danger-light)';
      rankColor = '#991b1b';
    }

    dom.examRankBadge.textContent = rankText;
    dom.examRankBadge.style.background = rankBg;
    dom.examRankBadge.style.color = rankColor;

    dom.examReviewMistakesBtn.style.display = appState.examMistakes.length > 0 ? 'inline-block' : 'none';
  }

  // =========================================================================
  // 5. REVIEW & FAVORITES
  // =========================================================================
  function renderReviewList() {
    const all = getAllWordsAcrossAllCategories();
    let words = [];

    if (appState.reviewTab === 'mistakes') {
      const mistakeIds = Object.keys(storage.mistakes).map(Number);
      words = all.filter(w => mistakeIds.includes(w.id));
    } else if (appState.reviewTab === 'mastered') {
      words = all.filter(w => storage.mastered.has(w.id));
    } else {
      words = all.filter(w => storage.favorites.has(w.id));
    }

    if (words.length === 0) {
      let emptyIcon = '🎉';
      let emptyTitle = 'Không có từ nào!';
      let emptyDesc = '';

      if (appState.reviewTab === 'mistakes') {
        emptyIcon = '🎉';
        emptyTitle = 'Không có câu làm sai!';
        emptyDesc = 'Bạn chưa làm sai từ nào hoặc đã xóa hết danh sách làm sai.';
      } else if (appState.reviewTab === 'mastered') {
        emptyIcon = '📚';
        emptyTitle = 'Chưa có từ nào đánh dấu Đã thuộc!';
        emptyDesc = 'Hãy làm đúng trong Quiz hoặc bấm "Đã thuộc" trong Flashcard để tích lũy từ vào đây nhé.';
      } else {
        emptyIcon = '⭐';
        emptyTitle = 'Chưa có từ yêu thích nào!';
        emptyDesc = 'Hãy bấm nút ngôi sao ★ trong lúc làm Quiz để lưu từ vào đây nhé.';
      }

      dom.reviewListContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${emptyIcon}</div>
          <h3>${emptyTitle}</h3>
          <p>${emptyDesc}</p>
        </div>
      `;
      return;
    }

    const isMasteredTab = appState.reviewTab === 'mastered';

    dom.reviewListContainer.innerHTML = `
      <table class="dict-table">
        <thead>
          <tr>
            <th>Kanji</th>
            <th>Hiragana</th>
            <th>Hán Việt</th>
            <th>Nghĩa Tiếng Việt</th>
            <th class="col-topic">Danh mục / Chủ đề</th>
            <th style="text-align: center;">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${words.map(w => `
            <tr>
              <td class="dict-kanji">${w.kanji}</td>
              <td class="dict-hiragana">${w.hiragana}</td>
              <td class="dict-hanviet">${w.hanViet || '-'}</td>
              <td>${w.nghia}</td>
              <td class="col-topic" style="font-size: 0.85rem; color: var(--text-muted);">${w.topicName}</td>
              <td style="text-align: center; white-space: nowrap;">
                <button class="audio-btn btn-speak" data-word="${w.kanji}" title="Nghe phát âm" style="width: 32px; height: 32px; font-size: 0.9rem;">🔊</button>
                ${isMasteredTab ? `
                  <button class="btn-secondary btn-unmaster" data-id="${w.id}" title="Chuyển về trạng thái chưa thuộc" style="padding: 4px 10px; font-size: 0.8rem; margin-left: 6px; border-color: var(--border);">
                    🔄 Chưa thuộc
                  </button>
                ` : `
                  <button class="btn-icon btn-remove" data-id="${w.id}" title="Xóa khỏi danh sách này" style="padding: 4px 8px; font-size: 0.8rem; color: var(--danger);">✕</button>
                `}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    dom.reviewListContainer.querySelectorAll('.btn-speak').forEach(btn => {
      btn.addEventListener('click', () => soundManager.speak(btn.dataset.word));
    });

    dom.reviewListContainer.querySelectorAll('.btn-unmaster').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        storage.mastered.delete(id);
        storage.save();
        updateQuickStats();
        renderReviewList();
      });
    });

    dom.reviewListContainer.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        if (appState.reviewTab === 'mistakes') {
          storage.removeMistake(id);
        } else {
          storage.toggleFavorite(id);
        }
        updateQuickStats();
        renderReviewList();
      });
    });
  }

  // =========================================================================
  // 6. DICTIONARY TABLE & COLUMN VISIBILITY (CHE DÒ BÀI)
  // =========================================================================
  function toggleColumnVisibility(colName) {
    if (appState.hiddenColumns[colName] === undefined) return;
    appState.hiddenColumns[colName] = !appState.hiddenColumns[colName];
    try {
      localStorage.setItem('jlpt_n3_hidden_cols', JSON.stringify(appState.hiddenColumns));
    } catch (e) {}
    updateColumnVisibilityUI();
  }

  function updateColumnVisibilityUI() {
    const table = dom.dictTable || document.getElementById('dictTable') || document.querySelector('.dict-table');
    if (!table) return;

    const cols = ['kanji', 'hiragana', 'hanviet', 'nghia'];
    cols.forEach(col => {
      const isHidden = !!appState.hiddenColumns[col];
      table.classList.toggle(`hide-col-${col}`, isHidden);

      // Update Header Buttons
      document.querySelectorAll(`.btn-col-toggle[data-col="${col}"]`).forEach(btn => {
        btn.classList.toggle('active', isHidden);
        const icon = btn.querySelector('.toggle-icon');
        if (icon) icon.textContent = isHidden ? '🙈' : '👁️';
        btn.title = isHidden ? `Đang ẩn - Bấm để hiện nội dung` : `Đang hiện - Bấm để ẩn nội dung`;
      });

      // Update Toolbar Pills
      document.querySelectorAll(`.col-pill-toggle[data-col="${col}"]`).forEach(btn => {
        btn.classList.toggle('active', isHidden);
        const icon = btn.querySelector('.col-icon');
        if (icon) icon.textContent = isHidden ? '🙈' : '👁️';
        btn.title = isHidden ? `Đang ẩn - Bấm để hiện nội dung` : `Đang hiện - Bấm để ẩn nội dung`;
      });
    });
  }

  function renderDictionary() {
    let sourceWords = [];
    const topicVal = dom.dictTopicSelect ? dom.dictTopicSelect.value : 'all';

    if (topicVal === 'all_categories') {
      sourceWords = getAllWordsAcrossAllCategories();
    } else if (topicVal === 'all') {
      sourceWords = getAllWordsFromCurrentCategory();
    } else {
      const topicIdNum = Number(topicVal);
      const foundTopic = appState.currentCategory ? appState.currentCategory.topics.find(t => t.id === topicIdNum) : null;
      if (foundTopic) {
        sourceWords = foundTopic.words;
      } else {
        sourceWords = getAllWordsAcrossAllCategories().filter(w => w.topicId === topicIdNum);
      }
    }

    const query = dom.dictSearchInput ? dom.dictSearchInput.value.trim().toLowerCase() : '';

    const filtered = sourceWords.filter(w => {
      if (!query) return true;
      return (
        w.kanji.toLowerCase().includes(query) ||
        w.hiragana.toLowerCase().includes(query) ||
        (w.hanViet && w.hanViet.toLowerCase().includes(query)) ||
        w.nghia.toLowerCase().includes(query)
      );
    });

    if (dom.dictStatusText) {
      let topicName = 'Tất cả chủ đề';
      if (topicVal === 'all_categories') {
        topicName = 'Tất cả 5 danh mục';
      } else if (topicVal !== 'all') {
        const found = appState.currentCategory && appState.currentCategory.topics.find(t => t.id === Number(topicVal));
        if (found) topicName = found.name;
      } else if (appState.currentCategory) {
        topicName = appState.currentCategory.name;
      }
      dom.dictStatusText.innerHTML = `Đang hiển thị <strong style="color: var(--primary); font-weight: 700;">${filtered.length}</strong> / ${sourceWords.length} từ (${topicName})${query ? ` khớp với "<em>${query}</em>"` : ''}`;
    }

    if (dom.dictTotalBadge) {
      dom.dictTotalBadge.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      dom.dictTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state" style="padding: 36px;">
            Không tìm thấy từ vựng nào khớp với ${query ? `từ khóa "${query}"` : 'bộ lọc hiện tại'}
          </td>
        </tr>
      `;
      return;
    }

    dom.dictTableBody.innerHTML = filtered.map(w => {
      const isFav = storage.favorites.has(w.id);
      return `
        <tr>
          <td style="font-weight: 700; color: var(--text-muted); font-size: 0.85rem;">#${w.stt}</td>
          <td class="dict-kanji"><span class="cell-text">${w.kanji}</span></td>
          <td class="dict-hiragana"><span class="cell-text">${w.hiragana}</span></td>
          <td class="dict-hanviet"><span class="cell-text">${w.hanViet || '-'}</span></td>
          <td class="dict-nghia"><span class="cell-text">${w.nghia}</span></td>
          <td class="col-topic" style="font-size: 0.82rem; color: var(--text-muted);">${w.topicName}</td>
          <td style="text-align: center; white-space: nowrap;">
            <button class="audio-btn dict-speak-btn" data-word="${w.kanji}" title="Nghe phát âm" style="width: 32px; height: 32px; font-size: 0.9rem;">🔊</button>
            <button class="star-btn dict-star-btn ${isFav ? 'active' : ''}" data-id="${w.id}" style="position: static; font-size: 1.2rem; vertical-align: middle;">★</button>
          </td>
        </tr>
      `;
    }).join('');

    dom.dictTableBody.querySelectorAll('.dict-speak-btn').forEach(btn => {
      btn.addEventListener('click', () => soundManager.speak(btn.dataset.word));
    });

    dom.dictTableBody.querySelectorAll('.dict-star-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        const active = storage.toggleFavorite(id);
        btn.classList.toggle('active', active);
        updateQuickStats();
      });
    });

    updateColumnVisibilityUI();
  }

  // =========================================================================
  // 7. APP MODE SWITCHER & GRAMMAR ENGINE (62 MẪU NGỮ PHÁP N3)
  // =========================================================================

  function switchAppMode(mode) {
    appState.appMode = mode;
    localStorage.setItem('jlpt_n3_app_mode', mode);

    const isGrammar = mode === 'grammar';
    if (dom.modeBtnVocab) dom.modeBtnVocab.classList.toggle('active', !isGrammar);
    if (dom.modeBtnGrammar) dom.modeBtnGrammar.classList.toggle('active', isGrammar);

    if (dom.vocabNavTabsWrapper) dom.vocabNavTabsWrapper.style.display = isGrammar ? 'none' : 'block';
    if (dom.grammarNavTabsWrapper) dom.grammarNavTabsWrapper.style.display = isGrammar ? 'block' : 'none';

    if (dom.vocabAppSection) dom.vocabAppSection.style.display = isGrammar ? 'none' : 'block';
    if (dom.grammarAppSection) dom.grammarAppSection.style.display = isGrammar ? 'block' : 'none';

    // Hide vocab category select on desktop in grammar mode
    if (dom.categorySelect) {
      dom.categorySelect.style.display = isGrammar ? 'none' : 'inline-block';
    }

    if (isGrammar) {
      document.title = 'Ôn Tập Ngữ Pháp JLPT N3 - VTI Mirai';
      if (dom.brandMainTitle) dom.brandMainTitle.textContent = 'JLPT N3 GRAMMAR';
      if (dom.brandSubTitle) dom.brandSubTitle.textContent = 'Tổng hợp 62 mẫu VTI Mirai';
      initGrammarSection();
    } else {
      document.title = 'Ôn Tập Từ Vựng JLPT N3 - Mimikara';
      if (dom.brandMainTitle) dom.brandMainTitle.textContent = 'JLPT N3 MASTER';
      if (dom.brandSubTitle) dom.brandSubTitle.textContent = 'Mimikara N3 Master';
      updateQuickStats();
    }
  }

  function initGrammarSection() {
    initGrammarCategories();
    updateGrammarStats();
    switchGrammarTab(appState.grammarTab || 'handbook');
  }

  function initGrammarCategories() {
    if (!dom.grammarCategorySelect || !dom.grammarCategoryPills) return;

    // Populate Category Select
    dom.grammarCategorySelect.innerHTML = appState.grammarCategories.map(cat => `
      <option value="${cat.id}">${cat.name}</option>
    `).join('');
    dom.grammarCategorySelect.value = appState.grammarCategoryId;

    // Populate Category Pills
    dom.grammarCategoryPills.innerHTML = appState.grammarCategories.map(cat => `
      <button type="button" class="cat-pill ${cat.id === appState.grammarCategoryId ? 'active' : ''}" data-gcat="${cat.id}">
        ${cat.name}
      </button>
    `).join('');

    // Events for pills
    dom.grammarCategoryPills.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        appState.grammarCategoryId = btn.dataset.gcat;
        dom.grammarCategorySelect.value = appState.grammarCategoryId;
        dom.grammarCategoryPills.querySelectorAll('.cat-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.gcat === appState.grammarCategoryId);
        });
        onGrammarCategoryChanged();
      });
    });

    // Event for select
    dom.grammarCategorySelect.onchange = () => {
      appState.grammarCategoryId = dom.grammarCategorySelect.value;
      dom.grammarCategoryPills.querySelectorAll('.cat-pill').forEach(b => {
        b.classList.toggle('active', b.dataset.gcat === appState.grammarCategoryId);
      });
      onGrammarCategoryChanged();
    };
  }

  function onGrammarCategoryChanged() {
    if (appState.grammarTab === 'handbook') {
      renderGrammarHandbook();
    } else if (appState.grammarTab === 'quiz') {
      initGrammarQuiz();
    } else if (appState.grammarTab === 'flashcard') {
      initGrammarFlashcard();
    }
  }

  function getFilteredGrammarList() {
    let list = appState.grammarData;
    if (appState.grammarCategoryId !== 'all') {
      list = list.filter(g => g.categoryId === appState.grammarCategoryId);
    }

    const q = (appState.grammarSearch || '').trim().toLowerCase();
    if (q) {
      list = list.filter(g => {
        return (
          g.pattern.toLowerCase().includes(q) ||
          g.meaning.toLowerCase().includes(q) ||
          g.usage.toLowerCase().includes(q) ||
          g.formation.toLowerCase().includes(q) ||
          g.examples.some(ex => ex.ja.toLowerCase().includes(q) || ex.vi.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }

  function updateGrammarStats() {
    const total = appState.grammarData.length;
    const mastered = storage.gMastered.size;
    const review = storage.gMistakes.size + storage.gStarred.size;

    if (dom.grammarTotalCount) dom.grammarTotalCount.textContent = total;
    if (dom.gMasteredCount) dom.gMasteredCount.textContent = mastered;
    if (dom.gReviewCount) dom.gReviewCount.textContent = storage.gMistakes.size;
    if (dom.gHandbookBadge) dom.gHandbookBadge.textContent = total;
    if (dom.gReviewBadge) dom.gReviewBadge.textContent = review;

    if (dom.gCountMistakesTab) dom.gCountMistakesTab.textContent = storage.gMistakes.size;
    if (dom.gCountMasteredTab) dom.gCountMasteredTab.textContent = storage.gMastered.size;
    if (dom.gCountStarredTab) dom.gCountStarredTab.textContent = storage.gStarred.size;
  }

  function switchGrammarTab(tabName) {
    appState.grammarTab = tabName;

    // Update active tab buttons
    document.querySelectorAll('#grammarNavTabsWrapper .nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.gtab === tabName);
    });

    // Update view sections
    document.querySelectorAll('#grammarAppSection .view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`view-grammar-${tabName}`);
    if (activeSec) activeSec.classList.add('active');

    // Activate corresponding view logic
    if (tabName === 'handbook') {
      renderGrammarHandbook();
    } else if (tabName === 'quiz') {
      initGrammarQuiz();
    } else if (tabName === 'flashcard') {
      initGrammarFlashcard();
    } else if (tabName === 'review') {
      renderGrammarReviewList();
    }
  }

  // --- 7.1 GRAMMAR HANDBOOK ---
  function renderGrammarHandbook() {
    if (!dom.grammarCardsList) return;
    const list = getFilteredGrammarList();

    if (dom.grammarStatusText) {
      const cat = appState.grammarCategories.find(c => c.id === appState.grammarCategoryId);
      const catName = cat ? cat.name : 'Tất cả';
      dom.grammarStatusText.innerHTML = `Đang hiển thị <strong style="color: var(--primary);">${list.length}</strong> / ${appState.grammarData.length} mẫu (${catName})${appState.grammarSearch ? ` khớp với "<em>${appState.grammarSearch}</em>"` : ''}`;
    }

    if (list.length === 0) {
      dom.grammarCardsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Không tìm thấy mẫu ngữ pháp nào!</h3>
          <p>Thử tìm với từ khóa khác hoặc chọn nhóm "Tất cả (62 mẫu)".</p>
        </div>
      `;
      return;
    }

    dom.grammarCardsList.innerHTML = list.map(g => {
      const isExpanded = appState.grammarExpanded.has(g.id);
      const isStarred = storage.gStarred.has(g.id);

      const examplesHtml = g.examples.map(ex => `
        <div class="gcard-example-item">
          <div class="gcard-example-content">
            <div class="gcard-example-ja">${ex.ja}</div>
            <div class="gcard-example-vi">${ex.vi}</div>
          </div>
          <button class="audio-btn gcard-speak-btn" data-speak="${ex.ja}" title="Nghe phát âm">🔊</button>
        </div>
      `).join('');

      return `
        <div class="grammar-card ${isExpanded ? 'expanded' : ''}" data-id="${g.id}">
          <div class="grammar-card-header" data-id="${g.id}">
            <div class="gcard-title-group">
              <span class="gcard-id-badge">#${g.id}</span>
              <span class="gcard-pattern">${g.pattern}</span>
              <span class="gcard-meaning">${g.meaning}</span>
              <span class="gcard-cat-tag">${g.categoryName}</span>
            </div>
            <div class="gcard-actions">
              <button class="star-btn gcard-star-btn ${isStarred ? 'active' : ''}" data-id="${g.id}" title="Lưu vào Sổ tay">★</button>
              <span class="gcard-chevron">▼</span>
            </div>
          </div>
          <div class="grammar-card-body">
            <div class="gcard-section-label">📌 Cấu trúc / Kết hợp:</div>
            <div class="gcard-formation-box">${g.formation}</div>

            <div class="gcard-section-label">💡 Ý nghĩa & Giải thích cách dùng:</div>
            <div class="gcard-usage-box">${g.usage}</div>

            <div class="gcard-section-label">📝 Các câu ví dụ mẫu (${g.examples.length}):</div>
            <div class="gcard-examples-list">
              ${examplesHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events on cards
    dom.grammarCardsList.querySelectorAll('.grammar-card-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.gcard-star-btn')) return;
        const cardId = Number(header.dataset.id);
        const card = header.closest('.grammar-card');
        const willExpand = !card.classList.contains('expanded');
        card.classList.toggle('expanded', willExpand);
        if (willExpand) {
          appState.grammarExpanded.add(cardId);
        } else {
          appState.grammarExpanded.delete(cardId);
        }
      });
    });

    // Star buttons
    dom.grammarCardsList.querySelectorAll('.gcard-star-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        const isNowStarred = storage.toggleGrammarStarred(id);
        btn.classList.toggle('active', isNowStarred);
        updateGrammarStats();
      });
    });

    // Speak buttons
    dom.grammarCardsList.querySelectorAll('.gcard-speak-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundManager.speak(btn.dataset.speak);
      });
    });
  }

  function toggleAllGrammarCards() {
    const list = getFilteredGrammarList();
    const allExpanded = list.every(g => appState.grammarExpanded.has(g.id));

    if (allExpanded) {
      list.forEach(g => appState.grammarExpanded.delete(g.id));
      if (dom.toggleAllIcon) dom.toggleAllIcon.textContent = '📂';
      if (dom.toggleAllText) dom.toggleAllText.textContent = 'Mở rộng tất cả';
    } else {
      list.forEach(g => appState.grammarExpanded.add(g.id));
      if (dom.toggleAllIcon) dom.toggleAllIcon.textContent = '📁';
      if (dom.toggleAllText) dom.toggleAllText.textContent = 'Thu gọn tất cả';
    }
    renderGrammarHandbook();
  }

  // --- 7.2 GRAMMAR QUIZ ENGINE ---
  function initGrammarQuiz() {
    appState.gQuizQuestions = generateGrammarQuizPool();
    appState.gQuizIndex = 0;
    appState.gQuizScore = 0;
    appState.gQuizStreak = 0;
    renderGrammarQuestion();
  }

  function generateGrammarQuizPool() {
    let source = getFilteredGrammarList();
    if (source.length === 0) source = appState.grammarData;

    const allPatterns = appState.grammarData.map(g => ({ id: g.id, pattern: g.pattern, meaning: g.meaning }));
    const questions = [];

    const shuffledItems = shuffle(source);
    shuffledItems.forEach(item => {
      if (item.examples.length === 0) return;
      const ex = item.examples[Math.floor(Math.random() * item.examples.length)];

      const raw = item.pattern.replace(/^[～~]/, '').replace(/\([^)]*\)/g, '').trim();
      let questionSentence = ex.ja;

      const candidateParts = raw.split(/[/・]/).map(s => s.trim().replace(/^[～~]/, '')).filter(Boolean);
      let foundCandidate = candidateParts.find(p => p.length >= 2 && ex.ja.includes(p));

      if (foundCandidate) {
        questionSentence = ex.ja.replace(foundCandidate, `<span class="blank-slot">【　？　】</span>`);
      } else {
        const words = ex.ja.split('、');
        if (words.length > 1) {
          questionSentence = words[0] + ` <span class="blank-slot">【　？　】</span> ` + words.slice(1).join('、');
        } else {
          questionSentence = ex.ja + ` ➔ Mẫu ngữ pháp: <span class="blank-slot">【　？　】</span>`;
        }
      }

      const distractors = allPatterns
        .filter(p => p.id !== item.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(p => p.pattern);

      const options = shuffle([
        { text: item.pattern, correct: true, item },
        ...distractors.map(d => ({ text: d, correct: false, item: null }))
      ]);

      questions.push({
        id: item.id,
        item,
        sentence: questionSentence,
        rawSentence: ex.ja,
        meaning: ex.vi,
        correctPattern: item.pattern,
        options
      });
    });

    return questions.slice(0, 10);
  }

  function renderGrammarQuestion() {
    if (appState.gQuizQuestions.length === 0) {
      dom.gQuizSentence.innerHTML = 'Không có đủ dữ liệu câu hỏi.';
      return;
    }

    if (appState.gQuizIndex >= appState.gQuizQuestions.length) {
      const total = appState.gQuizQuestions.length;
      const score = appState.gQuizScore;
      dom.gQuizSentence.innerHTML = `🎉 Bạn đã hoàn thành bài thi: <strong>${score} / ${total}</strong> câu đúng!`;
      dom.gQuizMeaning.textContent = score >= 8 ? 'Xuất sắc! Bạn đã nắm vững các mẫu ngữ pháp này.' : 'Hãy ôn lại các câu làm sai trong Sổ tay nhé!';
      dom.gQuizOptionsGrid.innerHTML = '';
      dom.gQuizExplanation.style.display = 'none';
      dom.gQuizNextBtn.style.display = 'none';
      return;
    }

    const q = appState.gQuizQuestions[appState.gQuizIndex];
    appState.gQuizCurrentQ = q;
    appState.gQuizAnswered = false;

    const total = appState.gQuizQuestions.length;
    const current = appState.gQuizIndex + 1;
    dom.gQuizProgressFill.style.width = `${(current / total) * 100}%`;
    dom.gQuizProgressText.textContent = `${current} / ${total}`;

    dom.gQuizCategoryBadge.textContent = q.item.categoryName;
    dom.gQuizStreak.textContent = `${appState.gQuizStreak} 🔥`;

    const isStarred = storage.gStarred.has(q.item.id);
    dom.gQuizStarBtn.classList.toggle('active', isStarred);

    dom.gQuizSentence.innerHTML = q.sentence;
    dom.gQuizMeaning.textContent = `(Dịch nghĩa: ${q.meaning})`;

    dom.gQuizAudioBtn.onclick = () => {
      soundManager.speak(q.rawSentence);
    };

    dom.gQuizOptionsGrid.innerHTML = q.options.map((opt, i) => `
      <button type="button" class="option-btn g-opt-btn" data-correct="${opt.correct}">
        <span class="option-key">${i + 1}</span>
        <div class="option-content">
          <span class="option-hira" style="font-size: 1.15rem;">${opt.text}</span>
        </div>
      </button>
    `).join('');

    dom.gQuizOptionsGrid.querySelectorAll('.g-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => handleGrammarAnswer(btn, q));
    });

    dom.gQuizExplanation.style.display = 'none';
    dom.gQuizNextBtn.style.display = 'none';
  }

  function handleGrammarAnswer(selectedBtn, q) {
    if (appState.gQuizAnswered) return;
    appState.gQuizAnswered = true;

    const isCorrect = selectedBtn && selectedBtn.dataset.correct === 'true';

    if (isCorrect) {
      appState.gQuizScore++;
      appState.gQuizStreak++;
      soundManager.playCorrect();
      storage.addGrammarMastered(q.item.id);
    } else {
      appState.gQuizStreak = 0;
      soundManager.playWrong();
      storage.addGrammarMistake(q.item.id);
    }

    updateGrammarStats();

    dom.gQuizOptionsGrid.querySelectorAll('.g-opt-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.correct === 'true') b.classList.add('correct');
    });

    if (selectedBtn && !isCorrect) {
      selectedBtn.classList.add('incorrect');
    }

    dom.gQuizExpTitle.textContent = isCorrect ? 'Chính xác! 🎉' : `Chưa chính xác! 💡 Đáp án đúng là: ${q.correctPattern}`;
    dom.gQuizExpDetail.innerHTML = `
      <div style="margin-bottom: 6px;"><strong>Ý nghĩa:</strong> ${q.item.meaning}</div>
      <div style="margin-bottom: 6px;"><strong>Cấu trúc:</strong> <span style="color: var(--primary); font-weight: 600;">${q.item.formation.replace(/\n/g, ' • ')}</span></div>
      <div style="font-size: 0.88rem; color: var(--text-muted);">${q.item.usage.replace(/\n/g, '<br>')}</div>
    `;
    dom.gQuizExplanation.style.display = 'block';

    dom.gQuizNextBtn.style.display = 'inline-flex';
  }

  function nextGrammarQuestion() {
    appState.gQuizIndex++;
    renderGrammarQuestion();
  }

  // --- 7.3 GRAMMAR FLASHCARD ---
  function initGrammarFlashcard() {
    const list = getFilteredGrammarList();
    appState.gFcList = list.length > 0 ? list : appState.grammarData;
    appState.gFcIndex = 0;
    appState.gFcFlipped = false;
    renderGrammarFlashcard();
  }

  function renderGrammarFlashcard() {
    if (appState.gFcList.length === 0) return;
    const g = appState.gFcList[appState.gFcIndex];

    appState.gFcFlipped = false;
    dom.gFlashcardElement.classList.remove('flipped');

    const total = appState.gFcList.length;
    const current = appState.gFcIndex + 1;
    dom.gFcProgressFill.style.width = `${(current / total) * 100}%`;
    dom.gFcProgressText.textContent = `${current} / ${total}`;

    dom.gFcCategoryBadge.textContent = g.categoryName;
    dom.gFcNumberBadge.textContent = `#${g.id}`;
    dom.gFcPattern.textContent = g.pattern;
    dom.gFcFormation.textContent = g.formation;

    dom.gFcCategoryBadgeBack.textContent = g.categoryName;
    dom.gFcMeaning.textContent = g.meaning;
    dom.gFcUsage.textContent = g.usage;

    const firstEx = g.examples[0] || { ja: '', vi: '' };
    dom.gFcExample.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 3px;">${firstEx.ja}</div>
      <div style="color: var(--text-muted); font-size: 0.88rem;">${firstEx.vi}</div>
    `;

    dom.gFcAudioBtn.onclick = (e) => {
      e.stopPropagation();
      soundManager.speak(firstEx.ja);
    };
  }

  function flipGrammarFlashcard() {
    appState.gFcFlipped = !appState.gFcFlipped;
    dom.gFlashcardElement.classList.toggle('flipped', appState.gFcFlipped);
  }

  function nextGrammarFlashcard() {
    if (appState.gFcIndex < appState.gFcList.length - 1) {
      appState.gFcIndex++;
      renderGrammarFlashcard();
    }
  }

  function prevGrammarFlashcard() {
    if (appState.gFcIndex > 0) {
      appState.gFcIndex--;
      renderGrammarFlashcard();
    }
  }

  // --- 7.4 GRAMMAR REVIEW NOTEBOOK ---
  function renderGrammarReviewList() {
    if (!dom.gReviewListContainer) return;

    let targetIds = [];
    if (appState.gReviewTab === 'mistakes') {
      targetIds = [...storage.gMistakes];
    } else if (appState.gReviewTab === 'mastered') {
      targetIds = [...storage.gMastered];
    } else {
      targetIds = [...storage.gStarred];
    }

    const items = appState.grammarData.filter(g => targetIds.includes(g.id));

    if (items.length === 0) {
      let msg = 'Chưa có mẫu câu nào trong mục này!';
      if (appState.gReviewTab === 'mistakes') msg = 'Tuyệt vời! Bạn không có mẫu câu ngữ pháp nào bị sai.';
      if (appState.gReviewTab === 'mastered') msg = 'Bạn chưa đánh dấu mẫu câu Đã thuộc nào. Hãy luyện tập để tích lũy nhé!';
      if (appState.gReviewTab === 'starred') msg = 'Chưa có mẫu câu nào được gắn dấu sao ★.';

      dom.gReviewListContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌟</div>
          <h3>${msg}</h3>
        </div>
      `;
      return;
    }

    dom.gReviewListContainer.innerHTML = items.map(g => `
      <div class="grammar-card expanded" data-id="${g.id}">
        <div class="grammar-card-header" data-id="${g.id}">
          <div class="gcard-title-group">
            <span class="gcard-id-badge">#${g.id}</span>
            <span class="gcard-pattern">${g.pattern}</span>
            <span class="gcard-meaning">${g.meaning}</span>
            <span class="gcard-cat-tag">${g.categoryName}</span>
          </div>
          <div class="gcard-actions">
            ${appState.gReviewTab === 'mastered' ? `
              <button class="btn-secondary btn-unmaster-grammar" data-id="${g.id}" title="Chuyển về chưa thuộc" style="padding: 4px 10px; font-size: 0.8rem;">
                🔄 Chưa thuộc
              </button>
            ` : `
              <button class="btn-icon btn-remove-grammar" data-id="${g.id}" title="Xóa khỏi danh sách này" style="color: var(--danger); padding: 4px 8px; font-size: 0.8rem;">✕</button>
            `}
          </div>
        </div>
        <div class="grammar-card-body">
          <div class="gcard-section-label">📌 Cấu trúc:</div>
          <div class="gcard-formation-box">${g.formation}</div>
          <div class="gcard-section-label">💡 Cách dùng:</div>
          <div class="gcard-usage-box">${g.usage}</div>
          <div class="gcard-section-label">📝 Ví dụ:</div>
          <div class="gcard-examples-list">
            ${g.examples.map(ex => `
              <div class="gcard-example-item">
                <div class="gcard-example-content">
                  <div class="gcard-example-ja">${ex.ja}</div>
                  <div class="gcard-example-vi">${ex.vi}</div>
                </div>
                <button class="audio-btn gcard-speak-btn" data-speak="${ex.ja}">🔊</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');

    // Events in review list
    dom.gReviewListContainer.querySelectorAll('.gcard-speak-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundManager.speak(btn.dataset.speak);
      });
    });

    dom.gReviewListContainer.querySelectorAll('.btn-remove-grammar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        if (appState.gReviewTab === 'mistakes') storage.removeGrammarMistake(id);
        if (appState.gReviewTab === 'starred') storage.toggleGrammarStarred(id);
        updateGrammarStats();
        renderGrammarReviewList();
      });
    });

    dom.gReviewListContainer.querySelectorAll('.btn-unmaster-grammar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        storage.removeGrammarMastered(id);
        updateGrammarStats();
        renderGrammarReviewList();
      });
    });
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Topic & Category changes
    dom.categorySelect.addEventListener('change', (e) => {
      const cat = appState.categories.find(c => c.id === e.target.value);
      if (cat) {
        appState.currentCategory = cat;
        renderCategoryControls();
        populateTopics();
        onTopicOrCategoryChange();
      }
    });

    dom.topicSelect.addEventListener('change', (e) => {
      appState.currentTopicId = e.target.value;
      if (dom.dictTopicSelect && dom.dictTopicSelect.querySelector(`option[value="${e.target.value}"]`)) {
        dom.dictTopicSelect.value = e.target.value;
      }
      onTopicOrCategoryChange();
    });

    // Theme toggle
    dom.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('jlpt_n3_theme', next);
      dom.themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    // Sound toggle
    dom.soundToggleBtn.addEventListener('click', () => {
      soundManager.enabled = !soundManager.enabled;
      localStorage.setItem('jlpt_n3_sound', JSON.stringify(soundManager.enabled));
      dom.soundIcon.textContent = soundManager.enabled ? '🔊' : '🔇';
    });

    // Navigation Tabs
    dom.navTabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Quiz Events
    dom.quizNextBtn.addEventListener('click', nextQuiz);
    dom.quizShuffleBtn.addEventListener('click', initQuiz);
    dom.quizStarBtn.addEventListener('click', () => {
      if (!appState.quizCurrentQ) return;
      const isFav = storage.toggleFavorite(appState.quizCurrentQ.id);
      dom.quizStarBtn.classList.toggle('active', isFav);
      updateQuickStats();
    });

    // Flashcard Events
    dom.flashcardElement.addEventListener('click', flipFlashcard);
    dom.fcNextBtn.addEventListener('click', nextFlashcard);
    dom.fcPrevBtn.addEventListener('click', prevFlashcard);
    dom.fcMasteredBtn.addEventListener('click', () => {
      if (appState.fcWords.length === 0) return;
      const w = appState.fcWords[appState.fcIndex];
      storage.addMastered(w.id);
      soundManager.playCorrect();
      updateQuickStats();
      nextFlashcard();
    });
    dom.fcReviewBtn.addEventListener('click', () => {
      if (appState.fcWords.length === 0) return;
      const w = appState.fcWords[appState.fcIndex];
      storage.addMistake(w.id);
      soundManager.playWrong();
      updateQuickStats();
      nextFlashcard();
    });

    // Spelling Events
    dom.spellingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      checkSpelling();
    });
    dom.spellingHintBtn.addEventListener('click', () => {
      if (!appState.spellingCurrentWord) return;
      const firstChar = appState.spellingCurrentWord.hiragana.charAt(0);
      dom.spellingInput.value = firstChar;
      dom.spellingInput.focus();
    });
    dom.spellingSkipBtn.addEventListener('click', () => {
      appState.spellingIndex++;
      renderSpellingQuestion();
    });

    // Exam Events
    dom.examStartBtn.addEventListener('click', startExam);
    dom.examRetryBtn.addEventListener('click', startExam);
    dom.examReviewMistakesBtn.addEventListener('click', () => {
      switchTab('review');
    });

    // Review Events
    function updateSubtabStyles() {
      const activeTab = appState.reviewTab;
      const btns = [
        { btn: dom.subtabMistakesBtn, id: 'mistakes' },
        { btn: dom.subtabMasteredBtn, id: 'mastered' },
        { btn: dom.subtabFavoritesBtn, id: 'favorites' }
      ];
      btns.forEach(({ btn, id }) => {
        if (!btn) return;
        if (id === activeTab) {
          btn.style.background = 'var(--primary-light)';
          btn.style.color = 'var(--primary)';
        } else {
          btn.style.background = 'none';
          btn.style.color = 'inherit';
        }
      });
    }

    if (dom.subtabMistakesBtn) {
      dom.subtabMistakesBtn.addEventListener('click', () => {
        appState.reviewTab = 'mistakes';
        updateSubtabStyles();
        renderReviewList();
      });
    }

    if (dom.subtabMasteredBtn) {
      dom.subtabMasteredBtn.addEventListener('click', () => {
        appState.reviewTab = 'mastered';
        updateSubtabStyles();
        renderReviewList();
      });
    }

    if (dom.subtabFavoritesBtn) {
      dom.subtabFavoritesBtn.addEventListener('click', () => {
        appState.reviewTab = 'favorites';
        updateSubtabStyles();
        renderReviewList();
      });
    }

    // Click on Quick Stat Pill "Đã thuộc" -> Navigate to Tab Review, Subtab Mastered
    if (dom.statPillMastered) {
      dom.statPillMastered.addEventListener('click', () => {
        switchTab('review');
        appState.reviewTab = 'mastered';
        updateSubtabStyles();
        renderReviewList();
      });
    }

    // Click on Quick Stat Pill "Cần ôn" -> Navigate to Tab Review, Subtab Mistakes
    if (dom.statPillMistake) {
      dom.statPillMistake.addEventListener('click', () => {
        switchTab('review');
        appState.reviewTab = 'mistakes';
        updateSubtabStyles();
        renderReviewList();
      });
    }

    dom.clearReviewBtn.addEventListener('click', () => {
      let msg = 'Bạn có chắc muốn làm trống danh sách này không?';
      if (appState.reviewTab === 'mastered') {
        msg = 'Bạn có chắc muốn đặt lại toàn bộ danh sách "Đã thuộc" về trạng thái chưa thuộc không?';
      }
      if (confirm(msg)) {
        if (appState.reviewTab === 'mistakes') {
          storage.mistakes = {};
        } else if (appState.reviewTab === 'mastered') {
          storage.mastered.clear();
        } else {
          storage.favorites.clear();
        }
        storage.save();
        updateQuickStats();
        renderReviewList();
      }
    });

    // Dictionary Events
    if (dom.dictTopicSelect) {
      dom.dictTopicSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val !== 'all_categories') {
          dom.topicSelect.value = val;
          appState.currentTopicId = val;
          updateQuickStats();
        }
        renderDictionary();
      });
    }
    if (dom.dictSearchInput) {
      dom.dictSearchInput.addEventListener('input', renderDictionary);
    }

    // Column Visibility Toggles (Buttons in table header & toolbar pills)
    document.querySelectorAll('.btn-col-toggle, .col-pill-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const col = btn.dataset.col;
        if (col) toggleColumnVisibility(col);
      });
    });

    // Click to peek/reveal individual cell in dictionary table
    if (dom.dictTableBody) {
      dom.dictTableBody.addEventListener('click', (e) => {
        const cell = e.target.closest('.dict-kanji, .dict-hiragana, .dict-hanviet, .dict-nghia');
        if (cell && !e.target.closest('button')) {
          cell.classList.toggle('revealed');
        }
      });
    }

    window.addEventListener('resize', updateHeaderHeightVar);

    // Reset Progress Modal Events
    if (dom.resetStatsBtn && dom.resetModal) {
      dom.resetStatsBtn.addEventListener('click', () => {
        dom.resetModal.style.display = 'flex';
      });

      dom.closeResetModalBtn.addEventListener('click', () => {
        dom.resetModal.style.display = 'none';
      });

      dom.resetModal.addEventListener('click', (e) => {
        if (e.target === dom.resetModal) {
          dom.resetModal.style.display = 'none';
        }
      });

      dom.resetMasteredBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn đặt lại danh sách "Đã thuộc" về 0 không?')) {
          storage.mastered.clear();
          storage.save();
          updateQuickStats();
          dom.resetModal.style.display = 'none';
          alert('Đã đặt lại "Đã thuộc" về 0 thành công!');
        }
      });

      dom.resetMistakesBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn đặt lại danh sách "Cần ôn" về 0 không?')) {
          storage.mistakes = {};
          storage.save();
          updateQuickStats();
          if (appState.reviewTab === 'mistakes') renderReviewList();
          dom.resetModal.style.display = 'none';
          alert('Đã đặt lại "Cần ôn" về 0 thành công!');
        }
      });

      dom.resetAllStatsBtn.addEventListener('click', () => {
        if (confirm('CẢNH BÁO: Thao tác này sẽ xóa toàn bộ danh sách "Đã thuộc", "Cần ôn" và điểm số để bạn học lại từ đầu. Bạn có đồng ý không?')) {
          storage.mastered.clear();
          storage.mistakes = {};
          storage.save();
          appState.quizScore = 0;
          appState.quizStreak = 0;
          updateQuickStats();
          if (appState.reviewTab === 'mistakes') renderReviewList();
          dom.resetModal.style.display = 'none';
          alert('Đã đặt lại toàn bộ tiến độ về 0 thành công!');
        }
      });
    }

    // =========================================================================
    // GRAMMAR EVENT BINDINGS
    // =========================================================================
    if (dom.modeBtnVocab) {
      dom.modeBtnVocab.addEventListener('click', () => switchAppMode('vocab'));
    }
    if (dom.modeBtnGrammar) {
      dom.modeBtnGrammar.addEventListener('click', () => switchAppMode('grammar'));
    }

    // Grammar Nav Tabs
    document.querySelectorAll('#grammarNavTabsWrapper .nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.gtab;
        if (tab) switchGrammarTab(tab);
      });
    });

    // Grammar Handbook Events
    if (dom.grammarSearchInput) {
      dom.grammarSearchInput.addEventListener('input', (e) => {
        appState.grammarSearch = e.target.value;
        renderGrammarHandbook();
      });
    }

    if (dom.grammarToggleAllBtn) {
      dom.grammarToggleAllBtn.addEventListener('click', toggleAllGrammarCards);
    }

    // Grammar Quiz Events
    if (dom.gQuizNextBtn) {
      dom.gQuizNextBtn.addEventListener('click', nextGrammarQuestion);
    }
    if (dom.gQuizRestartBtn) {
      dom.gQuizRestartBtn.addEventListener('click', initGrammarQuiz);
    }
    if (dom.gQuizStarBtn) {
      dom.gQuizStarBtn.addEventListener('click', () => {
        if (!appState.gQuizCurrentQ) return;
        const active = storage.toggleGrammarStarred(appState.gQuizCurrentQ.item.id);
        dom.gQuizStarBtn.classList.toggle('active', active);
        updateGrammarStats();
      });
    }

    // Grammar Flashcard Events
    if (dom.gFlashcardElement) {
      dom.gFlashcardElement.addEventListener('click', flipGrammarFlashcard);
    }
    if (dom.gFcNextBtn) dom.gFcNextBtn.addEventListener('click', nextGrammarFlashcard);
    if (dom.gFcPrevBtn) dom.gFcPrevBtn.addEventListener('click', prevGrammarFlashcard);
    if (dom.gFcMasteredBtn) {
      dom.gFcMasteredBtn.addEventListener('click', () => {
        if (appState.gFcList.length === 0) return;
        const g = appState.gFcList[appState.gFcIndex];
        storage.addGrammarMastered(g.id);
        soundManager.playCorrect();
        updateGrammarStats();
        nextGrammarFlashcard();
      });
    }
    if (dom.gFcReviewBtn) {
      dom.gFcReviewBtn.addEventListener('click', () => {
        if (appState.gFcList.length === 0) return;
        const g = appState.gFcList[appState.gFcIndex];
        storage.addGrammarMistake(g.id);
        soundManager.playWrong();
        updateGrammarStats();
        nextGrammarFlashcard();
      });
    }

    // Grammar Review Subtabs
    function updateGrammarSubtabStyles() {
      const activeTab = appState.gReviewTab;
      const btns = [
        { btn: dom.gSubtabMistakesBtn, id: 'mistakes' },
        { btn: dom.gSubtabMasteredBtn, id: 'mastered' },
        { btn: dom.gSubtabStarredBtn, id: 'starred' }
      ];
      btns.forEach(({ btn, id }) => {
        if (!btn) return;
        if (id === activeTab) {
          btn.style.background = 'var(--primary-light)';
          btn.style.color = 'var(--primary)';
        } else {
          btn.style.background = 'none';
          btn.style.color = 'inherit';
        }
      });
    }

    if (dom.gSubtabMistakesBtn) {
      dom.gSubtabMistakesBtn.addEventListener('click', () => {
        appState.gReviewTab = 'mistakes';
        updateGrammarSubtabStyles();
        renderGrammarReviewList();
      });
    }
    if (dom.gSubtabMasteredBtn) {
      dom.gSubtabMasteredBtn.addEventListener('click', () => {
        appState.gReviewTab = 'mastered';
        updateGrammarSubtabStyles();
        renderGrammarReviewList();
      });
    }
    if (dom.gSubtabStarredBtn) {
      dom.gSubtabStarredBtn.addEventListener('click', () => {
        appState.gReviewTab = 'starred';
        updateGrammarSubtabStyles();
        renderGrammarReviewList();
      });
    }

    if (dom.gStatPillMastered) {
      dom.gStatPillMastered.addEventListener('click', () => {
        switchGrammarTab('review');
        appState.gReviewTab = 'mastered';
        updateGrammarSubtabStyles();
        renderGrammarReviewList();
      });
    }
    if (dom.gStatPillReview) {
      dom.gStatPillReview.addEventListener('click', () => {
        switchGrammarTab('review');
        appState.gReviewTab = 'mistakes';
        updateGrammarSubtabStyles();
        renderGrammarReviewList();
      });
    }

    if (dom.gClearReviewBtn) {
      dom.gClearReviewBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn xóa danh sách ngữ pháp này?')) {
          if (appState.gReviewTab === 'mistakes') storage.gMistakes.clear();
          if (appState.gReviewTab === 'mastered') storage.gMastered.clear();
          if (appState.gReviewTab === 'starred') storage.gStarred.clear();
          storage.save();
          updateGrammarStats();
          renderGrammarReviewList();
        }
      });
    }

    if (dom.resetGrammarStatsBtn) {
      dom.resetGrammarStatsBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn đặt lại toàn bộ tiến độ học Ngữ pháp (Đã thuộc, Cần ôn, Đánh dấu)?')) {
          storage.gMastered.clear();
          storage.gMistakes.clear();
          storage.gStarred.clear();
          storage.save();
          updateGrammarStats();
          if (appState.grammarTab === 'review') renderGrammarReviewList();
          alert('Đã đặt lại tiến độ Ngữ pháp thành công!');
        }
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts if user is typing in search or spelling input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Vocab Quiz mode shortcuts: keys 1-4 for options, Enter for next
      const activeSec = document.querySelector('.view-section.active');
      if (activeSec && activeSec.id === 'view-quiz') {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          const btns = dom.quizOptionsGrid.querySelectorAll('.option-btn');
          if (btns[idx] && !appState.quizAnswered) {
            btns[idx].click();
          }
        } else if (e.key === 'Enter') {
          if (appState.quizAnswered) nextQuiz();
        }
      }

      // Vocab Flashcard mode shortcuts: Space for flip, ArrowLeft/Right for Prev/Next
      if (activeSec && activeSec.id === 'view-flashcard') {
        if (e.code === 'Space') {
          e.preventDefault();
          flipFlashcard();
        } else if (e.key === 'ArrowRight') {
          nextFlashcard();
        } else if (e.key === 'ArrowLeft') {
          prevFlashcard();
        }
      }

      // Grammar Quiz mode shortcuts: keys 1-4 for options, Enter for next
      if (activeSec && activeSec.id === 'view-grammar-quiz') {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          const btns = dom.gQuizOptionsGrid.querySelectorAll('.g-opt-btn');
          if (btns[idx] && !appState.gQuizAnswered) {
            btns[idx].click();
          }
        } else if (e.key === 'Enter') {
          if (appState.gQuizAnswered) nextGrammarQuestion();
        }
      }

      // Grammar Flashcard mode shortcuts: Space for flip, ArrowLeft/Right for Prev/Next
      if (activeSec && activeSec.id === 'view-grammar-flashcard') {
        if (e.code === 'Space') {
          e.preventDefault();
          flipGrammarFlashcard();
        } else if (e.key === 'ArrowRight') {
          nextGrammarFlashcard();
        } else if (e.key === 'ArrowLeft') {
          prevGrammarFlashcard();
        }
      }
    });
  }

  // Start app on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
