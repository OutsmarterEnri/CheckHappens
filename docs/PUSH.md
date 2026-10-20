# First push

Destination: https://github.com/OutsmarterEnri/CheckHappens.git

The local working copy has branch `main` and `origin` configured. The remote was checked on 20 October 2026 and had no refs. The first push was completed on 20 October 2026. Pages deployment is separate and remains manual; see [PAGES.md](PAGES.md).

From the project directory:

```sh
npm ci
npm run check
npx playwright install chromium
npx playwright test --workers=2
git status
git remote -v
```

When ready to publish the prepared commits:

```sh
git push -u origin main
```

If using an extracted ZIP instead of this working copy, initialize Git first and commit the source:

```sh
git init -b main
git add .
git diff --cached --stat
git commit -m "Build Check Happens with verified compact match logs"
git remote add origin https://github.com/OutsmarterEnri/CheckHappens.git
git push -u origin main
```

Configure your own Git identity if Git requests it. Authenticate through your existing GitHub credential manager or SSH setup; do not place tokens in commands or project files. A readable public remote does not prove write permission. If GitHub contains changes by the time you push, fetch and review them before proceeding; do not force-push over remote work.

Dependencies, builds, generated test traces, environment files, and personal match logs are ignored. CI verifies TypeScript, domain tests, build, browser interactions and both synthetic log schemas. It uploads browser failure details when tests fail. The Pages workflow runs only via manual dispatch; ordinary pushes do not deploy the site.
