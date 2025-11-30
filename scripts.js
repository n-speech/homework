// scripts.js
const STORAGE_KEY = "lk_user_cached";

async function fetchUsersJson() {
  const res = await fetch("users.json", {cache: "no-store"});
  if (!res.ok) throw new Error("Не удалось загрузить users.json");
  return await res.json();
}

/* ====== Страница входа ====== */
async function initLoginPage() {
  const loginBtn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("error");

  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      errorEl.textContent = "Введите email и пароль";
      return;
    }

    try {
      const users = await fetchUsersJson();
      const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        errorEl.textContent = "Неверный email или пароль";
        return;
      }

      const safeUser = {
        email: user.email,
        name: user.name,
        courses: user.courses || []
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
      window.location.href = "dashboard.html";

    } catch (err) {
      errorEl.textContent = "Ошибка загрузки данных";
    }
  });
}

/* ====== Страница Dashboard ====== */
function initDashboardPage() {
  const userJson = localStorage.getItem(STORAGE_KEY);
  if (!userJson) return (window.location.href = "index.html");

  const user = JSON.parse(userJson);
  document.getElementById("welcome").textContent = `Привет, ${user.name}!`;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "index.html";
  });

  const container = document.getElementById("courses");
  const noCourses = document.getElementById("no-courses");

  if (!user.courses || user.courses.length === 0) {
    noCourses.textContent = "У вас пока нет активных курсов.";
    return;
  }

  user.courses.forEach(course => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.textContent = course;
    card.addEventListener("click", () => {
      window.location.href = `course.html?name=${encodeURIComponent(course)}`;
    });
    container.appendChild(card);
  });
}

/* ====== Страница Course ====== */
function initCoursePage() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");

  if (!name) {
    document.getElementById("course-title").textContent = "Ошибка: курс не найден";
    return;
  }

  document.getElementById("course-title").textContent = name;

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
}

/* ====== Авто-инициализация ====== */
(function () {
  const page = window.location.pathname.split("/").pop();

  if (page === "" || page === "index.html") {
    document.addEventListener("DOMContentLoaded", initLoginPage);
  } else if (page === "dashboard.html") {
    document.addEventListener("DOMContentLoaded", initDashboardPage);
  } else if (page === "course.html") {
    document.addEventListener("DOMContentLoaded", initCoursePage);
  }
})();
