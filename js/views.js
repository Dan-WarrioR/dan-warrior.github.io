import { loadProjects, getProject } from "./data.js";
import { scrambleAll } from "./effects.js";

const FEATURED_PROJECT_COUNT = 3;
const CV_URL = "assets/cv/Danylo_Norkin_CV.pdf";
const YOUTUBE_ID_PATTERN = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/;

function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function escapeAttr(value) {
	return escapeHtml(value);
}

function isSafeUrl(url) {
	return /^(https?:\/\/|mailto:|assets\/|projects\/)/.test(String(url ?? ""));
}

function tagListHtml(project) {
	const tags = [];
	if (project.engine) {
		tags.push(`<span class="tag tag--engine">${escapeHtml(project.engine)}</span>`);
	}
	for (const tag of project.tags ?? []) {
		tags.push(`<span class="tag">${escapeHtml(tag)}</span>`);
	}
	return tags.join("");
}

function projectCardHtml(project, index) {
	const cover = isSafeUrl(project.cover)
		? `<img src="${escapeAttr(project.cover)}" alt="${escapeAttr(project.title)} cover" loading="lazy">`
		: "";
	const indexLabel = String(index + 1).padStart(2, "0");
	return `
		<a class="project-card" href="#/project/${escapeAttr(project.slug)}">
			<div class="card-cover">${cover}</div>
			<div class="card-body">
				<p class="hud-label hud-label--accent">// PROJECT_${indexLabel}</p>
				<h3>${escapeHtml(project.title)}</h3>
				<div>${tagListHtml(project)}</div>
				<p class="card-desc">${escapeHtml(project.shortDescription ?? "")}</p>
			</div>
		</a>`;
}

function stateHtml(message, isError = false) {
	return `<div class="view-state${isError ? " view-state--error" : ""}">${escapeHtml(message)}</div>`;
}

/* ---------- views ---------- */

export async function renderHome(container) {
	container.innerHTML = `
		<div class="view">
			<section class="hero">
				<p class="hud-label hud-label--accent">// UNITY_GAME_DEVELOPER</p>
				<h1 class="glitch glitch--auto" data-text="DANYLO NORKIN"><span data-scramble>DANYLO NORKIN</span></h1>
				<p class="hero-sub">I build gameplay that survives production — NPC AI, game systems and UI for shipped commercial titles, from the VR horror Echoes of the Sun to live development on Hero Realms.</p>
				<div class="hero-actions">
					<a class="btn" href="#/projects">VIEW PROJECTS</a>
					<a class="btn btn--ghost" href="${CV_URL}" download>DOWNLOAD_CV</a>
				</div>
			</section>
			<hr class="rule">
			<section>
				<p class="hud-label">// FEATURED_PROJECTS</p>
				<div class="project-grid" id="featured-grid">${stateHtml("LOADING DATA STREAM...")}</div>
			</section>
		</div>`;
	scrambleAll(container);

	const grid = container.querySelector("#featured-grid");
	try {
		const projects = await loadProjects();
		grid.innerHTML = projects.length
			? projects.slice(0, FEATURED_PROJECT_COUNT).map(projectCardHtml).join("")
			: stateHtml("NO PROJECTS FOUND");
	} catch (error) {
		console.error(error);
		grid.innerHTML = stateHtml("ERROR: FAILED TO LOAD PROJECT DATA", true);
	}
}

export async function renderProjects(container) {
	container.innerHTML = `
		<div class="view">
			<p class="hud-label hud-label--accent">// PROJECT_DATABASE</p>
			<h1 class="view-title glitch" data-text="PROJECTS"><span data-scramble>PROJECTS</span></h1>
			<div class="project-grid" id="projects-grid">${stateHtml("LOADING DATA STREAM...")}</div>
		</div>`;
	scrambleAll(container);

	const grid = container.querySelector("#projects-grid");
	try {
		const projects = await loadProjects();
		grid.innerHTML = projects.length
			? projects.map(projectCardHtml).join("")
			: stateHtml("NO PROJECTS FOUND");
	} catch (error) {
		console.error(error);
		grid.innerHTML = stateHtml("ERROR: FAILED TO LOAD PROJECT DATA", true);
	}
}

export async function renderProject(container, slug) {
	container.innerHTML = `<div class="view">${stateHtml("LOADING DATA STREAM...")}</div>`;

	let project = null;
	try {
		project = await getProject(slug);
	} catch (error) {
		console.error(error);
		container.innerHTML = `<div class="view">${stateHtml("ERROR: FAILED TO LOAD PROJECT DATA", true)}</div>`;
		return;
	}

	if (!project) {
		renderNotFound(container);
		return;
	}

	const sections = [];

	if (project.video) {
		sections.push(`
			<section class="project-section">
				<p class="hud-label">// VIDEO_FEED</p>
				${videoFrameHtml(project.video)}
			</section>`);
	}

	const screenshots = (project.screenshots ?? []).filter(isSafeUrl);
	if (screenshots.length) {
		sections.push(`
			<section class="project-section">
				<p class="hud-label">// VISUAL_RECORDS [${screenshots.length}]</p>
				<div class="carousel" id="carousel">
					<div class="carousel-viewport"></div>
					<button class="carousel-btn carousel-btn--prev" aria-label="Previous screenshot">&lt;</button>
					<button class="carousel-btn carousel-btn--next" aria-label="Next screenshot">&gt;</button>
					<span class="carousel-status"></span>
				</div>
			</section>`);
	}

	if (project.description) {
		const paragraphs = String(project.description)
			.split(/\n+/)
			.filter((paragraph) => paragraph.trim())
			.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
			.join("");
		sections.push(`
			<section class="project-section project-desc">
				<p class="hud-label">// MISSION_BRIEF</p>
				${paragraphs}
			</section>`);
	}

	const links = (project.links ?? []).filter((link) => link.label && isSafeUrl(link.url));
	if (links.length) {
		sections.push(`
			<section class="project-section">
				<p class="hud-label">// EXTERNAL_LINKS</p>
				<div class="project-links">
					${links.map((link) => `<a class="btn" href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`).join("")}
				</div>
			</section>`);
	}

	container.innerHTML = `
		<div class="view">
			<a class="back-link" href="#/projects">&lt; BACK_TO_PROJECTS</a>
			<header class="project-head">
				<p class="hud-label hud-label--accent">// PROJECT_FILE :: ${escapeHtml(project.slug.toUpperCase())}</p>
				<h1 class="glitch" data-text="${escapeAttr(project.title)}"><span data-scramble>${escapeHtml(project.title)}</span></h1>
				<div>${tagListHtml(project)}</div>
			</header>
			${sections.join("")}
		</div>`;
	scrambleAll(container);

	initVideoFrame(container);
	if (screenshots.length) {
		initCarousel(container.querySelector("#carousel"), screenshots, project.title);
	}
}

export function renderAbout(container) {
	container.innerHTML = `
		<div class="view">
			<p class="hud-label hud-label--accent">// PERSONNEL_FILE</p>
			<h1 class="view-title glitch" data-text="ABOUT"><span data-scramble>ABOUT</span></h1>
			<div class="about-layout">
				<section class="about-bio">
					<p>I'm Danylo Norkin, a Unity developer currently at Storymode, where I support and develop Hero Realms — implementing new gameplay features, investigating and fixing production bugs, and improving existing systems in a live production environment.</p>
					<p>Before that I worked on Echoes of the Sun, a commercial VR project: ghost NPC AI built on Behavior Trees, a modular NPC animation system with Timeline integration, interactive dialogue logic, and the game's modular UI and settings architecture.</p>
					<p>I got into game development by leading a small team on <a href="#/project/post-office-unity">Post-Office</a>, a first-person horror game, and I never stopped prototyping — most recently high-performance experiments with Unity DOTS and ECS. Alongside work I'm studying Software Engineering in Krakow.</p>
					<p>Open to game development opportunities — reach out via any channel in the footer.</p>
					<div class="hero-actions">
						<a class="btn" href="${CV_URL}" download>DOWNLOAD_CV</a>
						<a class="btn btn--ghost" href="mailto:norkindanylo@gmail.com">CONTACT_ME</a>
					</div>
					<div class="about-timeline">
						<p class="hud-label">// SERVICE_RECORD</p>
						<div class="timeline-entry" style="margin-top:18px">
							<span class="timeline-date">2025 — PRESENT</span>
							<h3>Storymode — Hero Realms</h3>
							<p>Live production: new gameplay features, bug investigation and fixes, system improvements, code quality.</p>
						</div>
						<div class="timeline-entry">
							<span class="timeline-date">2024 — 2025</span>
							<h3>Echoes of the Sun (VR)</h3>
							<p>NPC AI with Behavior Trees, modular animation and dialogue systems, UI architecture and persistent settings.</p>
						</div>
						<div class="timeline-entry">
							<span class="timeline-date">2023 — 2024</span>
							<h3>Post-Office</h3>
							<p>Team lead on a first-person horror game: Zenject architecture, inventory, quest and random event systems, full UI.</p>
						</div>
					</div>
				</section>
				<section class="about-skills">
					<p class="hud-label">// TECH_SKILLS_&amp;_TOOLS</p>
					<dl class="skill-list">
						<dt>UNITY_DEVELOPMENT</dt><dd>C#, DOTS, Unity (UI, AI, Animation, Timeline, Shaders, Localization, NavMesh, UniTask, FMOD, Behavior Trees, Odin Inspector, Zenject, Reflex)</dd>
						<dt>PROGRAMMING_PARADIGMS</dt><dd>OOP, SOLID, Design Patterns, ECS, Job System, Async programming</dd>
						<dt>DEVELOPMENT_PRACTICES</dt><dd>Debugging, Optimization, Rapid Prototyping, Code Refactoring, Production Game Support</dd>
						<dt>BACKEND_&amp;_SCRIPTING</dt><dd>.NET, Lua</dd>
						<dt>TOOLS</dt><dd>Git, Rider, Visual Studio</dd>
					</dl>
					<p class="hud-label skill-list-heading">// PROFESSIONAL_SKILLS</p>
					<dl class="skill-list">
						<dt>GAME_DEVELOPMENT</dt><dd>Gameplay architecture, NPC AI, Dialogue systems, UI/UX Design, Feature Development</dd>
						<dt>ALGORITHMS</dt><dd>FSM, HSM, Behavior Trees, Data Structures</dd>
						<dt>SOFT_SKILLS</dt><dd>Team Leadership, Team Collaboration, Agile/Scrum, Code Reviews</dd>
						<dt>PROBLEM_SOLVING</dt><dd>Debugging complex systems, edge-case handling, performance optimization</dd>
						<dt>LANGUAGES</dt><dd>Ukrainian (native), Russian (native), English (intermediate), Polish (intermediate)</dd>
					</dl>
				</section>
			</div>
		</div>`;
	scrambleAll(container);
}

export function renderNotFound(container) {
	container.innerHTML = `
		<div class="view">
			${stateHtml("ERROR 404 // FILE_NOT_FOUND", true)}
			<p style="text-align:center"><a class="btn" href="#/projects">BACK TO PROJECTS</a></p>
		</div>`;
}

/* ---------- video embed (click-to-load, youtube-nocookie) ---------- */

function extractYoutubeId(url) {
	const match = String(url ?? "").match(YOUTUBE_ID_PATTERN);
	return match ? match[1] : null;
}

function videoFrameHtml(videoUrl) {
	const videoId = extractYoutubeId(videoUrl);
	if (!videoId) {
		return stateHtml("UNSUPPORTED VIDEO URL", true);
	}
	return `
		<div class="video-frame" data-video-id="${escapeAttr(videoId)}">
			<img class="video-thumb" src="https://img.youtube.com/vi/${escapeAttr(videoId)}/hqdefault.jpg" alt="Video thumbnail" loading="lazy" onerror="this.remove()">
			<button class="video-play" type="button" aria-label="Play video">
				<svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
				<span>INITIATE_PLAYBACK</span>
			</button>
		</div>`;
}

function initVideoFrame(container) {
	const frame = container.querySelector(".video-frame");
	if (!frame) {
		return;
	}
	frame.querySelector(".video-play")?.addEventListener("click", () => {
		const videoId = frame.dataset.videoId;
		frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1" title="Project video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
	});
}

/* ---------- screenshot carousel + lightbox ---------- */

/**
 * Builds the three-layer glitch image: a base <img> plus two color-shifted
 * copies used by the RGB-split animation. The animation starts only once the
 * image is actually decoded — starting it while the file is still downloading
 * would finish invisibly before paint.
 */
function createGlitchImage(src, altText) {
	const figure = document.createElement("figure");
	figure.className = "glitch-img";

	const base = document.createElement("img");
	base.className = "glitch-img-base";
	base.alt = altText;
	base.src = src;
	figure.appendChild(base);

	for (const layerModifier of ["glitch-img-layer--r", "glitch-img-layer--b"]) {
		const layer = document.createElement("img");
		layer.className = `glitch-img-layer ${layerModifier}`;
		layer.alt = "";
		layer.setAttribute("aria-hidden", "true");
		layer.src = src;
		figure.appendChild(layer);
	}

	const play = () => {
		figure.classList.remove("is-glitching");
		void figure.offsetWidth;
		figure.classList.add("is-glitching");
	};
	if (base.complete && base.naturalWidth > 0) {
		play();
	} else {
		base.addEventListener("load", play, { once: true });
	}

	return figure;
}

function initCarousel(carousel, screenshots, projectTitle) {
	const viewport = carousel.querySelector(".carousel-viewport");
	const status = carousel.querySelector(".carousel-status");
	let currentIndex = 0;

	function show(index) {
		currentIndex = (index + screenshots.length) % screenshots.length;
		const figure = createGlitchImage(screenshots[currentIndex], `${projectTitle} screenshot ${currentIndex + 1}`);
		figure.addEventListener("click", () => openLightbox(screenshots[currentIndex], projectTitle));
		viewport.replaceChildren(figure);
		status.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(screenshots.length).padStart(2, "0")}`;
	}

	carousel.querySelector(".carousel-btn--prev").addEventListener("click", () => show(currentIndex - 1));
	carousel.querySelector(".carousel-btn--next").addEventListener("click", () => show(currentIndex + 1));

	function onKeyDown(event) {
		if (document.querySelector(".lightbox") || !document.body.contains(carousel)) {
			if (!document.body.contains(carousel)) {
				document.removeEventListener("keydown", onKeyDown);
			}
			return;
		}
		if (event.key === "ArrowLeft") {
			show(currentIndex - 1);
		} else if (event.key === "ArrowRight") {
			show(currentIndex + 1);
		}
	}
	document.addEventListener("keydown", onKeyDown);

	show(0);
}

function openLightbox(src, projectTitle) {
	const lightbox = document.createElement("div");
	lightbox.className = "lightbox";
	const figure = createGlitchImage(src, `${projectTitle} screenshot, full size`);
	const closeButton = document.createElement("button");
	closeButton.className = "lightbox-close";
	closeButton.type = "button";
	closeButton.setAttribute("aria-label", "Close");
	closeButton.textContent = "[ CLOSE ]";
	lightbox.append(figure, closeButton);

	function close() {
		lightbox.remove();
		document.removeEventListener("keydown", onKeyDown);
	}

	function onKeyDown(event) {
		if (event.key === "Escape") {
			close();
		}
	}

	lightbox.addEventListener("click", close);
	document.addEventListener("keydown", onKeyDown);
	document.body.appendChild(lightbox);
}
