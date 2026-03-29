const links = Array.from(document.querySelectorAll(".nav a"));
const content = document.getElementById("docContent");
const title = document.getElementById("currentTitle");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("menuBackdrop");
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const brandHero = document.querySelector(".brand-hero");

const defaultPage = "intro.html";
const pageByHash = new Map(
  links.map(link => [link.getAttribute("href").slice(1), link.dataset.page])
);

function setMenuState(isOpen) {
  sidebar.classList.toggle("is-open", isOpen);
  backdrop.hidden = !isOpen;
  backdrop.classList.toggle("is-visible", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function getLinkByPage(page) {
  return links.find(link => link.dataset.page === page) || links[0];
}

function readPageFromFrame(page) {
  return new Promise((resolve, reject) => {
    const loader = document.createElement("iframe");

    loader.hidden = true;
    loader.src = `pages/${page}`;

    loader.addEventListener("load", () => {
      try {
        const html = loader.contentDocument?.body?.innerHTML;

        loader.remove();

        if (!html) {
          reject(new Error(`Empty iframe response for ${page}`));
          return;
        }

        resolve(html);
      } catch (error) {
        loader.remove();
        reject(error);
      }
    }, { once: true });

    loader.addEventListener("error", () => {
      loader.remove();
      reject(new Error(`Failed to load ${page} in iframe fallback`));
    }, { once: true });

    document.body.appendChild(loader);
  });
}

async function loadPage(page, options = {}) {
  const activeLink = getLinkByPage(page);
  const targetPage = activeLink?.dataset.page || defaultPage;

  try {
    let html;

    try {
      const response = await fetch(`pages/${targetPage}`);

      if (!response.ok) {
        throw new Error(`Failed to load ${targetPage}`);
      }

      html = await response.text();
    } catch (fetchError) {
      html = await readPageFromFrame(targetPage);
      console.warn(fetchError);
    }

    content.innerHTML = html;

    links.forEach(link => {
      link.classList.toggle("active", link.dataset.page === targetPage);
    });

    if (activeLink) {
      title.textContent = activeLink.textContent.trim();

      if (options.updateHash !== false) {
        const nextHash = activeLink.getAttribute("href");

        if (window.location.hash !== nextHash) {
          history.replaceState(null, "", nextHash);
        }
      }
    }

    document.documentElement.scrollTop = 0;
    setMenuState(false);
  } catch (error) {
    content.innerHTML = `
      <h1>Не удалось загрузить раздел</h1>
      <p>Попробуйте открыть страницу ещё раз. Если проблема повторяется, проверьте наличие файла <strong>${targetPage}</strong> в папке pages.</p>
    `;
    title.textContent = "Ошибка загрузки";
    console.error(error);
  }
}

links.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    loadPage(link.dataset.page);
  });
});

brandHero?.addEventListener("click", event => {
  event.preventDefault();
  loadPage(defaultPage);
});

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  setMenuState(isOpen);
});

menuClose.addEventListener("click", () => setMenuState(false));
backdrop.addEventListener("click", () => setMenuState(false));

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    setMenuState(false);
  }
});

window.addEventListener("hashchange", () => {
  const page = pageByHash.get(window.location.hash.slice(1)) || defaultPage;
  loadPage(page, { updateHash: false });
});

const initialPage = pageByHash.get(window.location.hash.slice(1)) || defaultPage;
loadPage(initialPage, { updateHash: false });
