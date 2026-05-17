# Pocket AI — Build Context & Scratchpad

## Project Goal

Building "Pocket AI" — a React Native/Expo mobile app (Android) for local LLM model management and chat.
Repo: https://github.com/maxta85/local-android-ai (public).
Main challenge: getting `llama.rn` JSI bindings to work in the EAS-built APK.

---

## Progress

- Fixed SDK version mismatches (`expo-file-system ~19.0.22`, `expo-document-picker ~14.0.8`, `expo-clipboard ~8.0.8`) and added Expo Go detection guard in `LlamaContext.tsx`.
- Added `llama.rn` Expo plugin to `app.json` (was missing — caused JNI libs to not be bundled in APK).
- Set `newArchEnabled: false` after discovering `RNLlamaModule.java` calls `getCatalystInstance()` which returns null in New Architecture, causing JSI install to always fail.
- Downgraded `react-native-reanimated` from `~4.1.1` → `~3.19.5` and removed `react-native-worklets: 0.5.1` because reanimated v4 hard-requires New Architecture (`assertNewArchitectureEnabledTask` Gradle check).
- Build `fb870dc7` failed with "Gradle build failed with unknown error" — root cause: reanimated 3.x is incompatible with RN 0.81.5 (the whole Expo SDK 54 ecosystem has moved to New Architecture).
- **Current fix (build `190421d8`):** Created `patches/llama.rn@0.12.0.patch` to fix `RNLlamaModule.java` to work with New Architecture. Patch wraps `getCatalystInstance()` in a null-safe try/catch and falls back to `context.getJSCallInvokerHolder()` which `BridgelessReactContext` (New Arch) overrides correctly. Restored `newArchEnabled: true`, `reanimated ~4.1.1`, `react-native-worklets 0.5.1`.

---

## Scratchpad

- Stack: Expo SDK 54 (~54.0.27), React Native 0.81.5, llama.rn ^0.12.0, expo-router ~6.0.17, pnpm workspaces monorepo.
- EAS project ID: `8d6b541e-2441-409a-901c-354ab1c26c9e`, package: `com.pocketai.llmchat`, keystore: `AhrNkl1bxC`.
- EXPO_TOKEN and GITHUB_TOKEN secrets available. GitHub repo owner: maxta85 / maxjkt@gmail.com.
- EAS builds triggered via:
  ```
  cd artifacts/llm-chat && GIT_OPTIONAL_LOCKS=0 EXPO_TOKEN=$EXPO_TOKEN npx eas-cli build \
    --platform android --profile preview --non-interactive --no-wait
  ```
- GitHub file pushes done via curl GitHub Contents API (PUT). Large files (pnpm-lock.yaml) written to temp file, then `--data-binary @file`.
- The core bug in `llama.rn` 0.12.0: `RNLlamaModule.java` `install()` calls `context.getCatalystInstance().getJSCallInvokerHolder()`. In New Architecture (RN 0.76+), `getCatalystInstance()` returns null → NPE → JSI install silently fails → `global.llamaInitContext` is never defined → all inference calls crash.
- The fix in `patches/llama.rn@0.12.0.patch`:
  1. Try `getCatalystInstance().getJSCallInvokerHolder()` (Old Arch)
  2. Fall back to `context.getJSCallInvokerHolder()` — `BridgelessReactContext` overrides this in New Arch
- pnpm applies the patch automatically via `patchedDependencies` in `pnpm-workspace.yaml`. EAS runs `pnpm install` which applies the patch before Gradle compiles the source.
- EAS `build:logs` CLI command returns no output for failed builds — use the Expo web dashboard instead.
- `llama.rn` 0.12.0 is the latest version on npm.

### Build History

| Build ID | Result | Root Cause |
|---|---|---|
| (early builds) | FAILED | Missing `llama.rn` plugin → JNI `.so` libs not bundled in APK |
| (mid builds) | FAILED | `newArchEnabled: true` + `getCatalystInstance()` null → JSI never installs |
| (pre-fb870dc7) | FAILED | `assertNewArchitectureEnabledTask` in reanimated v4 with `newArchEnabled: false` |
| `fb870dc7` | FAILED | reanimated 3.19.5 incompatible with RN 0.81.5 (New Arch ecosystem mismatch) |
| `190421d8` | PENDING | Full fix: llama.rn Java patch + New Arch + modern packages restored |

---

## Important Files

| File | Purpose |
|---|---|
| `artifacts/llm-chat/app.json` | `newArchEnabled: true`, llama.rn plugin with `enableOpenCLAndHexagon: true` |
| `artifacts/llm-chat/package.json` | `reanimated ~4.1.1`, `react-native-worklets 0.5.1` |
| `artifacts/llm-chat/context/LlamaContext.tsx` | Expo Go detection guard added |
| `artifacts/llm-chat/eas.json` | Build profiles: `preview` = APK, `production` = AAB |
| `artifacts/llm-chat/node_modules/llama.rn/android/src/main/java/com/rnllama/RNLlamaModule.java` | Has `getCatalystInstance()` bug in `install()` method — patched via `patches/llama.rn@0.12.0.patch` |
| `patches/llama.rn@0.12.0.patch` | pnpm patch that fixes the New Architecture JSI installation bug |
| `pnpm-workspace.yaml` | Has `patchedDependencies` entry pointing to the patch file |
