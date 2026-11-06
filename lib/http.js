/**
 * Upstream HTTP helpers for the Host half. Node-only: market fetching never
 * happens in the browser. The fetch implementation is injectable so unit
 * tests run offline; the default is the Node global fetch.
 */

/** A source failure with a stable code, routable by the fallback chain. */
export class SourceError extends Error {
	/**
	 * @param source - upstream id (eastmoney / tencent / yahoo).
	 * @param code - machine code such as TIMEOUT, HTTP_STATUS, PARSE, EMPTY.
	 * @param message - human-readable detail.
	 */
	constructor(source, code, message) {
		super(`${source}: ${message}`);
		this.name = 'SourceError';
		this.source = source;
		this.code = code;
	}
}

/**
 * Fetch a URL as text or JSON with a hard timeout and a browser-like UA.
 * @param url - absolute http(s) URL (same-host allowlist is applied by callers).
 * @param options - fetch override, timeout, headers, gbk decoding, and an
 * optional plain-HTTP retry when TLS to the host fails at connect time
 * (observed with push2.eastmoney.com on some networks).
 * @returns the decoded body (json returns a parsed value).
 */
export async function fetchUpstream(url, options = {}) {
	const { fetchImpl = globalThis.fetch, timeoutMs = 6000, as = 'text', headers = {}, signal, insecureFallback } = options;
	if (fetchImpl === void 0) throw new SourceError('http', 'NO_FETCH', 'global fetch is unavailable in this Node runtime');
	const attempt = async (target) => {
		const init = {
			method: 'GET',
			redirect: 'follow',
			headers: {
				'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) MarketLens/0.1',
				accept: as === 'json' ? 'application/json, text/plain, */*' : '*/*',
				...headers,
			},
		};
		const timeoutSignal = AbortSignal.timeout(timeoutMs);
		init.signal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
		let response;
		try {
			response = await fetchImpl(target, init);
		} catch (error) {
			const timedOut = timeoutSignal.aborted && !signal?.aborted;
			throw new SourceError('http', timedOut ? 'TIMEOUT' : 'NETWORK', `${target} ${timedOut ? 'timed out' : `failed: ${String(error)}`}`);
		}
		if (!response.ok) throw new SourceError('http', 'HTTP_STATUS', `${target} answered ${String(response.status)}`);
		if (as === 'json') return await response.json();
		const charset = String(response.headers.get('content-type') ?? '').toLowerCase();
		if (charset.includes('gbk') || charset.includes('gb2312') || options.decodeGbk === true) {
			const buffer = await response.arrayBuffer();
			return new TextDecoder('gbk').decode(buffer);
		}
		return await response.text();
	};
	try {
		return await attempt(url);
	} catch (error) {
		if (insecureFallback === true && error instanceof SourceError && (error.code === 'NETWORK' || error.code === 'TIMEOUT') && url.startsWith('https://')) {
			return await attempt(`http://${url.slice('https://'.length)}`);
		}
		throw error;
	}
}
