const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#01";
const SCRAMBLE_FRAME_MS = 28;
const SCRAMBLE_STEPS_PER_CHAR = 2;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * "Decrypting text" effect: characters resolve left-to-right from random
 * glyphs to the element's real text. Applied to elements with [data-scramble].
 */
export function scramble(element) {
	const finalText = element.textContent;
	if (reducedMotion.matches || !finalText.trim()) {
		return;
	}

	let frame = 0;
	const totalFrames = finalText.length * SCRAMBLE_STEPS_PER_CHAR;

	const timer = setInterval(() => {
		frame++;
		const resolvedCount = Math.floor(frame / SCRAMBLE_STEPS_PER_CHAR);
		let output = finalText.slice(0, resolvedCount);
		for (let i = resolvedCount; i < finalText.length; i++) {
			output += finalText[i] === " "
				? " "
				: SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
		}
		element.textContent = output;
		if (frame >= totalFrames) {
			clearInterval(timer);
			element.textContent = finalText;
		}
	}, SCRAMBLE_FRAME_MS);
}

export function scrambleAll(root) {
	root.querySelectorAll("[data-scramble]").forEach(scramble);
}
