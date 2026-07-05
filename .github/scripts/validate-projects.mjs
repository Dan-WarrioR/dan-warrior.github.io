import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const errors = [];

function report(message) {
	errors.push(message);
	console.error(`ERROR: ${message}`);
}

async function fileExists(relativePath) {
	try {
		await access(resolve(REPO_ROOT, relativePath));
		return true;
	} catch {
		return false;
	}
}

async function readJson(relativePath) {
	const raw = await readFile(resolve(REPO_ROOT, relativePath), "utf8");
	return JSON.parse(raw);
}

let slugs;
try {
	slugs = await readJson("projects/index.json");
} catch (error) {
	report(`projects/index.json is missing or not valid JSON: ${error.message}`);
	process.exit(1);
}

if (!Array.isArray(slugs) || slugs.some((slug) => typeof slug !== "string")) {
	report("projects/index.json must be an array of strings");
	process.exit(1);
}

for (const slug of slugs) {
	const jsonPath = `projects/${slug}.json`;

	if (!(await fileExists(jsonPath))) {
		report(`${jsonPath} is listed in index.json but does not exist`);
		continue;
	}

	let project;
	try {
		project = await readJson(jsonPath);
	} catch (error) {
		report(`${jsonPath} is not valid JSON: ${error.message}`);
		continue;
	}

	if (!project.title || typeof project.title !== "string") {
		report(`${jsonPath}: "title" is required and must be a string`);
	}

	const imagePaths = [project.cover, ...(project.screenshots ?? [])].filter(
		(path) => typeof path === "string" && path.startsWith("assets/")
	);
	for (const imagePath of imagePaths) {
		if (!(await fileExists(imagePath))) {
			report(`${jsonPath}: referenced file "${imagePath}" does not exist`);
		}
	}
}

if (errors.length > 0) {
	console.error(`\n${errors.length} problem(s) found.`);
	process.exit(1);
}

console.log(`OK: ${slugs.length} project(s) validated.`);
