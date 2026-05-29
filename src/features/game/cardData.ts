import type { Card } from './gameTypes';

const CARDS: Card[] = [
  {
    id: 'market-boom',
    title: 'Markedsboble',
    description: 'Investoroptimisme driver alle eiendomsverdier kraftig opp.',
    polarity: 'positive',
    effect: { type: 'market_boost', pct: 25, days: 3 },
  },
  {
    id: 'tech-surge',
    title: 'Teknologiboom',
    description: 'Stor tech-satsing i området presser prisene opp.',
    polarity: 'positive',
    effect: { type: 'market_boost', pct: 15, days: 2 },
  },
  {
    id: 'market-crash',
    title: 'Børskrakk',
    description: 'Panikksalg i markedet. Alle eiendomsverdier faller.',
    polarity: 'negative',
    effect: { type: 'market_crash', pct: 20, days: 2 },
  },
  {
    id: 'correction',
    title: 'Markedskorreksjon',
    description: 'Analytikere varsler om overprisede markeder. Mild nedgang.',
    polarity: 'negative',
    effect: { type: 'market_crash', pct: 10, days: 1 },
  },
  {
    id: 'tax',
    title: 'Kommuneskatt',
    description: 'Myndighetene krever inn eiendomsskatt basert på nettoverdi.',
    polarity: 'negative',
    effect: { type: 'tax', pct: 3 },
  },
  {
    id: 'distressed',
    title: 'Nødssalg',
    description:
      'En desperat eier trenger kontanter øyeblikkelig. Neste kjøp er halv pris.',
    polarity: 'positive',
    effect: { type: 'discount', pct: 50 },
  },
  {
    id: 'rent-boom',
    title: 'Leieboom',
    description:
      'Tilflyttingsboom skaper høy etterspørsel. Leieinntektene stiger.',
    polarity: 'positive',
    effect: { type: 'rent_boost', pct: 30, days: 3 },
  },
  {
    id: 'fire',
    title: 'Branntilløp',
    description:
      'Brann herjer en av dine eiendommer og forårsaker alvorlig skade.',
    polarity: 'negative',
    effect: { type: 'fire' },
  },
  {
    id: 'dividend',
    title: 'Utbytte',
    description: 'En gammel investering gir uventet avkastning.',
    polarity: 'positive',
    effect: { type: 'cash', amount: 2_000_000 },
  },
  {
    id: 'momentum',
    title: 'Handlekraft',
    description: 'Energi og momentum bærer seg inn i neste dag.',
    polarity: 'positive',
    effect: { type: 'ap_bonus', ap: 2 },
  },
];

const DECK_COMPOSITION: [string, number][] = [
  ['market-boom', 2],
  ['tech-surge', 2],
  ['market-crash', 2],
  ['correction', 2],
  ['tax', 3],
  ['distressed', 2],
  ['rent-boom', 2],
  ['fire', 1],
  ['dividend', 2],
  ['momentum', 2],
];

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createDeck(): Card[] {
  const cardMap = new Map(CARDS.map(c => [c.id, c]));
  const deck: Card[] = [];
  for (const [id, count] of DECK_COMPOSITION) {
    const card = cardMap.get(id);
    if (card) {
      for (let i = 0; i < count; i++) deck.push(card);
    }
  }
  return shuffle(deck);
}
