// 寰镜 MarketLens — one-command release (docs/RELEASE.md §2).
// Usage:
//   node scripts/release.mjs <x.y.z> --msg "summary" [--token npm_xxx] [--host-port 41070] [--python D:\...\python.exe] [--no-npm]
// Gates run in order; any failure aborts BEFORE git commit, so the tree is
// left untouched and the same version can be retried after fixing.
import { readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const version = argv.find((a) => !a.startsWith('--'));
const flag = (name) => {
	const i = argv.indexOf(`--${name}`);
	return i < 0 ? null : (argv[i + 1] === void 0 || (argv[i + 1] ?? '').startsWith('--') ? true : argv[i + 1]);
};
const msg = flag('msg');
const token = flag('token');
const hostPort = flag('host-port');
const py = flag('python') ?? (existsSync('C:\\Users\\SuiFei\\.dsh\\dsh-runtimes\\dsh-primary-runtime\\dependencies\\python\\python.exe')
	? 'C:\\Users\\SuiFei\\.dsh\\dsh-runtimes\\dsh-primary-runtime\\dependencies\\python\\python.exe' : 'python');
const NODE = process.execPath;
const fail = (why) => { console.error(`\x1b[31mRELEASE ABORT: ${why}\x1b[0m`); process.exit(1); };
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) fail('usage: release.mjs <x.y.z> --msg "..." [--token npm_..] [--host-port N] [--no-npm]');
if (typeof msg !== 'string') fail('--msg is required (one-line summary)');
if (!token && flag('no-npm') !== true) fail('npm channel needs --token <granular token with Bypass-2FA> (or --no-npm)');

const run = (cmd, args, opts) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024, ...opts });
const step = async (n, name, fn) => {
	process.stdout.write(`[${n}] ${name} ... `);
	try {
		const out = await fn();
		console.log('OK');
		return out;
	} catch (e) {
		console.log('FAIL');
		fail(`${name}: ${(e.stdout ?? '') + (e.stderr ?? '') + (e.message ?? '')}`.slice(0, 2000));
	}
};

// 1) version triple sync -------------------------------------------------------
const bump = async (file, from, to) => {
	const p = join(root, file);
	const s = await readFile(p, 'utf8');
	if (!s.includes(from)) fail(`${file} missing anchor "${from}" — file drifted from release script assumptions`);
	await writeFile(p, s.replace(from, to));
};
await step('1/8', `version triple -> ${version}`, async () => {
	const pkg = await readFile(join(root, 'package.json'), 'utf8');
	const old = /"version": "([^"]+)"/.exec(pkg)?.[1];
	if (old === void 0) fail('package.json has no version');
	await bump('package.json', `"version": "${old}"`, `"version": "${version}"`);
	await bump('index.js', `version: '${old}'`, `version: '${version}'`);
	const rev = /const CLIENT_REV = '([^']+)';/.exec(await readFile(join(root, 'client.js'), 'utf8'))?.[1];
	if (rev === void 0) fail('client.js has no CLIENT_REV');
	await bump('client.js', `const CLIENT_REV = '${rev}';`, `const CLIENT_REV = '${version}';`);
	console.log(`\n    ${old} -> ${version} (package.json / index.js / client.js)`);
});

// 2) syntax gate ---------------------------------------------------------------
await step('2/8', 'node --check client.js + index.js', () => { run(NODE, ['--check', 'client.js']); run(NODE, ['--check', 'index.js']); });

// 3) test gate -----------------------------------------------------------------
await step('3/8', 'node --test', () => run(NODE, ['--test']));

// 4) bulb-wall offline self-check gate (0 collisions) ---------------------------
await step('4/8', 'led-shot 800x450 three frames + collision audit', () => {
	run(NODE, [join('scripts', 'led-shot.mjs')]);
	const out = run(py, [join('scripts', 'led-shot.py')]);
	if (!/TOTAL collisions: 0\b/.test(out)) fail(`led-shot audit reported collisions:\n${out}`);
	return out;
});

// 5) git commit + tag + push -----------------------------------------------------
await step('5/8', 'git add/commit/tag/push', async () => {
	const msgFile = join(root, '.release-msg.txt');
	await writeFile(msgFile, `${msg}\n\nrelease ${version}: version triple synced, tests green, bulb-wall self-check 0 collisions (docs/RELEASE.md §2).`);
	// stage everything the ignore rules allow: a hardcoded whitelist silently
	// dropped lib/ for two releases (0.34.0/0.34.1 shipped to npm but not to git)
	run('git', ['add', '-A']);
	run('git', ['commit', '-F', msgFile]);
	await rm(msgFile);
	run('git', ['tag', `v${version}`]);
	run('git', ['push', 'origin', 'main', '--follow-tags']);
});

// 6) npm publish (token via environment, never on disk) --------------------------
if (flag('no-npm') === true) {
	console.log('[6/8] npm publish ... SKIPPED (--no-npm)');
} else {
	try {
		const env = { ...process.env, [`npm_config_//${'registry.npmjs.org'}/:_authToken`]: token };
		run('npm', ['publish', '--registry=https://registry.npmjs.org'], { env, shell: process.platform === 'win32' });
		console.log('[6/8] npm publish -> registry.npmjs.org ... OK');
	} catch (e) {
		console.log('[6/8] npm publish -> registry.npmjs.org ... FAIL');
		console.error(`    gates passed and the tree is already pushed/tagged; fix auth/network, then republish WITHOUT bumping:`);
		console.error(`    npm publish --registry=https://registry.npmjs.org`);
		fail(`npm publish: ${(e.stderr ?? '') + (e.stdout ?? '') + (e.message ?? '')}`.slice(0, 800));
	}
}

// 7) registry + host verification ------------------------------------------------
const latest = await step('7/8', 'registry dist-tags.latest poll', async () => {
	// scoped publishes can sit in the registry's staging queue for several minutes
	const deadline = Date.now() + (token ? 300000 : 5000);
	let seen = 'n/a';
	while (Date.now() < deadline) {
		try {
			const r = await fetch('https://registry.npmjs.org/@suifei%2Fdsh-market-lens');
			const j = await r.json();
			seen = j?.['dist-tags']?.latest ?? 'n/a';
			if (seen === version) return seen;
		} catch { /* keep polling */ }
		await new Promise((ok) => setTimeout(ok, 5000));
	}
	console.log(`(latest still ${seen}; scoped npm entries can lag a few minutes — re-check with: npm view @suifei/dsh-market-lens version)`);
	return seen;
});
if (hostPort !== null) {
	const m = await fetch(`http://127.0.0.1:${hostPort}/market-lens/meta`, { headers: { referer: `http://127.0.0.1:${hostPort}/` } }).then((r) => r.json()).catch(() => null);
	console.log(`    host meta: ${m?.version ?? 'unreachable'}${m?.version === version ? ' ✓' : ' — 若 index.js 有改动，先在插件管理把 include:market-lens 关→开再验'}`);
}

// 8) marketplace manual checklist -------------------------------------------------
console.log(`
[8/8] 渠道清单（人工两步，见 docs/RELEASE.md §1）
  · dsh.so 插件市场：粘贴 github.com/suifei/dsh-market-lens → 开始检查 → 提交到 dsh.so
    （${latest === version ? 'npm latest 已是 ' + version : 'npm latest 尚在传播（当前 ' + latest + '），等一两分钟再提交'}）
  · awesome-dsh-plugin：条目描述如与 README 首段有出入，推送到 PR 分支
  · 本机 desktop profile 是 link: 直链，无需重装；刷新页面即达新 client.js`);
