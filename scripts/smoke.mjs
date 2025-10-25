import assert from 'node:assert/strict';
import { parseCurlToJson } from '../dist/index.js';

// Simple GET
let out = parseCurlToJson('curl https://api.example.com/users -H "Accept: application/json"');
assert.equal(out.method, 'GET');
assert.equal(out.url, 'https://api.example.com/users');
assert.equal(out.headers['Accept'], 'application/json');

// POST JSON
out = parseCurlToJson('curl -X POST https://api.example.com/users -H "Content-Type: application/json" -d "{\\\"name\\\":\\\"Alice\\\"}"');
console.log('POST JSON:', out);
assert.equal(out.method, 'POST');
assert.deepEqual(out.json, { name: 'Alice' });

// -G to query
out = parseCurlToJson('curl -G https://api.example.com/search -d "q=hello world" -d "sort=desc"');
assert.equal(out.method, 'GET');
assert.equal(out.query.q, 'hello world');
assert.equal(out.query.sort, 'desc');

console.log('Smoke tests passed');
