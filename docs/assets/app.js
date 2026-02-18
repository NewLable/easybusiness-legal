const links = document.querySelectorAll("nav a");
const frame = document.getElementById("docFrame");

links.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();

    links.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    frame.src = "pages/" + link.dataset.page;
  });
});
