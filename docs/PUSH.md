# First push

Run commands from the project folder containing `package.json`.

```sh
npm ci
npm run check
npx playwright install chromium
npx playwright test --workers=2
```

If you extracted a ZIP instead of using the prepared working copy, initialize it first with `git init -b main`.

Create an empty GitHub repository (do not initialize it with another README). Then, if no initial commit exists:

```sh
git add .
git commit -m "Build Check Happens 2.0 with reproducible match logs"
```

If Git requests your identity, configure your own `user.name` and `user.email` before committing. No identity is invented by the project.

Add the URL of your chosen repository and push:

```sh
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Review `git diff --cached --stat` before the commit. Dependencies, builds, generated browser results, credentials and personal match logs are ignored. CI checks TypeScript, rule tests, build, browser interactions and the synthetic JSON example. No publishing/deployment workflow runs automatically.
