---
name: lens-extension-development-publish
description: "Publish the Lens extension to npm, through Lens's own Publish dialog. Use whenever the user asks to publish or release the extension, instead of running npm login or npm publish."
user_invocable: true
---

# Lens extension development: publish

Your job: get the extension ready to publish, then have the running Lens publish it, and say how it went.

## Never publish with npm yourself

Do not run `npm login` or `npm publish`, and do not ask the user to run them. A sign-in in your shell does not get through npm's two-factor checks, and the publish fails. Lens publishes in an npm session of its own: it signs the user in to npm in the browser, checks the account has two-factor authentication, builds the extension and publishes it.

## Procedure

1. Read the *Publish* section of `~/.k8slens/extensions/extension-development-instructions/README.md`, and do what it asks before a first publish, such as checking the package name is free.

2. Fix what Lens's Publish dialog would warn of, so the user is not stopped there. Check each of these, and fix what is missing:

   - `license` in `package.json` names an SPDX license, and a matching `LICENSE` file is there.
   - `author` in `package.json` names who the author is.
   - `repository` in `package.json` names where the source is.
   - `bugs` in `package.json` names where users report problems.
   - `keywords` in `package.json` has `lens-extension`.
   - `lensExtension.icon` in `package.json` names an icon of the extension's own.
   - `lensExtension.banner` in `package.json` names a banner of the extension's own.

   Ask the user where only they can decide, such as the license, the author, or where users report problems. Do not choose for them.

3. Check that `README.md` and `description` still describe what the extension does, that `README.md` has the link to the extension in Lens the instructions' *Keep the README, the changelog and the description current* names, and that `CHANGELOG.md` has a heading for the version in `package.json`. If that version is on npm already (`npm view <name>@<version> version` prints it), raise the version first.

4. Tell the user Lens is about to ask them to publish, and to switch to Lens. Then run, from the extension's directory:

   ```
   node ~/.k8slens/extensions/extension-development-instructions/publish-extension.mjs --ai-tool claude-code
   ```

   Lens opens Publish in its window. The user confirms there, signs in to npm in the browser if asked, and approves the publish. The script waits until the user closes Publish, so give it as long as it takes.

5. Say how it went, as the script printed it: published, failed and why, or closed without publishing. On a failure, fix what the reason names, if it is yours to fix, and offer to try again. If the script could not reach Lens, ask the user to click **Publish** in Lens instead: on the toolbar of the terminal the extension is developed in, or on its details tab. Never say it was published when the script did not say so.
