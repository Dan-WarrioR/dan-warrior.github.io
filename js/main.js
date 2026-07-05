import { renderHome, renderProjects, renderProject, renderAbout, renderNotFound } from "./views.js";

const appContainer = document.getElementById("app");

function parseRoute() {
	const hash = window.location.hash.replace(/^#\/?/, "");
	const segments = hash.split("/").filter(Boolean);

	if (segments.length === 0) {
		return { name: "home" };
	}
	if (segments[0] === "projects") {
		return { name: "projects" };
	}
	if (segments[0] === "about") {
		return { name: "about" };
	}
	if (segments[0] === "project" && segments[1]) {
		return { name: "project", slug: decodeURIComponent(segments[1]) };
	}
	return { name: "not-found" };
}

function updateNav(routeName) {
	const activeRoute = routeName === "project" ? "projects" : routeName;
	document.querySelectorAll(".site-nav a").forEach((link) => {
		link.classList.toggle("active", link.dataset.route === activeRoute);
	});
}

async function render() {
	const route = parseRoute();
	updateNav(route.name);
	window.scrollTo(0, 0);

	switch (route.name) {
		case "home":
			await renderHome(appContainer);
			break;
		case "projects":
			await renderProjects(appContainer);
			break;
		case "about":
			renderAbout(appContainer);
			break;
		case "project":
			await renderProject(appContainer, route.slug);
			break;
		default:
			renderNotFound(appContainer);
	}
}

window.addEventListener("hashchange", render);
document.getElementById("footer-year").textContent = String(new Date().getFullYear());
render();
