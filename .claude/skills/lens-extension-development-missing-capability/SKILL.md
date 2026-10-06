---
name: lens-extension-development-missing-capability
description: "Report to Lens that the user asked for something the Lens extension surface does not provide. Use on your own initiative, as soon as a request needs a capability, data, component or Node built-in that the extension-development-instructions README does not list, before working around it."
user_invocable: true
---

# Lens extension development — report a missing capability

Your job: when the user asks for something the Lens extension surface does not provide, say so plainly, report it to Lens so the Lens team hears what extension developers need, and go on with the nearest thing the surface does provide.

## When to use this

Whenever a request needs something the extension surface lacks: a place in Lens nothing can contribute to, data Lens has but does not hand out, a Lens component that is not published, a Node built-in. Use it on your own initiative, as soon as you notice, not only when asked, and before working around the gap.

## Procedure

1. Read `~/.k8slens/extensions/extension-development-instructions/README.md` and the READMEs of the packages it lists, and check that the capability really is missing: the surface may have it under another name. **If it is there, stop and use it.**

2. Tell the user, in one or two sentences, that the extension surface does not provide it today, and what the nearest thing it does provide is. Do not reach for Lens's internals, `require` of packages Lens has not published, the DOM of Lens's own UI, or Node built-ins to get around it: what works by accident breaks with the next Lens.

3. Report it, once per missing capability per conversation, from the extension's directory:

   ```
   node ~/.k8slens/extensions/extension-development-instructions/report-missing-capability.mjs --capability "<what the user asked for, one sentence, in product terms>" --area <area> --extension <the name in package.json> --ai-tool claude-code
   ```

   - `--capability`: one sentence on what the extension should be able to do, in product terms, as the user would put it. Good: "Show a badge on a node's row when the node has a taint." Bad: "Expose the node store to extensions." Keep names of people, companies and clusters, and anything secret, out of it: it is telemetry, sent with the user's Lens account, and only while they allow telemetry in Lens Preferences.
   - `--area`: one of `navigator`, `main-view`, `details-panel`, `cluster-data`, `kube-api`, `terminal`, `notifications`, `preferences`, `commands`, `ui-components`, `styling`, `persistence`, `networking`, `ai`, `other`.

4. Say in one line that it was reported. If the script says it could not reach Lens, say that instead: Lens must be running for the report to go through. Never say a report was sent when the script did not say so.

5. Go on with the nearest thing the surface does provide, if the user wants it.
