/* Grease the Groove — suivi callisthénie
 * Appli 100 % locale : les données restent dans le navigateur (localStorage).
 */
'use strict';

const STORAGE_KEY = 'gtg-data-v1';
const APP_VERSION = '0.8.1';

const DAYS = [
  ['lun', 'Lundi'], ['mar', 'Mardi'], ['mer', 'Mercredi'], ['jeu', 'Jeudi'],
  ['ven', 'Vendredi'], ['sam', 'Samedi'], ['dim', 'Dimanche'],
];

const MEASURES = [
  ['poids', 'Poids', 'kg'],
  ['grasse', 'Masse grasse', '%'],
  ['bras', 'Tour de bras', 'cm'],
  ['poitrine', 'Tour de poitrine', 'cm'],
  ['taille', 'Tour de taille', 'cm'],
  ['hanches', 'Tour de hanches', 'cm'],
  ['cuisse', 'Tour de cuisse', 'cm'],
  ['mollet', 'Tour de mollet', 'cm'],
];

// Icônes (tracés lucide, ISC)
const ICONS = {
  dumbbell: '<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
  sliders: '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  minus: '<path d="M5 12h14"/>',
  footprints: '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// Niveaux des tractions : livre « Mon programme de callisthénie », dictés par Arthur.
// Les autres exercices ont des niveaux génériques, à remplacer par ceux du livre.
function lvl(name, target, extra = {}) { return { name, sets: 1, target, times: 1, ...extra }; }
function bookTractions() {
  return [
    lvl('Tractions australiennes', 15, { cond: 'Corps presque à l\'horizontale par rapport au support' }),
    lvl('Suspension', 30, { unit: 'sec', bis: true, cond: 'Tenue confortable, sans glisser' }),
    lvl('Tractions avec élastique', 6, { optional: true, cond: 'Tu sens que tu maîtrises le mouvement. Quelques semaines au plus, sans t\'y attarder' }),
    lvl('Tractions négatives', 6, { cond: 'Chaque descente dure au moins 10 s, et tu sais stopper la descente 2 à 3 s en tout point' }),
    lvl('Tractions', 10, { cond: 'Amplitude complète' }),
  ];
}
// Pour les exercices unilatéraux, `perSide` : l'objectif vaut pour chaque jambe (une valeur à gauche, une à droite).
const side = (name, target, extra = {}) => lvl(name, target, { sets: 2, perSide: true, ...extra });
function bookExercises() {
  return {
    tractions: { name: 'Tractions', unit: 'reps', levels: bookTractions() },
    pompes: { name: 'Pompes', unit: 'reps', levels: [
      lvl('Pompes mains surélevées', 20, {
        cond: 'Support bas, corps presque à l\'horizontale',
        tip: 'Plus les mains sont hautes, plus c\'est facile (au maximum, debout contre un mur). Pour valider, vise un support d\'environ 30 à 40 cm, comme une marche ou un banc bas (repère proposé par Claude).' }),
      lvl('Pompes à genoux', 20, { cond: 'Amplitude complète' }),
      lvl('Pompes négatives', 12, { cond: 'Amplitude complète, et tu sais stopper la descente 2 à 3 s n\'importe où' }),
      lvl('Pompes', 20, { cond: 'Amplitude complète' }),
    ] },
    pistol: { name: 'Pistol squat', unit: 'reps', levels: [
      lvl('Demi-squats', 20),
      lvl('Squats profonds assistés', 20, { bis: true, optional: true,
        tip: 'Facultatif : aide-toi d\'une barre à deux mains, puis à une main, avant les squats profonds sans aide.' }),
      lvl('Squats profonds', 20),
      side('Pistol squats assistés', 10, {
        cond: 'Descente active, sans te laisser tomber sur le support',
        tip: 'Progression de l\'aide : chaise ou banc, puis barre à deux mains, puis une main, puis sans rien. Note l\'aide utilisée dans la note de la séance.' }),
      side('Pistol squats', 6),
    ] },
    gainage: { name: 'Gainage', unit: 'sec', levels: [
      lvl('Gainage à genoux ou pieds écartés', 30),
      lvl('Gainage', 60),
    ] },
    dips: { name: 'Dips', unit: 'reps', levels: [
      lvl('Dips sur support, jambes pliées', 12, { tip: 'Support : barre basse, chaise, muret…' }),
      lvl('Dips sur support, jambes tendues', 12),
      lvl('Dips négatifs', 8),
      lvl('Dips', 12),
    ] },
    lsit: { name: 'L-sit', unit: 'sec', levels: [
      lvl('Se soulever sur un support', 6, { tip: 'Sur un banc, une chaise ou autre support. Objectif du livre : 6 à 8 secondes.' }),
      lvl('Se soulever au sol', 6, { tip: 'Objectif du livre : 6 à 8 secondes.' }),
      lvl('Relevés de jambes', 10, { unit: 'reps', bis: true,
        tip: 'Pour gagner en force de compression. Assis, mains de part et d\'autre du buste, lève les jambes tendues. Une fois les 10 réussies, avance les mains, puis encore, jusqu\'aux genoux et au-delà. Si la souplesse manque, fais l\'étirement du niveau 3.' }),
      lvl('Se soulever jambes dépliées', 5, {
        tip: 'Étirement : assis jambes tendues, essaie de toucher tes pieds. À ton maximum, contracte jambes, abdos, fessiers et poings 3 s, relâche et expire, puis avance les mains du peu que le relâchement t\'offre. Recommence 3 ou 4 fois d\'affilée, jusqu\'à ne plus rien gagner.' }),
      lvl('L-sit', 10),
    ] },
  };
}
// Option d'un niveau : ce qui change la difficulté sans changer d'exercice (élastique, hauteur, aide).
// { label, choices: [...] } pour une liste, ou { label, unit } pour une valeur libre.
const LEVEL_OPTS = {
  'Tractions australiennes': { label: 'Hauteur de la barre', unit: 'cm' },
  'Tractions avec élastique': { label: 'Élastique', choices: ['30 kg', '20 kg', '10 kg'] },
  'Pompes mains surélevées': { label: 'Hauteur du support', unit: 'cm' },
  'Squats profonds assistés': { label: 'Aide', choices: ['Barre à 2 mains', 'Barre à 1 main'] },
  'Pistol squats assistés': { label: 'Aide', choices: ['Chaise ou banc', 'Barre à 2 mains', 'Barre à 1 main'] },
  'Dips sur support, jambes pliées': { label: 'Support', choices: ['Chaise', 'Banc', 'Barre basse', 'Muret'] },
  // Appui des mains : poignets à plat ou droits (poignées de la chaise romaine), pour des tests comparables.
  'Pompes à genoux': { label: 'Appui', choices: ['Mains à plat', 'Poings', 'Poignées'] },
  'Pompes négatives': { label: 'Appui', choices: ['Mains à plat', 'Poings', 'Poignées'] },
  'Pompes': { label: 'Appui', choices: ['Mains à plat', 'Poings', 'Poignées'] },
  'Se soulever sur un support': { label: 'Appui', choices: ['Mains à plat', 'Poings', 'Poignées'] },
  'Se soulever au sol': { label: 'Appui', choices: ['Mains à plat', 'Poings', 'Poignées'] },
};
function addDefaultOpts(ex) {
  (ex.levels || []).forEach(l => { if (!l.opt && !l.optSet && LEVEL_OPTS[l.name]) l.opt = JSON.parse(JSON.stringify(LEVEL_OPTS[l.name])); });
}
function optField(l, id, val = '') {
  if (!l || !l.opt) return '';
  const o = l.opt;
  const ch = o.choices && o.choices.length ? o.choices : null;
  return `<label class="field"><span>${esc(o.label)}${o.unit ? ` (${esc(o.unit)})` : ''}</span>${ch
    ? `<select data-opt id="${id}"><option value="">Non précisé</option>${ch.map(c => `<option ${c === val ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>`
    : `<input data-opt id="${id}" type="text" inputmode="${o.unit ? 'decimal' : 'text'}" value="${esc(val)}" placeholder="${o.unit ? 'Ex. 40' : 'Facultatif'}">`}</label>`;
}
const optText = (l, v) => (v ? `${l && l.opt ? l.opt.label.toLowerCase() + ' ' : ''}${v}${l && l.opt && l.opt.unit ? ' ' + l.opt.unit : ''}` : '');
function lastOpt(ex, i) {
  const list = atLevel(ex, i).filter(x => x.opt);
  return list.length ? list[list.length - 1].opt : '';
}
function defaultExercises() {
  const book = bookExercises();
  return ['tractions', 'pompes', 'pistol', 'gainage', 'dips', 'lsit']
    .map(id => ({ id, ...book[id], current: 0, fromBook: true }))
    .map(ex => { addDefaultOpts(ex); return ex; });
}

function defaultState() {
  return {
    version: 1,
    exercises: defaultExercises(),
    sessions: [],          // { id, date, exId, level, sets: [n], note }
    profile: { taille: '', measurements: [] }, // measurements: { id, date, poids, bras, ... }
    schedule: { lun: 20, mar: 0, mer: 20, jeu: 0, ven: 20, sam: 30, dim: 0 },
    settings: { levelsReviewed: false },
    gtg: defaultGtg(),
    walks: [],             // { id, date, name, distance (m), duration (s), gain, loss, splits, points }
    days: {},              // 'AAAA-MM-JJ' -> { date, type?, done: { exId: { sets, reps, level } } }
  };
}
function defaultGtg() {
  return {
    rhythm: 120,           // minutes entre deux séries les jours à la maison
    split: false,          // false : les 6 exercices chaque jour ; true : 3 + 3 en alternance
    week: { lun: 'maison', mar: 'agence', mer: 'maison', jeu: 'agence', ven: 'maison', sam: 'chargee', dim: 'chargee' },
    sizes: {},             // taille de série réglée à la main : exId -> { i, reps, testId }
    slots: { agence: 2, chargee: 2 }, // créneaux de séries ces jours-là
    film: false,           // rappel « filme-toi » (désactivé par défaut)
    startedAt: null,
  };
}

// ---------- Stockage ----------
// Deux modes :
//  - « db » quand l'appli tourne en artefact claude.ai : données synchronisées entre appareils
//    (doc gtg/config + une collection sessions + une collection measures) ;
//  - « local » sinon (fichier ouvert dans un navigateur) : tout dans localStorage.
let state = loadLocal();
function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* stockage indisponible */ }
  return defaultState();
}
function migrate(s) {
  const d = defaultState();
  // Remplace les anciens niveaux génériques par ceux du livre, s'ils n'ont pas servi.
  const book = bookExercises();
  (Array.isArray(s.exercises) ? s.exercises : []).forEach(ex => {
    if (ex.fromBook || !book[ex.id] || (s.sessions || []).some(x => x.exId === ex.id)) return;
    Object.assign(ex, { levels: book[ex.id].levels, current: 0, fromBook: true });
  });
  (s.exercises || []).forEach(ex => { if (ex.fromBook) addDefaultOpts(ex); });
  // Précision d'Arthur (L-sit niveau 1 : sur un support).
  const ls = (s.exercises || []).find(e => e.id === 'lsit');
  if (ls && ls.fromBook && ls.levels[0] && ls.levels[0].name === 'Se soulever') {
    Object.assign(ls.levels[0], { name: 'Se soulever sur un support', tip: 'Sur un banc, une chaise ou autre support. Objectif du livre : 6 à 8 secondes.' });
  }
  return {
    ...d, ...s,
    profile: { ...d.profile, ...(s.profile || {}), measurements: Array.isArray(s.profile && s.profile.measurements) ? s.profile.measurements : [] },
    schedule: { ...d.schedule, ...(s.schedule || {}) },
    settings: { ...d.settings, ...(s.settings || {}) },
    gtg: { ...d.gtg, ...(s.gtg || {}), week: { ...d.gtg.week, ...((s.gtg && s.gtg.week) || {}) }, sizes: { ...((s.gtg && s.gtg.sizes) || {}) }, slots: { ...d.gtg.slots, ...((s.gtg && s.gtg.slots) || {}) } },
    days: s.days && typeof s.days === 'object' ? s.days : {},
    walks: Array.isArray(s.walks) ? s.walks : [],
    exercises: Array.isArray(s.exercises) && s.exercises.length ? s.exercises : d.exercises,
    sessions: Array.isArray(s.sessions) ? s.sessions : [],
  };
}
const clone = o => JSON.parse(JSON.stringify(o));
const configOf = st => ({ version: st.version, exercises: st.exercises, schedule: st.schedule, taille: st.profile.taille, settings: st.settings, gtg: st.gtg });

const persist = {
  mode: 'local',
  db: null,
  ready: false,
  queue: Promise.resolve(),
  // Les écritures s'enchaînent une par une, pour ne jamais écrire deux fois le même document en parallèle.
  run(fn) {
    this.queue = this.queue.then(fn).catch(e => {
      console.warn('Écriture refusée', e);
      toast(e && e.code === 'quota_exceeded' ? 'Stockage plein : supprime d\'anciennes séances' : `Enregistrement impossible pour le moment${e && e.code ? ` (${e.code})` : ''}`);
    });
    return this.queue;
  },
  saveLocal() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignoré */ }
  },
  config() {
    if (this.mode !== 'db') return this.saveLocal();
    const body = clone(configOf(state));
    return this.run(() => this.db.doc('gtg/config').set(body));
  },
  putSession(s) {
    if (this.mode !== 'db') return this.saveLocal();
    const body = clone(s);
    return this.run(() => this.db.doc('sessions/' + s.id).set(body));
  },
  deleteSession(id) {
    if (this.mode !== 'db') return this.saveLocal();
    return this.run(() => this.db.doc('sessions/' + id).delete());
  },
  putMeasure(m) {
    if (this.mode !== 'db') return this.saveLocal();
    const body = clone(m);
    return this.run(() => this.db.doc('measures/' + m.id).set(body));
  },
  deleteMeasure(id) {
    if (this.mode !== 'db') return this.saveLocal();
    return this.run(() => this.db.doc('measures/' + id).delete());
  },
  putWalk(w) {
    if (this.mode !== 'db') return this.saveLocal();
    const body = walkBody(w);
    return this.run(() => this.db.doc('walks/' + w.id).set(body));
  },
  deleteWalk(id) {
    if (this.mode !== 'db') return this.saveLocal();
    return this.run(() => this.db.doc('walks/' + id).delete());
  },
  putDay(d) {
    if (this.mode !== 'db') return this.saveLocal();
    const body = clone(d);
    return this.run(() => this.db.doc('days/' + d.date).set(body));
  },
  // Remplace toutes les données (import d'une sauvegarde, remise à zéro).
  replaceAll(next) {
    if (this.mode !== 'db') { state = next; return this.saveLocal(); }
    const db = this.db;
    return this.run(async () => {
      for (const name of ['sessions', 'measures', 'days', 'walks']) {
        const snap = await db.collection(name).get();
        for (const d of snap.docs) await db.doc(name + '/' + d.id).delete();
      }
      await db.doc('gtg/config').set(clone(configOf(next)));
      for (const s of next.sessions) await db.doc('sessions/' + s.id).set(clone(s));
      for (const m of next.profile.measurements) await db.doc('measures/' + m.id).set(clone(m));
      for (const d of Object.values(next.days || {})) await db.doc('days/' + d.date).set(clone(d));
      for (const w of next.walks || []) await db.doc('walks/' + w.id).set(walkBody(w));
    });
  },
};
// Raccourci pour les changements de réglages (niveaux, plan, taille…).
const save = () => persist.config();

// Re-rendu après une mise à jour venue d'un autre appareil, sans casser une saisie en cours.
let lastKey = '';
let pendingRender = false;
function dataKey() { return JSON.stringify([state.exercises, state.schedule, state.profile, state.settings, state.sessions, state.gtg, state.days, state.walks]); }
function remoteChanged() {
  const k = dataKey();
  if (k === lastKey) return;
  const el = document.activeElement;
  const typing = el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
  if (typing || $('#modal').open) { pendingRender = true; return; }
  render();
}
document.addEventListener('focusout', () => setTimeout(() => {
  if (!pendingRender) return;
  const el = document.activeElement;
  if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
  if ($('#modal').open) return;
  pendingRender = false; render();
}, 0));

async function connectStore() {
  const c = window.claude;
  if (!c || typeof c.use !== 'function') { persist.ready = true; return; }
  const db = await c.use('db').catch(() => null);
  if (!db) { persist.ready = true; render(); toast('Données gardées sur cet appareil seulement'); return; }
  persist.db = db;
  persist.mode = 'db';
  state = defaultState();
  const got = { config: false, sessions: false, measures: false, days: false, walks: false };
  const settle = () => {
    if (!persist.ready && got.config && got.sessions && got.measures && got.days && got.walks) { persist.ready = true; render(); return; }
    if (persist.ready) remoteChanged();
  };
  const fail = e => { console.warn('Synchronisation interrompue', e); toast('Synchronisation interrompue, recharge la page'); };
  db.doc('gtg/config').onSnapshot(snap => {
    if (snap.exists) {
      const d = clone(snap.data());
      const m = migrate({ ...d, profile: { taille: d.taille || '' } });
      state.version = m.version; state.exercises = m.exercises; state.schedule = m.schedule;
      state.settings = m.settings; state.profile.taille = m.profile.taille; state.gtg = m.gtg;
    }
    got.config = true; settle();
  }, fail);
  db.collection('sessions').onSnapshot(q => {
    state.sessions = q.docs.map(d => clone(d.data()));
    got.sessions = true; settle();
  }, fail);
  db.collection('measures').onSnapshot(q => {
    state.profile.measurements = q.docs.map(d => clone(d.data()));
    got.measures = true; settle();
  }, fail);
  db.collection('days').onSnapshot(q => {
    state.days = Object.fromEntries(q.docs.map(d => { const x = clone(d.data()); return [x.date, x]; }));
    got.days = true; settle();
  }, fail);
  db.collection('walks').onSnapshot(q => {
    state.walks = q.docs.map(d => walkFromBody(clone(d.data())));
    got.walks = true; settle();
  }, fail);
}


// ---------- Utilitaires ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}
const fr = v => String(v).replace('.', ',');
const unitLabel = u => (u === 'sec' ? 's' : 'rép.');
const unitLong = u => (u === 'sec' ? 'secondes' : 'répétitions');
function toast(msg) {
  $$('.toast').forEach(x => x.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}
const exById = id => state.exercises.find(e => e.id === id);
const lvUnit = (ex, l) => (l && l.unit) || ex.unit;
const setsText = (l, unit) => l.perSide ? `${l.target} ${unitLabel(unit)} par jambe`
  : `${l.sets > 1 ? `${l.sets} × ` : ''}${l.target} ${unitLabel(unit)}`;
function criterionText(l, unit) {
  return `${setsText(l, unit)}${l.times > 1 ? `, ${l.times} séances d'affilée` : ''}`;
}

// ---------- Étapes ----------
// Une étape = un niveau suivi de ses niveaux « bis » : tous doivent être validés pour avancer.
function stepRange(ex, i) {
  let a = i, b = i;
  while (a > 0 && ex.levels[a] && ex.levels[a].bis) a--;
  while (ex.levels[b + 1] && ex.levels[b + 1].bis) b++;
  return [a, b];
}
const stepIdx = (ex, a) => { const [s, e] = stepRange(ex, a); return Array.from({ length: e - s + 1 }, (_, k) => s + k); };
const stepCount = ex => ex.levels.filter((l, i) => i === 0 || !l.bis).length;
const stepNo = (ex, i) => ex.levels.slice(0, i + 1).filter((l, k) => k === 0 || !l.bis).length;
const levelLabel = (ex, i) => (i > 0 && ex.levels[i].bis ? `${stepNo(ex, i)}bis` : String(stepNo(ex, i)));
function stepStarts(ex) { return ex.levels.map((l, i) => i).filter(i => i === 0 || !ex.levels[i].bis); }

// ---------- Feu vert ----------
// Une séance valide un niveau si elle contient au moins `sets` séries ≥ `target`
// et, si le niveau a une condition de forme, si « forme respectée » est cochée.
// Un niveau est validé quand ses `times` dernières séances sont valides (1 par défaut : une réussite suffit).
function sessionValid(sess, l) {
  if (l.cond && sess.formOk !== true) return false;
  return sess.sets.filter(v => v >= l.target).length >= l.sets;
}
function atLevel(ex, i = ex.current) {
  return state.sessions
    .filter(s => s.exId === ex.id && s.level === i)
    .sort((a, b) => (a.date + a.id).localeCompare(b.date + b.id));
}
function levelState(ex, i) {
  const l = ex.levels[i];
  const list = atLevel(ex, i);
  const need = Math.max(1, l.times || 1);
  let streak = 0;
  for (let k = list.length - 1; k >= 0 && sessionValid(list[k], l); k--) streak++;
  if (streak >= need) return 'go';
  if (!list.length) return 'off';
  return streak ? 'wait' : 'stop';
}
// state : off (aucune séance), stop (critère pas encore atteint), wait (en partie validé), go (feu vert)
function levelStatus(ex) {
  if (!ex.levels[ex.current]) return { state: 'off', label: 'Aucun niveau' };
  const all = stepIdx(ex, ex.current);
  const idx = all.filter(i => !(ex.levels[i].bis && ex.levels[i].optional)); // un bis facultatif n'est pas exigé
  const states = idx.map(i => levelState(ex, i));
  const v = states.filter(x => x === 'go').length;
  const n = idx.length;
  const isLast = all[all.length - 1] >= ex.levels.length - 1;
  if (v === n) {
    return isLast
      ? { state: 'go', label: 'Dernier niveau maîtrisé', done: true }
      : { state: 'go', label: 'Feu vert pour le niveau suivant', green: true };
  }
  if (states.every(x => x === 'off')) return { state: 'off', label: 'Pas encore de séance à ce niveau' };
  if (v || states.includes('wait')) return { state: 'wait', label: n > 1 ? `${v} exercice${v > 1 ? 's' : ''} validé${v > 1 ? 's' : ''} sur ${n}` : 'En cours de validation' };
  return { state: 'stop', label: 'Critère pas encore atteint' };
}
const signal = (st, lg = false) =>
  `<span class="signal${lg ? ' lg' : ''}" data-state="${st.state}" role="img" aria-label="${esc(st.label)}"><i></i><i></i><i></i></span>`;
const stateLabel = { go: 'Validé', wait: 'En cours', stop: 'Pas encore atteint', off: 'À faire' };

// ---------- Navigation ----------
let route = { tab: 'exercices', view: null, id: null };
function go(tab, view = null, id = null) {
  route = { tab, view, id };
  render();
  window.scrollTo(0, 0);
}
$$('.tabbar button').forEach(b => {
  b.insertAdjacentHTML('afterbegin', icon(b.dataset.icon));
  b.addEventListener('click', () => { walkView = null; planDate = null; go(b.dataset.tab); });
});

function setTitle(text, backTo) {
  const bar = $('.topbar');
  bar.innerHTML = (backTo ? `<button class="back" id="back" aria-label="Retour">${icon('chevronLeft')}</button>` : '') +
    `<h1 id="view-title">${esc(text)}</h1>`;
  if (backTo) $('#back').onclick = backTo;
}

function render() {
  $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === route.tab));
  const main = $('#view');
  if (!persist.ready) {
    setTitle('Grease the Groove');
    main.innerHTML = `<p class="empty">Chargement de tes données…</p>`;
    return;
  }
  lastKey = dataKey();
  pendingRender = false;
  if (route.tab === 'exercices' && route.view === 'ex') return renderExercise(main, route.id);
  if (route.tab === 'exercices') return renderExercises(main);
  if (route.tab === 'plan') return renderPlan(main);
  if (route.tab === 'marche') return renderWalks(main);
  if (route.tab === 'profil') return renderProfile(main);
  if (route.tab === 'reglages') return renderSettings(main);
}

// ---------- Vue : liste des exercices ----------
function renderExercises(main) {
  setTitle('Exercices');
  const greens = state.exercises.filter(e => levelStatus(e).green).length;
  const toReview = state.exercises.filter(e => !e.fromBook).map(e => e.name);
  let html = '';
  if (!state.settings.levelsReviewed && toReview.length) {
    html += `<div class="notice">
      <p><strong>Niveaux à reprendre du livre.</strong> ${esc(toReview.join(', '))} : niveaux génériques pour l'instant.
      Remplace-les depuis la fiche de l'exercice, avec « Modifier ».</p>
      <div><button class="btn sm" id="dismiss-levels">Masquer</button></div>
    </div>`;
  }
  html += `<section>
    <h2 class="section-title"><span>Les six bases</span><span class="num">${greens ? `${greens} feu${greens > 1 ? 'x' : ''} vert${greens > 1 ? 's' : ''}` : ''}</span></h2>
    <div class="panel list">${state.exercises.map(ex => {
      const st = levelStatus(ex);
      const idx = ex.levels[ex.current] ? stepIdx(ex, ex.current) : [];
      const starts = stepStarts(ex);
      const cur = starts.indexOf(idx[0]);
      return `<a class="ex-row" href="#" data-ex="${esc(ex.id)}">
        ${signal(st)}
        <div class="grow">
          <div class="row" style="gap:8px;align-items:baseline">
            <span class="name grow">${esc(ex.name)}</span>
            <span class="num small muted">N${cur + 1}/${starts.length}</span>
          </div>
          <div class="small secondary">${idx.map(i => `${esc(ex.levels[i].name)} · <span class="num">${esc(setsText(ex.levels[i], lvUnit(ex, ex.levels[i])))}</span>`).join('<br>') || '—'}</div>
          <div class="rungs" aria-hidden="true">${starts.map((_, k) =>
            `<span class="${k < cur || (k === cur && st.done) ? 'done' : k === cur ? 'current' + (st.green ? ' go' : '') : ''}"></span>`).join('')}</div>
        </div>
        ${icon('chevronRight', 'chev')}
      </a>`;
    }).join('')}</div>
  </section>`;
  main.innerHTML = html;
  const d = $('#dismiss-levels');
  if (d) d.onclick = () => { state.settings.levelsReviewed = true; save(); render(); };
  $$('.ex-row', main).forEach(c => c.onclick = e => { e.preventDefault(); go('exercices', 'ex', c.dataset.ex); });
}

// ---------- Vue : fiche d'un exercice ----------
const logChoice = {}; // niveau choisi dans le formulaire quand l'étape en compte plusieurs
function renderExercise(main, id) {
  const ex = exById(id);
  if (!ex) return go('exercices');
  setTitle(ex.name, () => go('exercices'));
  const hasLevel = !!ex.levels[ex.current];
  const st = levelStatus(ex);
  const idx = hasLevel ? stepIdx(ex, ex.current) : [];
  const base = ex.levels[idx[0]];
  const nextI = hasLevel ? idx[idx.length - 1] + 1 : -1;
  const next = ex.levels[nextI];
  const sessions = state.sessions.filter(s => s.exId === ex.id)
    .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  if (!idx.includes(logChoice[ex.id])) logChoice[ex.id] = idx.find(i => levelState(ex, i) !== 'go') ?? idx[0];
  const selI = logChoice[ex.id];
  const sel = ex.levels[selI];
  const selU = sel ? lvUnit(ex, sel) : ex.unit;
  const nSets = sel ? Math.max(sel.sets, 1) : 1;

  let html = `<div class="level-head">
    <div class="small muted num">Niveau ${hasLevel ? stepNo(ex, idx[0]) : 0} sur ${stepCount(ex)}${base && base.optional ? ' · optionnel' : ''}</div>
    <h2>${hasLevel ? idx.map(i => esc(ex.levels[i].name)).join(' et ') : 'Aucun niveau défini'}</h2>
  </div>`;

  if (hasLevel) {
    html += `<div class="panel" style="display:grid;gap:16px">
      <div class="status${st.state === 'go' ? ' go' : ''}">${signal(st, true)}<div class="grow">
        <div style="font-weight:500">${esc(st.label)}</div>
        ${st.green ? `<div class="small secondary">Prochain niveau : ${esc(next.name)}</div>` : ''}
        ${st.done ? `<div class="small secondary">Ajoute un niveau avec « Modifier » pour continuer.</div>` : ''}
        ${!st.green && !st.done ? `<div class="small secondary">${idx.length > 1 ? 'Valide chacun des exercices ci-dessous, une fois suffit.' : 'Réussis le critère une fois pour obtenir le feu vert.'}</div>` : ''}
      </div></div>
      <div class="criteria">${idx.map(i => {
        const l = ex.levels[i]; const ls = levelState(ex, i);
        return `<div class="crit"><div class="row" style="gap:8px;align-items:baseline">
            <span class="grow" style="font-weight:500">${idx.length > 1 ? `<span class="num muted">${levelLabel(ex, i)}</span> ` : ''}${esc(l.name)}${l.optional ? ' <span class="small muted" style="font-weight:400">· facultatif</span>' : ''}</span>
            <span class="small ${ls === 'go' ? 'ok' : 'muted'}">${stateLabel[ls]}</span></div>
          <div class="small secondary"><span class="num">${esc(criterionText(l, lvUnit(ex, l)))}</span>${l.cond ? ` · ${esc(l.cond)}` : ''}</div>
          ${l.tip ? `<div class="small muted">${esc(l.tip)}</div>` : ''}</div>`;
      }).join('')}</div>
      ${st.green ? `<button class="btn go block" id="level-up">Passer à ${esc(next.name)}</button>` : ''}
      ${base.optional && !st.green && next ? `<button class="btn block" id="skip-level">Sauter ce niveau optionnel</button>` : ''}
    </div>`;
  }

  html += `<section>
    <h2 class="section-title">Noter un test de max</h2>
    <form class="panel form" id="log-form">
      ${idx.length > 1 ? `<div class="field"><span>Exercice</span><div class="seg" role="radiogroup">${idx.map(i =>
        `<button type="button" role="radio" aria-checked="${i === selI}" class="${i === selI ? 'on' : ''}" data-pick="${i}">${esc(ex.levels[i].name)}</button>`).join('')}</div></div>` : ''}
      <div class="field"><span>${sel && sel.perSide ? 'Résultat par jambe' : nSets > 1 ? 'Séries' : 'Résultat'} en ${unitLong(selU)}</span>
        <div class="sets" id="sets">${Array.from({ length: nSets }, (_, i) => {
          const lab = sel && sel.perSide ? (i % 2 ? 'Droite' : 'Gauche') : nSets > 1 ? String(i + 1) : '';
          return `<input type="number" inputmode="numeric" min="0" step="1" placeholder="${lab}" aria-label="${lab || 'Résultat'}" id="set-${i}">`;
        }).join('')}
          <button type="button" class="btn" id="add-set" aria-label="Ajouter une série">${icon('plus')}</button>
        </div>
      </div>
      <div class="grid2">
        <label class="field"><span>Date</span><input type="date" name="date" id="log-date" value="${today()}" required></label>
        <label class="field"><span>Note</span><input type="text" name="note" id="log-note" placeholder="Facultatif"></label>
      </div>
      ${optField(sel, 'log-opt', sel ? lastOpt(ex, selI) : '')}
      ${sel && sel.cond ? `<label class="check"><input type="checkbox" name="formOk" id="log-form-ok">
        <span><span style="font-weight:500">Forme respectée</span><span class="small secondary" style="display:block">${esc(sel.cond)}</span></span></label>` : ''}
      <button class="btn primary block" type="submit" ${sel ? '' : 'disabled'}>Enregistrer</button>
    </form>
  </section>`;

  html += `<section>
    <h2 class="section-title">Progression au niveau actuel</h2>
    ${idx.length ? idx.map(i => `<div class="panel">${idx.length > 1 ? `<div class="small secondary" style="margin-bottom:8px">${esc(ex.levels[i].name)}</div>` : ''}${chartForLevel(ex, i)}</div>`).join('') : ''}
  </section>`;

  html += `<section>
    <h2 class="section-title"><span>Niveaux</span><button class="btn sm" id="edit-levels">Modifier</button></h2>
    <div class="panel"><ol class="ladder">${ex.levels.map((lv, i) => {
      const done = i < idx[0] || (idx.includes(i) && levelState(ex, i) === 'go' && st.done);
      const current = idx.includes(i);
      const okHere = current && levelState(ex, i) === 'go';
      return `<li class="${done ? 'done' : current ? 'current' + (okHere ? ' go' : '') : ''}${lv.bis ? ' bis' : ''}">
        <span class="rung">${done || okHere ? icon('check') : levelLabel(ex, i)}</span>
        <div class="grow"><div class="lname">${esc(lv.name)}${lv.optional ? ' <span class="small muted">· optionnel</span>' : ''}${lv.bis ? ` <span class="small muted">· avec le niveau ${stepNo(ex, i)}</span>` : ''}</div>
          <div class="small muted num">${esc(criterionText(lv, lvUnit(ex, lv)))}</div>
          ${lv.cond ? `<div class="small muted">${esc(lv.cond)}</div>` : ''}</div>
      </li>`;
    }).join('')}</ol></div>
  </section>`;

  html += `<section>
    <h2 class="section-title">Historique</h2>
    <div class="panel">${sessions.length ? `<div class="table-wrap"><table class="hist">
      <thead><tr><th>Date</th><th>Niv.</th><th>Résultat</th><th><span class="sr">Supprimer</span></th></tr></thead><tbody>
      ${sessions.slice(0, 50).map(s => {
        const lv = ex.levels[s.level];
        const ok = lv && sessionValid(s, lv);
        return `<tr>
          <td class="num">${fmtDate(s.date)}</td>
          <td class="num">${lv ? levelLabel(ex, s.level) : '–'}</td>
          <td style="white-space:normal"><span class="num">${s.sets.join(' · ')} ${lv ? unitLabel(lvUnit(ex, lv)) : ''}</span>${ok ? ` <span class="small ok">validé</span>` : ''}
            ${lv ? `<div class="small muted">${esc(lv.name)}${s.opt ? ` · ${esc(optText(lv, s.opt))}` : ''}</div>` : ''}
            ${s.note ? `<div class="small muted">${esc(s.note)}</div>` : ''}</td>
          <td><button class="icon-btn" data-del="${esc(s.id)}" aria-label="Supprimer la séance du ${fmtDate(s.date)}">${icon('x')}</button></td>
        </tr>`;
      }).join('')}</tbody></table></div>` : `<p class="empty">Aucun test pour l'instant.</p>`}
    </div>
  </section>`;

  main.innerHTML = html;

  $$('[data-pick]', main).forEach(b => b.onclick = () => { logChoice[ex.id] = +b.dataset.pick; render(); });
  $('#add-set').onclick = () => {
    const n = $$('#sets input').length;
    const inp = document.createElement('input');
    Object.assign(inp, { type: 'number', min: 0, step: 1, placeholder: String(n + 1), id: 'set-' + n });
    inp.inputMode = 'numeric';
    inp.setAttribute('aria-label', 'Série ' + (n + 1));
    $('#add-set').before(inp); inp.focus();
  };
  $('#log-form').onsubmit = e => {
    e.preventDefault();
    const sets = $$('#sets input').map(i => parseInt(i.value, 10)).filter(v => Number.isFinite(v) && v >= 0);
    if (!sets.length) return toast('Saisis ton résultat');
    const f = e.target;
    const before = levelStatus(ex);
    const sess = { id: uid(), date: f.date.value || today(), exId: ex.id, level: selI, sets, note: f.note.value.trim(), test: true };
    if (sel.cond) sess.formOk = !!(f.formOk && f.formOk.checked);
    const ov = $('#log-opt') ? $('#log-opt').value.trim() : '';
    if (ov) sess.opt = ov;
    state.sessions.push(sess);
    persist.putSession(sess);
    const after = levelStatus(ex);
    const numbersOk = sets.filter(v => v >= sel.target).length >= sel.sets;
    toast(after.green && !before.green ? 'Feu vert : tu peux tester le niveau suivant'
      : numbersOk && sel.cond && !sess.formOk ? 'Enregistré, non compté : forme non cochée'
      : sessionValid(sess, sel) ? `Validé : ${sel.name}` : 'Test enregistré');
    logChoice[ex.id] = undefined;
    render();
  };
  const goNext = () => { ex.current = nextI; save(); toast('Nouveau niveau : ' + ex.levels[ex.current].name); render(); };
  const up = $('#level-up');
  if (up) up.onclick = goNext;
  const skip = $('#skip-level');
  if (skip) skip.onclick = () => confirmAction(`Sauter « ${base.name} » et passer à « ${next.name} » ?`, 'Sauter', goNext);
  $('#edit-levels').onclick = () => editLevels(ex);
  $$('[data-del]', main).forEach(b => b.onclick = () => confirmAction('Supprimer cette séance ?', 'Supprimer', () => {
    state.sessions = state.sessions.filter(s => s.id !== b.dataset.del);
    persist.deleteSession(b.dataset.del); render();
  }));
}

// Graphique : meilleur résultat de chaque séance à un niveau, avec la ligne d'objectif.
function chartForLevel(ex, i) {
  const l = ex.levels[i];
  const u = unitLabel(lvUnit(ex, l));
  const list = atLevel(ex, i);
  if (list.length < 2) {
    return `<p class="empty">La courbe apparaîtra après deux tests. La ligne verte marquera l'objectif : ${l.target} ${u}</p>`;
  }
  return lineChart(list.map(s => ({ x: s.date, y: Math.max(...s.sets) })), {
    target: l.target, unit: u, label: `Meilleur résultat par séance, objectif ${l.target} ${u}`,
  });
}

function niceStep(range) {
  const raw = range / 3;
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 5, 10].map(m => m * p).find(s => s >= raw) || p * 10;
}
function lineChart(points, { target = null, unit = '', label = '' } = {}) {
  const W = 320, H = 168, P = { l: 32, r: 12, t: 12, b: 24 };
  const ys = points.map(p => p.y).concat(target != null ? [target] : []);
  let min = Math.min(...ys), max = Math.max(...ys);
  let step = niceStep(max - min || Math.max(1, max * 0.2));
  if (ys.every(Number.isInteger)) step = Math.max(1, step);
  min = Math.floor(min / step) * step; max = Math.ceil(max / step) * step;
  if (min === max) max = min + step;
  const x = i => P.l + (points.length === 1 ? 0 : (i * (W - P.l - P.r)) / (points.length - 1));
  const y = v => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const ticks = [];
  for (let v = min; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${x(points.length - 1).toFixed(1)},${H - P.b} L${P.l},${H - P.b} Z`;
  const last = points[points.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    ${ticks.map(v => `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}"/>
      <text x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end">${fr(v)}</text>`).join('')}
    <path class="area" d="${area}"/>
    ${target != null ? `<line class="target" x1="${P.l}" x2="${W - P.r}" y1="${y(target)}" y2="${y(target)}"/>
      <text class="target-label" x="${W - P.r}" y="${y(target) - 6}" text-anchor="end">objectif ${fr(target)} ${esc(unit)}</text>` : ''}
    <path class="line" d="${d}"/>
    ${points.map((p, i) => `<circle class="dot${i === points.length - 1 ? ' last' : ''}" cx="${x(i)}" cy="${y(p.y)}" r="${i === points.length - 1 ? 4 : 3}"/>`).join('')}
    <text x="${P.l}" y="${H - 6}">${fmtDate(points[0].x)}</text>
    <text x="${W - P.r}" y="${H - 6}" text-anchor="end">${fmtDate(last.x)}</text>
  </svg>`;
}

// ---------- Modale ----------
function openModal(html) {
  const dlg = $('#modal');
  $('#modal-body').innerHTML = html;
  if (!dlg.open) dlg.showModal();
  return dlg;
}
function closeModal() { $('#modal').close(); }
function confirmAction(question, verb, onYes) {
  openModal(`<h2>${esc(question)}</h2>
    <div class="actions"><button class="btn" id="c-no">Annuler</button><button class="btn primary" id="c-yes">${esc(verb)}</button></div>`);
  $('#c-no').onclick = closeModal;
  $('#c-yes').onclick = () => { closeModal(); onYes(); };
}

function editLevels(ex) {
  const draft = { name: ex.name, unit: ex.unit, current: ex.current, levels: ex.levels.map((l, i) => ({ ...l, _src: i })) };
  let pendingDelete = null;
  const draw = () => {
    const tmp = { levels: draft.levels };
    openModal(`
      <h2>Modifier ${esc(ex.name)}</h2>
      <label class="field"><span>Nom de l'exercice</span><input id="ed-name" value="${esc(draft.name)}"></label>
      <p class="small secondary">Pour chaque niveau : l'objectif à réussir (en répétitions ou en secondes) et, si le livre en donne une, la condition de forme.
      Un niveau « bis » se valide en plus du niveau qui le précède.</p>
      ${draft.levels.map((l, i) => {
        const u = (l.unit || draft.unit) === 'sec' ? 'Secondes' : 'Répétitions';
        return `
        <div class="level-edit" data-i="${i}">
          <div class="head"><strong>Niveau ${levelLabel(tmp, i)}${i === draft.current ? ' · actuel' : ''}</strong>
            <button class="icon-btn" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Monter">${icon('up')}</button>
            <button class="icon-btn" data-act="down" ${i === draft.levels.length - 1 ? 'disabled' : ''} aria-label="Descendre">${icon('down')}</button>
            <button class="icon-btn" data-act="del" ${draft.levels.length <= 1 ? 'disabled' : ''} aria-label="Supprimer">${icon('x')}</button>
          </div>
          ${pendingDelete === i ? `<div class="actions"><button class="btn sm" data-act="keep">Garder</button><button class="btn sm primary" data-act="confirm-del">Supprimer ce niveau</button></div>` : ''}
          <label class="field"><span>Nom</span><input data-k="name" id="ed-${i}-name" value="${esc(l.name)}"></label>
          <div class="grid2">
            <label class="field"><span>Objectif</span><input data-k="target" id="ed-${i}-target" type="number" inputmode="numeric" min="1" value="${l.target}"></label>
            <label class="field"><span>Mesuré en</span><select data-k="unit" id="ed-${i}-unit">
              <option value="reps" ${u === 'Répétitions' ? 'selected' : ''}>Répétitions</option>
              <option value="sec" ${u === 'Secondes' ? 'selected' : ''}>Secondes</option></select></label>
            <label class="field"><span>Nombre de séries</span><input data-k="sets" id="ed-${i}-sets" type="number" inputmode="numeric" min="1" value="${l.sets}"></label>
            <label class="field"><span>Séances réussies</span><input data-k="times" id="ed-${i}-times" type="number" inputmode="numeric" min="1" value="${l.times}"></label>
          </div>
          <label class="field"><span>Condition de forme (facultatif)</span><input data-k="cond" id="ed-${i}-cond" value="${esc(l.cond || '')}" placeholder="Ex. : amplitude complète"></label>
          <div class="grid2">
            <label class="field"><span>Option (facultatif)</span><input data-k="optLabel" id="ed-${i}-optLabel" value="${esc(l.opt ? l.opt.label : '')}" placeholder="Ex. : Élastique"></label>
            <label class="field"><span>Choix ou unité</span><input data-k="optChoices" id="ed-${i}-optChoices" value="${esc(l.opt ? (l.opt.choices ? l.opt.choices.join(', ') : l.opt.unit || '') : '')}" placeholder="30 kg, 20 kg… ou cm"></label>
          </div>
          <label class="field"><span>Conseil d'exécution (facultatif)</span><textarea data-k="tip" id="ed-${i}-tip" rows="2">${esc(l.tip || '')}</textarea></label>
          <label class="check"><input type="checkbox" data-k="perSide" id="ed-${i}-perSide" ${l.perSide ? 'checked' : ''}><span>Objectif à réussir de chaque côté (gauche et droite)</span></label>
          <label class="check"><input type="checkbox" data-k="optional" id="ed-${i}-optional" ${l.optional ? 'checked' : ''}><span>Niveau optionnel, on peut le sauter</span></label>
          ${i > 0 ? `<label class="check"><input type="checkbox" data-k="bis" id="ed-${i}-bis" ${l.bis ? 'checked' : ''}><span>Niveau « bis », à valider en plus du précédent</span></label>` : ''}
          ${i !== draft.current && !l.bis ? `<div><button class="btn sm" data-act="cur">En faire mon niveau actuel</button></div>` : ''}
        </div>`;
      }).join('')}
      <button class="btn block" id="ed-add">${icon('plus')} Ajouter un niveau</button>
      <div class="actions">
        <button class="btn" id="ed-cancel">Annuler</button>
        <button class="btn primary" id="ed-save">Enregistrer</button>
      </div>`);
    const body = $('#modal-body');
    const sync = () => {
      draft.name = $('#ed-name').value.trim() || ex.name;
      $$('[data-i]', body).forEach(card => {
        const l = draft.levels[+card.dataset.i];
        $$('[data-k]', card).forEach(inp => {
          const k = inp.dataset.k;
          if (k === 'name') l.name = inp.value;
          else if (k === 'cond') { const c = inp.value.trim(); if (c) l.cond = c; else delete l.cond; }
          else if (k === 'tip') { const t = inp.value.trim(); if (t) l.tip = t; else delete l.tip; }
          else if (k === 'optLabel') { l._optLabel = inp.value.trim(); }
          else if (k === 'optChoices') {
            const lab = l._optLabel; delete l._optLabel;
            const v = inp.value.trim();
            if (!lab) { if (l.opt) l.optSet = true; delete l.opt; }
            else {
              const parts = v.split(',').map(x => x.trim()).filter(Boolean);
              l.opt = parts.length > 1 ? { label: lab, choices: parts } : (v ? { label: lab, unit: v } : { label: lab });
              l.optSet = true;
            }
          }
          else if (k === 'perSide') { if (inp.checked) { l.perSide = true; l.sets = 2; } else if (l.perSide) { delete l.perSide; l.sets = 1; } }
          else if (k === 'optional' || k === 'bis') { if (inp.checked) l[k] = true; else delete l[k]; }
          else if (k === 'unit') { if (inp.value === draft.unit) delete l.unit; else l.unit = inp.value; }
          else l[k] = Math.max(1, parseInt(inp.value, 10) || 1);
        });
      });
    };
    $$('[data-k="bis"]', body).forEach(c => c.onchange = () => { sync(); draw(); });
    $$('[data-act]', body).forEach(b => b.onclick = () => {
      sync();
      const i = +b.closest('[data-i]').dataset.i;
      const L = draft.levels;
      const act = b.dataset.act;
      if (act === 'up' || act === 'down') {
        const j = act === 'up' ? i - 1 : i + 1;
        [L[i], L[j]] = [L[j], L[i]];
        if (draft.current === i) draft.current = j; else if (draft.current === j) draft.current = i;
        pendingDelete = null;
      } else if (act === 'del') {
        pendingDelete = i;
      } else if (act === 'keep') {
        pendingDelete = null;
      } else if (act === 'confirm-del') {
        L.splice(i, 1);
        if (draft.current > i || draft.current >= L.length) draft.current = Math.max(0, draft.current - 1);
        pendingDelete = null;
      } else if (act === 'cur') draft.current = i;
      draw();
    });
    $('#ed-add').onclick = () => {
      sync();
      const last = draft.levels[draft.levels.length - 1];
      draft.levels.push(lvl('Nouveau niveau', last ? last.target : 10, last && last.unit ? { unit: last.unit } : {}));
      draw();
    };
    $('#ed-cancel').onclick = closeModal;
    $('#ed-save').onclick = () => {
      sync();
      draft.levels.forEach(l => { l.name = l.name.trim() || 'Niveau sans nom'; });
      if (draft.levels[0]) delete draft.levels[0].bis;
      // Le niveau actuel pointe toujours sur le début de son étape.
      while (draft.current > 0 && draft.levels[draft.current] && draft.levels[draft.current].bis) draft.current--;
      // Les séances gardent l'index de leur niveau : on le remappe si l'ordre a changé
      // (-1 si le niveau a été supprimé : la séance reste dans l'historique).
      const map = {};
      draft.levels.forEach((l, i) => { if (l._src != null) map[l._src] = i; delete l._src; });
      state.sessions.forEach(s => {
        if (s.exId !== ex.id) return;
        const nl = s.level in map ? map[s.level] : -1;
        if (nl !== s.level) { s.level = nl; persist.putSession(s); }
      });
      Object.assign(ex, { name: draft.name, current: draft.current, levels: draft.levels });
      save(); closeModal(); toast('Niveaux enregistrés'); render();
    };
  };
  draw();
}

// ---------- Grease the Groove ----------
// Programme « bis » du livre : des séries faciles (environ la moitié du max), souvent, sans fatigue.
// Arthur préfère un objectif par semaine à un planning fixe : l'objectif hebdomadaire de chaque
// exercice se calcule sur sa semaine type, et la part du jour dépend du type de journée.
const DAY_TYPES = {
  maison: { label: 'Maison', hint: 'Une série à chaque pause' },
  agence: { label: 'Agence', hint: 'Le matin avant de partir, à midi' },
  chargee: { label: 'Chargée', hint: 'Quelques séries quand tu peux' },
  repos: { label: 'Repos', hint: 'Pas de séries aujourd\'hui' },
};
const RHYTHMS = [[120, '2 h'], [60, '1 h'], [30, '30 min']];
// Créneaux par jour : une journée maison de 9 h à 17 h selon le rythme choisi ; agence et chargée :
// nombre de créneaux réglable (agence par défaut : avant de partir le matin et à midi, sans transpirer).
function slotsFor(type) {
  if (type === 'maison') return Math.round(480 / (state.gtg.rhythm || 120));
  if (type === 'repos') return 0;
  return Math.max(0, (state.gtg.slots || {})[type] ?? 2);
}
const PER_SLOT = 3; // exercices par créneau, comme dans les exemples du livre
const LIGHT = ['gainage']; // le gainage revient moins souvent : une fois par jour au plus

function isoOf(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function weekDates(iso = today()) {
  const d = new Date(iso + 'T12:00:00');
  const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, k) => { const x = new Date(mon); x.setDate(mon.getDate() + k); return isoOf(x); });
}
const dayKey = iso => DAYS[(new Date(iso + 'T12:00:00').getDay() + 6) % 7][0];
const dayDoc = iso => state.days[iso] || { date: iso, done: {} };
const typeOf = iso => dayDoc(iso).type || state.gtg.week[dayKey(iso)] || 'chargee';

// Groupes de l'alternance 3 + 3 (choix proposé par Claude) : les trois premiers exercices, puis les trois autres.
const groupOf = ex => (state.exercises.indexOf(ex) < Math.ceil(state.exercises.length / 2) ? 0 : 1);

// Meilleur résultat d'une séance de test (par jambe : la moins bonne des deux).
function bestOf(s, l) {
  if (!s || !s.sets.length) return 0;
  if (l && l.perSide) {
    const g = s.sets.filter((_, i) => i % 2 === 0), d = s.sets.filter((_, i) => i % 2 === 1);
    return d.length ? Math.min(Math.max(...g), Math.max(...d)) : Math.max(...g);
  }
  return Math.max(...s.sets);
}
// Niveau travaillé : le premier niveau obligatoire pas encore validé de l'étape, sinon sa base.
function grooveLevel(ex) {
  if (!ex.levels[ex.current]) return -1;
  const idx = stepIdx(ex, ex.current).filter(i => !(ex.levels[i].bis && ex.levels[i].optional));
  return idx.find(i => levelState(ex, i) !== 'go') ?? idx[0];
}
// Niveau précédent : début de l'étape d'avant, en sautant les niveaux optionnels.
function prevLevel(ex, i) {
  const starts = stepStarts(ex).filter(k => k < stepRange(ex, i)[0] && !ex.levels[k].optional);
  return starts.length ? starts[starts.length - 1] : -1;
}
// Série du jour, d'après le livre : environ la moitié du max ; si le max au niveau actuel est
// encore très faible, on fait des séries du niveau précédent (ex. 2 négatives -> séries de 10 australiennes).
function grooveSet(ex) {
  const i = grooveLevel(ex);
  if (i < 0) return { i, reps: 0, basis: 'none' };
  const l = ex.levels[i];
  const tests = atLevel(ex, i);
  const t = tests[tests.length - 1];
  const p = prevLevel(ex, i);
  const fromPrev = () => ({ i: p, reps: Math.max(1, Math.round(ex.levels[p].target * 2 / 3)) });
  let res;
  if (t) {
    const max = bestOf(t, l);
    res = max < l.target * 0.4 && p >= 0
      ? { ...fromPrev(), basis: 'prev', max, testI: i, test: t }
      : { i, reps: Math.max(1, Math.floor(max / 2)), basis: 'max', max, testI: i, test: t };
  } else {
    res = p >= 0 ? { ...fromPrev(), basis: 'untested', testI: i } : { i, reps: 0, basis: 'none', testI: i };
  }
  // Réglage manuel (autoexpérimentation) : valable tant qu'il n'y a pas de nouveau test.
  const c = state.gtg.sizes[ex.id];
  if (c && res.reps && c.i === res.i && c.testId === (res.test ? res.test.id : null)) { res.reps = c.reps; res.custom = true; }
  return res;
}

// Séries prévues pour un exercice un jour donné, à type de journée fixé.
function plannedSets(ex, iso, type = typeOf(iso)) {
  const slots = slotsFor(type);
  if (!slots) return 0;
  if (LIGHT.includes(ex.id)) return 1;
  if (state.gtg.split) return activeGroup(iso) === groupOf(ex) ? slots : 0;
  return Math.ceil(slots * PER_SLOT / Math.max(1, state.exercises.length));
}
// Alternance 3 + 3 : le groupe change à chaque journée d'entraînement de la semaine.
function activeGroup(iso) {
  const n = weekDates(iso).filter(d => d < iso && slotsFor(typeOf(d)) > 0).length;
  return n % 2;
}
// Objectif de la semaine : la semaine type (sans les changements du jour).
function weekGoal(ex, iso = today()) {
  return weekDates(iso).reduce((t, d) => t + plannedSets(ex, d, state.gtg.week[dayKey(d)] || 'chargee'), 0);
}
const doneOn = (ex, iso) => (dayDoc(iso).done[ex.id] || { sets: 0, reps: 0 });
function weekDone(ex, iso = today()) {
  return weekDates(iso).reduce((t, d) => {
    const x = doneOn(ex, d);
    return { sets: t.sets + (x.sets || 0), reps: t.reps + (x.reps || 0) };
  }, { sets: 0, reps: 0 });
}
// Part du jour : ce qui reste de l'objectif de la semaine, réparti sur les jours restants
// au prorata de leurs créneaux. Ce qui n'est pas fait un jour se reporte sur les suivants.
function todayShare(ex, iso = today()) {
  const days = weekDates(iso);
  const before = days.filter(d => d < iso).reduce((t, d) => t + (doneOn(ex, d).sets || 0), 0);
  const left = Math.max(0, weekGoal(ex, iso) - before);
  const mine = plannedSets(ex, iso);
  const rest = days.filter(d => d >= iso).reduce((t, d) => t + plannedSets(ex, d), 0);
  if (!mine || !rest) return 0;
  const cap = LIGHT.includes(ex.id) ? 1 : slotsFor(typeOf(iso));
  return Math.min(cap, Math.ceil(left * mine / rest));
}

function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
function lastTestDate(ex) {
  const list = state.sessions.filter(s => s.exId === ex.id).map(s => s.date).sort();
  return list[list.length - 1] || null;
}
// Les 4 temps du livre, selon l'ancienneté du programme.
function phaseNotice() {
  const start = state.gtg.startedAt;
  if (!start) return null;
  const w = Math.floor(daysBetween(start, today()) / 7);
  if (w < 2) return { title: 'Semaines 1 et 2 : fixe ton rythme', text: 'Garde un rythme que tu tiens sans effort. Chaque répétition doit être parfaite : mieux vaut une série de moins qu\'une série bâclée.' };
  if (w < 4) return { title: 'Semaines 3 et 4 : installe l\'habitude', text: 'Le rythme devient automatique. Ne monte pas la fréquence au point de sentir la fatigue.' };
  const ideas = ['change la fréquence (plus de séries un jour, moins un autre)', 'change le repos entre les séries', 'change le nombre de répétitions par série', 'teste une progression plus dure sur une ou deux séries'];
  return { title: 'Varie', text: `L'habitude est là : ajoute des fluctuations. Idée de la semaine : ${ideas[w % ideas.length]}.` };
}

let planDate = null; // jour affiché (aujourd'hui par défaut)
function renderPlan(main) {
  if (route.view === 'test') return renderTest(main);
  const iso = planDate || today();
  const isToday = iso === today();
  setTitle(isToday ? 'Aujourd\'hui' : fmtLong(iso), isToday ? null : () => { planDate = null; render(); });
  const type = typeOf(iso);
  const doc = dayDoc(iso);
  const exs = state.exercises;
  const sets = Object.fromEntries(exs.map(e => [e.id, grooveSet(e)]));
  const neverTested = exs.every(e => !state.sessions.some(s => s.exId === e.id));
  const todayList = exs.filter(e => todayShare(e, iso) > 0 || (doc.done[e.id] && doc.done[e.id].sets));
  const ph = phaseNotice();

  let html = '';
  if (neverTested) {
    html += `<div class="notice"><p><strong>Commence par la séance test.</strong> Ton max sur chaque exercice place ton niveau et règle la taille de tes séries.</p>
      <div><button class="btn sm primary" data-go-test>Faire la séance test</button></div></div>`;
  } else if (ph) {
    html += `<div class="notice"><p><strong>${esc(ph.title)}.</strong> ${esc(ph.text)}</p></div>`;
  }

  html += `<section>
    <h2 class="section-title"><span>${isToday ? 'Ma journée' : 'Journée'}</span><span>${esc(DAY_TYPES[type].hint)}</span></h2>
    <div class="seg" role="radiogroup" aria-label="Type de journée">${Object.entries(DAY_TYPES).map(([k, t]) =>
      `<button type="button" role="radio" aria-checked="${k === type}" class="${k === type ? 'on' : ''}" data-type="${k}">${t.label}</button>`).join('')}</div>
  </section>`;

  html += `<section>
    <h2 class="section-title"><span>Séries du jour</span><span class="num">${slotsFor(type) ? `${slotsFor(type)} créneau${slotsFor(type) > 1 ? 'x' : ''}` : ''}</span></h2>
    <div class="panel list">${todayList.length ? todayList.map(e => {
      const g = sets[e.id];
      const l = e.levels[g.i];
      const u = l ? lvUnit(e, l) : e.unit;
      const share = todayShare(e, iso);
      const d = doneOn(e, iso);
      const left = Math.max(0, share - (d.sets || 0));
      const due = g.basis !== 'none' && g.testI != null && (g.basis === 'untested' || !g.test || daysBetween(g.test.date, today()) >= 14);
      return `<div class="groove" data-ex="${esc(e.id)}">
        <div class="grow">
          <div class="row" style="gap:8px;align-items:baseline"><span class="name grow">${esc(e.name)}</span>
            <span class="count ${left ? '' : 'ok'}"><b>${d.sets || 0}</b>/${share}</span></div>
          <div class="pbar"><span style="width:${share ? Math.min(100, (d.sets || 0) / share * 100) : 0}%"></span></div>
          ${g.reps ? `<div class="small secondary"><button type="button" class="size-link" data-size="${esc(e.id)}" aria-label="Régler la taille des séries de ${esc(e.name)}">Séries de <span class="num">${g.reps} ${unitLabel(u)}${l.perSide ? ' par jambe' : ''}</span>${g.custom ? ' (réglée)' : ''}</button> · ${esc(l.name)}${lastOpt(e, g.i) ? ` · ${esc(optText(l, lastOpt(e, g.i)))}` : ''}</div>`
            : `<div class="small secondary">Fais d'abord un test de ton max.</div>`}
          ${g.basis === 'prev' ? `<div class="small muted">Ton max en ${esc(e.levels[g.testI].name.toLowerCase())} est encore faible (${g.max}) : on consolide le niveau d'avant.</div>` : ''}
          ${due ? `<div class="small" style="color:var(--wait)">${g.basis === 'untested' ? `Teste ton max en ${esc(e.levels[g.testI].name.toLowerCase())}` : 'Refais un test de max'} quand tu es reposé.</div>` : ''}
        </div>
        ${g.reps ? `<div class="groove-btns">
          <button class="icon-btn" data-minus="${esc(e.id)}" ${d.sets ? '' : 'disabled'} aria-label="Retirer une série de ${esc(e.name)}">${icon('minus')}</button>
          <button class="btn sm ${left ? 'primary' : ''}" data-plus="${esc(e.id)}" aria-label="Ajouter une série de ${esc(e.name)}">${icon('plus')} Série</button>
        </div>` : `<button class="btn sm" data-open="${esc(e.id)}">Tester</button>`}
      </div>`;
    }).join('') : `<p class="empty" style="padding:16px 0">${type === 'repos' ? 'Jour de repos.' : 'Objectif de la semaine déjà atteint. Tu peux quand même ajouter des séries depuis le tableau ci-dessous.'}</p>`}</div>
    <p class="small muted" style="padding:0 4px">Pas d'échauffement. Arrête-toi bien avant la fatigue : chaque répétition doit être parfaite.</p>
  </section>`;

  const days = weekDates(iso);
  html += `<section>
    <h2 class="section-title"><span>La semaine</span><span class="num">${fmtDate(days[0])} au ${fmtDate(days[6])}</span></h2>
    <div class="panel list"><div class="table-wrap"><table class="hist">
      <thead><tr><th>Exercice</th><th>Séries</th><th>Volume</th></tr></thead><tbody>
      ${exs.map(e => {
        const w = weekDone(e, iso), goal = weekGoal(e, iso), g = sets[e.id];
        const l = e.levels[g.i];
        const u = l ? unitLabel(lvUnit(e, l)) : '';
        return `<tr><td>${esc(e.name)}${l ? `<div class="small muted">${esc(l.name)}</div>` : ''}</td>
          <td class="num ${w.sets >= goal && goal ? 'ok' : ''}">${w.sets}/${goal}</td>
          <td class="num">${w.reps} ${u}</td></tr>`;
      }).join('')}</tbody></table></div></div>
    <p class="small muted" style="padding:0 4px">Le volume compte les répétitions (ou les secondes) faites en séries. Pour ajuster la taille d'une série, touche « Séries de… » plus haut.</p>
    <div class="grid2"><button class="btn" data-go-test>Séance test</button><button class="btn" id="day-prev">${icon('chevronLeft')} Jour précédent</button></div>
    ${!isToday ? `<button class="btn block" id="day-today">Revenir à aujourd'hui</button>` : ''}
  </section>`;

  if (state.gtg.film) {
    const w = state.gtg.startedAt ? Math.floor(daysBetween(state.gtg.startedAt, today()) / 7) : 0;
    if (w && w % 4 === 0) html += `<div class="notice"><p><strong>Cette semaine, filme une série.</strong> Le livre conseille de te filmer de temps en temps pour vérifier ta forme. Personne n'a besoin de voir la vidéo.</p></div>`;
  }

  html += `<section>
    <h2 class="section-title">Mon rythme</h2>
    <div class="panel form">
      <div class="field"><span>À la maison, une série toutes les…</span><div class="seg" role="radiogroup">${RHYTHMS.map(([v, t]) =>
        `<button type="button" role="radio" aria-checked="${state.gtg.rhythm === v}" class="${state.gtg.rhythm === v ? 'on' : ''}" data-rhythm="${v}">${t}</button>`).join('')}</div></div>
      <div class="field"><span>Exercices</span><div class="seg" role="radiogroup">
        <button type="button" role="radio" aria-checked="${!state.gtg.split}" class="${!state.gtg.split ? 'on' : ''}" data-split="0">Les 6 chaque jour</button>
        <button type="button" role="radio" aria-checked="${!!state.gtg.split}" class="${state.gtg.split ? 'on' : ''}" data-split="1">3 + 3 en alternance</button></div>
        ${state.gtg.split ? `<span class="small muted">Un jour ${esc(exs.filter(e => groupOf(e) === 0).map(e => e.name).join(', '))}, le suivant ${esc(exs.filter(e => groupOf(e) === 1).map(e => e.name).join(', '))}.</span>` : ''}</div>
      <div class="grid2">${['agence', 'chargee'].map(t => `<label class="field"><span>Créneaux un jour ${DAY_TYPES[t].label.toLowerCase()}</span>
        <select data-slots="${t}" id="slots-${t}">${[1, 2, 3, 4, 6].map(n => `<option value="${n}" ${slotsFor(t) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="field"><span>Ma semaine type</span>
        <div class="list">${DAYS.map(([k, label]) => `<label class="day"><span class="dname">${label}</span>
          <select data-week="${k}" id="week-${k}" aria-label="Type de journée le ${label}">${Object.entries(DAY_TYPES).map(([t, d]) =>
            `<option value="${t}" ${state.gtg.week[k] === t ? 'selected' : ''}>${d.label}</option>`).join('')}</select></label>`).join('')}</div></div>
      <label class="check"><input type="checkbox" id="gtg-film" ${state.gtg.film ? 'checked' : ''}><span>Me rappeler de me filmer de temps en temps</span></label>
      <p class="small muted">L'objectif de la semaine se calcule sur la semaine type. Quand un jour change (échange de jours, mise en prod, week-end chargé), change seulement le type du jour en haut : le reste se répartit sur les jours suivants.</p>
    </div>
  </section>`;

  main.innerHTML = html;

  const putDay = d => { state.days[d.date] = d; persist.putDay(d); };
  $$('[data-type]', main).forEach(b => b.onclick = () => {
    const d = clone(dayDoc(iso));
    if (b.dataset.type === state.gtg.week[dayKey(iso)]) delete d.type; else d.type = b.dataset.type;
    putDay(d); render();
  });
  $$('[data-plus]', main).forEach(b => b.onclick = () => {
    const e = exById(b.dataset.plus), g = sets[e.id];
    const d = clone(dayDoc(iso));
    const x = d.done[e.id] || { sets: 0, reps: 0 };
    d.done[e.id] = { sets: x.sets + 1, reps: x.reps + g.reps, level: g.i };
    putDay(d);
    if (!state.gtg.startedAt) { state.gtg.startedAt = iso; save(); }
    const share = todayShare(e, iso);
    toast(d.done[e.id].sets === share ? `${e.name} : séries du jour faites` : `${e.name} : ${d.done[e.id].sets}/${share}`);
    render();
  });
  $$('[data-minus]', main).forEach(b => b.onclick = () => {
    const e = exById(b.dataset.minus), g = sets[e.id];
    const d = clone(dayDoc(iso));
    const x = d.done[e.id];
    if (!x || !x.sets) return;
    const per = x.sets ? Math.round(x.reps / x.sets) : g.reps;
    d.done[e.id] = { ...x, sets: x.sets - 1, reps: Math.max(0, x.reps - per) };
    putDay(d); render();
  });
  $$('[data-open]', main).forEach(b => b.onclick = () => go('exercices', 'ex', b.dataset.open));
  $$('[data-go-test]', main).forEach(b => b.onclick = () => go('plan', 'test'));
  $$('[data-size]', main).forEach(b => b.onclick = () => editSize(exById(b.dataset.size), sets[b.dataset.size]));
  $('#day-prev').onclick = () => { const x = new Date(iso + 'T12:00:00'); x.setDate(x.getDate() - 1); planDate = isoOf(x); render(); };
  const t = $('#day-today'); if (t) t.onclick = () => { planDate = null; render(); };
  $$('[data-rhythm]', main).forEach(b => b.onclick = () => { state.gtg.rhythm = +b.dataset.rhythm; save(); render(); });
  $$('[data-split]', main).forEach(b => b.onclick = () => { state.gtg.split = b.dataset.split === '1'; save(); render(); });
  $$('[data-week]', main).forEach(s => s.onchange = () => { state.gtg.week[s.dataset.week] = s.value; save(); render(); });
  $$('[data-slots]', main).forEach(s => s.onchange = () => { state.gtg.slots[s.dataset.slots] = +s.value; save(); render(); });
  $('#gtg-film').onchange = e => { state.gtg.film = e.target.checked; save(); render(); };
}
function fmtLong(iso) {
  const d = new Date(iso + 'T12:00:00');
  return `${DAYS[(d.getDay() + 6) % 7][1]} ${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function editSize(ex, g) {
  const l = ex.levels[g.i];
  const u = unitLong(lvUnit(ex, l));
  let v = g.reps;
  const draw = () => {
    openModal(`<h2>Séries de ${esc(ex.name.toLowerCase())}</h2>
      <p class="secondary">${esc(l.name)}, en ${u}${l.perSide ? ' par jambe' : ''}.
      ${g.max != null ? `Ton dernier max : <span class="num">${g.max}</span>${g.basis === 'prev' ? ` en ${esc(ex.levels[g.testI].name.toLowerCase())}` : ''}.` : ''}</p>
      <div class="row" style="justify-content:center;gap:24px">
        <button class="icon-btn" id="sz-minus" aria-label="Moins" ${v <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
        <span class="num" style="font-size:32px;line-height:40px;min-width:3ch;text-align:center">${v}</span>
        <button class="icon-btn" id="sz-plus" aria-label="Plus">${icon('plus')}</button>
      </div>
      <p class="small muted">Le livre donne ses chiffres comme des exemples : ajuste jusqu'à trouver des séries faciles, sans fatigue. Le réglage tient jusqu'à ton prochain test.</p>
      <div class="actions"><button class="btn" id="sz-auto">Calcul auto</button><button class="btn primary" id="sz-ok">Enregistrer</button></div>`);
    $('#sz-minus').onclick = () => { v = Math.max(1, v - 1); draw(); };
    $('#sz-plus').onclick = () => { v += 1; draw(); };
    $('#sz-auto').onclick = () => { delete state.gtg.sizes[ex.id]; save(); closeModal(); render(); };
    $('#sz-ok').onclick = () => {
      state.gtg.sizes[ex.id] = { i: g.i, reps: v, testId: g.test ? g.test.id : null };
      save(); closeModal(); render();
    };
  };
  draw();
}

// ---------- Séance test ----------
// Un test de max par exercice, reposé : il place le niveau et règle la taille des séries.
const testPick = {};
const testDraft = {};
function renderTest(main) {
  setTitle('Séance test', () => go('plan'));
  // Ordre conseillé : on alterne tirage, jambes, poussée, gainage, pour ne pas fatiguer deux fois les mêmes muscles.
  const ORDER = ['tractions', 'pistol', 'pompes', 'gainage', 'dips', 'lsit'];
  const exs = state.exercises.slice().sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99));
  main.innerHTML = `
    <div class="notice" style="gap:8px"><p><strong>Un seul max par exercice.</strong> Fais-le reposé. On monte, on ne descend pas :</p>
      <ol class="steps">
        <li>Commence au niveau facile : 2 ou 3 répétitions tranquilles, c'est ton échauffement.</li>
        <li>Essaie 1 seule répétition propre du niveau au-dessus. Si elle passe facilement, essaie le suivant.</li>
        <li>Arrête de monter dès qu'une répétition est dure ou pas propre.</li>
        <li>Après 2 min de repos, fais ton max une fois, au dernier niveau où tu fais au moins 3 répétitions propres. C'est ce chiffre que tu notes.</li>
      </ol>
      <p class="small secondary">Exercices dans l'ordre conseillé, 2 à 3 min de repos entre chacun. Tu peux étaler le test sur deux jours : laisse vide ce que tu ne testes pas.</p></div>
    <form class="panel form" id="test-form">${exs.map(e => {
      if (!(e.id in testPick)) testPick[e.id] = grooveLevel(e) < 0 ? 0 : grooveLevel(e);
      const i = testPick[e.id];
      const l = e.levels[i];
      const u = lvUnit(e, l);
      return `<div class="test-row" data-ex="${esc(e.id)}">
        <div class="row" style="align-items:baseline"><strong class="grow" style="font-weight:500">${esc(e.name)}</strong>
          <span class="small muted num">objectif ${esc(setsText(l, u))}</span></div>
        <label class="field"><span>Niveau testé</span><select data-lvl id="t-${esc(e.id)}-lvl">${e.levels.map((x, k) =>
          `<option value="${k}" ${k === i ? 'selected' : ''}>${levelLabel(e, k)} · ${esc(x.name)}</option>`).join('')}</select></label>
        <div class="field"><span>Ton max en ${unitLong(u)}${l.perSide ? ' (gauche, droite)' : ''}</span>
          <div class="sets">${(l.perSide ? ['Gauche', 'Droite'] : ['Max']).map((p, k) =>
            `<input type="number" inputmode="numeric" min="0" step="1" data-v="${k}" id="t-${esc(e.id)}-${k}" placeholder="${p}" aria-label="${esc(e.name)} : ${p}">`).join('')}</div></div>
        ${optField(l, `t-${esc(e.id)}-opt`, lastOpt(e, i))}
        ${l.cond ? `<label class="check"><input type="checkbox" data-ok id="t-${esc(e.id)}-ok"><span><span style="font-weight:500">Forme respectée</span><span class="small secondary" style="display:block">${esc(l.cond)}</span></span></label>` : ''}
      </div>`;
    }).join('')}
      <label class="field"><span>Date</span><input type="date" id="t-date" value="${today()}"></label>
      <button class="btn primary block" type="submit">Enregistrer le test</button>
    </form>`;

  // Changer de niveau redessine le formulaire : on garde ce qui est déjà saisi.
  Object.entries(testDraft).forEach(([id, v]) => { const el = document.getElementById(id); if (el) { if (el.type === 'checkbox') el.checked = v; else el.value = v; } });
  $$('[data-lvl]', main).forEach(s => s.onchange = () => {
    const row = s.closest('[data-ex]');
    $$('input, select[data-opt]', main).forEach(el => { if (el.id && el.closest('[data-ex]') !== row) testDraft[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
    testPick[row.dataset.ex] = +s.value; render();
  });
  $('#test-form').onsubmit = ev => {
    ev.preventDefault();
    const date = $('#t-date').value || today();
    let n = 0;
    $$('[data-ex]', main).forEach(row => {
      const e = exById(row.dataset.ex), i = testPick[e.id], l = e.levels[i];
      const vals = $$('[data-v]', row).map(x => parseInt(x.value, 10));
      if (!vals.some(Number.isFinite)) return;
      const s = { id: uid(), date, exId: e.id, level: i, sets: vals.map(v => (Number.isFinite(v) && v >= 0 ? v : 0)), note: 'Séance test', test: true };
      if (l.cond) s.formOk = !!($('[data-ok]', row) || {}).checked;
      const oe = $('[data-opt]', row);
      if (oe && oe.value.trim()) s.opt = oe.value.trim();
      state.sessions.push(s); persist.putSession(s);
      e.current = stepRange(e, i)[0];
      n++;
    });
    if (!n) return toast('Saisis au moins un résultat');
    save();
    Object.keys(testPick).forEach(k => delete testPick[k]);
    Object.keys(testDraft).forEach(k => delete testDraft[k]);
    toast(`Test enregistré pour ${n} exercice${n > 1 ? 's' : ''}`);
    go('plan');
  };
}

// ---------- Marche (Tour de Cholet) ----------
// Les marches arrivent en fichiers GPX (export Strava sur le site, ou FitnessView), ou en saisie rapide.
const EVENT = { name: 'Tour de Cholet', date: '2026-12-06', km: 14, record: 2 * 3600 + 46 * 60 };
const TARGET_PACE = EVENT.record / EVENT.km; // secondes par km pour battre le record
function fmtDur(sec) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m} min ${String(s).padStart(2, '0')}`;
}
const fmtDurShort = sec => { sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60); return h ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`; };
const fmtPace = sec => `${Math.floor(sec / 60)}'${String(Math.round(sec % 60)).padStart(2, '0')}`;
const fmtKm = m => fr((m / 1000).toFixed(2));
function haversine(a, b) {
  const R = 6371000, toR = x => x * Math.PI / 180;
  const dLat = toR(b[0] - a[0]), dLon = toR(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// Lit un GPX : points [lat, lon, alt, temps] et calcule distance, durée, dénivelé, temps au km.
function parseGpx(text, fileName) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('xml');
  let nodes = [...doc.getElementsByTagName('trkpt')];
  if (!nodes.length) nodes = [...doc.getElementsByTagName('rtept')];
  const pts = nodes.map(n => {
    const ele = n.getElementsByTagName('ele')[0], time = n.getElementsByTagName('time')[0];
    const hr = [...n.getElementsByTagName('*')].find(x => x.localName === 'hr' || x.localName === 'HeartRateBpm');
    return [parseFloat(n.getAttribute('lat')), parseFloat(n.getAttribute('lon')),
      ele ? parseFloat(ele.textContent) : null, time ? Date.parse(time.textContent) : null, hr ? parseFloat(hr.textContent) : null];
  }).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) throw new Error('vide');
  let dist = 0, gain = 0, loss = 0, ref = null;
  const cum = [0], splits = [];
  let nextKm = 1000, kmStart = pts[0][3];
  let moving = 0;
  for (let i = 1; i < pts.length; i++) {
    const step = haversine(pts[i - 1], pts[i]);
    dist += step;
    // Temps en mouvement : on ignore les arrêts (moins de 0,5 m/s) et les trous d'enregistrement.
    if (pts[i][3] != null && pts[i - 1][3] != null) {
      const dt = (pts[i][3] - pts[i - 1][3]) / 1000;
      if (dt > 0 && dt <= 60 && step / dt >= 0.5) moving += dt;
    }
    cum.push(dist);
    if (pts[i][3] != null && kmStart != null && dist >= nextKm) {
      splits.push(Math.round((pts[i][3] - kmStart) / 1000));
      kmStart = pts[i][3]; nextKm += 1000;
    }
  }
  // Dénivelé avec un seuil de 3 m, pour ne pas compter le bruit du GPS.
  for (const p of pts) {
    if (p[2] == null) continue;
    if (ref == null) { ref = p[2]; continue; }
    const d = p[2] - ref;
    if (d >= 3) { gain += d; ref = p[2]; } else if (d <= -3) { loss -= d; ref = p[2]; }
  }
  const t0 = pts[0][3], t1 = pts[pts.length - 1][3];
  const duration = t0 != null && t1 != null ? Math.round((t1 - t0) / 1000) : null;
  // On garde au plus 400 points pour le tracé et le profil.
  const stepN = Math.max(1, Math.ceil(pts.length / 400));
  const keep = pts.map((p, i) => [+p[0].toFixed(5), +p[1].toFixed(5), p[2] == null ? null : Math.round(p[2] * 10) / 10, Math.round(cum[i])])
    .filter((_, i) => i % stepN === 0 || i === pts.length - 1);
  const hrAll = pts.map(p => p[4]).filter(v => Number.isFinite(v) && v > 0);
  const eles = pts.map(p => p[2]).filter(v => v != null);
  const hrKeep = hrAll.length ? pts.map(p => (Number.isFinite(p[4]) ? Math.round(p[4]) : 0)).filter((_, i) => i % stepN === 0 || i === pts.length - 1) : [];
  const nameNode = doc.getElementsByTagName('name')[0];
  const d = t0 != null ? new Date(t0) : new Date();
  return {
    id: uid(), date: isoOf(d), name: (nameNode && nameNode.textContent.trim()) || fileName.replace(/\.gpx$/i, ''),
    distance: Math.round(dist), duration, gain: Math.round(gain), loss: Math.round(loss), splits, points: keep, source: 'gpx',
    moving: duration ? Math.round(moving) : null,
    eleMin: eles.length ? Math.round(Math.min(...eles)) : null, eleMax: eles.length ? Math.round(Math.max(...eles)) : null,
    hrAvg: hrAll.length ? Math.round(hrAll.reduce((t, v) => t + v, 0) / hrAll.length) : null, hrMax: hrAll.length ? Math.round(Math.max(...hrAll)) : null,
    ...(hrKeep.length ? { hrs: hrKeep } : {}),
  };
}
// Tuile de chiffre : libellé, grande valeur, unité ; `tone` colore la tuile (walk, hr, alt, go).
const tile = (label, value, unit = '', tone = '', extra = '') =>
  `<div class="tile ${tone}"><span class="t-label">${label}</span><span class="t-val">${value}${unit ? `<small>${unit}</small>` : ''}</span>${extra}</div>`;
const paceOf = w => (w.duration && w.distance ? w.duration / (w.distance / 1000) : null);
// Dans la base, le tracé est rangé en tableaux plats ; en mémoire, en points [lat, lon, alt, distance].
function walkBody(w) {
  const { points, hrs, ...rest } = clone(w);
  const P = points || [];
  const hasEle = P.length && P.every(p => p[2] != null);
  return { ...rest, track: {
    lat: P.map(p => p[0]), lon: P.map(p => p[1]), ele: hasEle ? P.map(p => p[2]) : [], d: P.map(p => p[3]),
    hr: Array.isArray(hrs) && hrs.length === P.length ? hrs.map(v => v || 0) : [],
  } };
}
function walkFromBody(b) {
  if (!b.track) return { points: [], ...b };
  const t = b.track;
  const { track, ...rest } = b;
  return { ...rest, points: (t.lat || []).map((a, i) => [a, t.lon[i], t.ele && t.ele.length ? t.ele[i] : null, t.d[i]]),
    hrs: t.hr && t.hr.length ? t.hr : undefined };
}

let walkView = null; // id de la marche affichée
function renderWalks(main) {
  if (walkView) return renderWalk(main, walkView);
  setTitle('Marche');
  const walks = state.walks.slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const days = daysBetween(today(), EVENT.date);
  const wk = weekDates();
  const weekKm = state.walks.filter(w => w.date >= wk[0] && w.date <= wk[6]).reduce((t, w) => t + w.distance, 0);
  const longest = walks.reduce((m, w) => (!m || w.distance > m.distance ? w : m), null);
  const recent = walks.filter(w => paceOf(w) && w.kind !== 'mixte' && daysBetween(w.date, today()) <= 28);
  const avgPace = recent.length ? recent.reduce((t, w) => t + w.duration, 0) / recent.reduce((t, w) => t + w.distance / 1000, 0) : null;
  const projection = avgPace ? avgPace * EVENT.km : null;
  const okPace = avgPace && avgPace <= TARGET_PACE;

  let html = '';
  if (days >= 0) {
    const longKm = longest ? longest.distance / 1000 : 0;
    html += `<section class="hero walk">
      <div class="hero-top"><div><div class="hero-meta">${EVENT.name}</div>
        <div class="hero-sub">Dimanche 6 décembre · ${EVENT.km} km · record 2h46</div></div>
        <div class="hero-count"><span class="big">${days}</span><small>${days > 1 ? 'jours' : 'jour'}</small></div></div>
      <div class="progress-block"><div class="row" style="justify-content:space-between"><span class="small">Plus longue marche</span>
        <span class="t-num">${fr(longKm.toFixed(1))} <small>/ ${EVENT.km} km</small></span></div>
        <div class="bar on-hero"><span style="width:${Math.min(100, longKm / EVENT.km * 100)}%"></span></div></div>
    </section>
    <div class="tiles">
      ${tile('Cette semaine', fr((weekKm / 1000).toFixed(1)), 'km', 'walk')}
      ${tile('Allure marche', avgPace ? fmtPace(avgPace) : '–', avgPace ? '/km' : '', okPace ? 'go' : '', `<span class="t-foot">visée ${fmtPace(TARGET_PACE)}</span>`)}
      ${tile('Sur 14 km', projection ? fmtDurShort(projection) : '–', '', projection && projection < EVENT.record ? 'go' : '', `<span class="t-foot">${projection ? (projection < EVENT.record ? `${fmtDurShort(EVENT.record - projection)} de marge` : 'au-dessus du record') : 'à ton allure'}</span>`)}
    </div>
    <p class="small secondary" style="padding:0 4px">${projection
      ? 'Ton allure est la bonne : ce qu\'il reste à construire, c\'est l\'endurance pour tenir les 14 km. Allonge un peu chaque semaine.'
      : `Pour battre ton record, marche à ${fmtPace(TARGET_PACE)} au km ou mieux. Importe tes marches pour suivre ta préparation.`}</p>`;
  }

  html += `<section>
    <h2 class="section-title">Ajouter une marche</h2>
    <div class="panel" style="display:grid;gap:12px">
      <label class="btn primary block">Importer des fichiers GPX<input type="file" id="gpx" accept=".gpx,application/gpx+xml,application/xml,text/xml" multiple hidden></label>
      <p class="small muted">Sur le site Strava (PC) : ouvre l'activité, menu « ⋯ », « Exporter au format GPX ». Tu peux en importer plusieurs d'un coup.</p>
      <details><summary class="small secondary">Saisie rapide, sans fichier</summary>
        <form class="form" id="walk-form" style="margin-top:12px">
          <div class="grid3">
            <label class="field"><span>Date</span><input type="date" name="date" id="w-date" value="${today()}"></label>
            <label class="field"><span>Distance (km)</span><input type="text" inputmode="decimal" name="km" id="w-km" placeholder="3,6"></label>
            <label class="field"><span>Durée (min)</span><input type="number" inputmode="numeric" step="1" min="0" name="min" id="w-min"></label>
          </div>
          <button class="btn block" type="submit">Enregistrer</button>
        </form></details>
    </div>
  </section>`;

  html += `<section>
    <h2 class="section-title"><span>Mes marches</span><span class="num">${walks.length || ''}</span></h2>
    <div class="panel list">${walks.length ? walks.map(w => `<a class="ex-row" href="#" data-walk="${esc(w.id)}">
        ${w.points && w.points.length > 1 ? routeSvg(w, 52) : `<span class="route-ph">${icon('footprints')}</span>`}
        <div class="grow"><div class="row" style="gap:8px;align-items:baseline"><span class="name grow">${esc(w.name || 'Marche')}</span><span class="small muted">${fmtDate(w.date)}</span></div>
          <div class="walk-figs"><span><b>${fmtKm(w.distance)}</b> km</span>${w.duration ? `<span><b>${fmtDur(w.duration)}</b></span><span><b>${fmtPace(paceOf(w))}</b> /km</span>` : ''}${w.gain ? `<span class="alt-t"><b>+${w.gain}</b> m</span>` : ''}</div>
          <div class="small muted">${w.kind === 'mixte' ? 'Marche et footing' : 'Marche pure'}${w.note ? ` · ${esc(w.note)}` : ''}</div></div>
        ${icon('chevronRight', 'chev')}</a>`).join('') : `<p class="empty" style="padding:16px 0">Aucune marche pour l'instant.</p>`}</div>
  </section>`;
  main.innerHTML = html;

  $('#gpx').onchange = async e => {
    const files = [...e.target.files];
    e.target.value = '';
    let ok = 0, dup = 0, bad = 0;
    for (const f of files) {
      try {
        const w = parseGpx(await f.text(), f.name);
        if (state.walks.some(x => x.date === w.date && Math.abs(x.distance - w.distance) < 20)) { dup++; continue; }
        state.walks.push(w); persist.putWalk(w); ok++;
      } catch (err) { bad++; }
    }
    toast([ok && `${ok} marche${ok > 1 ? 's' : ''} importée${ok > 1 ? 's' : ''}`, dup && `${dup} déjà là`, bad && `${bad} fichier${bad > 1 ? 's' : ''} illisible${bad > 1 ? 's' : ''}`].filter(Boolean).join(', ') || 'Aucun fichier');
    render();
  };
  $('#walk-form').onsubmit = e => {
    e.preventDefault();
    const f = e.target;
    const km = parseFloat(String(f.km.value).replace(',', '.')), min = parseFloat(f.min.value);
    if (!(km > 0)) return toast('Saisis la distance');
    const w = { id: uid(), date: f.date.value || today(), name: 'Marche', distance: Math.round(km * 1000), duration: min > 0 ? Math.round(min * 60) : null, gain: 0, loss: 0, splits: [], points: [], source: 'manuel' };
    state.walks.push(w); persist.putWalk(w); toast('Marche enregistrée'); render();
  };
  $$('[data-walk]', main).forEach(a => a.onclick = e => { e.preventDefault(); walkView = a.dataset.walk; render(); window.scrollTo(0, 0); });
}

// Tracé sans fond de carte (l'artefact ne peut pas charger de tuiles), projeté à plat.
function routeSvg(w, size = null, onHero = false) {
  const P = w.points;
  const lat0 = P.reduce((t, p) => t + p[0], 0) / P.length;
  const k = Math.cos(lat0 * Math.PI / 180);
  const xs = P.map(p => p[1] * k), ys = P.map(p => -p[0]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const W = 100, pad = 6, s = (W - 2 * pad) / span;
  const ox = pad + ((W - 2 * pad) - (maxX - minX) * s) / 2, oy = pad + ((W - 2 * pad) - (maxY - minY) * s) / 2;
  const d = P.map((p, i) => `${i ? 'L' : 'M'}${(ox + (xs[i] - minX) * s).toFixed(1)},${(oy + (ys[i] - minY) * s).toFixed(1)}`).join(' ');
  const end = d.split(' ').pop().slice(1).split(',');
  const start = d.split(' ')[0].slice(1).split(',');
  return `<svg class="route${size ? ' mini' : ''}${onHero ? ' on-hero' : ''}" viewBox="0 0 ${W} ${W}" ${size ? `width="${size}" height="${size}"` : ''} role="img" aria-label="Tracé de la marche">
    <path d="${d}"/>${size ? '' : `<circle class="start" cx="${start[0]}" cy="${start[1]}" r="2"/><circle class="end" cx="${end[0]}" cy="${end[1]}" r="2"/>`}</svg>`;
}
function elevationSvg(w) {
  const P = w.points.filter(p => p[2] != null);
  if (P.length < 2) return '';
  return distChart(P.map(p => [p[3], p[2]]), 10, 'Profil d\'altitude', 'm', 'alt');
}
function hrSvg(w) {
  if (!w.hrs) return '';
  const P = w.points.map((p, i) => [p[3], w.hrs[i]]).filter(x => x[1] > 0);
  return P.length > 1 ? distChart(P, 10, 'Fréquence cardiaque', 'bpm', 'hr') : '';
}
function distChart(P, minSpan, what, unit, tone = '') {
  const W = 320, H = 120, L = 36, R = 8, T = 10, B = 22;
  const maxD = P[P.length - 1][0] || 1;
  let min = Math.min(...P.map(p => p[1])), max = Math.max(...P.map(p => p[1]));
  const lo = min, hi = max;
  const st = niceStep(Math.max(minSpan, max - min));
  min = Math.floor(min / st) * st; max = Math.ceil(max / st) * st; if (max === min) max += st;
  const x = d => L + d / maxD * (W - L - R), y = v => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const line = P.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
  const ticks = []; for (let v = min; v <= max + 1e-9; v += st) ticks.push(v);
  return `<svg class="chart ${tone}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${what}, de ${Math.round(lo)} à ${Math.round(hi)} ${unit}">
    ${ticks.map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
    <path class="area" d="${line} L${x(maxD)},${H - B} L${L},${H - B} Z"/><path class="line" d="${line}"/>
    <text x="${L}" y="${H - 6}">0 km</text><text x="${W - R}" y="${H - 6}" text-anchor="end">${fmtKm(maxD)} km</text></svg>`;
}
function walkDetails(w) {
  const rows = [];
  if (w.moving) {
    rows.push(['En mouvement', fmtDur(w.moving)]);
    if (w.duration - w.moving >= 30) rows.push(['Pauses', fmtDur(w.duration - w.moving)]);
    rows.push(['Allure en mouvement', fmtPace(w.moving / (w.distance / 1000)) + '/km']);
  }
  if (w.splits && w.splits.length > 1) {
    const best = Math.min(...w.splits), worst = Math.max(...w.splits);
    rows.push(['Kilomètre le plus rapide', `${fmtPace(best)} (km ${w.splits.indexOf(best) + 1})`]);
    rows.push(['Kilomètre le plus lent', `${fmtPace(worst)} (km ${w.splits.indexOf(worst) + 1})`]);
  }
  if (w.eleMin != null) rows.push(['Altitude', `${w.eleMin} à ${w.eleMax} m`]);
  if (w.hrAvg) rows.push(['Fréquence cardiaque', `moy. ${w.hrAvg}, max ${w.hrMax} bpm`]);
  if (!rows.length) return '';
  return `<section><h2 class="section-title">Détails</h2><div class="panel"><div class="table-wrap"><table class="hist"><tbody>
    ${rows.map(([k, v]) => `<tr><td>${k}</td><td class="num">${esc(v)}</td></tr>`).join('')}</tbody></table></div></div></section>`;
}
function renderWalk(main, id) {
  const w = state.walks.find(x => x.id === id);
  if (!w) { walkView = null; return renderWalks(main); }
  setTitle(w.name || 'Marche', () => { walkView = null; render(); });
  const pace = paceOf(w);
  const hasEle = w.points && w.points.some(p => p[2] != null);
  const pauses = w.moving && w.duration - w.moving >= 30 ? w.duration - w.moving : 0;
  main.innerHTML = `
    <section class="hero walk">
      <div class="hero-meta">${fmtLong(w.date)} · ${w.kind === 'mixte' ? 'marche et footing' : 'marche pure'}</div>
      <div class="hero-main"><div><div class="hero-big"><span class="big">${fmtKm(w.distance)}</span><small>km</small></div>
        <div class="hero-sub">${w.duration ? `${fmtDur(w.duration)}${pace ? ` · ${fmtPace(pace)} /km` : ''}` : 'saisie rapide'}</div></div>
        ${w.points && w.points.length > 1 ? routeSvg(w, 96, true) : ''}</div>
    </section>
    <div class="tiles">
      ${tile('Allure', pace ? fmtPace(pace) : '–', pace ? '/km' : '', pace && pace <= TARGET_PACE ? 'go' : '')}
      ${tile('Vitesse', pace ? fr((3600 / pace).toFixed(1)) : '–', pace ? 'km/h' : '')}
      ${w.moving ? tile('En mouvement', fmtDurShort(w.moving), '', '', pauses ? `<span class="t-foot">${fmtDurShort(pauses)} de pause</span>` : '') : ''}
      ${hasEle ? tile('Dénivelé', `+${w.gain}`, 'm', 'alt', `<span class="t-foot">${w.eleMin} à ${w.eleMax} m</span>`) : ''}
      ${w.hrAvg ? tile('Cardio moyen', w.hrAvg, 'bpm', 'hr', `<span class="t-foot">max ${w.hrMax}</span>`) : ''}
      ${w.splits && w.splits.length > 1 ? tile('Meilleur km', fmtPace(Math.min(...w.splits)), '/km', 'walk', `<span class="t-foot">km ${w.splits.indexOf(Math.min(...w.splits)) + 1}</span>`) : ''}
    </div>
    ${w.points && w.points.length > 1 ? `<section><h2 class="section-title">Tracé</h2><div class="panel route-panel">${routeSvg(w)}</div></section>` : ''}
    ${elevationSvg(w) ? `<section><h2 class="section-title"><span>Altitude</span><span class="num">+${w.gain} m · −${w.loss} m</span></h2><div class="panel">${elevationSvg(w)}</div></section>` : ''}
    ${hrSvg(w) ? `<section><h2 class="section-title"><span>Fréquence cardiaque</span><span class="num">moy. ${w.hrAvg} · max ${w.hrMax} bpm</span></h2><div class="panel">${hrSvg(w)}</div></section>` : ''}
    ${w.splits && w.splits.length ? `<section><h2 class="section-title"><span>Temps au kilomètre</span><span class="num">visée ${fmtPace(TARGET_PACE)}</span></h2>
      <div class="panel"><div class="splits">${w.splits.map((s, i) => `<div><span class="num muted">${i + 1}</span>
        <span class="sbar"><span style="width:${Math.min(100, s / (TARGET_PACE * 1.3) * 100)}%" class="${s <= TARGET_PACE ? 'ok' : ''}"></span></span>
        <span class="num ${s <= TARGET_PACE ? 'ok' : ''}">${fmtPace(s)}</span></div>`).join('')}</div></div></section>` : ''}
    <section><h2 class="section-title">Note</h2>
      <div class="panel form">
        <div class="seg" role="radiogroup" aria-label="Type de sortie">
          <button type="button" role="radio" aria-checked="${w.kind !== 'mixte'}" class="${w.kind !== 'mixte' ? 'on' : ''}" data-kind="marche">Marche pure</button>
          <button type="button" role="radio" aria-checked="${w.kind === 'mixte'}" class="${w.kind === 'mixte' ? 'on' : ''}" data-kind="mixte">Marche et footing</button></div>
        <label class="field"><span>Note (ressenti, parcours, poussette…)</span><textarea id="walk-note" rows="2" placeholder="Facultatif">${esc(w.note || '')}</textarea></label>
        <p class="small muted">Seules les marches pures comptent dans l'allure de préparation au Tour de Cholet.</p>
      </div></section>
    <button class="btn block" id="walk-del" style="color:var(--stop)">Supprimer cette marche</button>`;
  $$('[data-kind]', main).forEach(b => b.onclick = () => { w.kind = b.dataset.kind; persist.putWalk(w); render(); });
  $('#walk-note').onchange = e => { const v = e.target.value.trim(); if (v) w.note = v; else delete w.note; persist.putWalk(w); toast('Note enregistrée'); };
  $('#walk-del').onclick = () => confirmAction('Supprimer cette marche ?', 'Supprimer', () => {
    state.walks = state.walks.filter(x => x.id !== id); persist.deleteWalk(id); walkView = null; render();
  });
}

// ---------- Vue : profil ----------
function renderProfile(main) {
  setTitle('Profil');
  const ms = state.profile.measurements.slice().sort((a, b) => a.date.localeCompare(b.date));
  // Pour chaque mesure : sa valeur la plus récente et l'écart depuis la première.
  const series = k => ms.filter(m => m[k] != null);
  const latest = Object.fromEntries(MEASURES.map(([k]) => { const s = series(k); return [k, s[s.length - 1]]; }));
  const delta = k => {
    const s = series(k);
    if (s.length < 2) return '';
    const d = Math.round((s[s.length - 1][k] - s[0][k]) * 10) / 10;
    return `${d > 0 ? '+' : ''}${fr(d)} depuis le ${fmtDate(s[0].date)}`;
  };
  let imc = '';
  const t = parseFloat(state.profile.taille);
  if (t && latest.poids) imc = fr((latest.poids.poids / ((t / 100) ** 2)).toFixed(1));

  let html = `<section>
    <h2 class="section-title">Taille</h2>
    <div class="panel row">
      <input id="taille" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(state.profile.taille)}" style="max-width:120px" aria-label="Taille en cm">
      <span class="muted">cm</span>
      ${imc ? `<span class="grow small secondary" style="text-align:right">IMC <span class="num">${imc}</span></span>` : ''}
    </div>
  </section>`;

  if (ms.length) {
    html += `<section>
      <h2 class="section-title">Dernières mesures</h2>
      <div class="panel list"><div class="table-wrap"><table class="hist"><tbody>
        ${MEASURES.filter(([k]) => latest[k]).map(([k, label, u]) => `<tr>
          <td>${label}<div class="small muted">${delta(k) || 'le ' + fmtDate(latest[k].date)}</div></td>
          <td class="num" style="font-size:16px">${fr(latest[k][k])} <span class="muted">${u}</span></td></tr>`).join('')}
      </tbody></table></div></div>
    </section>`;
    const wpts = series('poids').map(m => ({ x: m.date, y: m.poids }));
    if (wpts.length >= 2) html += `<section><h2 class="section-title">Poids</h2><div class="panel">${lineChart(wpts, { unit: 'kg', label: 'Évolution du poids en kg' })}</div></section>`;
    // Masse grasse (balance à impédance : imprécise, on regarde surtout la tendance).
    const gpts = series('grasse').map(m => ({ x: m.date, y: m.grasse }));
    const both = ms.filter(m => m.poids != null && m.grasse != null);
    const lastB = both[both.length - 1];
    if (gpts.length >= 2 || lastB) html += `<section><h2 class="section-title">Masse grasse</h2><div class="panel" style="display:grid;gap:12px">
      ${lastB ? `<div class="tiles">${tile('Masse grasse', fr((lastB.poids * lastB.grasse / 100).toFixed(1)), 'kg', 'hr')}${tile('Masse maigre', fr((lastB.poids * (1 - lastB.grasse / 100)).toFixed(1)), 'kg', 'go')}</div>` : ''}
      ${gpts.length >= 2 ? lineChart(gpts, { unit: '%', label: 'Évolution de la masse grasse en %' }) : ''}
      <p class="small muted">Les balances à impédance sont imprécises et varient avec l'hydratation : pèse-toi dans les mêmes conditions (vendredi matin, à jeun, après être allé aux toilettes) et regarde la tendance plutôt qu'un chiffre isolé.</p>
    </div></section>`;
  }

  html += `<section>
    <h2 class="section-title">Nouvelle mesure</h2>
    <form class="panel form" id="m-form">
      <label class="field"><span>Date</span><input type="date" name="date" id="m-date" value="${today()}" required></label>
      <div class="grid2">${MEASURES.map(([k, label, u]) => `
        <label class="field"><span>${label} (${u})</span><input type="number" inputmode="decimal" step="0.1" min="0" name="${k}" id="m-${k}"></label>`).join('')}
      </div>
      <button class="btn primary block" type="submit">Enregistrer la mesure</button>
      <p class="small muted">Remplis seulement ce que tu mesures. Mesure-toi le matin, à jeun, toujours au même endroit.</p>
    </form>
  </section>`;

  if (ms.length) {
    html += `<section>
      <h2 class="section-title">Historique</h2>
      <div class="panel"><div class="table-wrap"><table class="hist">
        <thead><tr><th>Date</th>${MEASURES.map(([, label]) => `<th>${label.replace('Tour de ', '')}</th>`).join('')}<th></th></tr></thead>
        <tbody>${ms.slice().reverse().map(m => `<tr><td class="num">${fmtDate(m.date)}</td>${MEASURES.map(([k]) =>
          `<td class="num">${m[k] != null ? fr(m[k]) : '–'}</td>`).join('')}
          <td><button class="icon-btn" data-mdel="${esc(m.id)}" aria-label="Supprimer la mesure du ${fmtDate(m.date)}">${icon('x')}</button></td></tr>`).join('')}
        </tbody></table></div></div>
    </section>`;
  }
  main.innerHTML = html;

  $('#taille').onchange = e => { state.profile.taille = e.target.value; save(); render(); };
  $('#m-form').onsubmit = e => {
    e.preventDefault();
    const f = e.target;
    const m = { id: uid(), date: f.date.value || today() };
    let any = false;
    for (const [k] of MEASURES) {
      const v = parseFloat(String(f[k].value).replace(',', '.'));
      if (Number.isFinite(v)) { m[k] = v; any = true; }
    }
    if (!any) return toast('Saisis au moins une mesure');
    state.profile.measurements.push(m);
    persist.putMeasure(m); toast('Mesure enregistrée'); render();
  };
  $$('[data-mdel]', main).forEach(b => b.onclick = () => confirmAction('Supprimer cette mesure ?', 'Supprimer', () => {
    state.profile.measurements = state.profile.measurements.filter(m => m.id !== b.dataset.mdel);
    persist.deleteMeasure(b.dataset.mdel); render();
  }));
}

// ---------- Vue : réglages ----------
function renderSettings(main) {
  setTitle('Réglages');
  const nS = state.sessions.length, nM = state.profile.measurements.length;
  const synced = persist.mode === 'db';
  const counts = `<span class="num">${nS}</span> séance${nS > 1 ? 's' : ''} et <span class="num">${nM}</span> mesure${nM > 1 ? 's' : ''}`;
  main.innerHTML = `
    <section>
      <h2 class="section-title">Données</h2>
      <div class="panel" style="display:grid;gap:16px">
        <p class="secondary">${synced
          ? `Tes données (${counts}, et tes séries) sont enregistrées dans ton compte Claude et synchronisées entre ton iPhone et ton PC.
             L'export garde une copie de secours. L'import reprend une sauvegarde, par exemple celle de l'ancienne version de l'appli.`
          : `Tes données (${counts}) restent sur cet appareil. Exporte-les régulièrement, et utilise l'import pour les transférer.`}</p>
        <div class="grid2">
          <button class="btn primary" id="export">Exporter</button>
          <label class="btn">Importer<input type="file" id="import" accept="application/json,.json" hidden></label>
        </div>
      </div>
    </section>
    <section>
      <h2 class="section-title">Réinitialiser</h2>
      <div class="panel" style="display:grid;gap:16px">
        <p class="secondary">${synced ? 'Efface les séances, les mesures et les niveaux personnalisés, sur tous tes appareils' : 'Efface les séances, les mesures et les niveaux personnalisés de cet appareil'}. Pense à exporter avant.</p>
        <div><button class="btn" id="reset" style="color:var(--stop)">Tout effacer</button></div>
      </div>
    </section>
    <p class="small muted num" style="text-align:center">Grease the Groove ${APP_VERSION}</p>`;

  $('#export').onclick = async () => {
    const json = JSON.stringify({ app: 'grease-the-groove', exportedAt: new Date().toISOString(), data: state }, null, 2);
    const name = `gtg-sauvegarde-${today()}.json`;
    const dl = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('downloads').catch(() => null) : null;
    if (dl) {
      try { await dl.save({ filename: name, data: json }); toast('Sauvegarde exportée'); }
      catch (e) { if (e && e.code !== 'declined') toast('Export impossible ici'); }
      return;
    }
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#import').onchange = async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed.data || parsed;
      if (!Array.isArray(data.exercises)) throw new Error('format');
      confirmAction('Remplacer les données de cet appareil par celles du fichier ?', 'Remplacer', () => {
        state = migrate(data);
        persist.replaceAll(state).then(() => toast('Données importées'));
        go('exercices');
      });
    } catch (err) { toast("Ce fichier n'est pas une sauvegarde de l'appli"); }
  };
  $('#reset').onclick = () => confirmAction(synced ? 'Effacer toutes tes données ?' : 'Effacer toutes les données de cet appareil ?', 'Tout effacer', () => {
    state = defaultState();
    persist.replaceAll(state).then(() => toast('Données effacées'));
    go('exercices');
  });
}

// ---------- Démarrage ----------
if (!window.claude) persist.ready = true;
render();
connectStore();
// Hors ligne uniquement pour la version hébergée (GitHub Pages) : un artefact n'a pas de service worker.
if (!window.claude && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
