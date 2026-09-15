/**
 * Strings the original single-file game did not have: page chrome, ARIA labels
 * and the end-of-story summary.
 *
 * Spread *after* the content pack's own `ui`, so `end` here replaces the
 * original — which reported the child's lifetime star total ("you have 47 ⭐")
 * rather than anything about the story they just finished.
 */
export const readingExtraUI = {
  pl: {
    pageDescription:
      'Historyjki, które dziecko samo układa, sylaby, słowa i śmieszne zdania — nauka czytania dla dzieci 5-8 lat.',
    home: 'Menu',
    langSwitch: 'Switch to English',
    soundOn: 'Wyłącz dźwięk',
    soundOff: 'Włącz dźwięk',
    syllablesLabel: 'Pokaż sylaby',
    starsLabel: 'gwiazdki',
    practiceLabel: 'przeczytane na głos',
    tabsLabel: 'Wybierz zabawę',
    optionsLabel: 'Odpowiedzi',
    chipsLabel: 'Wybierz',
    end: earned => `Super czytanie! W tej historyjce zdobyłaś ${earned} ⭐`,
    practiceEarned: '📚 +1 przeczytane!'
  },
  en: {
    pageDescription:
      'Build-your-own stories, syllables, words and silly sentences — early reading practice for children aged 5-8.',
    home: 'Menu',
    langSwitch: 'Przełącz na polski',
    soundOn: 'Turn sound off',
    soundOff: 'Turn sound on',
    syllablesLabel: 'Show syllables',
    starsLabel: 'stars',
    practiceLabel: 'read out loud',
    tabsLabel: 'Pick a game',
    optionsLabel: 'Answers',
    chipsLabel: 'Choose',
    end: earned => `Great reading! You earned ${earned} ⭐ in this story`,
    practiceEarned: '📚 +1 read!'
  }
};
