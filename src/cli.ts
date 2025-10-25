import { parseCurlToJson } from './index.js';

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    if (process.stdin.isTTY) return resolve('');
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

const isFlag = (t: string) => t.startsWith('-') && t !== '-';
const takesValue = (t: string) =>
  t === '-H' || t === '--header' ||
  t === '-d' || t.startsWith('--data') ||
  t === '-F' || t === '--form' ||
  t === '-u' || t === '--user' ||
  t === '--url' || t === '-A' || t === '--user-agent' ||
  t === '--referer';

const maybeQuote = (s: string) => (/\s/.test(s) ? `"${s}"` : s);

function isBalanced(s: string): boolean {
  let depth = 0;
  let inS = false, inD = false, esc = false;
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (!inS && ch === '"') { inD = !inD; continue; }
    if (!inD && ch === '\'') { inS = !inS; continue; }
    if (!inS && !inD) {
      if (ch === '{' || ch === '[') depth++;
      if (ch === '}' || ch === ']') depth--;
    }
  }
  return depth === 0 && !inS && !inD;
}

function collectSimpleValue(tokens: string[], startIndex: number): [string, number] {
  let buf: string[] = [];
  let i = startIndex;

  if (i + 1 < tokens.length) {
    buf.push(tokens[++i]);
  }

  while (i + 1 < tokens.length && !isFlag(tokens[i + 1])) {
    buf.push(tokens[++i]);
  }

  return [buf.join(' '), i];
}

function collectDataValue(tokens: string[], startIndex: number): [string, number] {
  let buf: string[] = [];
  let i = startIndex;

  if (i + 1 < tokens.length) {
    buf.push(tokens[++i]);
  }

  while (i + 1 < tokens.length && !isFlag(tokens[i + 1])) {
    const peek = tokens[i + 1];
    const joined = buf.concat(peek).join(' ');
    if (isBalanced(joined)) {
      break;
    }
    buf.push(tokens[++i]);
  }

  return [buf.join(' '), i];
}


function processValueFlag(token: string, tokens: string[], index: number, out: string[]): number {
  out.push(token);

  if (token === '-H' || token === '--header') {
    const [value, newIndex] = collectSimpleValue(tokens, index);
    out.push(maybeQuote(value));
    return newIndex;
  }

  if (token === '-d' || token.startsWith('--data') || token === '-F' || token === '--form') {
    const [value, newIndex] = collectDataValue(tokens, index);
    out.push(maybeQuote(value));
    return newIndex;
  }

  const [value, newIndex] = collectSimpleValue(tokens, index);
  out.push(maybeQuote(value));
  return newIndex;
}

function reconstructCurlFromArgv(argv: string[]): string {
  if (argv.length === 0) return '';
  if (argv.length === 1) return argv[0];

  const out: string[] = [];
  const tokens = [...argv];

  if (!/^curl$/i.test(tokens[0])) out.push('curl');

  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];

    if (i === 0 && /^curl$/i.test(t)) {
      out.push('curl');
      i++;
      continue;
    }

    if (takesValue(t)) {
      i = processValueFlag(t, tokens, i, out);
      i++;
      continue;
    }

    out.push(t);
    i++;
  }

  return out.join(' ');
}

(async () => {
  try {
    const argv = process.argv.slice(2);
    let input = '';

    if (argv.length === 0) {
      input = (await readStdin()).trim();
    } else {
      input = reconstructCurlFromArgv(argv).trim();
    }

    if (input) {
      const result = parseCurlToJson(input);
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('Usage: curl-to-json-parser "curl ..."\n  or: echo "curl ..." | curl-to-json-parser');
      process.exitCode = 1;
    }
  } catch (err: any) {
    console.error('Error:', err?.message || String(err));
    process.exitCode = 1;
  }
})();
