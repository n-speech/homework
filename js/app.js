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
      <span>${esc(v.name)}</span>
      <div class="vaccine-meta">
        <span class="vac-date">${fmtDate(v.date_done)}${v.date_next ? ' → ' + fmtDate(v.date_next) : ''}</span>
        ${badge(v.status)}
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

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${parseInt(day)} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][m-1]} ${y}`;
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
