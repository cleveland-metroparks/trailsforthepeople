// Type shim for @turf/bbox v6.5.0.
//
// The package ships types at `dist/js/index.d.ts`, but its `package.json`
// `exports` field does not declare a `types` condition, so TypeScript with
// `moduleResolution: "bundler"` cannot resolve them. Re-export the bundled
// typings here so `import bbox from '@turf/bbox'` is typed correctly.
//
// This shim should be removed once we upgrade to @turf/bbox v7, which fixes
// the `exports` map to include a `types` condition.
declare module '@turf/bbox' {
  export { default } from '@turf/bbox/dist/js/index'
}
