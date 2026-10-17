# VYNE iPhone application

Expo SDK 58, React Native 0.88, React 19.3 and strict TypeScript. The Expo-compatible versions are locked in `package-lock.json`.

```sh
npm ci
npx expo run:ios          # Mac, Xcode, iOS Simulator
npx expo run:ios --device # Mac, connected iPhone, signing configured in Xcode
```

`npm run web` is a development preview, not the target platform. Metro supplies cross-origin isolation headers required for browser SQLite. Production web hosting would need the same headers; no website deployment is part of M1.

`npm run typecheck`, `npm run lint`, and `npm test` validate source and domain/persistence behavior. For browser interaction tests, install Chromium with `npx playwright install chromium`, start `npm run web -- --port 8081` in another terminal, and run `npm run test:browser`.

The native module is not registered or implemented. A development build is the intended native path, using `expo-dev-client`; future PhotoKit integration cannot run in Expo Go. See [testing instructions](../../docs/TESTING.md).
