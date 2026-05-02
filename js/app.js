let pets = [];
let editingPetId = null;
let tempVaccines = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await Auth.init();
  if (!user) return;
  document.getElementById('user-email').textContent = user.email;
  await loadPets();
  setupTabs();
  setupModal();
});

async function loadPets() {
  try {
    pets = await API.getPets();
    renderPets();
    renderCalendar();
  } catch (err) {
    showError('Ошибка загрузки: ' + err.message);
  }
}

function setupTabs() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

function setupModal() {
  document.getElementById('btn-add-pet').addEventListener('click', openCreateModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-save').addEventListener('click', savePet);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}

function renderPets() {
  const c = document.getElementById('pets-container');
  if (!pets.length) {
    c.innerHTML = '<div class="empty-state">Питомцев пока нет. Нажмите «+ Добавить питомца».</div>';
    return;
  }
  c.innerHTML = pets.map(renderPetCard).join('');
}

function renderPetCard(pet) {
  const icon    = pet.type === 'Кошка' ? '🐈' : pet.type === 'Другое' ? '🐇' : '🐕';
  const age     = pet.birth_date ? calcAge(pet.birth_date) + ' · ' : '';
  const vacRows = (pet.vaccines || []).map(v => `
    <div class="vaccine-item">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-weight:500">${esc(v.name)}</span>
        ${badge(v.status)}
      </div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px;display:flex;flex-wrap:wrap;gap:12px">
        ${v.date_done ? `<span>Сделана: <b style="color:#1a1a1a">${fmtDate(v.date_done)}</b></span>` : ''}
        ${v.date_next ? `<span>Следующая: <b style="color:#1D9E75">${fmtDate(v.date_next)}</b></span>` : ''}
      </div>
    </div>`).join('');
  const vacBlock = pet.vaccines?.length
    ? `<div class="vaccine-list"><div class="vaccine-section-title">ПРИВИВКИ</div>${vacRows}</div>`
    : '<div class="no-vaccines">Прививки не добавлены</div>';

  return `
    <div class="card" id="pet-${pet.id}">
      <div class="pet-row">
        <div class="pet-icon">${icon}</div>
        <div class="pet-info">
          <div class="pet-name">${esc(pet.name)}</div>
          <div class="pet-meta">${esc(pet.breed || pet.type)} · ${age}${pet.sex || ''}</div>
        </div>
        <div class="pet-actions">
          <button class="icon-btn" onclick="openEditModal('${pet.id}')">✏️ Редактировать</button>
          <button class="icon-btn danger" onclick="deletePet('${pet.id}')">🗑</button>
        </div>
      </div>
      ${vacBlock}
    </div>`;
}

// ── Календарь ─────────────────────────────────────────────
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();

window.calPrev = function() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); };
window.calNext = function() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); };

function renderCalendar() {
  const now   = new Date();
  const year  = calYear;
  const month = calMonth;

  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  document.getElementById('cal-month-title').textContent = months[month] + ' ' + year;

  // Собираем все даты прививок в этом месяце
  const eventDays = {};
  pets.forEach(pet => {
    (pet.vaccines || []).forEach(v => {
      // Проверяем date_done
      if (v.date_done) {
        const d = new Date(v.date_done);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          if (!eventDays[day]) eventDays[day] = [];
          eventDays[day].push({ pet: pet.name, vaccine: v.name, type: 'done' });
        }
      }
      // Проверяем date_next
      if (v.date_next) {
        const d = new Date(v.date_next);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          if (!eventDays[day]) eventDays[day] = [];
          eventDays[day].push({ pet: pet.name, vaccine: v.name, type: 'next' });
        }
      }
    });
  });

  // Рендерим сетку
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(d => {
    const el = document.createElement('div');
    el.style.cssText = 'text-align:center;font-size:11px;color:#9ca3af;padding:4px';
    el.textContent = d;
    grid.appendChild(el);
  });

  const lastDay = new Date(year, month + 1, 0).getDate();
  let startDow = new Date(year, month, 1).getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  for (let i = 0; i < startDow; i++) {
    const el = document.createElement('div');
    el.style.cssText = 'text-align:center;font-size:13px;padding:8px 4px;color:#d1d5db';
    el.textContent = new Date(year, month, -startDow + i + 1).getDate();
    grid.appendChild(el);
  }

  for (let d = 1; d <= lastDay; d++) {
    const el = document.createElement('div');
    el.style.cssText = 'text-align:center;font-size:13px;padding:6px 4px;border-radius:8px;position:relative;cursor:default';
    el.textContent = d;

    if (d === now.getDate()) {
      el.style.background = '#1D9E75';
      el.style.color = 'white';
      el.style.fontWeight = '500';
    }

    if (eventDays[d]) {
      const dot = document.createElement('div');
      dot.style.cssText = 'width:5px;height:5px;border-radius:50%;background:#f59e0b;margin:2px auto 0';
      if (d === now.getDate()) dot.style.background = 'white';
      el.appendChild(dot);
      el.title = eventDays[d].map(e => e.pet + ': ' + e.vaccine).join('\n');
      el.style.cursor = 'pointer';
      if (d !== now.getDate()) {
        el.style.background = '#FEF3C7';
        el.style.color = '#92400E';
      }
    }

    grid.appendChild(el);
  }

  // Список ближайших прививок
  renderUpcoming();
}

function renderUpcoming() {
  const now = new Date();
  const upcoming = [];

  pets.forEach(pet => {
    (pet.vaccines || []).forEach(v => {
      if (v.date_next) {
        const d = new Date(v.date_next);
        if (d >= now) {
          upcoming.push({ date: d, petName: pet.name, vacName: v.name, status: v.status });
        }
      }
      if (v.date_done) {
        const d = new Date(v.date_done);
        const diff = (now - d) / (1000 * 60 * 60 * 24);
        if (diff <= 30 && diff >= 0) {
          upcoming.push({ date: d, petName: pet.name, vacName: v.name, status: 'done', recent: true });
        }
      }
    });
  });

  upcoming.sort((a, b) => a.date - b.date);

  const el = document.getElementById('upcoming-list');
  if (!upcoming.length) {
    el.innerHTML = '<div style="font-size:13px;color:#9ca3af">Ближайших событий нет.</div>';
    return;
  }

  const monthNames = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  el.innerHTML = upcoming.slice(0, 5).map(e => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:0.5px solid var(--border)">
      <div style="min-width:52px;text-align:center;flex-shrink:0">
        <div style="font-size:16px;font-weight:500;color:#1D9E75;line-height:1">${e.date.getDate()}</div>
        <div style="font-size:10px;color:#9ca3af">${monthNames[e.date.getMonth()]} ${e.date.getFullYear()}</div>
      </div>
      <div style="min-width:0">
        <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.vacName)} — ${esc(e.petName)}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px">${e.recent ? 'Сделана недавно' : e.status === 'next' ? 'Следующая прививка' : 'Запланировано'}</div>
      </div>
    </div>`).join('');
}

// ── Модалки ───────────────────────────────────────────────
function openCreateModal() {
  editingPetId = null;
  tempVaccines = [];
  fillForm({ name:'', type:'Собака', breed:'', birth_date:'', sex:'Самец', notes:'' });
  document.getElementById('modal-title').textContent = 'Новый питомец';
  openModal();
}

window.openEditModal = function(id) {
  const pet = pets.find(p => p.id === id);
  if (!pet) return;
  editingPetId = id;
  tempVaccines = JSON.parse(JSON.stringify(pet.vaccines || []));
  fillForm(pet);
  document.getElementById('modal-title').textContent = 'Редактировать питомца';
  openModal();
};

function fillForm(pet) {
  document.getElementById('f-name').value  = pet.name || '';
  document.getElementById('f-type').value  = pet.type || 'Собака';
  document.getElementById('f-breed').value = pet.breed || '';
  document.getElementById('f-birth').value = pet.birth_date ? pet.birth_date.split('T')[0] : '';
  document.getElementById('f-sex').value   = pet.sex || 'Самец';
  document.getElementById('f-notes').value = pet.notes || '';
  renderVaccineInputs();
}

function renderVaccineInputs() {
  document.getElementById('vaccine-inputs').innerHTML = tempVaccines.map((v, i) => `
    <div class="vaccine-form-row">
      <div class="form-field">
        <label class="form-label">Название</label>
        <input class="form-input" id="vn-${i}" value="${esc(v.name)}" placeholder="Бешенство...">
      </div>
      <div class="form-field">
        <label class="form-label">Сделана</label>
        <input class="form-input" type="date" id="vd-${i}" value="${v.date_done || ''}">
      </div>
      <div class="form-field">
        <label class="form-label">Следующая</label>
        <input class="form-input" type="date" id="vn2-${i}" value="${v.date_next || ''}">
      </div>
      <div class="form-field">
        <label class="form-label">Статус</label>
        <select class="form-input" id="vs-${i}">
          <option value="done" ${v.status==='done'?'selected':''}>Сделана</option>
          <option value="soon" ${v.status==='soon'?'selected':''}>Скоро</option>
          <option value="next" ${v.status==='next'?'selected':''}>Следующая</option>
        </select>
      </div>
      <button class="del-vac-btn" onclick="removeVaccine(${i})">✕</button>
    </div>`).join('');
}

function syncVaccines() {
  tempVaccines.forEach((v, i) => {
    v.name      = document.getElementById('vn-'+i)?.value  || '';
    v.date_done = document.getElementById('vd-'+i)?.value  || null;
    v.date_next = document.getElementById('vn2-'+i)?.value || null;
    v.status    = document.getElementById('vs-'+i)?.value  || 'done';
  });
}

window.addVaccine = function() {
  syncVaccines();
  tempVaccines.push({ name:'', date_done:'', date_next:'', status:'done' });
  renderVaccineInputs();
};

window.removeVaccine = function(i) {
  syncVaccines();
  tempVaccines.splice(i, 1);
  renderVaccineInputs();
};

async function savePet() {
  syncVaccines();
  const petData = {
    name:       document.getElementById('f-name').value.trim(),
    type:       document.getElementById('f-type').value,
    breed:      document.getElementById('f-breed').value.trim(),
    birth_date: document.getElementById('f-birth').value || null,
    sex:        document.getElementById('f-sex').value,
    notes:      document.getElementById('f-notes').value.trim()
  };
  if (!petData.name) { alert('Введите кличку'); return; }
  const validVacs = tempVaccines.filter(v => v.name.trim());

  setSaving(true);
  try {
    if (editingPetId) {
      const updated = await API.updatePet(editingPetId, petData);
      const pet = pets.find(p => p.id === editingPetId);
      for (const v of (pet.vaccines || [])) await API.deleteVaccine(v.id);
      const newVacs = [];
      for (const v of validVacs) newVacs.push(await API.createVaccine({ ...v, pet_id: editingPetId }));
      pets[pets.findIndex(p => p.id === editingPetId)] = { ...updated, vaccines: newVacs };
    } else {
      const created = await API.createPet(petData);
      const newVacs = [];
      for (const v of validVacs) newVacs.push(await API.createVaccine({ ...v, pet_id: created.id }));
      pets.push({ ...created, vaccines: newVacs });
    }
    closeModal();
    renderPets();
    renderCalendar();
  } catch (err) {
    showError(err.message);
  } finally {
    setSaving(false);
  }
}

window.deletePet = async function(id) {
  if (!confirm('Удалить питомца и все прививки?')) return;
  try {
    await API.deletePet(id);
    pets = pets.filter(p => p.id !== id);
    renderPets();
    renderCalendar();
  } catch (err) {
    showError(err.message);
  }
};

function openModal()  { document.getElementById('modal-overlay').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }

function setSaving(on) {
  const btn = document.getElementById('btn-save');
  btn.textContent = on ? 'Сохранение...' : 'Сохранить';
  btn.disabled = on;
}

function badge(status) {
  const m = { done:['badge-done','Сделана'], soon:['badge-soon','Скоро'], next:['badge-next','Следующая'] };
  const [cls, label] = m[status] || m.done;
  return `<span class="badge ${cls}">${label}</span>`;
}

function fmtDate(d, showYear = true) {
  if (!d) return '—';
  const [y, m, day] = d.split('T')[0].split('-');
  const mon = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][m-1];
  return showYear ? `${parseInt(day)} ${mon} ${y}` : `${parseInt(day)} ${mon}`;
}

function calcAge(b) {
  const y = new Date().getFullYear() - new Date(b).getFullYear();
  return y === 1 ? '1 год' : y < 5 ? y + ' года' : y + ' лет';
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}
