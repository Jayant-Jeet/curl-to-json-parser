import assert from 'node:assert/strict';
import { parseCurlToJson } from '../dist/index.js';

console.log('Running comprehensive curl-to-json-parser tests...\n');

let testCount = 0;
let passCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    passCount++;
    console.log(`✓ ${name}`);
  } catch (err) {
    console.log(`✗ ${name}`);
    console.error(`  ${err.message}`);
  }
}

// Basic HTTP Methods
test('infers GET for simple URL', () => {
  const out = parseCurlToJson('curl https://api.example.com/users');
  assert.equal(out.method, 'GET');
  assert.equal(out.url, 'https://api.example.com/users');
});

test('explicit POST with -X', () => {
  const out = parseCurlToJson('curl -X POST https://api.example.com/users');
  assert.equal(out.method, 'POST');
});

test('explicit PUT with --request', () => {
  const out = parseCurlToJson('curl --request PUT https://api.example.com/users/1');
  assert.equal(out.method, 'PUT');
});

test('DELETE method', () => {
  const out = parseCurlToJson('curl -X DELETE https://api.example.com/users/1');
  assert.equal(out.method, 'DELETE');
});

test('HEAD with -I flag', () => {
  const out = parseCurlToJson('curl -I https://api.example.com/users');
  assert.equal(out.method, 'HEAD');
});

// Headers
test('single header with -H', () => {
  const out = parseCurlToJson('curl -H "Authorization: Bearer token123" https://api.example.com');
  assert.equal(out.headers['Authorization'], 'Bearer token123');
});

test('multiple headers', () => {
  const curl = 'curl -H "Content-Type: application/json" -H "Accept: application/json" https://api.example.com';
  const out = parseCurlToJson(curl);
  assert.equal(out.headers['Content-Type'], 'application/json');
  assert.equal(out.headers['Accept'], 'application/json');
});

test('header with spaces in value', () => {
  const out = parseCurlToJson('curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0)" https://api.example.com');
  assert.equal(out.headers['User-Agent'], 'Mozilla/5.0 (Windows NT 10.0)');
});

test('header with colon in value', () => {
  const out = parseCurlToJson('curl -H "X-Time: 2025-10-25T10:30:00" https://api.example.com');
  assert.equal(out.headers['X-Time'], '2025-10-25T10:30:00');
});

// JSON Body
test('POST with JSON body', () => {
  const curl = 'curl -X POST https://api.example.com/users -H "Content-Type: application/json" -d \'{"name":"John","age":30}\'';
  const out = parseCurlToJson(curl);
  assert.equal(out.method, 'POST');
  assert.deepEqual(out.json, { name: 'John', age: 30 });
});

test('POST with JSON array', () => {
  const curl = 'curl -X POST https://api.example.com/bulk -H "Content-Type: application/json" -d \'[1,2,3]\'';
  const out = parseCurlToJson(curl);
  assert.deepEqual(out.json, [1, 2, 3]);
});

test('POST with nested JSON', () => {
  const curl = 'curl -X POST https://api.example.com/users -H "Content-Type: application/json" -d \'{"user":{"name":"Alice","address":{"city":"NYC"}}}\'';
  const out = parseCurlToJson(curl);
  assert.deepEqual(out.json, {
    user: {
      name: 'Alice',
      address: { city: 'NYC' }
    }
  });
});

test('infers JSON from body structure', () => {
  const curl = 'curl -X POST https://api.example.com/data -d \'{"implicit":true}\'';
  const out = parseCurlToJson(curl);
  assert.deepEqual(out.json, { implicit: true });
});

test('multiple -d flags concatenate', () => {
  const curl = 'curl -X POST https://api.example.com/data -d "part1" -d "part2"';
  const out = parseCurlToJson(curl);
  assert.equal(out.body, 'part1&part2');
});

// Form Data
test('POST with form-encoded data', () => {
  const curl = 'curl -X POST https://api.example.com/form -H "Content-Type: application/x-www-form-urlencoded" -d "name=John&email=john@example.com"';
  const out = parseCurlToJson(curl);
  assert.deepEqual(out.form, {
    name: 'John',
    email: 'john@example.com'
  });
});

test('multipart form with -F', () => {
  const curl = 'curl -X POST https://api.example.com/upload -F "name=John" -F "email=john@example.com"';
  const out = parseCurlToJson(curl);
  assert.equal(out.multipart?.length, 2);
  assert.deepEqual(out.multipart?.[0], { name: 'name', value: 'John' });
});

test('multipart file upload', () => {
  const curl = 'curl -X POST https://api.example.com/upload -F "file=@/path/to/file.pdf"';
  const out = parseCurlToJson(curl);
  assert.deepEqual(out.multipart?.[0], {
    name: 'file',
    filename: '/path/to/file.pdf'
  });
});

test('multipart file with content type', () => {
  const curl = 'curl -X POST https://api.example.com/upload -F "document=@/path/to/doc.pdf;type=application/pdf"';
  const out = parseCurlToJson(curl);
  assert.deepEqual(out.multipart?.[0], {
    name: 'document',
    filename: '/path/to/doc.pdf',
    contentType: 'application/pdf'
  });
});

// Query Parameters
test('query params in URL', () => {
  const out = parseCurlToJson('curl "https://api.example.com/search?q=test&page=2"');
  assert.deepEqual(out.query, {
    q: 'test',
    page: '2'
  });
});

test('-G flag moves data to query params', () => {
  const curl = 'curl -G https://api.example.com/search -d "q=hello" -d "limit=10"';
  const out = parseCurlToJson(curl);
  assert.equal(out.method, 'GET');
  assert.deepEqual(out.query, {
    q: 'hello',
    limit: '10'
  });
  assert.equal(out.body, undefined);
});

test('combines URL query with -G data', () => {
  const curl = 'curl -G "https://api.example.com/search?existing=param" -d "new=param"';
  const out = parseCurlToJson(curl);
  assert.equal(out.query.existing, 'param');
  assert.equal(out.query.new, 'param');
});

test('duplicate query keys become arrays', () => {
  const out = parseCurlToJson('curl "https://api.example.com/search?tag=js&tag=node&tag=api"');
  assert.deepEqual(out.query.tag, ['js', 'node', 'api']);
});

// Authentication
test('basic auth with -u', () => {
  const out = parseCurlToJson('curl -u "username:password" https://api.example.com');
  assert.deepEqual(out.auth, {
    user: 'username',
    password: 'password'
  });
});

test('basic auth username only', () => {
  const out = parseCurlToJson('curl -u "username" https://api.example.com');
  assert.deepEqual(out.auth, { user: 'username' });
});

test('username with colon in password', () => {
  const out = parseCurlToJson('curl -u "user:pass:word:123" https://api.example.com');
  assert.deepEqual(out.auth, {
    user: 'user',
    password: 'pass:word:123'
  });
});

// Cookies
test('single cookie with -b', () => {
  const out = parseCurlToJson('curl -b "session=abc123" https://api.example.com');
  assert.deepEqual(out.cookies, { session: 'abc123' });
  assert.equal(out.headers['Cookie'], 'session=abc123');
});

test('multiple cookies', () => {
  const out = parseCurlToJson('curl -b "session=abc; user_id=123; token=xyz" https://api.example.com');
  assert.deepEqual(out.cookies, {
    session: 'abc',
    user_id: '123',
    token: 'xyz'
  });
});

// Other Flags
test('--compressed flag', () => {
  const out = parseCurlToJson('curl --compressed https://api.example.com');
  assert.equal(out.compressed, true);
});

test('-k insecure flag', () => {
  const out = parseCurlToJson('curl -k https://untrusted.example.com');
  assert.equal(out.insecure, true);
});

test('-L follow redirects flag', () => {
  const out = parseCurlToJson('curl -L https://api.example.com');
  assert.equal(out.followRedirects, true);
});

test('-A user agent flag', () => {
  const out = parseCurlToJson('curl -A "Custom Agent 1.0" https://api.example.com');
  assert.equal(out.userAgent, 'Custom Agent 1.0');
  assert.equal(out.headers['User-Agent'], 'Custom Agent 1.0');
});

test('-e referer flag', () => {
  const out = parseCurlToJson('curl -e "https://google.com" https://api.example.com');
  assert.equal(out.referer, 'https://google.com');
  assert.equal(out.headers['Referer'], 'https://google.com');
});

test('--http2 flag', () => {
  const out = parseCurlToJson('curl --http2 https://api.example.com');
  assert.equal(out.httpVersion, '2');
});

// Combined Flags
test('grouped short flags', () => {
  const out = parseCurlToJson('curl -sLk https://api.example.com');
  assert.equal(out.followRedirects, true);
  assert.equal(out.insecure, true);
});

test('complex real-world example', () => {
  const curl = `curl -X POST https://api.example.com/v1/users \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer token123" \
    -d '{"name":"John","email":"john@example.com"}' \
    -L --compressed`;

  const out = parseCurlToJson(curl);
  assert.equal(out.method, 'POST');
  assert.equal(out.url, 'https://api.example.com/v1/users');
  assert.equal(out.headers['Content-Type'], 'application/json');
  assert.equal(out.headers['Authorization'], 'Bearer token123');
  assert.deepEqual(out.json, {
    name: 'John',
    email: 'john@example.com'
  });
  assert.equal(out.followRedirects, true);
  assert.equal(out.compressed, true);
});

// Edge Cases
test('line continuations with backslash', () => {
  const curl = `curl https://api.example.com \\\n-H "Accept: application/json"`;
  const out = parseCurlToJson(curl);
  assert.equal(out.headers['Accept'], 'application/json');
});

test('localhost URL', () => {
  const out = parseCurlToJson('curl http://localhost:3000/api/test');
  assert.equal(out.url, 'http://localhost:3000/api/test');
});

test('URL with port', () => {
  const out = parseCurlToJson('curl https://api.example.com:8443/endpoint');
  assert.equal(out.url, 'https://api.example.com:8443/endpoint');
});

test('IP address URL', () => {
  const out = parseCurlToJson('curl http://192.168.1.100:8080/api');
  assert.equal(out.url, 'http://192.168.1.100:8080/api');
});

test('infers POST when body present', () => {
  const out = parseCurlToJson('curl https://api.example.com -d "data=value"');
  assert.equal(out.method, 'POST');
});

test('infers POST when multipart present', () => {
  const out = parseCurlToJson('curl https://api.example.com -F "file=@test.txt"');
  assert.equal(out.method, 'POST');
});

test('handles empty data', () => {
  const out = parseCurlToJson('curl https://api.example.com');
  assert.equal(out.body, undefined);
  assert.equal(out.json, undefined);
});

test('does not parse non-JSON as JSON', () => {
  const out = parseCurlToJson('curl -X POST https://api.example.com -d "plain text"');
  assert.equal(out.json, undefined);
  assert.equal(out.body, 'plain text');
});

console.log(`\n${passCount}/${testCount} tests passed`);
if (passCount !== testCount) {
  process.exit(1);
}
