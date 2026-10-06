---
name: lens-extension-development-ideas
description: "Propose starter prompts for this Lens extension based on the host's current extension-development-instructions."
user_invocable: true
---

# Lens extension development — idea menu

Your job: present a short, curated menu of starter prompts the user could send next, grounded in the host build's actual extension surface and what this extension already contains.

## Procedure

1. Read `~/.k8slens/extensions/extension-development-instructions/README.md`. This is the authoritative, host-generated description of the extension surface available in the current Lens build — it is regenerated on every Lens app load. **If a capability is not in that file, do not propose a prompt for it.**

2. Read the extension's name from `package.json` (and/or the containing directory). Treat the name as a **hint about user intent** — e.g. "kube-events-toast" suggests notifications + cluster events, "node-status-bar" suggests a status-bar item summarizing nodes. Bias the proposed prompts toward surfaces that match the hint when the connection is plausible. If the name is generic (e.g. "my-extension") or unclear, ignore it.

3. Scan the whole `src/` directory recursively to understand what is already in place — which surfaces are already wired, what's been built beyond the scaffold's placeholder, and what's still untouched. Prefer prompts that move the *current* state forward rather than re-proposing work that's already done. If only the scaffold's placeholder is present, frame prompts as "replace the placeholder with …".

4. Produce 5–7 concrete prompt suggestions covering distinct surfaces actually documented in the instructions (e.g. status-bar items, top-bar items, commands, routes, preferences pages, notifications). Each suggestion is one sentence the user could literally paste back. Prefer prompts that align with the name-derived hint and the current source state.

   **Phrase every suggestion in plain product terms** — what the extension *does* for the user, where it shows up, what it reacts to. Do not mention implementation details like injection tokens, injectables, MobX, observables, React hooks, DI containers, or any framework/library names. The user is describing a feature; the implementation is Claude's problem afterwards.

   Good: "Add a status-bar item that shows the current cluster's node count."
   Bad: "Register a statusBarItemInjectionToken that observes a MobX computed of nodes."

5. Render the suggestions as a markdown bulleted list under the heading "Starter ideas for this extension". Do not run anything yet — wait for the user to pick one or type their own.
