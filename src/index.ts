export interface MultipartField {
  name: string;
  value?: string;
  filename?: string;
  contentType?: string;
}

export interface CurlJson {
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
  body?: string;
  json?: any;
  form?: Record<string, string>;
  multipart?: MultipartField[];
  auth?: { user: string; password?: string };
  compressed?: boolean;
  insecure?: boolean;
  followRedirects?: boolean;
  referer?: string;
  userAgent?: string;
  httpVersion?: string;
  raw?: {
    tokens: string[];
    flags: Record<string, any>;
  };
}

interface ParseState {
  headers: Record<string, string>;
  cookies: Record<string, string>;
  query: Record<string, string | string[]>;
  multipart: MultipartField[];
  rawFlags: Record<string, any>;
  url: string;
  method: string;
  dataParts: string[];
  getMode: boolean;
  compressed: boolean;
  insecure: boolean;
  followRedirects: boolean;
  httpVersion?: string;
  referer?: string;
  userAgent?: string;
  auth?: { user: string; password?: string };
  // optional form container on state for -F simple key=val capture
  form?: Record<string, string>;
}

/**
 * Convert a multiline curl command string into a structured JSON object.
 */
export function parseCurlToJson(input: string): CurlJson {
  const pre = normalizeInput(input);
  const tokens = coalesceQuotedTokens(tokenize(pre));

  const state: ParseState = {
    headers: {},
    cookies: {},
    query: {},
    multipart: [],
    rawFlags: {},
    url: '',
    method: '',
    dataParts: [],
    getMode: false,
    compressed: false,
    insecure: false,
    followRedirects: false
  };

  parseTokens(tokens, state);
  return buildResult(state);
}

/**
 * Add a simple key=value form field to a form map.
 * Keeps file-style value verbatim (starts with '@').
 */
function addFormField(form: Record<string, string>, raw?: string) {
  if (!raw) return;
  const idx = raw.indexOf('=');
  if (idx === -1) return;
  const key = raw.slice(0, idx).trim();
  let value = raw.slice(idx + 1).trim();

  // strip surrounding quotes if present (but keep content)
  if (!value.startsWith('@')) {
    value = value.replace(/^['"]|['"]$/g, '');
  }
  form[key] = value;
}

function parseTokens(tokens: string[], state: ParseState): void {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'curl' || t === '--') continue;

    if (t.startsWith('--')) {
      i = processLongFlag(tokens, i, state);
    } else if (t.startsWith('-') && t !== '-') {
      i = processShortFlags(tokens, i, state);
    } else if (state.url) {
      // tokens after url are treated as dataParts (positional)
      state.dataParts.push(t);
    } else {
      state.url = t;
    }
  }
}

function processLongFlag(tokens: string[], i: number, state: ParseState): number {
  const t = tokens[i];

  switch (t) {
    case '--request':
      state.method = (tokens[++i] || '').toUpperCase();
      return i;
    case '--header':
      return processHeaderFlag(tokens, i, state);
    case '--url':
      return processUrlFlag(tokens, i, state);
    case '--data':
    case '--data-raw':
    case '--data-binary':
    case '--data-ascii':
    case '--data-urlencode':
      return processDataFlag(tokens, i, state);
    case '--form':
      return processFormFlag(tokens, i, state);
    case '--user':
      return processUserFlag(tokens, i, state);
    case '--get':
      state.getMode = true;
      return i;
    case '--compressed':
      state.compressed = true;
      return i;
    case '--insecure':
      state.insecure = true;
      return i;
    case '--head':
      state.method = 'HEAD';
      return i;
    case '--location':
      state.followRedirects = true;
      return i;
    case '--referer':
      return processRefererFlag(tokens, i, state);
    case '--user-agent':
      return processUserAgentFlag(tokens, i, state);
    case '--http1.1':
      state.httpVersion = '1.1';
      return i;
    case '--http2':
    case '--http2-prior-knowledge':
      state.httpVersion = '2';
      return i;
    case '--cookie':
      return processCookieFlag(tokens, i, state);
    default:
      return processUnknownLongFlag(t, state);
  }
}

function processShortFlags(tokens: string[], i: number, state: ParseState): number {
  const t = tokens[i];
  const flagBody = t.slice(1);

  for (const f of flagBody) {
    const result = processShortFlag(f, tokens, i, state);
    if (result.consumeRest) {
      return result.newIndex;
    }
    if (result.newIndex !== i) {
      return result.newIndex;
    }
  }
  return i;
}

function processShortFlag(f: string, tokens: string[], i: number, state: ParseState): { newIndex: number; consumeRest: boolean } {
  switch (f) {
    case 'X':
      state.method = (tokens[++i] || '').toUpperCase();
      return { newIndex: i, consumeRest: true };
    case 'H':
      return { newIndex: processHeaderFlag(tokens, i, state), consumeRest: true };
    case 'd':
      return { newIndex: processDataFlag(tokens, i, state), consumeRest: true };
    case 'F':
      return { newIndex: processFormFlag(tokens, i, state), consumeRest: true };
    case 'u':
      return { newIndex: processUserFlag(tokens, i, state), consumeRest: true };
    case 'G':
      state.getMode = true;
      return { newIndex: i, consumeRest: false };
    case 'A':
      return { newIndex: processUserAgentFlag(tokens, i, state), consumeRest: true };
    case 'e':
      return { newIndex: processRefererFlag(tokens, i, state), consumeRest: true };
    case 'I':
      state.method = 'HEAD';
      return { newIndex: i, consumeRest: false };
    case 'L':
      state.followRedirects = true;
      return { newIndex: i, consumeRest: false };
    case 'k':
      state.insecure = true;
      return { newIndex: i, consumeRest: false };
    case 'b':
      return { newIndex: processCookieFlag(tokens, i, state), consumeRest: true };
    default:
      state.rawFlags[f] = true;
      return { newIndex: i, consumeRest: false };
  }
}

function processHeaderFlag(tokens: string[], i: number, state: ParseState): number {
  const gathered = collectUntilNextFlag(tokens, i + 1, state);
  addHeader(state.headers, gathered.value);
  return gathered.nextIndex;
}

function processUrlFlag(tokens: string[], i: number, state: ParseState): number {
  const gathered = collectUntilNextFlag(tokens, i + 1, state);
  state.url = gathered.value || state.url;
  return gathered.nextIndex;
}

function processDataFlag(tokens: string[], i: number, state: ParseState): number {
  const gathered = collectUntilNextFlag(tokens, i + 1, state);
  state.dataParts.push(gathered.value || '');
  return gathered.nextIndex;
}

function processFormFlag(tokens: string[], i: number, state: ParseState): number {
  const gathered = collectUntilNextFlag(tokens, i + 1, state);
  const val = gathered.value || '';

  // populate multipart (existing behavior)
  parseFormPart(val, state.multipart);

  // also populate a simple form map for -F name=value or file=@file
  if (!state.form) state.form = {};
  addFormField(state.form, val);

  return gathered.nextIndex;
}

function processUserFlag(tokens: string[], i: number, state: ParseState): number {
  const gathered = collectUntilNextFlag(tokens, i + 1, state);
  state.auth = parseAuth(gathered.value || '');
  return gathered.nextIndex;
}

function processRefererFlag(tokens: string[], i: number, state: ParseState): number {
  const gathered = collectUntilNextFlag(tokens, i + 1, state);
  state.referer = gathered.value || '';
  return gathered.nextIndex;
}

function processUserAgentFlag(tokens: string[], i: number, state: ParseState): number {
  const gathered = collectUntilNextFlag(tokens, i + 1, state);
  state.userAgent = gathered.value || '';
  return gathered.nextIndex;
}

function processCookieFlag(tokens: string[], i: number, state: ParseState): number {
  const gathered = collectUntilNextFlag(tokens, i + 1, state);
  parseCookieString(gathered.value || '', state.cookies);
  return gathered.nextIndex;
}

function processUnknownLongFlag(t: string, state: ParseState): number {
  const eq = t.indexOf('=');
  if (eq > 2) {
    const key = t.slice(2, eq);
    const val = t.slice(eq + 1);
    state.rawFlags[key] = val;
  } else {
    state.rawFlags[t.replace(/^--/, '')] = true;
  }
  return 0; // no index change for unknown flags
}

function buildResult(state: ParseState): CurlJson {
  normalizeHeadersFromState(state);
  const { baseUrl, query } = processUrl(state);
  const { body, json, form } = processBody(state, query);
  const method = determineMethod(state, body);

  // prefer the form returned from processBody (it handles urlencoded forms)
  const resultForm = form ?? state.form;

  return {
    method,
    url: rebuildUrl(baseUrl, query),
    headers: normalizeHeaders(state.headers),
    query,
    cookies: state.cookies,
    body,
    json,
    form: resultForm && Object.keys(resultForm).length ? resultForm : undefined,
    multipart: state.multipart.length ? state.multipart : undefined,
    auth: state.auth,
    compressed: state.compressed,
    insecure: state.insecure,
    followRedirects: state.followRedirects,
    referer: state.referer,
    userAgent: state.userAgent,
    httpVersion: state.httpVersion,
    raw: { tokens: [], flags: state.rawFlags }
  };
}

function normalizeHeadersFromState(state: ParseState): void {
  if (state.referer) state.headers['Referer'] = state.referer;
  if (state.userAgent) state.headers['User-Agent'] = state.userAgent;
  if (Object.keys(state.cookies).length > 0) {
    state.headers['Cookie'] = cookieHeaderFromMap(state.cookies);
  }
}

function processUrl(state: ParseState): { baseUrl: string; query: Record<string, string | string[]> } {
  const query = { ...state.query };
  let baseUrl = state.url;

  try {
    if (state.url) {
      const u = new URL(state.url);
      baseUrl = u.origin + u.pathname;
      for (const [k, v] of u.searchParams.entries()) {
        addQuery(query, k, v);
      }
    }
  } catch {
    baseUrl = state.url;
  }

  return { baseUrl, query };
}

function processBody(state: ParseState, query: Record<string, string | string[]>): { body?: string; json?: any; form?: Record<string, string> } {
  // Handle -G / --get: treat dataParts as query params and merge them
  if (state.getMode && state.dataParts.length) {
    for (const data of state.dataParts) {
      const sp = new URLSearchParams(data);
      for (const [k, v] of sp.entries()) addQuery(query, k, v);
    }

    // rebuild state.url with encoded query values to reflect -G behavior
    try {
      const base = state.url ? state.url.split('?')[0] : '';
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (Array.isArray(v)) v.forEach(val => params.append(k, val));
        else params.append(k, v);
      }
      state.url = params.toString() ? `${base}?${params.toString()}` : base;
    } catch {
      // ignore URL rebuild errors; leave state.url as-is
    }

    return {};
  }

  if (!state.dataParts.length) return {};

  // preserve common escape sequences in the raw data string
  const body = state.dataParts
    .join('&')
    // If the input contained double-escaped sequences like "\\n" (string literal from shell),
    // convert double-escaped to single-escaped representation
    .replace(/\\\\n/g, '\\n')
    .replace(/\\n/g, '\\n')
    .replace(/\\"/g, '\\"');

  const ct = getHeader(state.headers, 'Content-Type');
  const looksJson = ct?.toLowerCase().includes('application/json') || /^[[{]/.test(body.trim());

  if (looksJson) {
    try {
      return { body, json: JSON.parse(body) };
    } catch {
      return { body };
    }
  }

  if (
    ct?.toLowerCase().includes("application/x-www-form-urlencoded") ||
    (!ct && /^[^=]+=./.test(body))
  ) {
    return { body, form: parseFormUrlEncoded(body) };
  }

  return { body };
}

function determineMethod(state: ParseState, body?: string): string {
  if (state.method) return state.method;

  if (state.getMode) {
    return 'GET';
  }

  if (body || state.multipart.length) {
    return 'POST';
  }

  return 'GET';
}

// Helpers
function normalizeInput(input: string): string {
  // Replace line continuations: backslash-newline -> space
  const joined = input.replace(/\\\r?\n/g, ' ');
  // Collapse multiple whitespaces
  return joined.trim();
}

function tokenize(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inS = false;
  let inD = false;
  let esc = false;
  for (const ch of s) {
    if (esc) {
      cur += ch;
      esc = false;
      continue;
    }
    if (ch === '\\') {
      // escape next char inside or outside quotes
      esc = true;
      continue;
    }
    if (!inS && ch === '"') {
      inD = !inD;
      continue;
    }
    if (!inD && ch === '\'') {
      inS = !inS;
      continue;
    }
    const isWs = ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t';
    if (!inS && !inD && isWs) {
      if (cur.length) {
        out.push(cur);
        cur = '';
      }
      continue;
    }
    cur += ch;
  }
  if (cur.length) out.push(cur);
  return out;
}

// Coalesce tokens that were split due to backslash-escaped quotes or standalone quote tokens
function coalesceQuotedTokens(tokens: string[]): string[] {
  const out: string[] = [];
  const isQuote = (t: string) => t === '"' || t === "'";
  const startsWithQuote = (t: string) => t.startsWith('"') || t.startsWith("'");
  const endsWithQuote = (t: string, q: '"' | "'") => t.endsWith(q) && !t.endsWith('\\' + q);

  let i = 0;
  while (i < tokens.length) {
    let t = tokens[i];

    // Replace common escaped quotes within tokens to real quotes for easier handling
    t = t.replace(/\\"/g, '"').replace(/\\'/g, "'");

    if (isQuote(t) || (startsWithQuote(t) && !endsWithQuote(t, t[0] as '"' | "'"))) {
      const q = isQuote(t) ? t : t[0];
      let buf = isQuote(t) ? '' : t.slice(1); // drop opening quote
      // accumulate until matching closing quote
      while (i + 1 < tokens.length) {
        let next = tokens[++i];
        // unescape common sequences in the chunk
        next = next.replace(/\\"/g, '"').replace(/\\'/g, "'");
        if (endsWithQuote(next, q as '"' | "'")) {
          buf += (buf ? ' ' : '') + next.slice(0, -1);
          break;
        } else if (isQuote(next)) {
          // reached a standalone closing quote
          break;
        } else {
          buf += (buf ? ' ' : '') + next;
        }
      }
      out.push(buf);
      i++;
      continue;
    }

    out.push(t);
    i++;
  }

  return out;
}

function addHeader(headers: Record<string, string>, raw?: string) {
  if (!raw) return;
  const idx = raw.indexOf(':');
  if (idx === -1) return;
  const name = raw.slice(0, idx).trim();
  const value = raw.slice(idx + 1).trim();

  if (headers[name]) {
    headers[name] = `${headers[name]}; ${value}`;
  } else {
    headers[name] = value;
  }
}

function getHeader(headers: Record<string, string>, name: string): string | undefined {
  const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : undefined;
}

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(headers)) {
    const existingKey = Object.keys(out).find(x => x.toLowerCase() === k.toLowerCase());
    const key = existingKey ?? k;
    if (existingKey) {
      out[key] = out[key] + ', ' + headers[k];
    } else {
      out[key] = headers[k];
    }
  }
  return out;
}

function parseFormPart(spec: string, arr: MultipartField[]) {
  // Formats: name=value OR name=@filename;type=mime
  // We'll parse conservatively
  const eq = spec.indexOf('=');
  if (eq === -1) {
    arr.push({ name: spec });
    return;
  }
  const name = spec.slice(0, eq);
  let rest = spec.slice(eq + 1);
  if (rest.startsWith('@')) {
    // file upload
    rest = rest.slice(1);
    // allow ;type=...
    let filename = rest;
    let contentType: string | undefined;
    const semi = rest.indexOf(';');
    if (semi !== -1) {
      filename = rest.slice(0, semi);
      const params = rest.slice(semi + 1).split(';');
      for (const p of params) {
        const [k, v] = p.split('=');
        if (k?.trim() === 'type') contentType = v?.trim();
      }
    }
    const field: MultipartField = { name, filename };
    if (contentType !== undefined) field.contentType = contentType;
    arr.push(field);
  } else {
    arr.push({ name, value: rest });
  }
}

function parseAuth(s: string): { user: string; password?: string } {
  const idx = s.indexOf(':');
  if (idx === -1) return { user: s };
  return { user: s.slice(0, idx), password: s.slice(idx + 1) };
}

function parseCookieString(s: string, out: Record<string, string>) {
  // cookie string like: a=b; c=d; e=f
  const parts = s.split(/;\s*/);
  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq === -1) continue;
    const k = p.slice(0, eq).trim();
    const v = p.slice(eq + 1).trim();
    if (k) out[k] = v;
  }
}

function cookieHeaderFromMap(map: Record<string, string>): string {
  return Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function addQuery(q: Record<string, string | string[]>, k: string, v: string) {
  if (k in q) {
    const cur = q[k];
    if (Array.isArray(cur)) q[k] = [...cur, v];
    else q[k] = [cur, v];
  } else {
    q[k] = v;
  }
}

function parseFormUrlEncoded(body: string): Record<string, string> {
  const map: Record<string, string> = {};
  const sp = new URLSearchParams(body);
  for (const [k, v] of sp.entries()) map[k] = v;
  return map;
}

function rebuildUrl(base: string, query: Record<string, string | string[]>): string {
  const qs = new URLSearchParams();
  for (const k of Object.keys(query)) {
    const v = query[k];
    if (Array.isArray(v)) {
      for (const x of v) qs.append(k, x);
    }
    else qs.append(k, v);
  }
  const qsStr = qs.toString();
  return qsStr ? `${base}?${qsStr}` : base;
}

function isFlagToken(t?: string): boolean {
  if (!t) return false;
  if (!t.startsWith('-') || t === '-') return false;
  return true;
}

function collectUntilNextFlag(tokens: string[], startIndex: number, state: ParseState): { value: string; nextIndex: number } {
  let i = startIndex;
  const parts: string[] = [];
  while (i < tokens.length && !isFlagToken(tokens[i])) {
    const token = tokens[i];
    // If we haven't set a URL yet and this token looks like a URL AND we already have some value, stop collecting
    // This allows flags like -e (referer) to have URL values, but stops when we hit the actual command URL
    if (!state.url && parts.length > 0 && looksLikeUrl(token)) {
      break;
    }
    parts.push(token);
    i++;
  }
  return { value: parts.join(' '), nextIndex: i - 1 };
}

function looksLikeUrl(token: string): boolean {
  // Check if token looks like a URL (starts with protocol or domain-like pattern)
  return /^https?:\/\//.test(token) ||
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+/.test(token);
}
