import '../ui/reading.css';

import store from '../core/store.js';
import { getLang, toggleLang, otherLangLabel } from '../core/i18n.js';
import { el, clear, shuffle, replay } from '../core/dom.js';
import {
  isSoundOn, toggleSound, popSound, pageSound, goodSound, badSound, fanfare, tone
} from '../core/audio.js';
import { confetti } from '../core/confetti.js';
import { say, warmUpVoices } from '../core/speech.js';
import { createTabs } from '../ui/tabs.js';
import { createStarCounter, createPracticeCounter } from '../ui/stars.js';
import { renderText, plain } from '../games/reading/text.js';
import {
  pickStory, buildQuestions, makeFunSentence
} from '../games/reading/story.js';
import PL from '../content/pl/reading.js';
import EN from '../content/en/reading.js';
import { readingExtraUI } from '../content/reading-extra.js';
import { registerServiceWorker } from '../core/pwa.js';

const PACKS = { pl: PL, en: EN };
const content = () => PACKS[getLang()] || PL;
const ui = () => ({ ...content().ui, ...readingExtraUI[getLang()] });

const q = sel => document.querySelector(sel);
const qa = sel => [...document.querySelectorAll(sel)];

let syllables = store.get('syllables', false);
const rt = text => renderText(text, syllables);

const starCounter = createStarCounter('reading', { celebrate: ['⭐', '🎉', '💜', '🌸', '✨', '📖'] });
const practiceCounter = createPracticeCounter('reading');

/* ==================== STORY ==================== */

const storySection = q('[data-section="story"]');
const storyPage = name =>
  qa('[data-page]').forEach(p => p.classList.toggle('hidden', p.dataset.page !== name));

let selection = { h: null, f: null, p: null, t: null };
let story = null;
let sentenceIndex = 0;
let questions = [];
let questionIndex = 0;
let answerLocked = false;
let storyStars = 0; // this story only — the end screen used to report the lifetime total

function buildChips() {
  const c = content();
  const groups = [
    ['h', c.HEROES, 'hero'],
    ['f', c.FRIENDS, 'friend'],
    ['p', c.PLACES, 'place'],
    ['t', c.THINGS, 'thing']
  ];
  for (const [key, list, labelKey] of groups) {
    const box = q(`[data-chips="${key}"]`);
    clear(box);
    box.setAttribute('aria-label', ui()[`lbl${cap(labelKey)}`] || ui().chipsLabel);
    for (const item of list) {
      const chip = el(
        'button.chip',
        {
          type: 'button',
          'aria-pressed': 'false',
          onclick: () => {
            popSound();
            selection[key] = item;
            [...box.children].forEach(ch => ch.setAttribute('aria-pressed', String(ch === chip)));
            q('[data-go]').disabled = !complete();
          }
        },
        el('span.em', { text: item.em, 'aria-hidden': 'true' }),
        el('span', { text: plain(item.nom) })
      );
      box.append(chip);
    }
  }
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const complete = () => Boolean(selection.h && selection.f && selection.p && selection.t);

q('[data-go]').addEventListener('click', () => {
  tone(523, { dur: 0.15 });
  tone(784, { delay: 0.12, dur: 0.2 });
  story = pickStory(content(), selection);
  questions = buildQuestions(content(), selection, story);
  sentenceIndex = 0;
  storyStars = 0;
  storyPage('read');
  renderSentence();
  q('[data-next]').focus();
});

function renderSentence() {
  const u = ui();
  q('[data-progress]').textContent = u.sentence(sentenceIndex + 1, story.s.length);
  const done = q('[data-done]');
  clear(done);
  for (const s of story.s.slice(0, sentenceIndex)) done.append(el('span.s', { text: plain(s) }));
  done.scrollTop = done.scrollHeight;
  const now = q('[data-now]');
  now.innerHTML = rt(story.s[sentenceIndex]);
  replay(now, 'pop');
  q('[data-next]').textContent =
    sentenceIndex === story.s.length - 1 ? u.readLast : u.read;
}

q('[data-next]').addEventListener('click', () => {
  pageSound();
  if (sentenceIndex < story.s.length - 1) {
    sentenceIndex++;
    renderSentence();
  } else {
    questionIndex = 0;
    storyPage('quiz');
    renderQuestion();
  }
});

q('[data-tts]').addEventListener('click', () => story && say(story.s[sentenceIndex]));

function renderQuestion() {
  answerLocked = false;
  const u = ui();
  const feedback = q('[data-feedback]');
  feedback.textContent = '';
  feedback.classList.remove('bad');
  const question = questions[questionIndex];
  q('[data-question]').innerHTML = rt(question.txt);
  const box = q('[data-options]');
  clear(box);
  box.setAttribute('aria-label', u.optionsLabel);
  for (const option of question.opts) {
    const btn = el(
      'button.opt',
      {
        type: 'button',
        'aria-label': plain(option.lbl),
        onclick: () => answer(option, btn)
      },
      el('span.em', { text: option.em, 'aria-hidden': 'true' }),
      el('span', { html: rt(option.lbl) })
    );
    box.append(btn);
  }
}

function answer(option, btn) {
  if (answerLocked) return;
  const u = ui();
  const feedback = q('[data-feedback]');
  if (!option.ok) {
    btn.classList.add('bad', 'shk');
    badSound();
    feedback.textContent = u.retry;
    feedback.classList.add('bad');
    setTimeout(() => btn.classList.remove('bad', 'shk'), 900);
    return;
  }
  answerLocked = true;
  btn.classList.add('good');
  goodSound();
  starCounter.add({ silent: true });
  storyStars++;
  feedback.classList.remove('bad');
  feedback.textContent = u.bravo;
  setTimeout(() => {
    questionIndex++;
    if (questionIndex < questions.length) renderQuestion();
    else finishStory();
  }, 1100);
}

function finishStory() {
  storyPage('end');
  q('[data-end-text]').textContent = ui().end(storyStars);
  q('[data-again]').textContent = ui().again;
  fanfare();
  confetti(['⭐', '🎉', '💜', '🌸', '✨', '📖']);
  q('[data-again]').focus();
}

q('[data-again]').addEventListener('click', resetPick);

function resetPick() {
  selection = { h: null, f: null, p: null, t: null };
  qa('.chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
  q('[data-go]').disabled = true;
  storyPage('pick');
}

/* ==================== WORDS (verified) ==================== */

let currentWord = null;
let wordLocked = false;

function nextWord() {
  wordLocked = false;
  const u = ui();
  const words = content().WORDS;
  const feedback = q('[data-word-feedback]');
  feedback.textContent = '';
  feedback.classList.remove('bad');
  currentWord = words[Math.floor(Math.random() * words.length)];

  const emoji = q('[data-word-emoji]');
  emoji.textContent = currentWord.em;
  emoji.setAttribute('aria-label', u.cListen);
  replay(emoji, 'pop');

  const box = q('[data-word-options]');
  clear(box);
  box.setAttribute('aria-label', u.optionsLabel);
  const others = shuffle(words.filter(w => w !== currentWord)).slice(0, 3);
  for (const item of shuffle([currentWord, ...others])) {
    const btn = el('button.opt.wordOpt', {
      type: 'button',
      html: rt(item.w),
      'aria-label': plain(item.w),
      onclick: () => {
        if (wordLocked) return;
        if (item !== currentWord) {
          btn.classList.add('bad', 'shk');
          badSound();
          feedback.textContent = u.retry;
          feedback.classList.add('bad');
          setTimeout(() => btn.classList.remove('bad', 'shk'), 900);
          return;
        }
        wordLocked = true;
        btn.classList.add('good');
        goodSound();
        starCounter.add({ silent: true });
        feedback.classList.remove('bad');
        feedback.textContent = u.bravo;
        setTimeout(nextWord, 1000);
      }
    });
    box.append(btn);
  }
}

q('[data-word-emoji]').addEventListener('click', () => currentWord && say(currentWord.w));

/* ==================== CARDS (self-graded → practice) ==================== */

let cardWord = null;
let cardLocked = false;
let cardDeck = [];

function nextCard() {
  cardLocked = false;
  q('[data-card-feedback]').textContent = '';
  if (!cardDeck.length) cardDeck = shuffle([...content().WORDS]);
  cardWord = cardDeck.pop();
  const word = q('[data-card-word]');
  word.innerHTML = rt(cardWord.w);
  word.setAttribute('aria-label', plain(cardWord.w));
  replay(word, 'pop');
}

q('[data-card-listen]').addEventListener('click', () => cardWord && say(cardWord.w));

q('[data-card-good]').addEventListener('click', () => {
  if (cardLocked) return;
  cardLocked = true;
  goodSound();
  practiceCounter.add();
  q('[data-card-feedback]').textContent = ui().practiceEarned;
  setTimeout(nextCard, 1100);
});

q('[data-card-bad]').addEventListener('click', () => {
  if (cardLocked) return;
  cardLocked = true;
  popSound();
  if (cardWord) say(cardWord.w);
  q('[data-card-feedback]').textContent = ui().cTry;
  setTimeout(nextCard, 1400);
});

/* ==================== FUNNY SENTENCES (self-graded → practice) ==================== */

let funSentence = null;
let funLocked = false;

function nextFun() {
  funLocked = false;
  q('[data-fun-feedback]').textContent = '';
  funSentence = makeFunSentence(content(), funSentence);
  const node = q('[data-fun-sentence]');
  node.innerHTML = rt(funSentence);
  node.setAttribute('aria-label', plain(funSentence));
  replay(node, 'pop');
}

q('[data-fun-listen]').addEventListener('click', () => funSentence && say(funSentence));

q('[data-fun-good]').addEventListener('click', () => {
  if (funLocked) return;
  funLocked = true;
  goodSound();
  practiceCounter.add();
  q('[data-fun-feedback]').textContent = ui().practiceEarned;
  setTimeout(nextFun, 1100);
});

q('[data-fun-new]').addEventListener('click', () => {
  if (funLocked) return;
  popSound();
  nextFun();
});

/* ==================== CHROME ==================== */

const starters = { story: () => {}, words: nextWord, cards: nextCard, fun: nextFun };

const tabs = createTabs(q('[data-tabs]'), { onChange: id => starters[id]?.() });

const syllablesBtn = q('[data-syllables]');
syllablesBtn.addEventListener('click', () => {
  syllables = !syllables;
  store.set('syllables', syllables);
  syllablesBtn.setAttribute('aria-pressed', String(syllables));
  popSound();
  rerenderVisible();
});

const soundBtn = q('[data-sound]');
function paintSound() {
  soundBtn.textContent = isSoundOn() ? '🔊' : '🔇';
  soundBtn.setAttribute('aria-label', isSoundOn() ? ui().soundOn : ui().soundOff);
  soundBtn.setAttribute('aria-pressed', String(isSoundOn()));
}
soundBtn.addEventListener('click', () => {
  toggleSound();
  paintSound();
});

q('[data-lang]').addEventListener('click', () => {
  toggleLang();
  popSound();
  cardDeck = [];
  funSentence = null;
  story = null;
  applyLanguage();
  buildChips();
  resetPick();
  const active = tabs.current;
  if (active !== 'story') starters[active]?.();
});

/** Re-renders whichever page is actually visible (syllable toggle, language). */
function rerenderVisible() {
  const active = tabs.current;
  if (active === 'story') {
    if (!q('[data-page="read"]').classList.contains('hidden') && story) renderSentence();
    if (!q('[data-page="quiz"]').classList.contains('hidden') && questions.length) renderQuestion();
  } else if (active === 'words' && currentWord) {
    nextWord();
  } else if (active === 'cards' && cardWord) {
    q('[data-card-word]').innerHTML = rt(cardWord.w);
  } else if (active === 'fun' && funSentence) {
    q('[data-fun-sentence]').innerHTML = rt(funSentence);
  }
}

function applyLanguage() {
  const u = ui();
  document.title = plain(u.title);
  q('[data-title]').textContent = u.title;
  q('[data-description]').setAttribute('content', u.pageDescription);
  q('[data-home]').setAttribute('aria-label', u.home);
  q('[data-lang]').textContent = otherLangLabel();
  q('[data-lang]').setAttribute('aria-label', u.langSwitch);
  q('[data-syllables]').textContent = u.syl;
  q('[data-syllables]').setAttribute('aria-label', u.syllablesLabel);
  q('[data-stars-label]').textContent = u.starsLabel;
  q('[data-practice-label]').textContent = u.practiceLabel;
  document.getElementById('starBox').setAttribute('aria-label', u.starsLabel);
  document.getElementById('practiceBox').setAttribute('aria-label', u.practiceLabel);
  q('[data-tabs]').setAttribute('aria-label', u.tabsLabel);

  const tabText = { story: u.tabStory, words: u.tabWords, cards: u.tabCards, fun: u.tabFun };
  tabs.tabs.forEach(tab => (tab.textContent = tabText[tab.dataset.tab]));

  q('[data-lbl="hero"]').textContent = u.lblHero;
  q('[data-lbl="friend"]').textContent = u.lblFriend;
  q('[data-lbl="place"]').textContent = u.lblPlace;
  q('[data-lbl="thing"]').textContent = u.lblThing;
  q('[data-go]').textContent = u.go;
  q('[data-tts]').textContent = u.tts;
  q('[data-again]').textContent = u.again;
  q('[data-words-q]').textContent = u.wordsQ;
  q('[data-cards-q]').textContent = u.cardsQ;
  q('[data-card-listen]').textContent = u.cListen;
  q('[data-card-good]').textContent = u.cGood;
  q('[data-card-bad]').textContent = u.cBad;
  q('[data-fun-q]').textContent = u.funQ;
  q('[data-fun-listen]').textContent = u.fListen;
  q('[data-fun-good]').textContent = u.fGood;
  q('[data-fun-new]').textContent = u.fNew;
  paintSound();
}

/* ---------- start ---------- */

syllablesBtn.setAttribute('aria-pressed', String(syllables));
applyLanguage();
buildChips();
storyPage('pick');
tabs.select('story', { silent: true });
warmUpVoices();

window.addEventListener('pageshow', e => {
  if (e.persisted) store.refresh();
});

registerServiceWorker();
