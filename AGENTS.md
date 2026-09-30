# Working on Personal

Use this existing checkout. Do not clone another Harness, create a worktree, or copy dependency caches merely to start a new Agent task. Read the current Git status and preserve other work. If a shared dependency directory already exists, reuse it; `npm ci` is for a missing development toolchain, not a routine first step.

This repository owns the Personal entry, directory, registry, navigation and styling. OOPS and future peer features belong to separate plugins. Keep the package ID `dsh-personal` and exported `dsh-personal/client` API compatible with consumers; the GitHub repository name is `dsh-personal-entry`.

Official Harness source, packages and build outputs are read-only. Use public slots, layout and Cordis lifecycle. Build scripts may create links only inside this plugin's ignored node_modules and may output only inside this plugin. Do not activate, reinstall or restart the live Host merely to publish repository changes.

Run `npm run typecheck`, `npm test` and `npm run build` against the intended existing Harness for implementation or packaging changes. Run `npm run test:registry` without a Harness for registry-only changes. Inspect `npm pack --dry-run --ignore-scripts` before distributing a package. Record current Desktop interaction separately from source, unit tests and bundles.

Never commit credentials, `.local`, `.dshx`, node_modules, build outputs, personal data, machine-specific paths or unrelated handoff material. Keep README and feature registration documentation aligned with public API changes. Follow the calling Agent's authorized native browser/computer-use policy.
