/**
 * Plugin-owned diagnostic log: one JSONL file per day, appended serially,
 * rotated at a byte cap, and readable back through tail(). Both the Host
 * (guard rejections, route facts) and the Client half (via POST /diag)
 * write into it, so "the panel shows no data" is answerable from evidence.
 */
import { appendFile, mkdir, readFile, rename, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** The date-stamped file name carries the project id and the day (naming rule). */
export function diagFileName(date = new Date()) {
	return `marketlens-diag-${date.toISOString().slice(0, 10)}.jsonl`;
}

export function defaultDiagDir() {
	return join(homedir(), '.dsh', 'market-lens');
}

/**
 * @param options - { dir, maxBytes, now, enabled } seams for tests.
 */
export function createDiagLogger(options = {}) {
	const dir = options.dir ?? defaultDiagDir();
	const maxBytes = options.maxBytes ?? 1048576;
	const enabled = options.enabled !== false;
	const now = options.now ?? (() => /* @__PURE__ */ new Date());
	let queue = Promise.resolve();
	let dirReady = null;
	/** @type {number} */
	let appended = 0;

	const ensureDir = () => {
		if (dirReady === null) dirReady = mkdir(dir, { recursive: true });
		return dirReady;
	};

	const path = () => join(dir, diagFileName(now()));

	function append(row) {
		if (!enabled) return queue;
		const line = `${JSON.stringify({ t: now().toISOString(), ...row })}\n`;
		queue = queue.then(async () => {
			await ensureDir();
			appended++;
			if (appended % 20 === 1) {
				// Cheap periodic rotation: stat at most every 20 appends.
				try {
					const info = await stat(path());
					if (info.size > maxBytes) await rename(path(), `${path()}.1`);
				} catch { /* first write: nothing to rotate */ }
			}
			await appendFile(path(), line, 'utf8');
		}).catch(() => void 0);
		return queue;
	}

	/**
	 * Read back the newest rows of today's file.
	 * @param count - rows to return, newest last.
	 */
	async function tail(count = 50) {
		let text = '';
		try {
			text = await readFile(path(), 'utf8');
		} catch {
			return { file: path(), rows: [] };
		}
		const rows = text
			.split('\n')
			.filter((line) => line !== '')
			.map((line) => {
				try {
					return JSON.parse(line);
				} catch {
					return { t: '?', ev: 'unparsed', line };
				}
			});
		return { file: path(), rows: rows.slice(-Math.max(1, Math.min(500, count))) };
	}

	return { append, tail, path, dir, get queueSize() {
		return appended;
	} };
}
