// scripts.js
// Общая логика для index.html и dashboard.html

const STORAGE_KEY = "lk_user_cached";

async function fetchUsersJson() {
  try {
    const res = await fetch("users.json", {cache: "no-store"});
    if (!res.ok) throw new Error("Не удалось загрузить users.json");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetchUsersJson:", err);
    throw err;
  }
}

/* ====== Код для страницы входа (index.html) ====== */
async function initLoginPage() {
  const loginBtn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("error");

  loginBtn.addEventListener("click", async () => {
    errorEl.textContent = "";
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      errorEl.textContent = "Введите email и пароль.";
      return;
    }

    try {
      const users = await fetchUsersJson();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

      if (!user) {
        errorEl.textContent = "Неверный email или пароль.";
        return;
      }

      // Сохраняем в localStorage минимальные данные (без пароля)
      const safeUser = {
        email: user.email,
        name: user.name || user.email,
        courses: Array.isArray(user.courses) ? user.courses : []
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
      // Переходим в личный кабинет
      window.location.href = "dashboard.html";
    } catch (err) {
      errorEl.textContent = "Ошибка загрузки данных. Убедитесь, что сайт запущен через http(s).";
    }
  });

  // Позволяет входить нажатием Enter в поле пароля
  document.getElementById("password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });
}

/* ====== Код для dashboard.html ====== */
function initDashboardPage() {
  const userJson = localStorage.getItem(STORAGE_KEY);
  if (!userJson) {
    // если пользователь не залогинен — возвращаемся на страницу входа
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(userJson);
  const welcome = document.getElementById("welcome");
  const coursesContainer = document.getElementById("courses");
  const noCourses = document.getElementById("no-courses");
  const logoutBtn = document.getElementById("logoutBtn");

  welcome.textContent = `Привет, ${user.name || user.email}!`;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "index.html";
  });

  // Показать курсы из user.courses
  coursesContainer.innerHTML = "";
  noCourses.textContent = "";

  if (!user.courses || user.courses.length === 0) {
    noCourses.textContent = "У вас пока нет активных курсов.";
    return;
  }

  user.courses.forEach(courseName => {
    const card = document.createElement("div");
    card.className = "course-card";

    const title = document.createElement("div");
    title.className = "course-title";
    title.textContent = courseName;

    // При необходимости можно добавить ссылку на страницу курса
    // const openBtn = document.createElement("a");
    // openBtn.href = "#"; // заменить на реальный URL
    // openBtn.className = "btn tiny";
    // openBtn.textContent = "Открыть";

    card.appendChild(title);
    // card.appendChild(openBtn);

    coursesContainer.appendChild(card);
  });
}

/* ====== Авто-инициализация в зависимости от страницы ====== */
(function() {
  const path = window.location.pathname.split("/").pop();
  if (path === "" || path === "index.html") {
    // Если пользователь уже залогинен — перекинуть в кабинет
    if (localStorage.getItem(STORAGE_KEY)) {
      window.location.href = "dashboard.html";
      return;
    }
    document.addEventListener("DOMContentLoaded", initLoginPage);
  } else if (path === "dashboard.html") {
    document.addEventListener("DOMContentLoaded", initDashboardPage);
  } else {
    // если другой файл — не делаем ничего
  }
})();
