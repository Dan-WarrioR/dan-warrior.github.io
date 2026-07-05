const PROJECTS_INDEX_URL = "projects/index.json";

let projectsCache = null;

async function fetchJson(url) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to load ${url} (HTTP ${response.status})`);
	}
	return response.json();
}

export async function loadProjects() {
	if (projectsCache) {
		return projectsCache;
	}

	const slugs = await fetchJson(PROJECTS_INDEX_URL);
	if (!Array.isArray(slugs)) {
		throw new Error("projects/index.json must contain an array of project slugs");
	}

	const results = await Promise.allSettled(
		slugs.map(async (slug) => {
			const project = await fetchJson(`projects/${slug}.json`);
			return { slug, ...project };
		})
	);

	const projects = [];
	for (const result of results) {
		if (result.status === "fulfilled" && result.value.title) {
			projects.push(result.value);
		} else if (result.status === "rejected") {
			console.error("[projects] skipped entry:", result.reason);
		}
	}

	projectsCache = projects;
	return projects;
}

export async function getProject(slug) {
	const projects = await loadProjects();
	return projects.find((project) => project.slug === slug) ?? null;
}
