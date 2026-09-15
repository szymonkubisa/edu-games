/**
 * Reading content, Polish. Extracted verbatim from the original single-file
 * game so it can be edited without touching game logic, and property-tested
 * across every hero/friend/place/thing combination.
 *
 * `|` marks a syllable boundary; it is stripped unless syllable mode is on.
 */
import { cap } from '../../games/reading/text.js';

export default {
 ui:{
  title:'📖 Czytanie na wesoło', tabStory:'📖 Historyjka', tabWords:'🔤 Słowa', tabCards:'🗣️ Czytam', tabFun:'😄 Śmieszne',
  syl:'Sy-la-by',
  lblHero:'Kto jest bohaterem?', lblFriend:'Z kim?', lblPlace:'Gdzie?', lblThing:'Jaka rzecz?',
  go:'Zaczynamy! 🚀', read:'Przeczytałam! ➜', readLast:'Przeczytałam! 🌟',
  tts:'🔊 Pomóż mi', bravo:'Brawo! ⭐', retry:'Spróbuj jeszcze raz!',
  end:s=>'Super czytanie, masz '+s+' ⭐!', again:'Nowa historyjka! 📖',
  wordsQ:'Co to jest? Wybierz słowo!',
  cardsQ:'Przeczytaj słowo na głos!', cListen:'🔊 Posłuchaj',
  cGood:'✅ Umiem!', cBad:'🤔 Jeszcze nie', cTry:'Nic nie szkodzi! 💪',
  funQ:'Przeczytaj śmieszne zdanie na głos!', fListen:'🔊 Posłuchaj',
  fGood:'✅ Przeczytałem!', fNew:'🎲 Inne zdanie',
  qHero:'Kto jest bo|ha|te|rem?', qPlace:'Gdzie to by|ło?', qThing:'Ja|ka rzecz by|ła w baj|ce?',
  sentence:(i,n)=>'Zdanie '+i+' z '+n
 },
 HEROES:[
  {em:'🐱',nom:'kot Pso|tek',short:'Pso|tek',g:'m'},
  {em:'🧚',nom:'wróż|ka Po|la',short:'Po|la',g:'f'},
  {em:'🤖',nom:'ro|bot Bzik',short:'Bzik',g:'m'},
  {em:'🐶',nom:'pie|sek Maks',short:'Maks',g:'m'},
  {em:'👑',nom:'księż|nicz|ka Zo|sia',short:'Zo|sia',g:'f'},
 ],
 FRIENDS:[
  {em:'🐲',nom:'smok Fe|lek',short:'Fe|lek',g:'m',ins:'ze smo|kiem Fel|kiem'},
  {em:'🦉',nom:'so|wa Lo|la',short:'Lo|la',g:'f',ins:'z so|wą Lo|lą'},
  {em:'🧸',nom:'miś Bo|rys',short:'Bo|rys',g:'m',ins:'z mi|siem Bo|ry|sem'},
  {em:'🐈',nom:'kot|ka Ki|ra',short:'Ki|ra',g:'f',ins:'z kot|ką Ki|rą'},
  {em:'👻',nom:'du|szek Bo|bo',short:'Bo|bo',g:'m',ins:'z dusz|kiem Bo|bo'},
 ],
 PLACES:[
  {em:'🌲',nom:'las',go:'do la|su',at:'w le|sie'},
  {em:'🏰',nom:'za|mek',go:'do zam|ku',at:'w zam|ku'},
  {em:'🚀',nom:'kos|mos',go:'w kos|mos',at:'w kos|mo|sie'},
  {em:'🏪',nom:'sklep',go:'do skle|pu',at:'w skle|pie'},
  {em:'🌊',nom:'mo|rze',go:'nad mo|rze',at:'nad mo|rzem'},
 ],
 THINGS:[
  {em:'💎',nom:'skarb',gen:'skar|bu',g:'m'},
  {em:'🍦',nom:'lo|dy',gen:'lo|dów',g:'p'},
  {em:'🎈',nom:'ba|lon',gen:'ba|lo|nu',g:'m'},
  {em:'🌸',nom:'kwia|tek',gen:'kwiat|ka',g:'m'},
  {em:'🎂',nom:'tort',gen:'tor|tu',g:'m'},
 ],
 WORDS:[
  {em:'🐱',w:'kot'},{em:'🏠',w:'dom'},{em:'🐟',w:'ry|ba'},{em:'🍦',w:'lo|dy'},
  {em:'🎈',w:'ba|lon'},{em:'🐉',w:'smok'},{em:'🦉',w:'so|wa'},{em:'🐸',w:'ża|ba'},
  {em:'🦋',w:'mo|tyl'},{em:'🧀',w:'ser'},{em:'👑',w:'ko|ro|na'},{em:'🌸',w:'kwia|tek'},
  {em:'🎂',w:'tort'},{em:'🚗',w:'au|to'},{em:'🐘',w:'słoń'},{em:'📖',w:'książ|ka'},
  {em:'⭐',w:'gwiaz|da'},{em:'❤️',w:'ser|ce'},{em:'🍎',w:'jabł|ko'},{em:'🍋',w:'cy|try|na'},
  {em:'🍌',w:'ba|nan'},{em:'⚽',w:'pił|ka'},{em:'🖍️',w:'kred|ka'},{em:'🌙',w:'księ|życ'},
 ],
 FUN:{
  subj:[
   'Zie|lo|ny smok','Gru|by kot','Śmiesz|na ża|ba','Ma|ły słoń','Ta|ń|czą|cy pies',
   'Nie|bie|ski je|dno|ro|żec','Gło|dny miś','La|ta|ją|ca so|wa','Ró|żo|wy kró|lik','Wiel|ki di|no|zaur'
  ],
  verb:[
   'tań|czy','śpie|wa','ska|cze','je lo|dy','gra na trą|bce',
   'ro|bi fi|koł|ki','pi|je sok','la|ta','śmie|je się','gwiż|dże'
  ],
  tail:[
   'na da|chu','w wan|nie','na Księ|ży|cu','pod sto|łem','w ka|pe|lu|szu',
   'na dro|dze','w kos|mo|sie','na huś|taw|ce','w og|ro|dzie','na lo|do|wi|sku'
  ]
 },
 stories(h,f,p,t){
  const hv=(m,x)=>h.g==='m'?m:x;           // bohater
  const fv=(m,x)=>f.g==='m'?m:x;           // przyjaciel
  const tv=(m,x)=>t.g==='m'?m:x;           // rzecz (m / l.mn.)
  const pv=(m,x)=>(h.g==='f'&&f.g==='f')?x:m; // oboje razem
  return [
   { /* 1. Skarb z niespodzianką */
    s:[
     'To jest '+h.nom+'.',
     cap(h.short)+' '+hv('po|szedł','po|szła')+' '+p.go+' '+f.ins+'.',
     'Ra|zem szu|ka|li '+t.gen+'.',
     pv('Zaj|rze|li','Zaj|rza|ły')+' pod ka|mień. Nic!',
     pv('Zaj|rze|li','Zaj|rza|ły')+' za drze|wo. Też nic!',
     '„Mo|że tam?" — '+fv('po|wie|dział','po|wie|dzia|ła')+' '+f.short+'.',
     'Na|gle coś błys|nę|ło w tra|wie!',
     'To '+tv('był','by|ły')+' '+t.nom+'! '+t.em,
     'Ale '+t.nom+'... '+tv('kich|nął','kich|nę|ły')+'!',
     '„A psik!"',
     'W środ|ku spa|ła ma|ła ża|ba. 🐸',
     'Ża|ba ziew|nę|ła i po|wie|dzia|ła: „Dzień do|bry!"',
     'Wszys|cy wy|buch|nę|li śmie|chem.',
     'Ko|niec. 🎉'
    ],
    q:{txt:'Kto spał w środ|ku?',opts:[
     {em:'🐸',lbl:'ża|ba',ok:true},{em:'🐭',lbl:'mysz|ka'},{em:'🦔',lbl:'jeż'},{em:'🐌',lbl:'śli|mak'}
    ]}
   },
   { /* 2. Urodziny i myszka */
    s:[
     cap(h.nom)+' '+hv('miał','mia|ła')+' dziś u|ro|dzi|ny. 🎁',
     hv('Za|pro|sił','Za|pro|si|ła')+' go|ści '+p.at+'.',
     fv('Przy|szedł','Przy|szła')+' '+f.nom+' z pre|zen|tem.',
     'Na sto|le '+tv('cze|kał','cze|ka|ły')+' '+t.nom+'. '+t.em,
     'Wszys|cy śpie|wa|li: „Sto lat!"',
     'Wtem zgas|ło świat|ło!',
     'Gdy za|błys|ło... '+t.nom+' '+tv('znik|nął','znik|nę|ły')+'!',
     '„O nie!" — '+hv('krzyk|nął','krzyk|nę|ła')+' '+h.short+'.',
     cap(f.short)+' '+fv('zna|lazł','zna|la|zła')+' ma|łe śla|dy.',
     'Pro|wa|dzi|ły pod stół...',
     'Tam sie|dzia|ła mysz|ka z o|krusz|ka|mi! 🐭',
     '„Prze|pra|szam, by|łam głod|na!" — pis|nę|ła.',
     'Mysz|ka do|sta|ła swój ka|wa|łek i wszys|cy się śmia|li.',
     'Ko|niec. 🎉'
    ],
    q:{txt:'Kto scho|wał się pod sto|łem?',opts:[
     {em:'🐭',lbl:'mysz|ka',ok:true},{em:'🐸',lbl:'ża|ba'},{em:'🐦',lbl:'pta|szek'},{em:'🐹',lbl:'chom|ik'}
    ]}
   },
   { /* 3. Psotna różdżka */
    s:[
     cap(h.nom)+' '+hv('zna|lazł','zna|la|zła')+' różdż|kę '+p.at+'. 🪄',
     fv('Przy|szedł','Przy|szła')+' '+f.nom+'.',
     '„Co to?" — '+fv('za|py|tał','za|py|ta|ła')+' '+f.short+'.',
     '„Ma|gicz|na różdż|ka!" — '+hv('od|po|wie|dział','od|po|wie|dzia|ła')+' '+h.short+'.',
     cap(h.short)+' '+hv('mach|nął','mach|nę|ła')+' nią raz...',
     'Bum! '+tv('Po|ja|wił się','Po|ja|wi|ły się')+' '+t.nom+'! '+t.em,
     hv('Mach|nął','Mach|nę|ła')+' dru|gi raz...',
     'Bum! '+cap(t.nom)+' '+tv('u|rósł','u|ro|sły')+' jak dom!',
     '„O|jej!" — '+fv('pis|nął','pis|nę|ła')+' '+f.short+'.',
     hv('Mach|nął','Mach|nę|ła')+' trze|ci raz...',
     'I różdż|ka zro|bi|ła psi|kus!',
     'Za|mie|ni|ła się w ba|na|na! 🍌',
     cap(f.short)+' '+fv('zjadł','zja|dła')+' ba|na|na. „Mniam!"',
     'Ko|niec. 🎉'
    ],
    q:{txt:'W co za|mie|ni|ła się różdż|ka?',opts:[
     {em:'🍌',lbl:'w ba|na|na',ok:true},{em:'🍎',lbl:'w jabł|ko'},{em:'🍋',lbl:'w cy|try|nę'},{em:'🍐',lbl:'w gru|szkę'}
    ]}
   },
   { /* 4. Śmieszny sen */
    s:[
     cap(h.nom)+' '+hv('za|snął','za|snę|ła')+' '+p.at+'. 😴',
     'O|bok '+fv('spał','spa|ła')+' '+f.nom+'.',
     cap(h.short)+' '+hv('miał','mia|ła')+' bar|dzo śmiesz|ny sen.',
     'We śnie '+tv('la|tał','la|ta|ły')+' '+t.nom+'! '+t.em,
     cap(t.nom)+' '+tv('śpie|wał','śpie|wa|ły')+' pio|sen|kę!',
     '„La la la, tra la la!"',
     'Po|tem '+tv('tań|czył','tań|czy|ły')+' na chmu|rze!',
     'Na|gle... łas|kot|ki!',
     cap(h.short)+' '+hv('o|two|rzył','o|two|rzy|ła')+' jed|no o|ko.',
     'To '+f.short+' '+fv('łas|ko|tał','łas|ko|ta|ła')+' '+(h.g==='m'?'go':'ją')+' piór|kiem! 🪶',
     '„Po|bud|ka, śpio|chu!"',
     cap(h.short)+' '+hv('śmiał','śmia|ła')+' się bar|dzo głoś|no.',
     '„Śni|ły mi się cu|da!" — '+hv('po|wie|dział','po|wie|dzia|ła')+' '+h.short+'.',
     'Ko|niec. 🎉'
    ],
    q:{txt:'Kto łas|ko|tał '+h.short+' piór|kiem?',list:'F',ok:f}
   }
  ];
 }
};
