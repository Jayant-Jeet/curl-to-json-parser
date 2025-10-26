---
name: Bug report
about: Report a problem with curl-to-json-parser (API or CLI)
title: "bug: <short summary>"
labels: bug
assignees: ''
---

## Summary

<!-- A clear and concise description of the bug. What went wrong? What did you expect instead? -->

## Affected Area

- [ ] API (imported function: `parseCurlToJson`)
- [ ] CLI (`npx curl-to-json-parser`)

## Environment

- Package version: `0.x.x`
- Node.js version: `node -v`
- OS: Windows/macOS/Linux (include version)

## Reproduction

Provide a minimal, complete example that reproduces the issue.

### 1) Curl input

```bash
# paste the exact curl you ran (multiline supported)
curl https://api.example.com/users -H "Accept: application/json" -G -d "page=2"
```

### 2) How you invoked the parser

One of the following:

- CLI (Windows cmd.exe)

```cmd
npx curl-to-json-parser "<your curl here>"
```

- API

```ts
import { parseCurlToJson } from 'curl-to-json-parser';

const input = `curl https://api.example.com/users -H "Accept: application/json" -G -d "page=2"`;
const result = parseCurlToJson(input);
console.log(result);
```

### 3) Expected output

```json
{
  "method": "GET",
  "url": "https://api.example.com/users?page=2",
  "headers": { "Accept": "application/json" }
}
```

### 4) Actual result

<!-- Paste the actual JSON output or error/stack trace -->

```json
{}
```

## Flags involved (check all that apply)

- [ ] `-X/--request`
- [ ] `-H/--header`
- [ ] `-d/--data*`
- [ ] `-G/--get`
- [ ] `-F/--form`
- [ ] `-u/--user`
- [ ] `--url`
- [ ] `-A/--user-agent`
- [ ] `--referer`
- [ ] `--compressed`
- [ ] `-k/--insecure`
- [ ] `-L/--location`
- [ ] `-I/--head`
- [ ] `-b/--cookie`

## Additional details

- Is this a regression (worked in a previous version)? If yes, which version?
- Any special characters, quoting, or multi-line edge cases in the curl string?
- If multipart/form-data, list parts and filenames if possible (redact sensitive info).

## Notes

This library only parses curl strings (no network calls). See README for supported flags and output shape.
