console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

function getBasePath() {
  const { hostname, pathname } = location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "/";
  }
  if (hostname.endsWith("github.io")) {
    const seg = pathname.split("/").filter(Boolean)[0];
    return seg ? `/${seg}/` : "/";
  }
  return "/";
}

const BASE_PATH = getBasePath();

const pages = [
  { url: "index.html", title: "Home" },
  { url: "index.html#resume", title: "Resume" },
  { url: "Projects/index.html", title: "Projects" },
  { url: "Contact/index.html", title: "Contact" },
];

function resolveUrl(url) {
  return !url.startsWith("http") ? BASE_PATH + url : url;
}

/** Treat /, /index.html, and /repo/index.html home variants as the same path key. */
function sitePathKey(pathname) {
  const n = pathname.replace(/\/$/, "") || "/";
  if (n === "/index.html" || n === "/") return "/";
  const stripped = n.replace(/\/index\.html$/i, "");
  return stripped || "/";
}

function isCurrentNavLink(a) {
  if (a.host !== location.host) return false;
  if (sitePathKey(a.pathname) !== sitePathKey(location.pathname)) return false;
  const lh = a.hash || "";
  const rh = location.hash || "";
  if (lh || rh) return lh === rh;
  return true;
}

const nav = document.createElement("nav");
nav.className = "site-nav";
nav.setAttribute("aria-label", "Main navigation");

for (const p of pages) {
  const url = resolveUrl(p.url);
  const a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;
  a.classList.toggle("current", isCurrentNavLink(a));
  if (
    a.host !== location.host &&
    (a.protocol === "http:" || a.protocol === "https:")
  ) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  nav.append(a);
}

document.body.prepend(nav);

document.body.insertAdjacentHTML(
  "afterbegin",
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic</option>
			<option value="light">Light</option>
			<option value="dark">Dark</option>
		</select>
	</label>`,
);

function setColorScheme(colorScheme, syncSelect) {
  document.documentElement.style.setProperty("color-scheme", colorScheme);
  if (syncSelect) {
    const sel = document.querySelector("label.color-scheme select");
    if (sel) sel.value = colorScheme;
  }
}

const select = document.querySelector("label.color-scheme select");

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme, true);
}

select?.addEventListener("input", (event) => {
  const value = event.target.value;
  setColorScheme(value, false);
  localStorage.colorScheme = value;
});

const contactForm = document.querySelector(
  'form.contact-form[action^="mailto:"]',
);
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const action = contactForm.getAttribute("action") || contactForm.action;
  const parts = [];
  for (const [name, value] of data) {
    parts.push(
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    );
  }
  const url = `${action}?${parts.join("&")}`;
  location.href = url;
});

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) return;
  containerElement.innerHTML = '';
  projects.forEach(project => {
    const article = document.createElement('article');
    
    const title = project.title || 'Untitled';
    const image = project.image || 'https://vis-society.github.io/labs/2/images/empty.svg';
    const desc = project.description || '';
    const year = project.year || '';
    
    // Resolve relative URL dynamically if not starting with http
    let url = project.url || '';
    if (url && !url.startsWith('http')) {
       // Since renderProjects might be called from indices at different folder depths, 
       // it's safest to use the BASE_PATH assuming urls are relative to root, or use a data-based approach.
       // The projects are stored with their relative paths from root, so we ensure absolute.
       url = resolveUrl(url); 
    }

    let linkStr = url ? ` <a href="${url}" class="project-link">View project \u2192</a>` : '';
    let yearStr = year ? ` <span style="font-family: var(--heading-font); color: var(--color-subtle); float: right;">${year}</span>` : '';

    article.innerHTML = `
      <${headingLevel}>${title}${yearStr}</${headingLevel}>
      <img src="${image}" alt="${title}">
      <p>${desc}${linkStr}</p>
    `;
    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
