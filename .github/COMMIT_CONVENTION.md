## Git Commit Message Convention

> This is adapted from [Angular's commit convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular).

Using conventional commit messages, we can automate the process of generating the CHANGELOG file. All commits messages will automatically be validated against the following regex.

``` js
/^(revert: )?(feat|fix|docs|style|refactor|perf|test|workflow|ci|chore|types|build|improvement)((.+))?: .{1,50}/
```

## Commit Message Format
A commit message consists of a **header**, **body** and **footer**. The header has a **type**, **scope** and **subject**:

> The **scope** is optional

```
feat(router): add support for prefix

Prefix makes it easier to append a path to a group of routes
```

1. `feat` is type.
2. `router` is scope and is optional
3. `add support for prefix` is the subject
4. The **body** is followed by a blank line.
5. The optional **footer** can be added after the body, followed by a blank line.

## Types
Only one type can be used at a time and only following types are allowed.

- feat
- fix
- docs
- style
- refactor
- perf
- test
- workflow
- ci
- chore
- types
- build

If a type is `feat`, `fix` or `perf`, then the commit will appear in the CHANGELOG.md file. However if there is any BREAKING CHANGE, the commit will always appear in the changelog.

### Revert
If the commit reverts a previous commit, it should begin with `revert:`, followed by the header of the reverted commit. In the body it should say: `This reverts commit <hash>`., where the hash is the SHA of the commit being reverted.

## Scope
The scope could be anything specifying place of the commit change. For example: `router`, `view`, `querybuilder`, `database`, `model` and so on.

## Subject
The subject contains succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes".
- don't capitalize first letter
- no dot (.) at the end

## Body

Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

## Footer

The footer should contain any information about **Breaking Changes** and is also the place to
reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then used for this.

