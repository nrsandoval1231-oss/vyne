# Future Swift PhotoKit integration

`PhotoLibraryContract.swift` is a design contract for M2. It imports PhotoKit types but is not registered as an Expo module and has not been compiled or executed in this Linux environment. The TypeScript counterpart is `../src/index.ts`.

M1 does not call native permissions, inventory, scanning, Vision, album writes or deletion. Implement these through a custom Expo module in a development build, including limited permissions, cancellation, revision validation, bounded thumbnail lifetimes and explicit user-authorized PhotoKit changes. Validate on a physical iPhone before enabling real actions.
