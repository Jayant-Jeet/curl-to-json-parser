---
name: Feature request
about: Suggest an improvement or new parsing capability for curl-to-json-parser
title: "feat: <short summary>"
labels: enhancement
assignees: ''
---

## Summary

<!-- Concise description of the feature. What should the parser/CLI be able to do? -->

## Problem this solves / Motivation

<!-- What limitation, use case, or pain point does this address? Include any links or context. -->

## Proposed solution

- Intended behavior:
- Any changes to output shape (if applicable):
- API changes (TypeScript): new options, return shape, errors, etc.
- CLI changes (flags or usage):

### Example curl input(s)

```bash
# Provide 1–2 realistic curl examples demonstrating the request
curl https://api.example.com/users -G -d "q=hello world" -d "page=2"
```

### Expected parsed JSON

```json
{
  "method": "GET",
  "url": "https://api.example.com/users?q=hello%20world&page=2",
  "headers": {},
  "query": { "q": "hello world", "page": "2" }
}
```

## Scope and impact

- [ ] Backward compatible
- [ ] Potentially breaking (describe migration path)
- [ ] Performance considerations
- [ ] Requires new dependencies

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
- [ ] Other: (specify)

## How would you use it?

- API (TypeScript)

```ts
import { parseCurlToJson } from 'curl-to-json-parser';

const input = `curl https://api.example.com/users -H "Accept: application/json"`;
const result = parseCurlToJson(input);
console.log(result);
```

- CLI (Windows cmd.exe)

```cmd
npx curl-to-json-parser "curl https://api.example.com/users -H \"Accept: application/json\""
```

## Alternatives considered

<!-- Other approaches you thought about and why they don't fully solve it -->

## Additional context

<!-- Any extra information, related issues/PRs, or screenshots -->

---

Note: This library only parses curl strings into structured JSON. It does not perform any HTTP requests. See README for supported flags and output shape.
