/* Grease the Groove — suivi callisthénie
 * Appli 100 % locale : les données restent dans le navigateur (localStorage).
 */
'use strict';

const STORAGE_KEY = 'gtg-data-v1';
const APP_VERSION = '0.2.0';

const DAYS = [
  ['lun', 'Lundi'], ['mar', 'Mardi'], ['mer', 'Mercredi'], ['jeu', 'Jeudi'],
  ['ven', 'Vendredi'], ['sam', 'Samedi'], ['dim', 'Dimanche'],
];

const MEASURES = [
  ['poids', 'Poids', 'kg'],
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
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// Niveaux génériques de départ : à remplacer par ceux du livre.
function lvl(name, sets, target, times = 2) { return { name, sets, target, times }; }
function defaultExercises() {
  return [
    { id: 'tractions', name: 'Tractions', unit: 'reps', current: 0, levels: [
      lvl('Tractions australiennes', 3, 10), lvl('Tractions négatives', 3, 5),
      lvl('Tractions classiques', 3, 8) ] },
    { id: 'pompes', name: 'Pompes', unit: 'reps', current: 0, levels: [
      lvl('Pompes inclinées', 3, 12), lvl('Pompes sur les genoux', 3, 12),
      lvl('Pompes classiques', 3, 15) ] },
    { id: 'pistol', name: 'Pistol squat', unit: 'reps', current: 0, levels: [
      lvl('Squat au poids du corps', 3, 20), lvl('Pistol squat assisté', 3, 6),
      lvl('Pistol squat', 3, 5) ] },
    { id: 'gainage', name: 'Gainage', unit: 'sec', current: 0, levels: [
      lvl('Planche sur les genoux', 3, 45), lvl('Planche', 3, 60),
      lvl('Planche bras tendus, une jambe levée', 3, 45) ] },
    { id: 'dips', name: 'Dips', unit: 'reps', current: 0, levels: [
      lvl('Dips sur banc', 3, 12), lvl('Dips négatifs', 3, 5),
      lvl('Dips aux barres parallèles', 3, 8) ] },
    { id: 'lsit', name: 'L-sit', unit: 'sec', current: 0, levels: [
      lvl('Tuck sit (genoux pliés)', 3, 15), lvl('L-sit une jambe tendue', 3, 10),
      lvl('L-sit', 3, 15) ] },
  ];
}

function defaultState() {
  return {
    version: 1,
    exercises: defaultExercises(),
    sessions: [],          // { id, date, exId, level, sets: [n], note }
    profile: { taille: '', measurements: [] }, // measurements: { id, date, poids, bras, ... }
    schedule: { lun: 20, mar: 0, mer: 20, jeu: 0, ven: 20, sam: 30, dim: 0 },
    settings: { levelsReviewed: false },
  };
}

// ---------- Stockage ----------
let state = load();
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { console.warn('Lecture impossible', e); }
  return defaultState();
}
function migrate(s) {
  const d = defaultState();
  return {
    ...d, ...s,
    profile: { ...d.profile, ...(s.profile || {}) },
    schedule: { ...d.schedule, ...(s.schedule || {}) },
    settings: { ...d.settings, ...(s.settings || {}) },
    exercises: Array.isArray(s.exercises) && s.exercises.length ? s.exercises : d.exercises,
    sessions: Array.isArray(s.sessions) ? s.sessions : [],
  };
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { toast('Sauvegarde impossible sur cet appareil'); }
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

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
const setsText = (l, unit) => `${l.sets} × ${l.target} ${unitLabel(unit)}`;
function criterionText(l, unit) {
  return `${setsText(l, unit)}${l.times > 1 ? `, ${l.times} séances d'affilée` : ''}`;
}

// ---------- Feu vert ----------
// Une séance valide le niveau si elle contient au moins `sets` séries ≥ `target`.
// Le feu vert s'allume quand les `times` dernières séances à ce niveau sont toutes valides.
function sessionValid(sess, l) {
  return sess.sets.filter(v => v >= l.target).length >= l.sets;
}
function atLevel(ex) {
  return state.sessions
    .filter(s => s.exId === ex.id && s.level === ex.current)
    .sort((a, b) => (a.date + a.id).localeCompare(b.date + b.id));
}
// state : off (aucune séance), stop (dernière séance non validée), wait (en cours), go (feu vert)
function levelStatus(ex) {
  const l = ex.levels[ex.current];
  if (!l) return { state: 'off', label: 'Aucun niveau' };
  const list = atLevel(ex);
  const need = Math.max(1, l.times || 1);
  if (!list.length) return { state: 'off', label: 'Pas encore de séance à ce niveau', streak: 0, need };
  let streak = 0;
  for (let i = list.length - 1; i >= 0 && sessionValid(list[i], l); i--) streak++;
  const isLast = ex.current >= ex.levels.length - 1;
  if (streak >= need) {
    return isLast
      ? { state: 'go', label: 'Dernier niveau maîtrisé', streak, need, done: true }
      : { state: 'go', label: 'Feu vert pour le niveau suivant', streak, need, green: true };
  }
  if (!streak) return { state: 'stop', label: `Critère pas encore atteint, 0 sur ${need}`, streak, need };
  return { state: 'wait', label: `${streak} séance validée sur ${need}`, streak, need };
}
const signal = (st, lg = false) =>
  `<span class="signal${lg ? ' lg' : ''}" data-state="${st.state}" role="img" aria-label="${esc(st.label)}"><i></i><i></i><i></i></span>`;

// ---------- Navigation ----------
let route = { tab: 'exercices', view: null, id: null };
function go(tab, view = null, id = null) {
  route = { tab, view, id };
  render();
  window.scrollTo(0, 0);
}
$$('.tabbar button').forEach(b => {
  b.insertAdjacentHTML('afterbegin', icon(b.dataset.icon));
  b.addEventListener('click', () => go(b.dataset.tab));
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
  if (route.tab === 'exercices' && route.view === 'ex') return renderExercise(main, route.id);
  if (route.tab === 'exercices') return renderExercises(main);
  if (route.tab === 'plan') return renderPlan(main);
  if (route.tab === 'profil') return renderProfile(main);
  if (route.tab === 'reglages') return renderSettings(main);
}

// ---------- Vue : liste des exercices ----------
function renderExercises(main) {
  setTitle('Exercices');
  const greens = state.exercises.filter(e => levelStatus(e).green).length;
  let html = '';
  if (!state.settings.levelsReviewed) {
    html += `<div class="notice">
      <p><strong>Niveaux à personnaliser.</strong> Les niveaux et critères de départ sont génériques.
      Remplace-les par ceux de ton livre depuis la fiche de chaque exercice, avec « Modifier ».</p>
      <div><button class="btn sm" id="dismiss-levels">C'est fait</button></div>
    </div>`;
  }
  html += `<section>
    <h2 class="section-title"><span>Les six bases</span><span class="num">${greens ? `${greens} feu${greens > 1 ? 'x' : ''} vert${greens > 1 ? 's' : ''}` : ''}</span></h2>
    <div class="panel list">${state.exercises.map(ex => {
      const l = ex.levels[ex.current];
      const st = levelStatus(ex);
      return `<a class="ex-row" href="#" data-ex="${esc(ex.id)}">
        ${signal(st)}
        <div class="grow">
          <div class="row" style="gap:8px;align-items:baseline">
            <span class="name grow">${esc(ex.name)}</span>
            <span class="num small muted">N${ex.current + 1}/${ex.levels.length}</span>
          </div>
          <div class="small secondary">${l ? esc(l.name) : '—'}${l ? ` · <span class="num">${esc(setsText(l, ex.unit))}</span>` : ''}</div>
          <div class="rungs" aria-hidden="true">${ex.levels.map((_, i) =>
            `<span class="${i < ex.current || (i === ex.current && st.done) ? 'done' : i === ex.current ? 'current' + (st.green ? ' go' : '') : ''}"></span>`).join('')}</div>
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
function renderExercise(main, id) {
  const ex = exById(id);
  if (!ex) return go('exercices');
  setTitle(ex.name, () => go('exercices'));
  const l = ex.levels[ex.current];
  const st = levelStatus(ex);
  const sessions = state.sessions.filter(s => s.exId === ex.id)
    .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const nSets = l ? Math.max(l.sets, 1) : 3;
  const next = ex.levels[ex.current + 1];

  let html = `<div class="level-head">
    <div class="small muted num">Niveau ${ex.current + 1} sur ${ex.levels.length}</div>
    <h2>${l ? esc(l.name) : 'Aucun niveau défini'}</h2>
    ${l ? `<div class="secondary">Objectif <span class="num">${esc(criterionText(l, ex.unit))}</span></div>` : ''}
  </div>`;

  html += `<div class="panel" style="display:grid;gap:16px">
    <div class="status${st.state === 'go' ? ' go' : ''}">${signal(st, true)}<div class="grow">
      <div style="font-weight:500">${esc(st.label)}</div>
      ${st.green ? `<div class="small secondary">Prochain niveau : ${esc(next.name)}</div>` : ''}
      ${st.done ? `<div class="small secondary">Ajoute un niveau avec « Modifier » pour continuer.</div>` : ''}
      ${!st.green && !st.done && l ? `<div class="small secondary">Il faut ${l.sets} séries d'au moins <span class="num">${l.target} ${unitLabel(ex.unit)}</span> dans une même séance.</div>` : ''}
    </div></div>
    ${st.green ? `<button class="btn go block" id="level-up">Passer à ${esc(next.name)}</button>` : ''}
  </div>`;

  html += `<section>
    <h2 class="section-title">Enregistrer une séance</h2>
    <form class="panel form" id="log-form">
      <div class="field"><span>Séries en ${unitLong(ex.unit)}</span>
        <div class="sets" id="sets">${Array.from({ length: nSets }, (_, i) =>
          `<input type="number" inputmode="numeric" min="0" step="1" placeholder="${i + 1}" aria-label="Série ${i + 1}" id="set-${i}">`).join('')}
          <button type="button" class="btn" id="add-set" aria-label="Ajouter une série">${icon('plus')}</button>
        </div>
      </div>
      <div class="grid2">
        <label class="field"><span>Date</span><input type="date" name="date" id="log-date" value="${today()}" required></label>
        <label class="field"><span>Note</span><input type="text" name="note" id="log-note" placeholder="Facultatif"></label>
      </div>
      <button class="btn primary block" type="submit" ${l ? '' : 'disabled'}>Enregistrer</button>
    </form>
  </section>`;

  html += `<section>
    <h2 class="section-title">Progression au niveau actuel</h2>
    <div class="panel">${chartForLevel(ex)}</div>
  </section>`;

  html += `<section>
    <h2 class="section-title"><span>Niveaux</span><button class="btn sm" id="edit-levels">Modifier</button></h2>
    <div class="panel"><ol class="ladder">${ex.levels.map((lv, i) => {
      const done = i < ex.current || (i === ex.current && st.done);
      return `<li class="${done ? 'done' : i === ex.current ? 'current' + (st.green ? ' go' : '') : ''}">
        <span class="rung">${done ? icon('check') : i + 1}</span>
        <div class="grow"><div class="lname">${esc(lv.name)}</div><div class="small muted num">${esc(criterionText(lv, ex.unit))}</div></div>
      </li>`;
    }).join('')}</ol></div>
  </section>`;

  html += `<section>
    <h2 class="section-title">Historique</h2>
    <div class="panel">${sessions.length ? `<div class="table-wrap"><table class="hist">
      <thead><tr><th>Date</th><th>Niv.</th><th>Séries</th><th><span class="sr">Supprimer</span></th></tr></thead><tbody>
      ${sessions.slice(0, 50).map(s => {
        const lv = ex.levels[s.level];
        const ok = lv && sessionValid(s, lv);
        return `<tr>
          <td class="num">${fmtDate(s.date)}</td>
          <td class="num">${s.level >= 0 ? s.level + 1 : '–'}</td>
          <td style="white-space:normal"><span class="num">${s.sets.join(' · ')}</span>${ok ? ` <span class="small ok">validée</span>` : ''}
            ${s.note ? `<div class="small muted">${esc(s.note)}</div>` : ''}</td>
          <td><button class="icon-btn" data-del="${esc(s.id)}" aria-label="Supprimer la séance du ${fmtDate(s.date)}">${icon('x')}</button></td>
        </tr>`;
      }).join('')}</tbody></table></div>` : `<p class="empty">Aucune séance pour l'instant.</p>`}
    </div>
  </section>`;

  main.innerHTML = html;

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
    if (!sets.length) return toast('Saisis au moins une série');
    const f = e.target;
    const before = levelStatus(ex);
    state.sessions.push({ id: uid(), date: f.date.value || today(), exId: ex.id, level: ex.current, sets, note: f.note.value.trim() });
    save();
    const after = levelStatus(ex);
    toast(after.green && !before.green ? 'Feu vert : tu peux tester le niveau suivant' : 'Séance enregistrée');
    render();
  };
  const up = $('#level-up');
  if (up) up.onclick = () => { ex.current++; save(); toast('Nouveau niveau : ' + ex.levels[ex.current].name); render(); };
  $('#edit-levels').onclick = () => editLevels(ex);
  $$('[data-del]', main).forEach(b => b.onclick = () => confirmAction('Supprimer cette séance ?', 'Supprimer', () => {
    state.sessions = state.sessions.filter(s => s.id !== b.dataset.del);
    save(); render();
  }));
}

// Graphique : meilleure série de chaque séance au niveau actuel, avec la ligne d'objectif.
function chartForLevel(ex) {
  const l = ex.levels[ex.current];
  const list = atLevel(ex);
  if (!l || list.length < 2) {
    return `<p class="empty">La courbe apparaîtra après deux séances à ce niveau. La ligne verte marquera l'objectif de ${l ? `${l.target} ${unitLabel(ex.unit)}` : 'ce niveau'}.</p>`;
  }
  return lineChart(list.map(s => ({ x: s.date, y: Math.max(...s.sets) })), {
    target: l.target, unit: unitLabel(ex.unit), label: `Meilleure série par séance, objectif ${l.target} ${unitLabel(ex.unit)}`,
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
  const step = niceStep(max - min || Math.max(1, max * 0.2));
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
    const u = draft.unit === 'sec' ? 'Secondes' : 'Rép.';
    openModal(`
      <h2>Modifier ${esc(ex.name)}</h2>
      <div class="grid2">
        <label class="field"><span>Nom de l'exercice</span><input id="ed-name" value="${esc(draft.name)}"></label>
        <label class="field"><span>Mesuré en</span><select id="ed-unit">
          <option value="reps" ${draft.unit === 'reps' ? 'selected' : ''}>Répétitions</option>
          <option value="sec" ${draft.unit === 'sec' ? 'selected' : ''}>Secondes</option></select></label>
      </div>
      <p class="small secondary">Pour chaque niveau : le nombre de séries, ${draft.unit === 'sec' ? 'les secondes' : 'les répétitions'} par série,
      et le nombre de séances d'affilée à réussir pour obtenir le feu vert.</p>
      ${draft.levels.map((l, i) => `
        <div class="level-edit" data-i="${i}">
          <div class="head"><strong>Niveau ${i + 1}${i === draft.current ? ' · actuel' : ''}</strong>
            <button class="icon-btn" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Monter">${icon('up')}</button>
            <button class="icon-btn" data-act="down" ${i === draft.levels.length - 1 ? 'disabled' : ''} aria-label="Descendre">${icon('down')}</button>
            <button class="icon-btn" data-act="del" ${draft.levels.length <= 1 ? 'disabled' : ''} aria-label="Supprimer">${icon('x')}</button>
          </div>
          ${pendingDelete === i ? `<div class="actions"><button class="btn sm" data-act="keep">Garder</button><button class="btn sm primary" data-act="confirm-del">Supprimer ce niveau</button></div>` : ''}
          <label class="field"><span>Nom</span><input data-k="name" id="ed-${i}-name" value="${esc(l.name)}"></label>
          <div class="grid3">
            <label class="field"><span>Séries</span><input data-k="sets" id="ed-${i}-sets" type="number" inputmode="numeric" min="1" value="${l.sets}"></label>
            <label class="field"><span>${u} par série</span><input data-k="target" id="ed-${i}-target" type="number" inputmode="numeric" min="1" value="${l.target}"></label>
            <label class="field"><span>Séances</span><input data-k="times" id="ed-${i}-times" type="number" inputmode="numeric" min="1" value="${l.times}"></label>
          </div>
          ${i !== draft.current ? `<div><button class="btn sm" data-act="cur">En faire mon niveau actuel</button></div>` : ''}
        </div>`).join('')}
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
          l[k] = k === 'name' ? inp.value : Math.max(1, parseInt(inp.value, 10) || 1);
        });
      });
    };
    $('#ed-unit').onchange = e => { sync(); draft.unit = e.target.value; draw(); };
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
      draft.levels.push(lvl('Nouveau niveau', last ? last.sets : 3, last ? last.target : 8, last ? last.times : 2));
      draw();
    };
    $('#ed-cancel').onclick = closeModal;
    $('#ed-save').onclick = () => {
      sync();
      draft.levels.forEach(l => { l.name = l.name.trim() || 'Niveau sans nom'; });
      // Les séances gardent l'index de leur niveau : on le remappe si l'ordre a changé
      // (-1 si le niveau a été supprimé : la séance reste dans l'historique).
      const map = {};
      draft.levels.forEach((l, i) => { if (l._src != null) map[l._src] = i; delete l._src; });
      state.sessions.forEach(s => { if (s.exId === ex.id) s.level = s.level in map ? map[s.level] : -1; });
      Object.assign(ex, { name: draft.name, unit: draft.unit, current: draft.current, levels: draft.levels });
      save(); closeModal(); toast('Niveaux enregistrés'); render();
    };
  };
  draw();
}

// ---------- Vue : plan hebdomadaire ----------
const WARMUP = 5;     // minutes
const BLOCK = 5;      // minutes par exercice dans une séance
function buildPlan() {
  const count = Object.fromEntries(state.exercises.map(e => [e.id, 0]));
  let cursor = 0;
  return DAYS.map(([key, label]) => {
    const min = Math.max(0, parseInt(state.schedule[key], 10) || 0);
    if (!min) return { key, label, min, items: [], kind: 'repos' };
    let n, kind;
    if (min >= WARMUP + BLOCK) { n = Math.floor((min - WARMUP) / BLOCK); kind = 'seance'; }
    else { n = Math.max(1, Math.floor(min / 5)); kind = 'gtg'; }
    n = Math.min(n, state.exercises.length);
    // Choix : les exercices les moins travaillés jusqu'ici dans la semaine, en tournant.
    const order = state.exercises.map((e, i) => ({ e, i: (i - cursor + state.exercises.length) % state.exercises.length }))
      .sort((a, b) => count[a.e.id] - count[b.e.id] || a.i - b.i).slice(0, n).map(o => o.e);
    order.forEach(e => count[e.id]++);
    cursor = (cursor + n) % state.exercises.length;
    return { key, label, min, items: order, kind };
  });
}
function grooveReps(ex) {
  const l = ex.levels[ex.current];
  if (!l) return '';
  return `${Math.max(1, Math.round(l.target * 0.6))} ${unitLabel(ex.unit)}`;
}
function renderPlan(main) {
  setTitle('Plan de la semaine');
  const total = DAYS.reduce((t, [k]) => t + (parseInt(state.schedule[k], 10) || 0), 0);
  const plan = buildPlan();
  const counts = Object.fromEntries(state.exercises.map(e => [e.id, 0]));
  plan.forEach(d => d.items.forEach(e => counts[e.id]++));
  const missing = state.exercises.filter(e => !counts[e.id]);

  main.innerHTML = `
    <section>
      <h2 class="section-title"><span>La semaine</span><span class="num">${total} min</span></h2>
      <div class="panel list">${plan.map(d => `
        <div class="plan-day${d.kind === 'repos' ? ' rest' : ''}">
          <div class="row"><span class="dname grow" style="font-weight:500">${d.label}</span>
            <span class="small muted">${d.kind === 'repos' ? 'Repos' : d.kind === 'gtg' ? 'Séries dans la journée' : `Échauffement ${WARMUP} min`}</span></div>
          ${d.items.length ? `<ul>${d.items.map(e => `<li><span>${esc(e.name)}</span>
            <span class="small muted">${esc(e.levels[e.current]?.name || '')}</span>
            <span class="num">${grooveReps(e)}</span></li>`).join('')}</ul>` : ''}
        </div>`).join('')}
      </div>
      <p class="small muted" style="padding:0 4px">Séries faciles, à environ 60 % de l'objectif du niveau et loin de l'échec, pour accumuler du volume sans fatigue.
      Fais le test du niveau un jour où tu te sens frais.</p>
      ${missing.length ? `<p class="small" style="padding:0 4px;color:var(--wait)">Pas assez de temps cette semaine pour : ${missing.map(e => esc(e.name)).join(', ')}.</p>` : ''}
    </section>

    <section>
      <h2 class="section-title">Temps disponible</h2>
      <form class="panel list" id="sched">${DAYS.map(([k, label]) => `
        <label class="day"><span class="dname">${label}</span>
          <input type="number" inputmode="numeric" min="0" step="5" name="${k}" id="sched-${k}" value="${esc(state.schedule[k])}" aria-label="Minutes le ${label}">
          <span class="small muted">min</span></label>`).join('')}
      </form>
      <p class="small muted" style="padding:0 4px">0 pour un jour de repos. Le plan se met à jour dès que tu changes une valeur.</p>
    </section>`;

  $$('#sched input').forEach(inp => inp.addEventListener('change', () => {
    state.schedule[inp.name] = Math.max(0, parseInt(inp.value, 10) || 0);
    save(); render();
  }));
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
    save(); toast('Mesure enregistrée'); render();
  };
  $$('[data-mdel]', main).forEach(b => b.onclick = () => confirmAction('Supprimer cette mesure ?', 'Supprimer', () => {
    state.profile.measurements = state.profile.measurements.filter(m => m.id !== b.dataset.mdel);
    save(); render();
  }));
}

// ---------- Vue : réglages ----------
function renderSettings(main) {
  setTitle('Réglages');
  const nS = state.sessions.length, nM = state.profile.measurements.length;
  main.innerHTML = `
    <section>
      <h2 class="section-title">Sauvegarde</h2>
      <div class="panel" style="display:grid;gap:16px">
        <p class="secondary">Tes données restent sur cet appareil : <span class="num">${nS}</span> séance${nS > 1 ? 's' : ''} et <span class="num">${nM}</span> mesure${nM > 1 ? 's' : ''}.
        Exporte-les régulièrement, et utilise l'import pour passer de ton iPhone à ton PC.</p>
        <div class="grid2">
          <button class="btn primary" id="export">Exporter</button>
          <label class="btn">Importer<input type="file" id="import" accept="application/json,.json" hidden></label>
        </div>
      </div>
    </section>
    <section>
      <h2 class="section-title">Installer sur iPhone</h2>
      <div class="panel"><p class="secondary">Dans Safari, touche Partager puis « Sur l'écran d'accueil ». L'appli s'ouvre alors en plein écran et marche hors ligne.
      Ouvre-la toujours depuis cette icône : c'est là que tes données sont conservées.</p></div>
    </section>
    <section>
      <h2 class="section-title">Réinitialiser</h2>
      <div class="panel" style="display:grid;gap:16px">
        <p class="secondary">Efface les séances, les mesures et les niveaux personnalisés de cet appareil. Pense à exporter avant.</p>
        <div><button class="btn" id="reset" style="color:var(--stop)">Tout effacer</button></div>
      </div>
    </section>
    <p class="small muted num" style="text-align:center">Grease the Groove ${APP_VERSION}</p>`;

  $('#export').onclick = async () => {
    const json = JSON.stringify({ app: 'grease-the-groove', exportedAt: new Date().toISOString(), data: state }, null, 2);
    const name = `gtg-sauvegarde-${today()}.json`;
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
        state = migrate(data); save(); toast('Données importées'); go('exercices');
      });
    } catch (err) { toast("Ce fichier n'est pas une sauvegarde de l'appli"); }
  };
  $('#reset').onclick = () => confirmAction('Effacer toutes les données de cet appareil ?', 'Tout effacer', () => {
    state = defaultState(); save(); toast('Données effacées'); go('exercices');
  });
}

// ---------- Démarrage ----------
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
