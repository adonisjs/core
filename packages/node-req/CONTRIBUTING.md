# Contributing

We love pull requests. And following this guidelines will make your pull request easier to merge

## Prerequisites

- Install [EditorConfig](http://editorconfig.org/) plugin for your code editor to make sure it uses correct settings.
- Fork the repository and clone your fork.
- Install dependencies: `npm install`.

## Coding style

We make use of Typescript along with [Tslint](https://palantir.github.io/tslint) to ensure a consistent coding style. All of the rules are defined inside the `tslint.json` file.

## Development work-flow

Always make sure to lint and test your code before pushing it to the GitHub.

```bash
npm test
```

Just lint the code

```bash
npm run lint
```

**Make sure you add sufficient tests for the change**.

## Other notes

- Do not change version number inside the `package.json` file.
- Do not update `CHANGELOG.md` file.
- Do not update `tslint.json` or `tslint.js` file. If something prevents you writing code, please create an issue for same.

## Need help?

Feel free to ask.
