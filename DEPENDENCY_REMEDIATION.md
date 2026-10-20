# Dependency Remediation Report

**Generated:** 2026-10-20
**Environment:** Node v24.16.0, npm v11.13.0
**Audit Commands:**
- Full tree: `npm audit --audit-level=high` → Exit 1, 12 findings (7 high, 5 moderate)
- Production-only: `npm audit --omit=dev --audit-level=high` → Exit 0, 3 moderate

## Summary

| Category | Count | Disposition |
| --- | ---: | --- |
| High severity (full tree) | 7 | Deferred - no compatible fix available |
| High severity (production-only) | 0 | N/A |
| Moderate severity (full tree) | 5 | Deferred - no compatible fix available |
| Moderate severity (production-only) | 3 | Deferred - incompatible downgrade required |

**Key Finding:** All 7 high-severity findings are in the development/build tool graph (Tailwind CSS, Next.js ESLint tooling). The production-only graph has 0 high findings and 3 moderate findings (Mammoth dependency chain).

## Detailed Remediation Matrix

### High Severity (Development/Build Toolchain)

| Package | Installed Version | Dependency Path | Severity | Advisory | Runtime Reachability | Application Usage | Patched Version | Compatibility | Remediation | Regression Coverage | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tailwindcss` | 3.4.4 (package.json: ^3.4.4) | Direct dev dependency; pulls `chokidar`, `fast-glob`, `micromatch`, `postcss-nested`, `postcss-selector-parser` | High | GHSA-vfj7-8cjw-p6xm (braces path) | No - dev dependency used only in CSS build | Stylesheet compilation via PostCSS; not imported by runtime routes | npm offers 4.3.3 (major upgrade) | Breaking change - Tailwind 4 requires CSS migration | Evaluate Tailwind 4 in isolated branch after reviewing migration guide | `npm run build`; compare generated CSS; visual/responsive smoke tests for public pages and dashboard on mobile/desktop; verify interactive states and theme styles | Deferred - awaiting safe migration path |
| `braces` | 3.0.3 (transitive) | `tailwindcss → chokidar → braces` and `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` | High | GHSA-vfj7-8cjw-p6xm (stack exhaustion from deeply nested patterns) | No - only in glob/pattern matching used by build tools | No application-level import or user-controlled pattern usage found in source search | None listed in advisory | No same-major patch identified; all current consuming ranges affected | Keep open; do not pin/override to another still-affected version; recheck advisory and consuming ranges before change | Once upstream compatible release exists: install from updated lockfile, run lint/build and offline tests; add bounded-pattern regression only if app code begins accepting user-controlled glob patterns | Deferred - awaiting upstream fix |
| `chokidar` | 3.6.0 (transitive) | `tailwindcss → chokidar → braces` | High | GHSA-vfj7-8cjw-p6xm (via braces) | No - dev dependency used for file watching in dev mode | No app runtime import found | npm offers no safe v3 patch; Chokidar 4 would be breaking transitive override | Tailwind's current range accepts v3.6.0; no safe compatible patched v3 release identified | Resolve with supported Tailwind/toolchain update, not override | Run dev server and verify CSS watch/rebuild after editing stylesheet; run production build and responsive visual checks after toolchain migration | Deferred - awaiting Tailwind 4 or compatible Chokidar update |
| `micromatch` | 4.0.8 (transitive) | `tailwindcss → fast-glob → micromatch → braces` and `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` | High | GHSA-vfj7-8cjw-p6xm (via braces) | No - glob pattern matching in build tools | No app runtime import found | Updating micromatch alone within current major does not remove affected braces dependency | Current 4.x has no patched braces release in its supported dependency range | Do not override only braces; monitor upstream consumers or plan tested toolchain migration | Lint/build; verify configured source globs include expected app, component, and test files; run offline suite and inspect final lockfile audit | Deferred - awaiting upstream dependency-range changes |
| `eslint-config-next` | 16.4.2 (package.json: ^16.4.2) | Direct dev dependency; pulls `@next/eslint-plugin-next → fast-glob → micromatch → braces` | High | GHSA-vfj7-8cjw-p6xm (via braces) | No - dev dependency used only for linting | `npm run lint`; not loaded in production requests | npm suggests 14.2.35 (major downgrade) | Incompatible with Next 16.4.2; registry metadata still reports 16.4.2 as current | Wait for supported Next 16 ESLint release; do not downgrade | `npm run lint`, TypeScript, production build, and offline suite; review changed lint diagnostics for removed/changed Next rules | Deferred - awaiting Next 16 compatible patch |
| `@next/eslint-plugin-next` | 16.4.2 (transitive) | `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` | High | GHSA-vfj7-8cjw-p6xm (via braces) | No - transitive ESLint plugin | No app runtime import | Coupled to eslint-config-next; no separate compatible patched release identified | Upgrade with supported eslint-config-next release | Lint, TypeScript, production build, and offline suite; confirm Next-specific rules still run and no lint configuration silently disables them | Deferred - awaiting Next 16 compatible patch |
| `fast-glob` | 3.3.1, 3.3.3 (transitive) | `tailwindcss → fast-glob → micromatch → braces` and `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` | High | GHSA-vfj7-8cjw-p6xm (via braces) | No - file globbing in build tools | No app runtime import | A fast-glob 3.x-only update does not remove vulnerable transitive path | Updating only fast-glob would not clear advisory; current consuming ranges still affected | Avoid top-level override; update consuming toolchain once its ranges point to resolved chain | Lint/build; verify file discovery across `src`, `tests`, and configuration files; run offline suite and inspect final lockfile audit | Deferred - awaiting consuming toolchain update |

### Moderate Severity (Production and Build)

| Package | Installed Version | Dependency Path | Severity | Advisory | Runtime Reachability | Application Usage | Patched Version | Compatibility | Remediation | Regression Coverage | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `mammoth` | 1.8.0 (package.json: ^1.8.0) | Direct runtime dependency; pulls `argparse → sprintf-js` | Moderate | GHSA-hp3w-g68c-fv3c (via sprintf-js) | Yes - used by authenticated DOCX upload route | `mammoth.extractRawText` in `/api/resume/upload`; authenticated route with 5 MB size limit | npm offers 0.3.29 (major downgrade) | Downgrade would be breaking; current v1.8.0 actively used | Do not downgrade; track upstream patch or evaluate replacing DOCX parser in isolation | Test valid DOCX upload, malformed DOCX, size-limit case, ownership scoping, persistence, and PDF upload; keep upload feature authenticated and size-limited | Deferred - awaiting upstream patch or replacement evaluation |
| `argparse` | 1.0.10 (transitive) | `mammoth → argparse → sprintf-js` | Moderate | GHSA-hp3w-g68c-fv3c (via sprintf-js) | Possibly - Mammoth CLI dependency | Source inspection found no import of argparse CLI path in app's `mammoth.extractRawText` library call | None listed for sprintf-js; argparse has later versions but Mammoth's version constraint remains | App's Mammoth extraction call does not import CLI parser; this narrows reachability but does not clear finding | Isolate/review CLI path and track replacement or upstream fix | If replacing DOCX parser: test valid/malformed files, size limits, ownership, persistence, and PDF behavior | Deferred - awaiting Mammoth patch or parser replacement |
| `sprintf-js` | 1.0.3 (transitive) | `mammoth → argparse → sprintf-js` | Moderate | GHSA-hp3w-g68c-fv3c (unbounded precision specifiers) | Possibly - Mammoth CLI dependency | No direct application import; appears only in Mammoth's CLI path | None listed in advisory (affected through 1.1.3) | No patched version identified | Avoid incompatible Mammoth downgrade; isolate/review CLI path and track replacement or upstream fix | Same as argparse above | Deferred - awaiting upstream patch |
| `postcss-selector-parser` | 6.1.4 (transitive) | `tailwindcss → postcss-nested → postcss-selector-parser` | Moderate | GHSA-rj75-hqrm-r3gf (quadratic complexity in flat selector parsing) | No - build-time CSS parsing | Tailwind/PostCSS build chain; no runtime import | 7.1.6+ (patched) | Tailwind requires `^6.1.2`; 7.1.6+ falls outside that range - major version boundary | Address with tested CSS-toolchain migration (likely alongside Tailwind 4), not unsupported parser override | Build; verify generated CSS; verify responsive layouts and representative visual states | Deferred - awaiting Tailwind 4 migration |
| `postcss-nested` | 6.2.0 (transitive) | `tailwindcss → postcss-nested → postcss-selector-parser` | Moderate | GHSA-rj75-hqrm-r3gf (via selector-parser) | No - build-time CSS nesting | Tailwind/PostCSS build chain; no runtime import | npm marks fix generically, but current compatible v6 is 6.2.0 | Updating chain crosses major boundary; Tailwind's range is `^6.2.0` | Test CSS-toolchain migration alongside Tailwind 4; verify build, generated CSS, responsive layouts, and visual states | Build; generated CSS comparison; responsive page coverage; visual regression checks | Deferred - awaiting Tailwind 4 migration |

## Risk Assessment

### Build-Time/Development Exposure
- **High-severity findings (7):** All in development/build tool graph (Tailwind CSS, Next.js ESLint)
- **Attack surface:** Build process, developer machines, CI environments
- **User data exposure:** Unlikely - these tools process static assets and source code, not user-controlled input at runtime
- **Mitigation:** Do not accept untrusted user-supplied PostCSS config, Tailwind config, or glob patterns in production builds

### Production Runtime Exposure
- **High-severity findings (0):** None in production-only dependency graph
- **Moderate-severity findings (3):** Mammoth → argparse → sprintf-js chain
- **Attack surface:** Authenticated DOCX upload route (5 MB size limit)
- **Reachability assessment:** Source inspection found no import of argparse CLI path in app's `mammoth.extractRawText` call; advisory appears CLI-only but not proven safe
- **Mitigation:** Keep upload authenticated and size-limited; consider DOCX parser replacement if upstream patch not available

## Recommended Actions

### Immediate (No Code Changes Required)
1. **Document findings** in this report
2. **Inform stakeholders** that all high-severity findings are build-toolchain risks
3. **Verify no user-controlled build inputs** in production (PostCSS config, Tailwind config, glob patterns)
4. **Continue monitoring** npm advisories for Tailwind 4 compatibility notes and Next 16 ESLint patches

### Short-Term (After Approval)
1. **Evaluate Tailwind 4 migration** in isolated branch:
   - Read Tailwind 4 migration guide
   - Test `npm run build` against Tailwind 4.3.3
   - Compare generated CSS output
   - Run visual/smoke tests for public pages and dashboard
   - Verify responsive layouts on mobile and desktop
2. **Monitor for Next 16 ESLint patch:**
   - Check Vercel/Next.js release notes
   - Test proposed patch in isolated branch
   - Verify `npm run lint`, TypeScript, and build after upgrade

### Long-Term (After Upstream Fixes)
1. **Resolve Mammoth/DOCX parser:**
   - Track upstream Mammoth patch for sprintf-js
   - Evaluate alternative DOCX parsers with clean dependency trees
   - Test replacement thoroughly (valid/malformed files, size limits, ownership, persistence)
2. **Address remaining toolchain advisories:**
   - Upgrade to Tailwind 4 once migration is verified
   - Apply Next 16 ESLint patch when available
   - Re-run full audit after toolchain migration

## Remediation Rules

### Do NOT Run
- `npm audit fix --force` (would force Tailwind 4.3.3 major upgrade and Mammoth 0.3.29 major downgrade)
- Incompatible package downgrades (e.g., Mammoth 0.3.29, eslint-config-next 14.2.35)
- Tailwind major-version migration as incidental part of another fix
- Lockfile regeneration unrelated to proposed remediation
- Individual transitive overrides that cross declared major ranges

### Do Run (After Approval)
- Tailwind 4 evaluation in isolated branch with migration guide review
- Next 16 ESLint patch when upstream provides compatible release
- Mammoth replacement evaluation if upstream patch not available
- Focused regression tests after any approved change
- Full re-audit after toolchain migration

## Verification Commands

After any approved remediation:

```powershell
# Check lockfile reflects intended dependency tree
npm ls tailwindcss eslint-config-next mammoth

# Run quality checks
npm run lint
npx tsc --noEmit
npx prisma validate
npx prisma generate

# Run offline tests
npm run test:offline

# Re-run dependency audit
npm audit --audit-level=high
npm audit --omit=dev --audit-level=high

# Run production build
npm run build
```

## Conclusion

**Current Status:** All 12 npm audit findings (7 high, 5 moderate) are deferred because no compatible patched versions exist within the current dependency constraints. The 7 high-severity findings are build-toolchain risks (Tailwind CSS, Next.js ESLint) and do not affect production runtime. The 3 production-only moderate findings are in the Mammoth DOCX parser dependency chain; source inspection suggests the affected path is CLI-only, but this is not proof of safety.

**No dependency or lockfile changes were made in this assessment.** Remediation requires:
1. Tailwind 4 migration evaluation in isolated branch
2. Next 16 ESLint patch when available
3. Mammoth replacement or upstream patch for sprintf-js

**Disposition:** Defer all findings until compatible upstream fixes or approved major-version migrations are available. Continue monitoring advisories and do not force upgrades with `npm audit fix --force`.
