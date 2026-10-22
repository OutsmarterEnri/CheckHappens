# Project rights and release considerations

## Owner's current decision

The owner explicitly chose to keep the project reserved for now. `LICENSE` records that no open-source reuse grant is being made for project-authored materials. `package.json` uses `UNLICENSED` (not the similarly named public-domain-style Unlicense). This status does not prohibit the owner from hosting their own prototype on Pages.

A public repository is not confidential. GitHub users can view and fork it under GitHub's terms; visitors to a browser game receive its JavaScript. Reserving rights does not technically hide the implementation or recall copies already obtained. If source confidentiality becomes necessary, review repository visibility and hosting/account-plan options before distributing further code.

If the owner later chooses MIT or another open-source license, add the actual chosen license and correct rights-holder details and update package/README metadata. MIT permits commercial reuse, modification and redistribution provided notices are retained; that choice should be deliberate. It does not grant the project's owner exclusive commercial use, and licenses already granted for earlier distributed versions generally cannot simply be recalled from recipients complying with them. No such MIT grant has been made for project-authored code here.

Reference: [GitHub repository licensing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), [MIT terms](https://choosealicense.com/licenses/mit/).

## Dependencies and assets

The current runtime dependencies are React, React DOM and Scheduler, under MIT. Their notices must remain with distributed substantial copies. MIT dependencies do not require the surrounding project to use MIT or publish its own source. Vite is a build tool with a small browser helper; its supplied license includes additional bundled-component notices. Relevant texts are retained in `licenses/`, and public runtime/core notices are copied into the build.

See [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) and [the lockfile inventory](DEPENDENCY_LICENSES.md). These inventories reflect the inspected versions, not a guarantee about future dependencies. Review new engines, icons, fonts, sounds, images, templates and copied snippets before including them. In particular, GPL/AGPL components can have materially different distribution/network-use obligations and should not be added on the assumption that every dependency behaves like MIT.

There are no downloaded font files or external chess-engine packages in the current runtime list. Project SVGs and generated icon files are maintained in this repository. That source review alone is not an originality or ownership opinion about every visual or AI-assisted contribution. Keep provenance and permissions for any externally sourced materials added later.

## Branding and card-game references

Check Happens is an independent prototype. Mattel identifies UNO as its brand and marks it with trademark symbols in its official materials. The project is not affiliated with or endorsed by Mattel. Describing inspiration is different from receiving permission to use a name, logo, card artwork, distinctive presentation or other protected material.

Use Check Happens as the product name and its own visual assets. Do not imply an official UNO edition. A non-affiliation statement, a free demo or a software license is not by itself clearance for another party's intellectual property. The name “Check Happens” has not been searched/cleared across trademark registers, jurisdictions, app stores or related products.

Before wider promotion, monetization or app-store distribution, obtain a review of the proposed name, visual identity, card presentation and marketing wording for the intended jurisdictions. This document does not assert a legal right to reproduce another game's branding or that a non-commercial prototype is automatically exempt.

Official example: [Mattel's Classic UNO product page](https://shop.mattel.com/products/uno-gdj85).

## Hosting and tester data

The app has no accounts or analytics integration. Local and bot games stay on-device. Private mode sends commands to the chosen room server, which persists match logs and hashed seat/invitation credentials; the hosting provider also receives network connection information. Explain this before inviting testers and configure retention for the actual host. Device storage and manually exported logs still deserve clear explanation to testers. Pages hosting is operated by GitHub; GitHub documents collection of visitor IP addresses for security. Public issues and attachments may disclose files to others. Do not request unrelated personal data in match reports.

A public prototype is not a promise of general legal/privacy compliance. If accounts, telemetry, payments, advertising, additional multiplayer data collection or other data collection is introduced, revisit the privacy information and applicable obligations for the actual deployment.

Reference: [GitHub Pages data collection](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection).

## Mascot asset provenance

The owner supplied the illustrated mascot/theme sheet in October 2026.
`public/brand/mascot-sheet.png` preserves that supplied image; theme illustrations
and app icons display regions of it. The transparent main mascot was prepared
with imagegen from the supplied reference. These assets inherit the project’s
reserved-rights policy; this record does not assert third-party clearance.

The Halloween mascot variant was created with imagegen using the owner-supplied
main mascot as its reference, for the Boo Happens theme.
