let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();

window.calPrev = function() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
};

window.calNext = function() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
};

async function initCalendar() {
  try {
    const pets = await API.getPets();
    window._calPets = pets;
    renderCalendar();
  } catch (err) {
    document.getElementById('error-msg').textContent = 'Ошибка загрузки: ' + err.message;
    document.getElementById('error-msg').style.display = 'block';
  }
}

function renderCalendar() {
  const pets  = window._calPets || [];
  const now   = new Date();
  const year  = calYear;
  const month = calMonth;

  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  document.getElementById('cal-month-title').textContent = months[month] + ' ' + year;

  // Собираем события
  const eventDays = {};
  pets.forEach(pet => {
    (pet.vaccines || []).forEach(v => {
      [v.date_done, v.date_next].forEach(dateStr => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          if (!eventDays[day]) eventDays[day] = [];
          eventDays[day].push({ pet: pet.name, vaccine: v.name });
        }
      });
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
    el.style.cssText = 'text-align:center;font-size:13px;padding:6px 4px;border-radius:8px;cursor:default';
    el.textContent = d;

    const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    if (isToday) {
      el.style.background = '#1D9E75';
      el.style.color = 'white';
      el.style.fontWeight = '500';
    }

    if (eventDays[d]) {
      const dot = document.createElement('div');
      dot.style.cssText = 'width:5px;height:5px;border-radius:50%;background:#f59e0b;margin:2px auto 0';
      if (isToday) dot.style.background = 'white';
      el.appendChild(dot);
      el.title = eventDays[d].map(e => e.pet + ': ' + e.vaccine).join('\n');
      el.style.cursor = 'pointer';
      if (!isToday) { el.style.background = '#FEF3C7'; el.style.color = '#92400E'; }
    }

    grid.appendChild(el);
  }

  renderUpcoming(pets);
}

function renderUpcoming(pets) {
  const now = new Date();
  const upcoming = [];

  pets.forEach(pet => {
    (pet.vaccines || []).forEach(v => {
      if (v.date_next) {
        const d = new Date(v.date_next);
        if (d >= now) upcoming.push({ date: d, petName: pet.name, vacName: v.name, label: 'Следующая прививка' });
      }
      if (v.date_done) {
        const d = new Date(v.date_done);
        if ((now - d) / 86400000 <= 30) upcoming.push({ date: d, petName: pet.name, vacName: v.name, label: 'Сделана недавно' });
      }
    });
  });

  upcoming.sort((a, b) => a.date - b.date);

  const el = document.getElementById('upcoming-list');
  if (!upcoming.length) {
    el.innerHTML = '<div style="font-size:13px;color:#9ca3af">Ближайших событий нет.</div>';
    return;
  }

  const mon = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  el.innerHTML = upcoming.slice(0, 8).map(e => `
    <div class="upcoming-item">
      <div class="upcoming-date">
        <div class="day">${e.date.getDate()}</div>
        <div class="mon">${mon[e.date.getMonth()]} ${e.date.getFullYear()}</div>
      </div>
      <div class="upcoming-info">
        <div class="title">${e.vacName} — ${e.petName}</div>
        <div class="sub">${e.label}</div>
      </div>
    </div>`).join('');
}
