# Changelog

## [1.0.2](https://github.com/forbiddenlink/constellation-events/compare/v1.0.1...v1.0.2) (2026-08-29)


### Bug Fixes

* **deps:** bump next to 16.3.3 for AVIF image RCE ([#51](https://github.com/forbiddenlink/constellation-events/issues/51)) ([fd75d14](https://github.com/forbiddenlink/constellation-events/commit/fd75d1421e970b4fc720e7dc9560dbd8dd20d42e))

## [1.0.1](https://github.com/forbiddenlink/constellation-events/compare/v1.0.0...v1.0.1) (2026-08-29)


### Bug Fixes

* harden workflow supply chain ([7de4e8b](https://github.com/forbiddenlink/constellation-events/commit/7de4e8bfd146dcc978e643c95dd8bbeedce99758))

## 1.0.0 (2026-08-16)


### Features

* Add astronomy-engine, night vision mode, and NASA APOD integration ([980705a](https://github.com/forbiddenlink/constellation-events/commit/980705a2a9044e741806b39e8a683722d7857328))
* celestial-timeline visual system ([b3bbc32](https://github.com/forbiddenlink/constellation-events/commit/b3bbc3239aa585078478aeaf53469205910afcb1))
* Comprehensive site audit - SEO, accessibility, and legal compliance ([148829e](https://github.com/forbiddenlink/constellation-events/commit/148829e04a770771300baa4aedb23bc9b4b3e756))
* Implement Deep Space Manifest marketplace design and update docs ([76b6329](https://github.com/forbiddenlink/constellation-events/commit/76b63299ef468d6d6a84de80c1bb6e7f6902084c))
* Polished design, fixed assets, and resolved functional bugs ([bbf73de](https://github.com/forbiddenlink/constellation-events/commit/bbf73de3a8acfc806c2e1a9043ad05ff020c82a5))
* Wire celestial-engine to live components for real ephemeris data ([6ff5534](https://github.com/forbiddenlink/constellation-events/commit/6ff55347a15875c78e75c424f818a6b6957dcd74))


### Bug Fixes

* add required maxDuration to TriggerConfig ([b607aca](https://github.com/forbiddenlink/constellation-events/commit/b607aca56edf6f25f5a3e74e049db34475312a72))
* add sentry.edge.config.ts to resolve Turbopack module not found error ([28ed170](https://github.com/forbiddenlink/constellation-events/commit/28ed170f235d55a9196b91f9ae3357dba455bd4f))
* address all persona-identified UX issues ([ba9f256](https://github.com/forbiddenlink/constellation-events/commit/ba9f256f6940004a08be0c75e4ddec2a3ebc5e72))
* cap cookie override below v2 to prevent @supabase/ssr build break ([b772ca3](https://github.com/forbiddenlink/constellation-events/commit/b772ca391e2772787c2688f71d087a72c7fc6a04))
* **ci:** add packageManager field for pnpm ([8f6fde6](https://github.com/forbiddenlink/constellation-events/commit/8f6fde6f98a5681d4f16cb656b9f760d0ccb3fde))
* **ci:** remove hardcoded pnpm version and update lockfile ([1e21396](https://github.com/forbiddenlink/constellation-events/commit/1e21396fbd2b8c5967892cf827136442605a32bf))
* correct template artifacts in auth and middleware imports ([aa04213](https://github.com/forbiddenlink/constellation-events/commit/aa04213288374557596caf742fecf921d13b3777))
* **csp:** unblock App Router hydration; allow NASA APOD + Sentry hosts ([d0e0a76](https://github.com/forbiddenlink/constellation-events/commit/d0e0a761c0b1c6a19de64d6b08b1c2152a2610b0))
* **deps:** clear high CVEs via same-major overrides ([d05d106](https://github.com/forbiddenlink/constellation-events/commit/d05d106abe7db79952d67774081ad605160c7c55))
* **deps:** pin undici &gt;=7.28.0 &lt;8 (CVE-2026-12151 floor, avoid v8 break) ([ed53f55](https://github.com/forbiddenlink/constellation-events/commit/ed53f5564be4184aea0aabb9222cd7549f5286e0))
* env.ts import, sentry paths, MSW types, safe-action api ([5367743](https://github.com/forbiddenlink/constellation-events/commit/5367743486f4ebfb04575c83d2f23c6425c01893))
* patch 9 security vulnerabilities ([107f3e5](https://github.com/forbiddenlink/constellation-events/commit/107f3e5bdc98377f4713a63aa36bf6e61029762e))
* pin nearest-safe transitive vulns (postcss, ws) via pnpm overrides ([0ecd5d7](https://github.com/forbiddenlink/constellation-events/commit/0ecd5d7c41a8c0b8ae2823640d3a8f9315555ba6))
* pin protobufjs to ^7.6.1 (CVSS 9.8) ([#15](https://github.com/forbiddenlink/constellation-events/issues/15)) ([e0833b6](https://github.com/forbiddenlink/constellation-events/commit/e0833b64cd66322efaff2209c12225eaf1a960c0))
* remove brace-expansion override breaking ESLint ([144f32e](https://github.com/forbiddenlink/constellation-events/commit/144f32ec9db66a85172b2482acce9efe37f63997))
* remove duplicate Sentry replay initialization ([ede9b76](https://github.com/forbiddenlink/constellation-events/commit/ede9b768d4c6e16dd83098292b4da609565f3b30))
* remove env.ts import from next.config to fix Vercel build ([db1857f](https://github.com/forbiddenlink/constellation-events/commit/db1857f9ad9030b90c1dcf8675ccad544739e24a))
* repair 246 broken tests across 21 test files ([bc64f36](https://github.com/forbiddenlink/constellation-events/commit/bc64f36ed2932df371cbd84d96275c527a446cc8))
* resolve build errors ([5639579](https://github.com/forbiddenlink/constellation-events/commit/56395796542f7c36a82c409be36d407bbf92d270))
* resolve Turbopack build failure caused by kysely adapter private API import ([e52c624](https://github.com/forbiddenlink/constellation-events/commit/e52c624ee443ab566ab977e8d1dfdf2f0f407794))
* resolve Vercel build errors ([ae059c4](https://github.com/forbiddenlink/constellation-events/commit/ae059c424d7548e20f296bca8c6ddd017727d590))
* sec sweep v3 - bump override floors + add fast-uri/uuid ([#16](https://github.com/forbiddenlink/constellation-events/issues/16)) ([d603935](https://github.com/forbiddenlink/constellation-events/commit/d603935eff9048d5f2d397546c76b101619d1ed3))
* **security:** pin transitive deps to patched versions (Dependabot high alerts) ([230a6d9](https://github.com/forbiddenlink/constellation-events/commit/230a6d9a835d6d997e89bd694d727145f11d8962))
* sentry instrumentation path and template artifacts ([f3ff5cd](https://github.com/forbiddenlink/constellation-events/commit/f3ff5cd166fde357dc68801fbc95eee60a9ab873))
* syntax error in next.config.js breaking Vercel build ([f4873e5](https://github.com/forbiddenlink/constellation-events/commit/f4873e5abee434e92501591e964b4f429d50df4c))
* upgrade minimatch for ESLint compatibility ([19e4622](https://github.com/forbiddenlink/constellation-events/commit/19e4622985c15faca7d1a37c3d0453d014b10e1b))
* use mockResolvedValue for React 19 strict mode compatibility ([3464cb8](https://github.com/forbiddenlink/constellation-events/commit/3464cb8a934fc1ab3d760cd536b716fcbb004c98))


### Reverts

* celestial-timeline (prod hydration break) ([213856b](https://github.com/forbiddenlink/constellation-events/commit/213856b220c5e2e23343cb9020d3a4371ae937b4))
