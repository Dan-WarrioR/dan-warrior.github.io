import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const PROJECTS_DIR = resolve(REPO_ROOT, "projects");
const INDEX_PATH = resolve(PROJECTS_DIR, "index.json");

const files = (await readdir(PROJECTS_DIR)).filter(
	(name) => name.endsWith(".json") && name !== "index.json"
);

const entries = [];
let hasErrors = false;

for (const file of files) {
	const slug = file.slice(0, -".json".length);
	try {
		const project = JSON.parse(await readFile(resolve(PROJECTS_DIR, file), "utf8"));
		entries.push({ slug, order: typeof project.order === "number" ? project.order : Infinity });
	} catch (error) {
		console.error(`ERROR: projects/${file} is not valid JSON: ${error.message}`);
		hasErrors = true;
	}
}

if (hasErrors) {
	process.exit(1);
}

entries.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

const slugs = entries.map((entry) => entry.slug);
const output = `[\n${slugs.map((slug) => `\t"${slug}"`).join(",\n")}\n]\n`;

const previous = await readFile(INDEX_PATH, "utf8").catch(() => "");
if (previous === output) {
	console.log(`OK: projects/index.json already up to date (${slugs.length} project(s)).`);
} else {
	await writeFile(INDEX_PATH, output);
	console.log(`Regenerated projects/index.json with ${slugs.length} project(s): ${slugs.join(", ")}`);
}
