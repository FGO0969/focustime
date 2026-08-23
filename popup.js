const RULES_KEY = 'focustime_rules';
const DAYS_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const DAYS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

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
  if (!rule.enabled) return false;
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

function getDomainIcon(domain) {
  const d = domain.toLowerCase();
  if (d.includes('youtube') || d.includes('youtu.be')) return '▶️';
  if (d.includes('instagram')) return '📷';
  if (d.includes('twitter') || d.includes('x.com')) return '🐦';
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
    card.className = 'rule-card' + (rule.enabled ? '' : ' disabled');

    const slotSummary = rule.timeSlots.length === 1
      ? formatSlotSummary(rule.timeSlots[0])
      : `${rule.timeSlots.length} horarios`;

    const badge = blocking
      ? `<span class="status-badge blocking">● Bloqueando</span>`
      : rule.enabled
        ? `<span class="status-badge active">● Activo</span>`
        : '';

    card.innerHTML = `
      <div class="rule-card-main">
        <div class="rule-icon-wrap">${getDomainIcon(rule.domain)}</div>
        <div class="rule-info">
          <div class="rule-domain">${rule.domain}</div>
          <div class="rule-meta">${slotSummary} ${badge}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-id="${rule.id}" />
          <div class="toggle-track"></div>
        </label>
      </div>
      <div class="rule-actions">
        <button class="rule-action-btn edit" data-id="${rule.id}">✏️ Editar</button>
        <button class="rule-action-btn delete" data-id="${rule.id}">🗑 Eliminar</button>
      </div>`;

    card.querySelector('input[type="checkbox"]').addEventListener('change', async e => {
      const r = rules.find(x => x.id === e.target.dataset.id);
      if (r) { r.enabled = e.target.checked; await saveRules(); renderList(); }
    });

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

function renderFormSlots() {
  const container = document.getElementById('slots-container');
  container.innerHTML = '';

  formSlots.forEach((slot, idx) => {
    const card = document.createElement('div');
    card.className = 'slot-card';

    const daysHtml = DAYS_LABELS.map((label, d) => `
      <button class="day-btn ${slot.days.includes(d) ? 'selected' : ''}"
              data-slot="${slot.id}" data-day="${d}">${label}</button>
    `).join('');

    card.innerHTML = `
      <div class="slot-row">
        <span class="slot-label">De</span>
        <input class="form-input-time" type="time" value="${slot.start}"
               data-slot="${slot.id}" data-field="start" />
        <span class="time-separator">→</span>
        <span class="slot-label">A</span>
        <input class="form-input-time" type="time" value="${slot.end}"
               data-slot="${slot.id}" data-field="end" />
        ${formSlots.length > 1
          ? `<button class="btn-remove-slot" data-slot="${slot.id}">−</button>`
          : '<div style="width:22px"></div>'}
      </div>
      <div class="days-row">${daysHtml}</div>`;

    card.querySelectorAll('.form-input-time').forEach(input => {
      input.addEventListener('change', e => {
        const s = formSlots.find(x => x.id === e.target.dataset.slot);
        if (s) s[e.target.dataset.field] = e.target.value;
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
        renderFormSlots();
      });
    }

    container.appendChild(card);
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
    rules.push({ id: uid(), domain, timeSlots: validSlots, enabled: true });
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

(async () => {
  await loadRules();
  renderList();
})();
