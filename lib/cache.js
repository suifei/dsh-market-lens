/**
 * Short-TTL cache with in-flight deduplication. Concurrent identical requests
 * share one upstream fetch; a failed fetch is not cached, but a previous
 * value stays readable for callers that opt into stale serving so a flaky
 * source degrades to a delayed quote instead of a blank board.
 */

export class TtlCache {
	/**
	 * @param now - clock injection for tests.
	 */
	constructor(now = () => Date.now()) {
		this._now = now;
		this._entries = new Map();
		this._pending = new Map();
	}

	/**
	 * Read a cached value or run fetcher once for this key.
	 * @param key - cache key including every parameter that changes the result.
	 * @param ttlMs - freshness window.
	 * @param fetcher - upstream loader; rejection evicts the key.
	 * @returns the fresh or newly fetched value.
	 */
	async get(key, ttlMs, fetcher) {
		const entry = this._entries.get(key);
		if (entry !== void 0 && entry.at + ttlMs > this._now()) return entry.value;
		const pending = this._pending.get(key);
		if (pending !== void 0) return await pending;
		const task = (async () => {
			try {
				const value = await fetcher();
				this._entries.set(key, { value, at: this._now() });
				return value;
			} catch (error) {
				this._pending.delete(key);
				throw error;
			}
			finally {
				this._pending.delete(key);
			}
		})();
		this._pending.set(key, task);
		return await task;
	}

	/**
	 * Read the last known value even when past its TTL.
	 * @param key - cache key.
	 * @returns the stale value or undefined.
	 */
	peekStale(key) {
		return this._entries.get(key)?.value;
	}

	/** Drop every entry (plugin reload / config change). */
	clear() {
		this._entries.clear();
	}
}
