// v0.34.6: drop the @deepseek-ai/dsh-tools import (packaging audit flagged a
// declared dependency on a DSH-internal package). We only ever used defineTool,
// which turns our parameter spec into JSON Schema and hands the registry a plain
// definition object - the same shape is produced here locally.
import { readFile, writeFile } from 'node:fs/promises';
const p = 'index.js';
let s = await readFile(p, 'utf8');
const crlf = s.includes('\r\n');
if (crlf) s = s.replace(/\r\n/g, '\n');

const imp = "import { defineTool } from '@deepseek-ai/dsh-tools';\n";
if (!s.includes(imp)) { console.log('MISS import'); process.exit(1); }
s = s.replace(imp, '');

const anchor = "/** Stable Loader identity. */";
if (!s.includes(anchor)) { console.log('MISS anchor'); process.exit(1); }
const block = [
	"/**",
	" * The tool registry only needs a plain definition: name, description, a JSON",
	" * Schema for the arguments, an output schema, a renderer and execute().",
	" * @deepseek-ai/dsh-tools' defineTool performs exactly this conversion, but",
	" * pulling that harness-internal package in as a dependency invites version",
	" * skew with the host's own copy, so the same shape is built here.",
	" */",
	"function parametersToJsonSchema(spec) {",
	"	const properties = {};",
	"	const required = [];",
	"	for (const [key, value] of Object.entries(spec ?? {})) {",
	"		const { required: isRequired, ...rest } = value ?? {};",
	"		properties[key] = rest;",
	"		if (isRequired === true) required.push(key);",
	"	}",
	"	return { type: 'object', properties, ...(required.length > 0 ? { required } : {}) };",
	"}",
	"",
	"function defineTool(options) {",
	"	const parameters = parametersToJsonSchema(options.parameters);",
	"	return {",
	"		name: options.name,",
	"		description: options.description,",
	"		parameters,",
	"		output: {",
	"			schema: options.output?.schema ?? { type: 'json' },",
	"			render: (args, value) => options.output.render(args, value),",
	"		},",
	"		...(options.timeoutMs !== void 0 ? { timeoutMs: options.timeoutMs } : {}),",
	"		async execute(args, exec) {",
	"			return await options.execute(args, exec);",
	"		},",
	"	};",
	"}",
	"",
	anchor,
].join('\n');
s = s.replace(anchor, block);

if (crlf) s = s.replace(/\n/g, '\r\n');
await writeFile(p, s);
console.log('local defineTool installed');
