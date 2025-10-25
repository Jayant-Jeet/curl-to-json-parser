# curl-to-json-parser

Convert a multiline curl command string into a structured, parsable JSON object. Also ships with a tiny CLI.

- No HTTP execution — pure parsing only
- Supports common curl flags: `-X/--request`, `-H/--header`, `-d/--data*`, `-G/--get`, `-F/--form`, `-u/--user`, `--url`, `-A/--user-agent`, `--referer`, `--compressed`, `-k/--insecure`, `-L/--location`, `-I/--head`, `-b/--cookie`
- Dual ESM/CJS build, TypeScript types included

## Install

```cmd
npm install curl-to-json-parser
```

## API

```ts
import { parseCurlToJson } from 'curl-to-json-parser';

const input = `curl https://api.example.com/users \
  -H \"Accept: application/json\" -G -d \"page=2\"`;

const result = parseCurlToJson(input);
console.log(result);
```

Output shape (simplified):

```ts
interface CurlJson {
  method: string;
  url: string; // rebuilt with query
  headers: Record<string, string>;
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
  body?: string;
  json?: any; // if JSON body detected
  form?: Record<string, string>; // if x-www-form-urlencoded detected
  multipart?: { name: string; value?: string; filename?: string; contentType?: string }[];
  auth?: { user: string; password?: string };
  compressed?: boolean;
  insecure?: boolean;
  followRedirects?: boolean;
  referer?: string;
  userAgent?: string;
}
```

## CLI

You can also use the CLI to parse a curl string and print JSON.

```cmd
npx curl-to-json-parser "curl https://api.example.com/users -H \"Accept: application/json\""
```

Or pipe:

```cmd
echo curl https://api.example.com/search -G -d "q=hello world" | npx curl-to-json-parser
```
