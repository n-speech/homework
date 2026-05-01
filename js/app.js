// Состояние приложения
let pets = [];
let editingPetId   = null;
let tempVaccines   = [];

// ── Инициализация ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const session = await Auth.init();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('user-email').textContent = Auth.getEmail();

  await loadPets();
  setupTabs();
  setupModal();
});

// ── Загрузка питомцев ──────────────────────────────────────
async function loadPets() {
  try {
    pets = await API.getPets();
    renderPets();
  } catch (err) {
    showError('Не удалось загрузить питомцев: ' + err.message);
  }
}

// ── Вкладки ────────────────────────────────────────────────
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

// ── Модальное окно ─────────────────────────────────────────
function setupModal() {
  document.getElementById('btn-add-pet').addEventListener('click', openCreateModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}

// ── Рендер карточек питомцев ───────────────────────────────
function renderPets() {
  const container = document.getElementById('pets-container');

  if (!pets.length) {
    container.innerHTML = `
      <div class="empty-state">
        Питомцев пока нет. Нажмите «+ Добавить питомца».
      </div>`;
    return;
  }

  container.innerHTML = pets.map(renderPetCard).join('');
}

function renderPetCard(pet) {
  const icon      = petIcon(pet.type);
  const ageStr    = pet.birth_date ? calcAge(pet.birth_date) + ' · ' : '';
  const vaccines  = (pet.vaccines || []).map(renderVaccineRow).join('');
  const vacBlock  = pet.vaccines?.length
    ? `<div class="vaccine-list">
         <div class="vaccine-section-title">ПРИВИВКИ</div>
         ${vaccines}
       </div>`
    : `<div class="no-vaccines">Прививки не добавлены</div>`;

  return `
    <div class="card" id="pet-${pet.id}">
      <div class="pet-row">
        <div class="pet-icon">${icon}</div>
        <div class="pet-info">
          <div class="pet-name">${escHtml(pet.name)}</div>
          <div class="pet-meta">${escHtml(pet.breed || pet.type)} · ${ageStr}${pet.sex || ''}</div>
        </div>
        <div class="pet-actions">
          <button class="icon-btn" onclick="openEditModal('${pet.id}')">✏️ Редактировать</button>
          <button class="icon-btn danger" onclick="confirmDeletePet('${pet.id}')">🗑</button>
        </div>
      </div>
      ${vacBlock}
    </div>`;
}

function renderVaccineRow(v) {
  const done = v.date_done ? formatDate(v.date_done) : '—';
  const next = v.date_next ? ' → ' + formatDate(v.date_next) : '';
  return `
    <div class="vaccine-item">
      <span>${escHtml(v.name)}</span>
      <div class="vaccine-meta">
        <span class="vac-date">${done}${next}</span>
        ${statusBadge(v.status)}
      </div>
    </div>`;
}

// ── Модалка создания ───────────────────────────────────────
function openCreateModal() {
  editingPetId = null;
  tempVaccines = [];
  renderModal({ name:'', type:'Собака', breed:'', birth_date:'', sex:'Самец', notes:'' }, false);
  openModal();
}

// ── Модалка редактирования ─────────────────────────────────
function openEditModal(petId) {
  const pet = pets.find(p => p.id === petId);
  if (!pet) return;
  editingPetId = petId;
  tempVaccines = JSON.parse(JSON.stringify(pet.vaccines || []));
  renderModal(pet, true);
  openModal();
}

function renderModal(pet, isEdit) {
  document.getElementById('modal-title').textContent = isEdit ? 'Редактировать питомца' : 'Новый питомец';

  document.getElementById('f-name').value       = pet.name       || '';
  document.getElementById('f-type').value       = pet.type       || 'Собака';
  document.getElementById('f-breed').value      = pet.breed      || '';
  document.getElementById('f-birth').value      = pet.birth_date ? pet.birth_date.split('T')[0] : '';
  document.getElementById('f-sex').value        = pet.sex        || 'Самец';
  document.getElementById('f-notes').value      = pet.notes      || '';

  renderVaccineInputs();
}

function renderVaccineInputs() {
  const container = document.getElementById('vaccine-inputs');
  container.innerHTML = tempVaccines.map((v, i) => `
    <div class="vaccine-form-row">
      <div class="form-field">
        <label class="form-label">Название</label>
        <input class="form-input" id="vn-${i}" value="${escHtml(v.name)}" placeholder="Бешенство...">
      </div>
      <div class="form-field">
        <label class="form-label">Дата сделана</label>
        <input class="form-input" type="date" id="vd-${i}" value="${v.date_done || ''}">
      </div>
      <div class="form-field">
        <label class="form-label">Следующая</label>
        <input class="form-input" type="date" id="vn2-${i}" value="${v.date_next || ''}">
      </div>
      <div class="form-field">
        <label class="form-label">Статус</label>
        <select class="form-input" id="vs-${i}">
          <option value="done"  ${v.status==='done' ?'selected':''}>Сделана</option>
          <option value="soon"  ${v.status==='soon' ?'selected':''}>Скоро</option>
          <option value="next"  ${v.status==='next' ?'selected':''}>Следующая</option>
        </select>
      </div>
      <button class="del-vac-btn" onclick="removeVaccine(${i})">✕</button>
    </div>`).join('');
}

function syncVaccines() {
  tempVaccines.forEach((v, i) => {
    v.name       = document.getElementById(`vn-${i}`)?.value  || '';
    v.date_done  = document.getElementById(`vd-${i}`)?.value  || null;
    v.date_next  = document.getElementById(`vn2-${i}`)?.value || null;
    v.status     = document.getElementById(`vs-${i}`)?.value  || 'done';
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

// ── Сохранение ─────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', savePet);

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

  if (!petData.name) {
    alert('Введите кличку питомца');
    return;
  }

  const validVaccines = tempVaccines.filter(v => v.name.trim());

  setSaving(true);
  try {
    if (editingPetId) {
      // Обновляем питомца
      const updated = await API.updatePet(editingPetId, petData);

      // Синхронизируем прививки: удаляем старые, создаём новые
      const pet = pets.find(p => p.id === editingPetId);
      const oldVaccines = pet.vaccines || [];

      // Удаляем все старые прививки питомца
      for (const v of oldVaccines) {
        await API.deleteVaccine(v.id);
      }
      // Создаём актуальные
      const newVaccines = [];
      for (const v of validVaccines) {
        const created = await API.createVaccine({ ...v, pet_id: editingPetId });
        newVaccines.push(created);
      }

      // Обновляем локальное состояние
      const idx = pets.findIndex(p => p.id === editingPetId);
      pets[idx] = { ...updated, vaccines: newVaccines };

    } else {
      // Создаём нового питомца
      const created = await API.createPet(petData);

      // Добавляем прививки
      const newVaccines = [];
      for (const v of validVaccines) {
        const vc = await API.createVaccine({ ...v, pet_id: created.id });
        newVaccines.push(vc);
      }
      pets.push({ ...created, vaccines: newVaccines });
    }

    closeModal();
    renderPets();
  } catch (err) {
    showError(err.message);
  } finally {
    setSaving(false);
  }
}

// ── Удаление питомца ───────────────────────────────────────
window.confirmDeletePet = async function(id) {
  if (!confirm('Удалить питомца и все его прививки?')) return;
  try {
    await API.deletePet(id);
    pets = pets.filter(p => p.id !== id);
    renderPets();
  } catch (err) {
    showError(err.message);
  }
};

// ── Вспомогательные ────────────────────────────────────────
function openModal()  { document.getElementById('modal-overlay').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
document.getElementById('btn-cancel').addEventListener('click', closeModal);
window.openEditModal  = openEditModal;

function setSaving(on) {
  document.getElementById('btn-save').textContent = on ? 'Сохранение...' : 'Сохранить';
  document.getElementById('btn-save').disabled = on;
}

function petIcon(type) {
  return type === 'Кошка' ? '🐈' : type === 'Другое' ? '🐇' : '🐕';
}

function statusBadge(status) {
  const map = {
    done: ['badge-done', 'Сделана'],
    soon: ['badge-soon', 'Скоро'],
    next: ['badge-next', 'Следующая']
  };
  const [cls, label] = map[status] || map.done;
  return `<span class="badge ${cls}">${label}</span>`;
}

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('T')[0].split('-');
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
}

function calcAge(birth) {
  const y = new Date().getFullYear() - new Date(birth).getFullYear();
  if (y === 1) return '1 год';
  if (y < 5)  return y + ' года';
  return y + ' лет';
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
