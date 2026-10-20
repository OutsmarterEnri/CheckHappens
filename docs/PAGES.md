# Publish the test prototype on GitHub Pages

Repository: https://github.com/OutsmarterEnri/CheckHappens

Expected public URL after deployment: `https://outsmarterenri.github.io/CheckHappens/`

The workflow is prepared locally in `.github/workflows/pages.yml`. It only runs through **Run workflow**. Adding/pushing the file does not automatically publish the site. Nothing in these instructions changes repository visibility or activates Pages by itself.

## 1. Review and push the prepared release

Review `README.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md` and `docs/RIGHTS.md`. The project-owned materials are reserved; third-party license obligations remain in force. Confirm that a publicly reachable test site and the repository's existing visibility fit your intention.

From the project directory:

```sh
git status
git add README.md LICENSE THIRD_PARTY_NOTICES.md licenses public/THIRD_PARTY_NOTICES.txt docs .github/workflows/pages.yml package.json package-lock.json
git diff --cached --stat
git commit -m "Document the project, rights and manual Pages deployment"
git push origin main
```

If the prepared changes are already committed locally, skip `git add` and `git commit` and push the existing commit. Do not include personal match logs or `.env` files. `dist/` remains ignored: Actions builds it.

## 2. Enable the Pages source

1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. If Actions is disabled, enable it under **Settings → Actions → General**, allowing the official actions referenced by the workflow.
4. No custom domain, deploy key or personal access token needs to be added for this standard workflow. It uses GitHub's workflow token and deployment OIDC permissions.

GitHub Free supports Pages from public repositories. Hosting from a private repository requires an eligible plan. Standard Pages hosting is publicly reachable; a private repository does not by itself create private access to the published site. Keep the source public or private according to your intended source visibility and account plan; do not change it blindly just to make a button appear.

## 3. Deploy manually

1. Open **Actions → Deploy Check Happens to Pages**.
2. Click **Run workflow**, select `main`, and confirm the run.
3. The `build` job installs locked dependencies, checks TypeScript and domain tests, builds, then runs the browser suite. It uploads only `dist/`.
4. The `deploy` job waits for a successful build and publishes to the `github-pages` environment. If an environment approval was configured, approve that deployment there.
5. Open the URL displayed by the deployment/environment. Enable **Enforce HTTPS** in Pages settings if available and not already enforced.

The workflow uses `contents: read`, Pages configuration read access for build, and `pages: write` plus `id-token: write` for deployment. Only `main` is allowed by the build condition. Pull requests and normal pushes do not trigger this publication workflow.

## 4. Test from an iPhone

Open the site in Safari in portrait orientation. Check home/tutorial, one local game, all time presets, one bot game, color selection, Reverse, JSON export and resume after leaving the app. Visit online once before testing offline. Verify `THIRD_PARTY_NOTICES.txt` is available under the same project URL. If desired, use **Share → Add to Home Screen**.

This does not install a native iOS application or create online multiplayer rooms. Each device/browser keeps its own save and logs. Localhost/LAN saves do not automatically migrate to the Pages origin; export a match on the old origin first if needed. A schema-1/2 diagnostic file can be imported through the Lab if you want to continue a compatible match.

The build uses relative asset URLs (`base: "./"`), and the manifest/service-worker scope is relative to the application directory. Keep the final `/CheckHappens/` slash when sharing the URL. Do not upload the entire repository as the Pages artifact or choose `/docs` as a static publishing folder: this React/Vite app must be built first.

## 5. Updates, rollback and troubleshooting

For a new version, push reviewed changes and run the same workflow manually. A normal code push runs CI but does not replace the published prototype. Application updates do not force service-worker activation while a game is open; close all open tabs/Home Screen instances and reopen when testing an update. Export before clearing site data; clearing it removes saved matches.

- **Run workflow is missing:** the workflow file must first exist on the default branch, and Actions must be enabled.
- **Configure Pages fails:** set **Settings → Pages → Source = GitHub Actions**, then rerun.
- **Deployment permission error:** inspect repository/organization policy and the workflow's Pages/OIDC permissions; do not paste credentials into YAML.
- **404 immediately after deployment:** wait for the successful deployment/environment URL and check the exact repository path/capitalization. Confirm `dist/index.html` is in the artifact.
- **Blank page or missing assets:** inspect browser console and paths under `/CheckHappens/`; a root-domain-only path can break project sites. Preserve relative assets and the service-worker path.
- **Old build persists:** close all app instances before reopening; compare the build context in a newly exported JSON. Clear site data only after exporting the save.
- **Need to revert:** revert the unwanted commit on `main`, push, and run the workflow again. To unpublish, use the Pages settings' unpublish control. Do not rewrite shared history with a force push.

Official references: [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [HTTPS and site visibility](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).
