/**
 * Reading content, English. Extracted verbatim from the original single-file
 * game so it can be edited without touching game logic, and property-tested
 * across every hero/friend/place/thing combination.
 *
 * `|` marks a syllable boundary; it is stripped unless syllable mode is on.
 */
import { cap } from '../../games/reading/text.js';

export default {
 ui:{
  title:'📖 Fun Reading', tabStory:'📖 Story', tabWords:'🔤 Words', tabCards:'🗣️ I read', tabFun:'😄 Funny',
  syl:'Syl-la-bles',
  lblHero:'Who is the hero?', lblFriend:'With whom?', lblPlace:'Where?', lblThing:'What thing?',
  go:"Let's go! 🚀", read:'I read it! ➜', readLast:'I read it! 🌟',
  tts:'🔊 Help me', bravo:'Great! ⭐', retry:'Try again!',
  end:s=>'Great reading! You have '+s+' ⭐!', again:'New story! 📖',
  wordsQ:'What is it? Pick the word!',
  cardsQ:'Read the word out loud!', cListen:'🔊 Listen',
  cGood:'✅ Got it!', cBad:'🤔 Not yet', cTry:'No worries! 💪',
  funQ:'Read the funny sentence out loud!', fListen:'🔊 Listen',
  fGood:'✅ I read it!', fNew:'🎲 Another one',
  qHero:'Who is the he|ro?', qPlace:'Where was it?', qThing:'What thing was in the sto|ry?',
  sentence:(i,n)=>'Sentence '+i+' of '+n
 },
 HEROES:[
  {em:'🐱',nom:'Tom the Cat',short:'Tom',g:'m'},
  {em:'🧚',nom:'Mi|a the Fai|ry',short:'Mi|a',g:'f'},
  {em:'🤖',nom:'Zip the Ro|bot',short:'Zip',g:'m'},
  {em:'🐶',nom:'Max the Pup|py',short:'Max',g:'m'},
  {em:'👑',nom:'Rose the Prin|cess',short:'Rose',g:'f'},
 ],
 FRIENDS:[
  {em:'🐲',nom:'Rex the Drag|on',short:'Rex',g:'m'},
  {em:'🦉',nom:'Lil|y the Owl',short:'Lil|y',g:'f'},
  {em:'🧸',nom:'Ben the Bear',short:'Ben',g:'m'},
  {em:'🐈',nom:'Ki|ki the Kit|ty',short:'Ki|ki',g:'f'},
  {em:'👻',nom:'Boo the Ghost',short:'Boo',g:'m'},
 ],
 PLACES:[
  {em:'🌲',nom:'for|est',go:'to the for|est',at:'in the for|est'},
  {em:'🏰',nom:'cas|tle',go:'to the cas|tle',at:'in the cas|tle'},
  {em:'🚀',nom:'space',go:'to space',at:'in space'},
  {em:'🏪',nom:'shop',go:'to the shop',at:'in the shop'},
  {em:'🌊',nom:'sea',go:'to the sea',at:'at the sea'},
 ],
 THINGS:[
  {em:'💎',nom:'trea|sure'},
  {em:'🍦',nom:'ice cream'},
  {em:'🎈',nom:'bal|loon'},
  {em:'🌸',nom:'flow|er'},
  {em:'🎂',nom:'cake'},
 ],
 WORDS:[
  {em:'🐱',w:'cat'},{em:'🐶',w:'dog'},{em:'🏠',w:'house'},{em:'🐟',w:'fish'},
  {em:'🐸',w:'frog'},{em:'🦉',w:'owl'},{em:'🐉',w:'drag|on'},{em:'🦋',w:'but|ter|fly'},
  {em:'🧀',w:'cheese'},{em:'👑',w:'crown'},{em:'🌸',w:'flow|er'},{em:'🎂',w:'cake'},
  {em:'🚗',w:'car'},{em:'🐘',w:'el|e|phant'},{em:'📖',w:'book'},{em:'⭐',w:'star'},
  {em:'❤️',w:'heart'},{em:'🍎',w:'ap|ple'},{em:'🍋',w:'lem|on'},{em:'🍌',w:'ba|na|na'},
  {em:'⚽',w:'ball'},{em:'🌙',w:'moon'},{em:'☀️',w:'sun'},{em:'🚢',w:'ship'},
 ],
 FUN:{
  subj:[
   'A green drag|on','A fat cat','A si|lly frog','A ti|ny el|e|phant','A danc|ing dog',
   'A blue u|ni|corn','A hun|gry bear','A fly|ing owl','A pink rab|bit','A big di|no|saur'
  ],
  verb:[
   'danc|es','sings','jumps','eats ice cream','plays the trum|pet',
   'does flips','drinks juice','flies','laughs','whis|tles'
  ],
  tail:[
   'on the roof','in the bath|tub','on the Moon','un|der the ta|ble','in a hat',
   'on the road','in space','on a swing','in the gar|den','at the sea'
  ]
 },
 stories(h,f,p,t){
  const He=h.g==='m'?'He':'She', he=h.g==='m'?'he':'she', him=h.g==='m'?'him':'her';
  const fshe=f.g==='m'?'he':'she';
  return [
   { /* 1. Treasure surprise */
    s:[
     'This is '+h.nom+'.',
     cap(h.short)+' went '+p.go+' with '+f.nom+'.',
     'They looked for the '+t.nom+'.',
     'They looked un|der a rock. Noth|ing!',
     'They looked be|hind a tree. Noth|ing!',
     '"May|be there?" said '+f.short+'.',
     'Sud|den|ly some|thing spar|kled!',
     'It was the '+t.nom+'! '+t.em,
     'But the '+t.nom+'... sneezed!',
     '"A|choo!"',
     'A lit|tle frog was sleep|ing in|side. 🐸',
     'The frog yawned and said: "Good morn|ing!"',
     'They all laughed and laughed.',
     'The end. 🎉'
    ],
    q:{txt:'Who was sleep|ing in|side?',opts:[
     {em:'🐸',lbl:'a frog',ok:true},{em:'🐭',lbl:'a mouse'},{em:'🦔',lbl:'a hedge|hog'},{em:'🐌',lbl:'a snail'}
    ]}
   },
   { /* 2. Birthday mouse */
    s:[
     cap(h.short)+' had a birth|day to|day. 🎁',
     He+' in|vit|ed friends '+p.at+'.',
     cap(f.nom)+' came with a gift.',
     'On the ta|ble was the '+t.nom+'. '+t.em,
     'Ev|ery|one sang: "Hap|py birth|day!"',
     'Sud|den|ly the lights went out!',
     'When they came back... the '+t.nom+' was gone!',
     '"Oh no!" cried '+h.short+'.',
     cap(f.short)+' found ti|ny foot|prints.',
     'They led un|der the ta|ble...',
     'A lit|tle mouse sat there with crumbs! 🐭',
     '"Sor|ry, I was hun|gry!" she squeaked.',
     'The mouse got her own piece and ev|ery|one laughed.',
     'The end. 🎉'
    ],
    q:{txt:'Who hid un|der the ta|ble?',opts:[
     {em:'🐭',lbl:'a mouse',ok:true},{em:'🐸',lbl:'a frog'},{em:'🐦',lbl:'a bird'},{em:'🐹',lbl:'a ham|ster'}
    ]}
   },
   { /* 3. Silly wand */
    s:[
     cap(h.short)+' found a mag|ic wand '+p.at+'. 🪄',
     cap(f.nom)+' came by.',
     '"What is that?" asked '+f.short+'.',
     '"A mag|ic wand!" said '+h.short+'.',
     cap(He)+' waved it once...',
     'Boom! The '+t.nom+' ap|peared! '+t.em,
     cap(He)+' waved it twice...',
     'Boom! The '+t.nom+' grew as big as a house!',
     '"Wow!" said '+f.short+'.',
     cap(He)+' waved it three times...',
     'And the wand played a trick!',
     'It turned in|to a ba|na|na! 🍌',
     cap(f.short)+' ate the ba|na|na. "Yum!"',
     'The end. 🎉'
    ],
    q:{txt:'What did the wand turn in|to?',opts:[
     {em:'🍌',lbl:'a ba|na|na',ok:true},{em:'🍎',lbl:'an ap|ple'},{em:'🍋',lbl:'a lem|on'},{em:'🍐',lbl:'a pear'}
    ]}
   },
   { /* 4. Funny dream */
    s:[
     cap(h.short)+' fell a|sleep '+p.at+'. 😴',
     cap(f.nom)+' slept close by.',
     cap(He)+' had a ve|ry fun|ny dream.',
     'In the dream the '+t.nom+' could fly! '+t.em,
     'The '+t.nom+' sang a song!',
     '"La la la, tra la la!"',
     'Then it danced on a cloud!',
     'Sud|den|ly... tick|les!',
     cap(h.short)+' o|pened one eye.',
     cap(f.short)+' was tick|ling '+him+' with a feath|er! 🪶',
     '"Wake up, sleep|y head!"',
     cap(h.short)+' laughed and laughed.',
     '"What a dream!" '+he+' said.',
     'The end. 🎉'
    ],
    q:{txt:'Who tick|led '+h.short+'?',list:'F',ok:f}
   }
  ];
 }
};
