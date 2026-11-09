/* Grease the Groove — suivi callisthénie V0
 * Appli 100 % locale : les données restent dans le navigateur (localStorage).
 */
'use strict';

const STORAGE_KEY = 'gtg-data-v1';
const APP_VERSION = '0.1.0';

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
const unitLabel = u => (u === 'sec' ? 's' : 'rép.');
const unitLong = u => (u === 'sec' ? 'secondes' : 'répétitions');
function toast(msg) {
  $$('.toast').forEach(x => x.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
const exById = id => state.exercises.find(e => e.id === id);
function criterionText(l, unit) {
  const n = l.times > 1 ? `, sur ${l.times} séances d'affilée` : '';
  return `${l.sets} × ${l.target} ${unitLabel(unit)}${n}`;
}

// ---------- Feu vert ----------
// Une séance valide le niveau si elle contient au moins `sets` séries ≥ `target`.
// Le feu vert s'allume quand les `times` dernières séances à ce niveau sont toutes valides.
function sessionValid(sess, l) {
  return sess.sets.filter(v => v >= l.target).length >= l.sets;
}
function levelStatus(ex) {
  const l = ex.levels[ex.current];
  if (!l) return { kind: 'grey', label: 'Aucun niveau' };
  const atLevel = state.sessions
    .filter(s => s.exId === ex.id && s.level === ex.current)
    .sort((a, b) => (a.date + a.id).localeCompare(b.date + b.id));
  if (!atLevel.length) return { kind: 'grey', label: 'Pas encore de séance', streak: 0 };
  let streak = 0;
  for (let i = atLevel.length - 1; i >= 0 && sessionValid(atLevel[i], l); i--) streak++;
  const need = Math.max(1, l.times || 1);
  const isLast = ex.current >= ex.levels.length - 1;
  if (streak >= need) {
    return isLast
      ? { kind: 'green', label: 'Niveau final maîtrisé', streak, need, done: true }
      : { kind: 'green', label: 'Feu vert', streak, need, green: true };
  }
  return { kind: 'orange', label: `${streak}/${need} séance${need > 1 ? 's' : ''} validée${streak > 1 ? 's' : ''}`, streak, need };
}
function badge(st) {
  const dot = st.kind === 'green' ? '🟢' : st.kind === 'orange' ? '🟠' : '⚪';
  return `<span class="badge ${st.kind}">${dot} ${esc(st.label)}</span>`;
}

// ---------- Navigation ----------
let route = { tab: 'exercices', view: null, id: null };
function go(tab, view = null, id = null) {
  route = { tab, view, id };
  render();
  window.scrollTo(0, 0);
}
$$('.tabbar button').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));

function setTitle(text, backTo) {
  const bar = $('.topbar');
  bar.innerHTML = (backTo ? `<button class="back" id="back">‹ Retour</button>` : '') +
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
  let html = '';
  if (!state.settings.levelsReviewed) {
    html += `<div class="card">
      <h2>Niveaux à personnaliser</h2>
      <p class="muted">Les niveaux et critères de passage ci-dessous sont génériques. Remplace-les par ceux de ton livre :
      ouvre un exercice puis « Modifier les niveaux ».</p>
      <button class="btn sm" id="dismiss-levels">C'est fait, masquer ce message</button>
    </div>`;
  }
  for (const ex of state.exercises) {
    const l = ex.levels[ex.current];
    const st = levelStatus(ex);
    const pct = ex.levels.length ? Math.round(((ex.current + (st.done ? 1 : 0)) / ex.levels.length) * 100) : 0;
    html += `<div class="card ex-card" data-ex="${esc(ex.id)}" role="button" tabindex="0">
      <div class="row between"><h2>${esc(ex.name)}</h2>${badge(st)}</div>
      <div class="level">${l ? esc(l.name) : '—'}</div>
      <div class="muted small">Niveau ${ex.current + 1}/${ex.levels.length}${l ? ' · objectif ' + esc(criterionText(l, ex.unit)) : ''}</div>
      <div class="progress"><div style="width:${pct}%"></div></div>
    </div>`;
  }
  main.innerHTML = html;
  const d = $('#dismiss-levels');
  if (d) d.onclick = () => { state.settings.levelsReviewed = true; save(); render(); };
  $$('.ex-card', main).forEach(c => {
    const open = () => go('exercices', 'ex', c.dataset.ex);
    c.onclick = open;
    c.onkeydown = e => { if (e.key === 'Enter') open(); };
  });
}

// ---------- Vue : détail d'un exercice ----------
function renderExercise(main, id) {
  const ex = exById(id);
  if (!ex) return go('exercices');
  setTitle(ex.name, () => go('exercices'));
  const l = ex.levels[ex.current];
  const st = levelStatus(ex);
  const sessions = state.sessions.filter(s => s.exId === ex.id)
    .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const nSets = l ? Math.max(l.sets, 1) : 3;

  let html = `<div class="card">
    <div class="row between wrap"><div class="muted small">Niveau ${ex.current + 1}/${ex.levels.length}</div>${badge(st)}</div>
    <h2 style="margin-top:6px">${l ? esc(l.name) : 'Aucun niveau défini'}</h2>
    ${l ? `<div class="muted">Critère de passage : ${esc(criterionText(l, ex.unit))}</div>` : ''}
    ${st.green ? `<p>Tu as validé ce niveau. Teste le suivant : <strong>${esc(ex.levels[ex.current + 1].name)}</strong>.</p>
      <button class="btn go block" id="level-up">Passer au niveau suivant</button>` : ''}
    ${st.done ? `<p>Bravo, tu maîtrises le dernier niveau de cet exercice. Tu peux en ajouter un dans « Modifier les niveaux ».</p>` : ''}
  </div>`;

  html += `<div class="card">
    <h2>Enregistrer une séance</h2>
    <div class="muted small">Saisis tes séries en ${unitLong(ex.unit)}${l ? ` au niveau « ${esc(l.name)} »` : ''}.</div>
    <form id="log-form">
      <div class="sets" id="sets">${Array.from({ length: nSets }, (_, i) =>
        `<input type="number" inputmode="numeric" min="0" step="1" placeholder="S${i + 1}" aria-label="Série ${i + 1}">`).join('')}
        <button type="button" class="btn sm" id="add-set" aria-label="Ajouter une série">＋</button>
      </div>
      <div class="grid2">
        <label class="field"><span>Date</span><input type="date" name="date" value="${today()}" required></label>
        <label class="field"><span>Note (optionnel)</span><input type="text" name="note" placeholder="Ressenti, forme…"></label>
      </div>
      <button class="btn primary block" type="submit" ${l ? '' : 'disabled'}>Enregistrer</button>
    </form>
  </div>`;

  html += `<div class="card">
    <div class="row between"><h2>Niveaux</h2><button class="btn sm" id="edit-levels">Modifier les niveaux</button></div>
    <ol class="level-list">${ex.levels.map((lv, i) => `
      <li class="${i < ex.current || (i === ex.current && st.done) ? 'done' : i === ex.current ? 'current' : ''}">
        <span class="num">${i < ex.current || (i === ex.current && st.done) ? '✓' : i + 1}</span>
        <div class="grow"><div>${esc(lv.name)}</div><div class="muted small">${esc(criterionText(lv, ex.unit))}</div></div>
      </li>`).join('')}
    </ol>
  </div>`;

  html += `<div class="card"><h2>Progression</h2>${sessionsChart(ex, sessions)}</div>`;

  html += `<div class="card"><h2>Historique</h2>${sessions.length ? `
    <table class="hist"><thead><tr><th>Date</th><th>Niveau</th><th>Séries</th><th></th></tr></thead><tbody>
    ${sessions.slice(0, 50).map(s => {
      const lv = ex.levels[s.level];
      const ok = lv && sessionValid(s, lv);
      return `<tr>
        <td>${fmtDate(s.date)}</td>
        <td>${s.level >= 0 ? s.level + 1 : '–'}${ok ? ' ✓' : ''}</td>
        <td>${s.sets.join(' · ')}${s.note ? `<div class="muted small">${esc(s.note)}</div>` : ''}</td>
        <td><button class="btn sm danger" data-del="${esc(s.id)}" aria-label="Supprimer">✕</button></td>
      </tr>`;
    }).join('')}</tbody></table>` : `<p class="muted empty">Aucune séance pour l'instant.</p>`}
  </div>`;

  main.innerHTML = html;

  $('#add-set').onclick = () => {
    const n = $$('#sets input').length + 1;
    const inp = document.createElement('input');
    Object.assign(inp, { type: 'number', min: 0, step: 1, placeholder: 'S' + n });
    inp.inputMode = 'numeric';
    inp.setAttribute('aria-label', 'Série ' + n);
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
    toast(after.green && !before.green ? '🟢 Feu vert : tu peux tester le niveau suivant !' : 'Séance enregistrée');
    render();
  };
  const up = $('#level-up');
  if (up) up.onclick = () => { ex.current++; save(); toast('Nouveau niveau : ' + ex.levels[ex.current].name); render(); };
  $('#edit-levels').onclick = () => editLevels(ex);
  $$('[data-del]', main).forEach(b => b.onclick = () => {
    if (!confirm('Supprimer cette séance ?')) return;
    state.sessions = state.sessions.filter(s => s.id !== b.dataset.del);
    save(); render();
  });
}

// Graphique simple : meilleure série par séance (toutes séances, tous niveaux).
function sessionsChart(ex, sessions) {
  const pts = sessions.slice().reverse().map(s => ({ date: s.date, v: Math.max(...s.sets), level: s.level }));
  if (pts.length < 2) return `<p class="muted empty">Le graphique apparaîtra après 2 séances.</p>`;
  return lineChart(pts.map(p => ({ x: p.date, y: p.v })), `Meilleure série (${unitLabel(ex.unit)})`);
}

function lineChart(points, label) {
  const W = 320, H = 140, P = { l: 30, r: 8, t: 14, b: 18 };
  const ys = points.map(p => p.y);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const x = i => P.l + (i * (W - P.l - P.r)) / (points.length - 1);
  const y = v => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const fmt = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}">
    <line class="axis" x1="${P.l}" x2="${W - P.r}" y1="${H - P.b}" y2="${H - P.b}"/>
    <text x="0" y="${y(max) + 3}">${fmt(max)}</text><text x="0" y="${y(min) + 3}">${fmt(min)}</text>
    <path class="line" d="${d}" vector-effect="non-scaling-stroke"/>
    ${points.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p.y)}" r="2.5"/>`).join('')}
    <text x="${P.l}" y="${H - 4}">${fmtDate(points[0].x)}</text>
    <text x="${W - P.r}" y="${H - 4}" text-anchor="end">${fmtDate(points[points.length - 1].x)}</text>
  </svg><div class="muted small">${esc(label)}</div>`;
}

// ---------- Modale : édition des niveaux ----------
function openModal(html) {
  const dlg = $('#modal');
  $('#modal-body').innerHTML = html;
  if (!dlg.open) dlg.showModal();
  return dlg;
}
function closeModal() { $('#modal').close(); }

function editLevels(ex) {
  let draft = { name: ex.name, unit: ex.unit, current: ex.current, levels: ex.levels.map((l, i) => ({ ...l, _src: i })) };
  const draw = () => {
    openModal(`
      <h2 style="margin-top:0">Modifier « ${esc(ex.name)} »</h2>
      <div class="grid2">
        <label class="field"><span>Nom de l'exercice</span><input id="ed-name" value="${esc(draft.name)}"></label>
        <label class="field"><span>Mesuré en</span><select id="ed-unit">
          <option value="reps" ${draft.unit === 'reps' ? 'selected' : ''}>Répétitions</option>
          <option value="sec" ${draft.unit === 'sec' ? 'selected' : ''}>Secondes</option></select></label>
      </div>
      <p class="muted small">Pour chaque niveau : nombre de séries, ${draft.unit === 'sec' ? 'secondes' : 'répétitions'} par série,
      et nombre de séances d'affilée à réussir pour obtenir le feu vert.</p>
      <div id="ed-levels">${draft.levels.map((l, i) => `
        <div class="card" data-i="${i}" style="padding:10px">
          <div class="row"><strong class="grow">Niveau ${i + 1}${i === draft.current ? ' · actuel' : ''}</strong>
            <button class="btn sm" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Monter">↑</button>
            <button class="btn sm" data-act="down" ${i === draft.levels.length - 1 ? 'disabled' : ''} aria-label="Descendre">↓</button>
            <button class="btn sm danger" data-act="del" ${draft.levels.length <= 1 ? 'disabled' : ''} aria-label="Supprimer">✕</button>
          </div>
          <label class="field" style="margin-top:8px"><span>Nom</span><input data-k="name" value="${esc(l.name)}"></label>
          <div class="grid3">
            <label class="field"><span>Séries</span><input data-k="sets" type="number" inputmode="numeric" min="1" value="${l.sets}"></label>
            <label class="field"><span>${draft.unit === 'sec' ? 'Secondes' : 'Rép.'}/série</span><input data-k="target" type="number" inputmode="numeric" min="1" value="${l.target}"></label>
            <label class="field"><span>Séances</span><input data-k="times" type="number" inputmode="numeric" min="1" value="${l.times}"></label>
          </div>
          ${i !== draft.current ? `<button class="btn sm" data-act="cur">Définir comme niveau actuel</button>` : ''}
        </div>`).join('')}
      </div>
      <button class="btn block" id="ed-add">＋ Ajouter un niveau</button>
      <div class="row" style="margin-top:12px">
        <button class="btn grow" id="ed-cancel">Annuler</button>
        <button class="btn primary grow" id="ed-save">Enregistrer</button>
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
      } else if (act === 'del') {
        if (!confirm(`Supprimer le niveau « ${L[i].name} » ?`)) return;
        L.splice(i, 1);
        if (draft.current > i || draft.current >= L.length) draft.current = Math.max(0, draft.current - 1);
      } else if (act === 'cur') draft.current = i;
      draw();
    });
    $('#ed-add').onclick = () => { sync(); const last = draft.levels[draft.levels.length - 1]; draft.levels.push(lvl('Nouveau niveau', last ? last.sets : 3, last ? last.target : 8, last ? last.times : 2)); draw(); };
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
const BLOCK = 5;     // minutes par exercice dans une séance
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
  const v = Math.max(1, Math.round(l.target * 0.6));
  return `${v} ${unitLabel(ex.unit)}`;
}
function renderPlan(main) {
  setTitle('Plan de la semaine');
  const total = DAYS.reduce((t, [k]) => t + (parseInt(state.schedule[k], 10) || 0), 0);
  let html = `<div class="card">
    <h2>Temps disponible</h2>
    <p class="muted small">Indique combien de minutes tu peux consacrer à l'entraînement chaque jour (0 = repos).</p>
    <form id="sched">${DAYS.map(([k, label]) => `
      <div class="day"><span class="name">${label}</span>
        <input type="number" inputmode="numeric" min="0" step="5" name="${k}" value="${esc(state.schedule[k])}" aria-label="Minutes le ${label}">
        <span class="muted small">min</span></div>`).join('')}
    </form>
    <div class="muted small" style="margin-top:6px">Total : ${total} min par semaine</div>
  </div>`;

  const plan = buildPlan();
  const counts = Object.fromEntries(state.exercises.map(e => [e.id, 0]));
  plan.forEach(d => d.items.forEach(e => counts[e.id]++));
  html += plan.map(d => `<div class="card plan-day">
    <div class="row between"><h3>${d.label}</h3><span class="muted small">${d.min ? d.min + ' min' : 'Repos'}</span></div>
    ${d.kind === 'repos' ? `<div class="muted small">Récupération.</div>` : d.kind === 'gtg'
      ? `<div class="muted small">Mini-séances « Grease the Groove » : quelques séries faciles réparties dans la journée, sans échauffement long.</div>`
      : `<div class="muted small">Échauffement ${WARMUP} min, puis environ ${BLOCK} min par exercice.</div>`}
    ${d.items.length ? `<ul>${d.items.map(e => `<li><strong>${esc(e.name)}</strong> · ${esc(e.levels[e.current]?.name || '')}
      <span class="muted small">— séries de ~${grooveReps(e)}, loin de l'échec</span></li>`).join('')}</ul>` : ''}
  </div>`).join('');

  const missing = state.exercises.filter(e => !counts[e.id]);
  html += `<div class="card"><p class="muted small">Plan générique : chaque exercice est travaillé à environ 60 % de l'objectif du niveau,
    pour accumuler du volume de qualité sans fatigue (principe du Grease the Groove).
    Teste ton niveau (séance enregistrée dans l'onglet Exercices) quand tu te sens frais.</p>
    ${missing.length ? `<p class="small" style="color:var(--orange)">Pas assez de temps cette semaine pour : ${missing.map(e => esc(e.name)).join(', ')}.</p>` : ''}
  </div>`;
  main.innerHTML = html;

  $$('#sched input').forEach(inp => inp.addEventListener('change', () => {
    state.schedule[inp.name] = Math.max(0, parseInt(inp.value, 10) || 0);
    save(); render();
  }));
}

// ---------- Vue : profil ----------
function renderProfile(main) {
  setTitle('Profil');
  const ms = state.profile.measurements.slice().sort((a, b) => a.date.localeCompare(b.date));
  const last = ms[ms.length - 1], first = ms[0];
  // Pour chaque mesure : sa valeur la plus récente et l'écart depuis la première.
  const series = k => ms.filter(m => m[k] != null);
  const latest = Object.fromEntries(MEASURES.map(([k]) => { const s = series(k); return [k, s[s.length - 1]]; }));
  const delta = k => {
    const s = series(k);
    if (s.length < 2) return '';
    const d = Math.round((s[s.length - 1][k] - s[0][k]) * 10) / 10;
    return `<span class="muted small">(${d > 0 ? '+' : ''}${String(d).replace('.', ',')} depuis le ${fmtDate(s[0].date)})</span>`;
  };
  let imc = '';
  const t = parseFloat(state.profile.taille);
  if (t && latest.poids) imc = (latest.poids.poids / ((t / 100) ** 2)).toFixed(1).replace('.', ',');

  let html = `<div class="card">
    <h2>Taille</h2>
    <div class="row"><input id="taille" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(state.profile.taille)}" style="max-width:120px" aria-label="Taille en cm"><span class="muted">cm</span>
    ${imc ? `<span class="muted small grow" style="text-align:right">IMC ${imc}</span>` : ''}</div>
  </div>`;

  if (last) {
    html += `<div class="card"><h2>Dernières mesures</h2>
      <table class="hist"><tbody>${MEASURES.filter(([k]) => latest[k]).map(([k, label, u]) =>
        `<tr><td>${label}</td><td><strong>${String(latest[k][k]).replace('.', ',')} ${u}</strong>
        <span class="muted small">le ${fmtDate(latest[k].date)}</span><br>${delta(k)}</td></tr>`).join('')}</tbody></table></div>`;
    const wpts = ms.filter(m => m.poids != null).map(m => ({ x: m.date, y: m.poids }));
    if (wpts.length >= 2) html += `<div class="card"><h2>Poids</h2>${lineChart(wpts, 'Poids (kg)')}</div>`;
  }

  html += `<div class="card"><h2>Nouvelle mesure</h2>
    <form id="m-form">
      <label class="field"><span>Date</span><input type="date" name="date" value="${today()}" required></label>
      <div class="grid2">${MEASURES.map(([k, label, u]) => `
        <label class="field"><span>${label} (${u})</span><input type="number" inputmode="decimal" step="0.1" min="0" name="${k}"></label>`).join('')}
      </div>
      <button class="btn primary block" type="submit">Enregistrer la mesure</button>
    </form>
    <p class="muted small">Remplis seulement ce que tu mesures. Astuce : mesure-toi le matin, à jeun, toujours au même endroit.</p>
  </div>`;

  if (ms.length) {
    html += `<div class="card"><h2>Historique</h2><div style="overflow-x:auto"><table class="hist">
      <thead><tr><th>Date</th>${MEASURES.map(([, label]) => `<th>${label.replace('Tour de ', '')}</th>`).join('')}<th></th></tr></thead>
      <tbody>${ms.slice().reverse().map(m => `<tr><td>${fmtDate(m.date)}</td>${MEASURES.map(([k]) =>
        `<td>${m[k] != null ? String(m[k]).replace('.', ',') : '–'}</td>`).join('')}
        <td><button class="btn sm danger" data-mdel="${esc(m.id)}" aria-label="Supprimer">✕</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
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
  $$('[data-mdel]', main).forEach(b => b.onclick = () => {
    if (!confirm('Supprimer cette mesure ?')) return;
    state.profile.measurements = state.profile.measurements.filter(m => m.id !== b.dataset.mdel);
    save(); render();
  });
}

// ---------- Vue : réglages ----------
function renderSettings(main) {
  setTitle('Réglages');
  const nS = state.sessions.length, nM = state.profile.measurements.length;
  main.innerHTML = `
    <div class="card">
      <h2>Sauvegarde</h2>
      <p class="muted small">Tes données restent sur cet appareil (${nS} séance${nS > 1 ? 's' : ''}, ${nM} mesure${nM > 1 ? 's' : ''}).
      Exporte-les régulièrement, et utilise l'import pour les transférer entre ton iPhone et ton PC.</p>
      <div class="row wrap">
        <button class="btn primary" id="export">Exporter</button>
        <label class="btn">Importer<input type="file" id="import" accept="application/json,.json" hidden></label>
      </div>
    </div>
    <div class="card">
      <h2>Installer sur iPhone</h2>
      <p class="muted small">Dans Safari : bouton Partager, puis « Sur l'écran d'accueil ». L'appli s'ouvre alors en plein écran et marche hors ligne.
      Utilise toujours l'icône de l'écran d'accueil : c'est là que tes données sont conservées.</p>
    </div>
    <div class="card">
      <h2>Réinitialiser</h2>
      <p class="muted small">Efface toutes les séances, mesures et niveaux personnalisés de cet appareil.</p>
      <button class="btn danger" id="reset">Tout effacer</button>
    </div>
    <p class="muted small" style="text-align:center">Grease the Groove · version ${APP_VERSION}</p>`;

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
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed.data || parsed;
      if (!Array.isArray(data.exercises)) throw new Error('format');
      if (!confirm('Remplacer les données de cet appareil par celles du fichier ?')) return;
      state = migrate(data); save(); toast('Données importées'); go('exercices');
    } catch (err) { toast('Fichier invalide'); }
    e.target.value = '';
  };
  $('#reset').onclick = () => {
    if (!confirm('Effacer toutes les données de cet appareil ? Pense à exporter avant.')) return;
    state = defaultState(); save(); toast('Données effacées'); go('exercices');
  };
}

// ---------- Démarrage ----------
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
