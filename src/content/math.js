/**
 * Maths content and copy, PL + EN.
 *
 * The maths game used to be Polish-only — 31 string literals in its JS plus
 * every label in its markup — while the menu and the reading game both
 * honoured the shared `lang` setting. Switching to EN and tapping Maths landed
 * you in Polish. All of its copy now lives here.
 */

/** Countable item themes. `forms` are [one, few, many] for PL, [one, many] for EN. */
export const THEMES = {
  cookie: { em: '🍪', pl: ['ciastko', 'ciastka', 'ciastek'], en: ['cookie', 'cookies'] },
  apple: { em: '🍎', pl: ['jabłko', 'jabłka', 'jabłek'], en: ['apple', 'apples'] },
  star: { em: '⭐', pl: ['gwiazdka', 'gwiazdki', 'gwiazdek'], en: ['star', 'stars'] },
  heart: { em: '💜', pl: ['serduszko', 'serduszka', 'serduszek'], en: ['heart', 'hearts'] },
  flower: { em: '🌸', pl: ['kwiatek', 'kwiatki', 'kwiatków'], en: ['flower', 'flowers'] },
  rainbow: { em: '🌈', pl: ['tęcza', 'tęcze', 'tęcz'], en: ['rainbow', 'rainbows'] },
  unicorn: { em: '🦄', pl: ['jednorożec', 'jednorożce', 'jednorożców'], en: ['unicorn', 'unicorns'] },
  crystal: { em: '💎', pl: ['kryształ', 'kryształy', 'kryształów'], en: ['crystal', 'crystals'] },
  marble: { em: '🔵', pl: ['kulka', 'kulki', 'kulek'], en: ['marble', 'marbles'] }
};

export const DEFAULT_THEME = 'unicorn';

export const BASKET_FORMS = {
  pl: ['koszyk', 'koszyki', 'koszyków'],
  en: ['basket', 'baskets']
};
export const ROW_FORMS = {
  pl: ['rząd', 'rzędy', 'rzędów'],
  en: ['row', 'rows']
};

export const mathDict = {
  pl: {
    title: 'Matematyka na wesoło',
    pageDescription: 'Dodawanie, odejmowanie, mnożenie i pole prostokąta — dla dzieci w wieku 5-8 lat.',
    home: 'Menu',
    soundOn: 'Wyłącz dźwięk',
    soundOff: 'Włącz dźwięk',
    langSwitch: 'Switch to English',
    starsLabel: 'Zdobyte gwiazdki',
    themesLabel: 'Wybierz obrazek',
    operationsLabel: 'Wybierz działanie',

    tabAdd: '➕ Dodawanie',
    tabSub: '➖ Odejmowanie',
    tabMul: '✖️ Mnożenie',
    tabGrid: '🟪 Kwadrat',
    tabExplore: '🔎 Odkrywaj',
    tabQuiz: '⭐ Zagadka',

    bravo: 'Brawo!',
    starEarned: 'Masz gwiazdkę!',
    countTogether: 'Sprawdźmy — policzmy razem! (dotknij, żeby pominąć)',
    tryAgain: 'Spróbuj jeszcze raz',
    answersLabel: 'Odpowiedzi',
    answerLabel: v => `Odpowiedź ${v}`,
    more: 'Więcej',
    fewer: 'Mniej',
    correctAnnounce: (a, op, b, v) => `Dobrze! ${a} ${op} ${b} = ${v}`,

    roundLabel: (done, total) => `Pytanie ${done} z ${total}`,
    roundDone: best =>
      best >= 5 ? `Runda ukończona! Najlepsza seria: ${best} 🔥` : 'Runda ukończona! 🎉',
    roundAgain: 'Jeszcze jedna runda! 🚀',
    progressLabel: 'Postęp rundy',

    addExplore: (a, b, c) => `${a} ${c.thing(a)} i jeszcze ${b} — razem ${a + b} ${c.thing(a + b)}!`,
    addQuiz: () => 'Ile jest razem? Policz i kliknij odpowiedź!',
    addWrong: () => 'Prawie! Policz najpierw pierwszy koszyk, potem licz dalej.',
    addLabelA: 'Pierwszy koszyk',
    addLabelB: 'Drugi koszyk',

    subExplore: (a, b, c) =>
      `Mamy ${a} ${c.thing(a)}, zabieramy ${b}. Zostaje: ${a - b} ${c.thing(a - b)}!`,
    subQuiz: () => 'Ile zostało? Szare są już zabrane!',
    subWrong: () => 'Prawie! Policz tylko kolorowe — szare są zabrane.',
    subLabelA: 'Ile mamy',
    subLabelB: 'Ile zabieramy',

    mulExplore: (a, b, c) =>
      `${a} ${c.basket(a)} po ${b} ${c.thing(b)} to razem ${a * b} ${c.thing(a * b)}!`,
    mulQuiz: () => 'Ile jest razem? Policz i kliknij odpowiedź!',
    mulWrong: (a, b) => `Prawie! Policz jeszcze raz — po ${b} w każdym koszyku.`,
    mulLabelA: 'Ile koszyków',
    mulLabelB: 'Ile w koszyku',

    gridLabel: (r, c) => `Plansza ${r} na ${c}`,
    cellLabel: (r, c) => `Rząd ${r}, kolumna ${c}`,
    gridPrompt: 'Kliknij pole!',
    gridQuiz: (a, b, c) => `Policz pole: ${a} ${c.row(a)} po ${b}. Wybierz wynik!`,
    gridWrong: (a, b, c) => `Prawie! Policz rzędy po kolei — ${a} ${c.row(a)} po ${b}.`,
    gridHintCount: (r, c2, c) =>
      `${r} ${c.row(r)} po ${c2}. Koniec każdego rzędu: liczymy skokami!`,
    gridHintProduct: () => 'Każde pole = rząd × kolumna. Róg to wynik.',
    gridMax: n => `Do ${n}`,
    gridNumCount: 'Licz: 1,2,3…',
    gridNumProduct: 'Wyniki: r×k'
  },

  en: {
    title: 'Fun Maths',
    pageDescription: 'Adding, subtracting, times tables and the area model — for children aged 5-8.',
    home: 'Menu',
    soundOn: 'Turn sound off',
    soundOff: 'Turn sound on',
    langSwitch: 'Przełącz na polski',
    starsLabel: 'Stars earned',
    themesLabel: 'Pick a picture',
    operationsLabel: 'Pick an operation',

    tabAdd: '➕ Adding',
    tabSub: '➖ Taking away',
    tabMul: '✖️ Times',
    tabGrid: '🟪 Square',
    tabExplore: '🔎 Explore',
    tabQuiz: '⭐ Puzzle',

    bravo: 'Well done!',
    starEarned: 'You got a star!',
    countTogether: "Let's count it together! (tap to skip)",
    tryAgain: 'Try again',
    answersLabel: 'Answers',
    answerLabel: v => `Answer ${v}`,
    more: 'More',
    fewer: 'Fewer',
    correctAnnounce: (a, op, b, v) => `Correct! ${a} ${op} ${b} = ${v}`,

    roundLabel: (done, total) => `Question ${done} of ${total}`,
    roundDone: best => (best >= 5 ? `Round complete! Best streak: ${best} 🔥` : 'Round complete! 🎉'),
    roundAgain: 'One more round! 🚀',
    progressLabel: 'Round progress',

    addExplore: (a, b, c) => `${a} ${c.thing(a)} and ${b} more — ${a + b} ${c.thing(a + b)} in all!`,
    addQuiz: () => 'How many altogether? Count them and tap your answer!',
    addWrong: () => 'Almost! Count the first basket, then keep going.',
    addLabelA: 'First basket',
    addLabelB: 'Second basket',

    subExplore: (a, b, c) => `We had ${a} ${c.thing(a)} and took ${b} away. ${a - b} left!`,
    subQuiz: () => 'How many are left? The grey ones are gone!',
    subWrong: () => 'Almost! Count only the coloured ones — the grey ones are gone.',
    subLabelA: 'How many',
    subLabelB: 'Take away',

    mulExplore: (a, b, c) =>
      `${a} ${c.basket(a)} with ${b} ${c.thing(b)} each makes ${a * b} ${c.thing(a * b)}!`,
    mulQuiz: () => 'How many altogether? Count them and tap your answer!',
    mulWrong: (a, b) => `Almost! Count again — ${b} in every basket.`,
    mulLabelA: 'Baskets',
    mulLabelB: 'In each basket',

    gridLabel: (r, c) => `${r} by ${c} board`,
    cellLabel: (r, c) => `Row ${r}, column ${c}`,
    gridPrompt: 'Tap a square!',
    gridQuiz: (a, b, c) => `Count the area: ${a} ${c.row(a)} of ${b}. Pick the answer!`,
    gridWrong: (a, b, c) => `Almost! Count row by row — ${a} ${c.row(a)} of ${b}.`,
    gridHintCount: (r, c2, c) => `${r} ${c.row(r)} of ${c2}. Skip-count at the end of each row!`,
    gridHintProduct: () => 'Every square = row × column. The corner is the answer.',
    gridMax: n => `Up to ${n}`,
    gridNumCount: 'Count: 1,2,3…',
    gridNumProduct: 'Products: r×c'
  }
};
