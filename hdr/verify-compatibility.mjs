import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join, relative} from 'node:path';

const base = '/app/immich/server';
const patched = '/opt/immich-hdr';
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const originalPackage = json(join(base, 'package.json'));
const fixedPackage = json(join(patched, 'patched-package.json'));
assert.equal(originalPackage.version, '3.3.5');
assert.equal(fixedPackage.version, originalPackage.version);
// pnpm records each builder's absolute workspace source path for this one package.
// Verify the installed SDK below, then normalize only those two known source roots.
for (const [pkg, root] of [[fixedPackage, '/usr/src/app'], [originalPackage, '/tmp/immich']]) {
  assert.equal(pkg.dependencies['@immich/plugin-sdk'], `@immich/plugin-sdk@file://${root}/packages/plugin-sdk`);
  pkg.dependencies['@immich/plugin-sdk'] = 'verified-workspace-sdk';
}
for (const field of ['dependencies', 'optionalDependencies', 'type']) {
  assert.deepEqual(fixedPackage[field], originalPackage[field], `Runtime package mismatch: ${field}`);
}

// Refuse any schema change when composing the two independently built images.
const files = root => readdirSync(root, {recursive: true, withFileTypes: true})
  .filter(entry => entry.isFile())
  .map(entry => relative(root, join(entry.parentPath, entry.name))).sort();
const compareJavaScript = (originalRoot, fixedRoot) => {
  assert.deepEqual(files(originalRoot), files(fixedRoot));
  for (const file of files(originalRoot)) {
    // Source-map paths may differ between builders; executable code must match.
    if (file.endsWith('.js')) {
      assert.deepEqual(readFileSync(join(originalRoot, file)), readFileSync(join(fixedRoot, file)), `Executable differs: ${file}`);
    }
  }
};
const originalSdk = json(join(base, 'node_modules/@immich/plugin-sdk/package.json'));
const fixedSdk = json(join(patched, 'patched-plugin-sdk.json'));
assert.equal(originalSdk.version, fixedSdk.version);
assert.deepEqual(originalSdk.dependencies, fixedSdk.dependencies);
compareJavaScript(join(base, 'node_modules/@immich/plugin-sdk/dist'), join(patched, 'plugin-sdk-dist'));
compareJavaScript(join(base, 'dist/migrations'), join(patched, 'dist/migrations'));
console.log('v3.3.5 runtime dependencies and database migrations match; retaining ImageGenius native modules.');
