window.onload = () => {
  if (window.location.pathname.includes("dashboard")) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) window.location.href = "index.html";

    document.getElementById("welcome").innerText = `Привет, ${user.name}!`;

    const container = document.getElementById("courses");

    if (user.courses.length === 0) {
      container.innerHTML = "<p>У вас пока нет активных курсов.</p>";
      return;
    }

    user.courses.forEach(course => {
      const div = document.createElement("div");
      div.className = "course-card";
      div.innerText = course;
      container.appendChild(div);
    });
  }
};

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
