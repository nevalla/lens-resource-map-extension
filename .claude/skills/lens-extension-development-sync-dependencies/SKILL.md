---
name: lens-extension-development-sync-dependencies
description: "Align this extension's package.json dependency ranges with the versions bundled in the Lens build it runs in, then reinstall and rebuild. Use after a Lens upgrade, or when Lens reports \"Declared range for ... is not compatible with Lens's ...\"."
user_invocable: true
---

# Syncing dependency versions with the Lens build

Your job: make every host-provided dependency this extension declares compatible with the Lens build it is developed against, using the versions Lens itself publishes, then reinstall and rebuild so the change lands in `dist/index.js`.

## Background

Lens serves `react`, `mobx`, `@k8slens/*`, `@lensapp/*` and a few other packages to extensions from its own bundle. Before loading an extension, Lens checks each range the extension declares for such a package against the bundled version and refuses to load the extension when the range does not match. The versions come from the Lens build, so they change whenever Lens is upgraded.

## Procedure

1. Read `~/.k8slens/extensions/extension-development-instructions/README.md` and find the section headed `## Dependency versions in this Lens build`. Its fenced JSON block maps each package name to the exact version this Lens build bundles. Lens regenerates the file on every app load, so it always describes the running Lens. **If the section is missing, stop and tell the user their Lens build predates it. Do not guess versions.**

2. Read the extension's `package.json`. Walk `dependencies`, `devDependencies` and `peerDependencies`. Lens checks only `dependencies` and `peerDependencies` before loading, but `devDependencies` are synced too so the extension builds and type-checks against the versions it runs on. For every entry whose name appears in the JSON block, set its range to `^<version>` using the version from the block. Leave every other entry exactly as it is: packages the block does not list are the extension's own, resolved from its `node_modules`, and Lens does not check them. Never add entries; the extension declares what it uses. Preserve key order, 2-space indentation and the trailing newline when writing the file back.

3. If nothing changed, say so and stop. No install or build is needed.

4. Otherwise run `npm install` in the extension directory, then `npm run build`.

5. Report as a table: each package whose range changed, with the old and new range. Then one line listing the host-provided packages that were already in sync, and one line listing the declared packages the host does not provide, so the user knows those were deliberately left alone. If `npm install` or `npm run build` failed, quote the error verbatim.

Always write the caret range. If the user wants a deliberately wider range for some package, they can say so and revert that row.
