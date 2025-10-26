# Pull Request

## Description

<!-- Please include a summary of the changes and the related issue. Include relevant motivation and context. -->

Fixes # (issue)

## Type of Change

<!-- Please delete options that are not relevant. -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] Build/CI configuration change

## Changes Made

<!-- Describe the changes in detail -->

-
-
-

## Testing

<!-- Describe the tests you ran to verify your changes. Provide instructions so we can reproduce. -->

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] All new and existing tests passed locally
- [ ] I have run `npm test` successfully
- [ ] I have tested the CLI functionality (if applicable)

### Test Cases

<!-- List specific test cases or curl commands you tested -->

```bash
# Example test command
npx curl-to-json-parser "curl https://api.example.com/users -H \"Accept: application/json\""
```

## Curl Parser Specific

<!-- If your changes affect curl parsing, please provide examples -->

### Example Curl Commands Tested

<!-- Provide curl commands that demonstrate your changes -->

```bash
# Example 1
curl https://api.example.com/users -X POST -H "Content-Type: application/json" -d '{"name":"John"}'

# Example 2
curl https://api.example.com/search -G -d "q=hello world" -d "page=2"
```

### Expected Output

<!-- Show the expected JSON output for the curl commands above -->

```json
{
  "method": "POST",
  "url": "https://api.example.com/users",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation (README.md)
- [ ] My changes generate no new warnings or errors
- [ ] I have checked that my changes work with both ESM and CJS builds
- [ ] I have verified TypeScript types are correct and exported properly
- [ ] I have tested with various curl flag combinations (if applicable):
  - [ ] `-X/--request` (HTTP methods)
  - [ ] `-H/--header` (headers)
  - [ ] `-d/--data*` (request body)
  - [ ] `-G/--get` (GET with data)
  - [ ] `-F/--form` (multipart form data)
  - [ ] `-u/--user` (authentication)
  - [ ] `-b/--cookie` (cookies)
  - [ ] Other flags: _____________

## Additional Context

<!-- Add any other context, screenshots, or information about the pull request here. -->

## Breaking Changes

<!-- If this is a breaking change, describe the impact and migration path for existing users. -->

N/A

## Related Issues/PRs

<!-- Link any related issues or pull requests -->

- Related to #
- Depends on #
