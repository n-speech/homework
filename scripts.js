async function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  const response = await fetch("users.json");
  const users = await response.json();

  const user = users.find(u => u.email === email && u.password === pass);

  if (!user) {
    document.getElementById("error").innerText = "Неверный логин или пароль";
    return;
  }

  localStorage.setItem("user", JSON.stringify(user));
  window.location.href = "dashboard.html";
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

window.onload = () => {
  if (window.location.pathname.includes("dashboard")) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) window.location.href = "index.html";

    document.getElementById("welcome").innerText = `Привет, ${user.name}!`;

    const coursesList = ["Французский A1", "Французский A2", "Русский для иностранцев"];
    const container = document.getElementById("courses");

    coursesList.forEach(course => {
      const btn = document.createElement("button");
      btn.innerText = user.courses.includes(course) ? `Записан: ${course}` : `Записаться: ${course}`;
      btn.onclick = () => alert("Здесь будет запись на курс");
      container.appendChild(btn);
    });
  }
};
