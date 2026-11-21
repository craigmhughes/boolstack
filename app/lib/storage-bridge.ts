import type { PGliteWithLive } from "@electric-sql/pglite/live";
import { artifactStoragePrefix } from "./artifacts";
import { scheduleBackup } from "./db";
import type { StoredValue } from "./types";

export const STORAGE_MESSAGE_SOURCE = "boolstack-ls";

export type StorageMessage = {
  source: typeof STORAGE_MESSAGE_SOURCE;
  ns: string;
  op: "set" | "remove" | "clear";
  key?: string;
  value?: string;
};

/**
 * Builds the script that replaces `window.localStorage` inside the artifact
 * iframe with a namespaced proxy and reports every mutation to the parent.
 */
export function buildProxyScript(namespace: string): string {
  const prefix = JSON.stringify(artifactStoragePrefix(namespace));
  const ns = JSON.stringify(namespace);
  const source = JSON.stringify(STORAGE_MESSAGE_SOURCE);
  return `<script>
(function () {
  var PREFIX = ${prefix};
  var NS = ${ns};
  var SOURCE = ${source};
  var ls = window.localStorage;

  function ownKeys() {
    var out = [];
    for (var i = 0; i < ls.length; i++) {
      var k = ls.key(i);
      if (k !== null && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
    }
    return out;
  }
  function notify(op, key, value) {
    try {
      var msg = { source: SOURCE, ns: NS, op: op };
      if (key !== undefined) msg.key = key;
      if (value !== undefined) msg.value = value;
      window.parent.postMessage(msg, '*');
    } catch (e) {}
  }

  var api = {
    getItem: function (k) { return ls.getItem(PREFIX + String(k)); },
    setItem: function (k, v) {
      k = String(k); v = String(v);
      ls.setItem(PREFIX + k, v);
      notify('set', k, v);
    },
    removeItem: function (k) {
      k = String(k);
      ls.removeItem(PREFIX + k);
      notify('remove', k);
    },
    clear: function () {
      var keys = ownKeys();
      for (var i = 0; i < keys.length; i++) ls.removeItem(PREFIX + keys[i]);
      notify('clear');
    },
    key: function (i) {
      var keys = ownKeys();
      return i >= 0 && i < keys.length ? keys[i] : null;
    }
  };
  function isApi(p) { return Object.prototype.hasOwnProperty.call(api, p); }

  var proxy = new Proxy({}, {
    get: function (t, p) {
      if (typeof p === 'symbol') return undefined;
      if (p === 'length') return ownKeys().length;
      if (isApi(p)) return api[p];
      var v = ls.getItem(PREFIX + p);
      return v === null ? undefined : v;
    },
    set: function (t, p, v) {
      if (typeof p === 'symbol') return true;
      api.setItem(p, v);
      return true;
    },
    deleteProperty: function (t, p) {
      if (typeof p === 'symbol') return true;
      api.removeItem(p);
      return true;
    },
    has: function (t, p) {
      if (typeof p === 'symbol') return false;
      return isApi(p) || p === 'length' || ls.getItem(PREFIX + p) !== null;
    },
    ownKeys: function () { return ownKeys(); },
    getOwnPropertyDescriptor: function (t, p) {
      if (typeof p === 'symbol') return undefined;
      var v = ls.getItem(PREFIX + p);
      if (v === null) return undefined;
      return { value: v, writable: true, enumerable: true, configurable: true };
    }
  });

  Object.defineProperty(window, 'localStorage', {
    get: function () { return proxy; },
    configurable: true
  });
})();
<\/script>`;
}

/**
 * Injects the proxy script as early as possible: first thing in <head>,
 * else after <html>, else after a leading doctype, else prepended.
 */
export function injectStorageProxy(html: string, namespace: string): string {
  const script = buildProxyScript(namespace);
  const insert = (re: RegExp) => html.replace(re, (m) => m + script);
  if (/<head[\s>]/i.test(html)) return insert(/<head(?:\s[^>]*)?>/i);
  if (/<html[\s>]/i.test(html)) return insert(/<html(?:\s[^>]*)?>/i);
  const doctype = /^\s*<!doctype[^>]*>/i.exec(html);
  if (doctype) return doctype[0] + script + html.slice(doctype[0].length);
  return script + html;
}

function prefixedKeys(prefix: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k !== null && k.startsWith(prefix)) keys.push(k);
  }
  return keys;
}

/** Removes every localStorage key belonging to the namespace. */
export function clearArtifactLocalStorage(namespace: string): void {
  const prefix = artifactStoragePrefix(namespace);
  for (const k of prefixedKeys(prefix)) {
    window.localStorage.removeItem(k);
  }
}

const UPSERT =
  "INSERT INTO namespaced_local_storage (Namespace, Key, Value, Updated_At) VALUES ($1, $2, $3, $4) ON CONFLICT (Namespace, Key) DO UPDATE SET Value = EXCLUDED.Value, Updated_At = EXCLUDED.Updated_At";

/**
 * Seeds real localStorage from the DB, or (first sync) pushes existing
 * localStorage values into an empty DB namespace.
 */
export async function hydrateLocalStorage(db: PGliteWithLive, namespace: string): Promise<void> {
  const prefix = artifactStoragePrefix(namespace);
  const existing = prefixedKeys(prefix);
  const result = await db.query<StoredValue>(
    "SELECT Namespace, Key, Value, Updated_At FROM namespaced_local_storage WHERE Namespace = $1",
    [namespace],
  );

  if (existing.length === 0) {
    for (const row of result.rows) {
      window.localStorage.setItem(prefix + row.key, row.value);
    }
    return;
  }

  if (result.rows.length === 0) {
    const now = Date.now();
    await db.transaction(async (tx) => {
      for (const full of existing) {
        await tx.query(UPSERT, [
          namespace,
          full.slice(prefix.length),
          window.localStorage.getItem(full) ?? "",
          now,
        ]);
      }
    });
    scheduleBackup(db);
  }
}

export type StorageSync = {
  handle: (msg: StorageMessage) => void;
  flush: () => Promise<void>;
  dispose: () => Promise<void>;
};

type PendingOp = { op: "set"; value: string } | { op: "remove" };

/** Batches iframe storage mutations and writes them to PGlite. */
export function createStorageSync(
  db: PGliteWithLive,
  namespace: string,
  idleMs = 1000,
): StorageSync {
  let pending = new Map<string, PendingOp>();
  let clearAll = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let chain: Promise<void> = Promise.resolve();

  const run = async () => {
    if (!clearAll && pending.size === 0) return;
    const ops = pending;
    const wipe = clearAll;
    pending = new Map();
    clearAll = false;
    const now = Date.now();
    try {
      await db.transaction(async (tx) => {
        if (wipe) {
          await tx.query("DELETE FROM namespaced_local_storage WHERE Namespace = $1", [namespace]);
        }
        for (const [key, op] of ops) {
          if (op.op === "set") {
            await tx.query(UPSERT, [namespace, key, op.value, now]);
          } else {
            await tx.query(
              "DELETE FROM namespaced_local_storage WHERE Namespace = $1 AND Key = $2",
              [namespace, key],
            );
          }
        }
      });
      scheduleBackup(db);
    } catch (error) {
      console.error("Failed to sync artifact storage:", error);
    }
  };

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    chain = chain.then(run);
    return chain;
  };

  return {
    handle(msg) {
      if (!msg || msg.ns !== namespace) return;
      if (msg.op === "clear") {
        pending = new Map();
        clearAll = true;
      } else if (msg.op === "set" && typeof msg.key === "string") {
        pending.set(msg.key, { op: "set", value: String(msg.value ?? "") });
      } else if (msg.op === "remove" && typeof msg.key === "string") {
        pending.set(msg.key, { op: "remove" });
      } else {
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flush(), idleMs);
    },
    flush,
    dispose: flush,
  };
}
