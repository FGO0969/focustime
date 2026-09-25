const RULES_KEY = 'focustime_rules';
const THEME_KEY = 'focustime_theme';
const DAYS_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const DAYS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

// ── Theme ─────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('btn-theme').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) { applyTheme(saved); return; }
  } catch (_) {}
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

let rules = [];
let editingId = null;
let formSlots = [];

// ── Storage ──────────────────────────────────────────────

async function loadRules() {
  const result = await browser.storage.local.get(RULES_KEY);
  rules = result[RULES_KEY] || [];
}

async function saveRules() {
  await browser.storage.local.set({ [RULES_KEY]: rules });
}

// ── Utils ─────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function isCurrentlyBlocked(rule) {
  const now = new Date();
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  return rule.timeSlots.some(slot => {
    if (!slot.days.includes(day)) return false;
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    const start = sh * 60 + sm, end = eh * 60 + em;
    return start <= end
      ? mins >= start && mins < end
      : mins >= start || mins < end;
  });
}

function formatSlotSummary(slot) {
  const dayNames = slot.days.map(d => DAYS_LABELS[d]).join(' ');
  return `${slot.start} – ${slot.end}  ·  ${dayNames}`;
}

function getDomainEmoji(domain) {
  const d = domain.toLowerCase();
  if (d.includes('youtube') || d.includes('youtu.be')) return '▶️';
  if (d.includes('instagram')) return '📷';
  if (d.includes('twitter') || d.includes('x.com')) return '𝕏';
  if (d.includes('facebook') || d.includes('fb.com')) return '👥';
  if (d.includes('tiktok')) return '🎵';
  if (d.includes('reddit')) return '🤖';
  if (d.includes('netflix')) return '🎬';
  if (d.includes('twitch')) return '🎮';
  if (d.includes('whatsapp')) return '💬';
  if (d.includes('telegram')) return '✈️';
  if (d.includes('amazon')) return '📦';
  return '🔒';
}

function faviconHtml(domain) {
  const clean  = domain.replace(/^www\./, '');
  const ddg    = `https://icons.duckduckgo.com/ip3/${clean}.ico`;
  const google = `https://www.google.com/s2/favicons?domain=${clean}&sz=32`;
  const emoji  = getDomainEmoji(domain);
  return `
    <img class="rule-favicon" src="${ddg}"
         onerror="this.src='${google}'; this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='flex';};" />
    <span class="rule-icon-fallback">${emoji}</span>`;
}

// ── View switching ────────────────────────────────────────

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
}

// ── List View ─────────────────────────────────────────────

function renderList() {
  const container = document.getElementById('rules-container');
  container.innerHTML = '';

  if (rules.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛡️</div>
        <div class="empty-title">Sin reglas activas</div>
        <div class="empty-subtitle">Toca + para bloquear un sitio en horarios específicos</div>
      </div>`;
    return;
  }

  const header = document.createElement('div');
  header.className = 'section-header';
  header.textContent = `${rules.length} ${rules.length === 1 ? 'regla' : 'reglas'}`;
  container.appendChild(header);

  rules.forEach(rule => {
    const blocking = isCurrentlyBlocked(rule);
    const card = document.createElement('div');
    card.className = 'rule-card';

    const slotSummary = rule.timeSlots.length === 1
      ? formatSlotSummary(rule.timeSlots[0])
      : `${rule.timeSlots.length} horarios`;

    const badge = blocking
      ? `<span class="status-badge blocking">● Bloqueando</span>`
      : `<span class="status-badge active">● Activo</span>`;

    card.innerHTML = `
      <div class="rule-card-main">
        <div class="rule-icon-wrap">${faviconHtml(rule.domain)}</div>
        <div class="rule-info">
          <div class="rule-domain">${rule.domain}</div>
          <div class="rule-meta">${slotSummary} ${badge}</div>
        </div>
      </div>
      <div class="rule-actions">
        <button class="rule-action-btn edit" data-id="${rule.id}">✏️ Editar</button>
        <button class="rule-action-btn delete" data-id="${rule.id}">🗑 Eliminar</button>
      </div>`;

    card.querySelector('.edit').addEventListener('click', e => {
      openForm(e.target.dataset.id);
    });

    card.querySelector('.delete').addEventListener('click', async e => {
      const id = e.target.dataset.id;
      rules = rules.filter(x => x.id !== id);
      await saveRules();
      renderList();
    });

    container.appendChild(card);
  });
}

// ── Form View ─────────────────────────────────────────────

function openForm(ruleId = null) {
  editingId = ruleId;
  openPicker = null;
  document.getElementById('form-title').textContent = ruleId ? 'Editar regla' : 'Nueva regla';
  document.getElementById('error-domain').classList.remove('visible');
  document.getElementById('error-slots').classList.remove('visible');

  if (ruleId) {
    const rule = rules.find(r => r.id === ruleId);
    document.getElementById('input-domain').value = rule.domain;
    formSlots = rule.timeSlots.map(s => ({ ...s, days: [...s.days] }));
  } else {
    document.getElementById('input-domain').value = '';
    formSlots = [makeSlot()];
  }

  renderFormSlots();
  showView('form');
}

function makeSlot() {
  return { id: uid(), start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] };
}

// ── Time picker ───────────────────────────────────────────

let openPicker = null; // { slotId, field }

function to12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return { h12: h % 12 === 0 ? 12 : h % 12, m, pm: h >= 12 };
}

function from12(h12, m, pm) {
  const h = (h12 % 12) + (pm ? 12 : 0);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTime(hhmm) {
  const { h12, m, pm } = to12(hhmm);
  return `${h12}:${String(m).padStart(2, '0')} ${pm ? 'p. m.' : 'a. m.'}`;
}

function pickerHtml(value) {
  const { h12, m, pm } = to12(value);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  if (!minutes.includes(m)) { minutes.push(m); minutes.sort((a, b) => a - b); }

  const col = (part, items, isSel, label) => `
    <div class="picker-col" data-part="${part}">
      ${items.map(v => `<button class="picker-opt ${isSel(v) ? 'selected' : ''}" data-part="${part}" data-value="${v}">${label(v)}</button>`).join('')}
    </div>`;

  return `
    <div class="time-picker">
      ${col('h', Array.from({ length: 12 }, (_, i) => i + 1), v => v === h12, v => v)}
      ${col('m', minutes, v => v === m, v => String(v).padStart(2, '0'))}
      ${col('p', [0, 1], v => (v === 1) === pm, v => (v ? 'p. m.' : 'a. m.'))}
    </div>`;
}

function centerSelected(root) {
  root.querySelectorAll('.picker-col').forEach(col => {
    const sel = col.querySelector('.selected');
    if (sel) col.scrollTop = sel.offsetTop - col.clientHeight / 2 + sel.offsetHeight / 2;
  });
}

function renderFormSlots() {
  const container = document.getElementById('slots-container');
  container.innerHTML = '';

  formSlots.forEach(slot => {
    const card = document.createElement('div');
    card.className = 'slot-card';

    const daysHtml = DAYS_LABELS.map((label, d) => `
      <button class="day-btn ${slot.days.includes(d) ? 'selected' : ''}"
              data-slot="${slot.id}" data-day="${d}">${label}</button>
    `).join('');

    const isOpen = field => openPicker && openPicker.slotId === slot.id && openPicker.field === field;
    const openField = openPicker && openPicker.slotId === slot.id ? openPicker.field : null;

    card.innerHTML = `
      <div class="slot-row">
        <button class="time-pill ${isOpen('start') ? 'open' : ''}" data-field="start" title="Desde">${formatTime(slot.start)}</button>
        <span class="time-separator">→</span>
        <button class="time-pill ${isOpen('end') ? 'open' : ''}" data-field="end" title="Hasta">${formatTime(slot.end)}</button>
        ${formSlots.length > 1
          ? `<button class="btn-remove-slot" data-slot="${slot.id}">−</button>`
          : ''}
      </div>
      ${openField ? pickerHtml(slot[openField]) : ''}
      <div class="days-row">${daysHtml}</div>`;

    card.querySelectorAll('.time-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.field;
        openPicker = isOpen(field) ? null : { slotId: slot.id, field };
        renderFormSlots();
      });
    });

    card.querySelectorAll('.picker-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        const field = openPicker.field;
        let { h12, m, pm } = to12(slot[field]);
        const v = Number(opt.dataset.value);
        if (opt.dataset.part === 'h') h12 = v;
        if (opt.dataset.part === 'm') m = v;
        if (opt.dataset.part === 'p') pm = v === 1;
        slot[field] = from12(h12, m, pm);
        renderFormSlots();
      });
    });

    card.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const s = formSlots.find(x => x.id === e.target.dataset.slot);
        const day = parseInt(e.target.dataset.day);
        if (!s) return;
        const i = s.days.indexOf(day);
        if (i > -1) s.days.splice(i, 1);
        else s.days.push(day);
        e.target.classList.toggle('selected', s.days.includes(day));
      });
    });

    const removeBtn = card.querySelector('.btn-remove-slot');
    if (removeBtn) {
      removeBtn.addEventListener('click', e => {
        formSlots = formSlots.filter(x => x.id !== e.target.dataset.slot);
        if (openPicker && openPicker.slotId === e.target.dataset.slot) openPicker = null;
        renderFormSlots();
      });
    }

    container.appendChild(card);
    centerSelected(card);
  });
}

async function saveForm() {
  const domain = document.getElementById('input-domain').value.trim()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

  let valid = true;

  if (!domain || !domain.includes('.')) {
    document.getElementById('error-domain').classList.add('visible');
    valid = false;
  } else {
    document.getElementById('error-domain').classList.remove('visible');
  }

  const validSlots = formSlots.filter(s => s.days.length > 0);
  if (validSlots.length === 0) {
    document.getElementById('error-slots').classList.add('visible');
    valid = false;
  } else {
    document.getElementById('error-slots').classList.remove('visible');
  }

  if (!valid) return;

  if (editingId) {
    const rule = rules.find(r => r.id === editingId);
    rule.domain = domain;
    rule.timeSlots = validSlots;
  } else {
    rules.push({ id: uid(), domain, timeSlots: validSlots });
  }

  await saveRules();
  showView('list');
  renderList();
}

// ── Init ──────────────────────────────────────────────────

document.getElementById('btn-new-rule').addEventListener('click', () => openForm());
document.getElementById('btn-back').addEventListener('click', () => { showView('list'); renderList(); });
document.getElementById('btn-save').addEventListener('click', saveForm);
document.getElementById('btn-save-bottom').addEventListener('click', saveForm);
document.getElementById('btn-add-slot').addEventListener('click', () => {
  formSlots.push(makeSlot());
  renderFormSlots();
});
document.getElementById('btn-theme').addEventListener('click', toggleTheme);

(async () => {
  loadTheme();
  await loadRules();
  renderList();
})();
