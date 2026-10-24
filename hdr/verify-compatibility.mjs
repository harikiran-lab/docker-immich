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
for (const field of ['dependencies', 'optionalDependencies', 'type']) {
  assert.deepEqual(fixedPackage[field], originalPackage[field], `Runtime package mismatch: ${field}`);
}

// Refuse any schema change when composing the two independently built images.
const files = root => readdirSync(root, {recursive: true, withFileTypes: true})
  .filter(entry => entry.isFile())
  .map(entry => relative(root, join(entry.parentPath, entry.name))).sort();
const originalMigrations = join(base, 'dist/migrations');
const fixedMigrations = join(patched, 'dist/migrations');
assert.deepEqual(files(originalMigrations), files(fixedMigrations));
for (const file of files(originalMigrations)) {
  // Source-map paths may differ between builders; executable migrations must match.
  if (file.endsWith('.js')) {
    assert.deepEqual(readFileSync(join(originalMigrations, file)), readFileSync(join(fixedMigrations, file)), `Migration differs: ${file}`);
  }
}
console.log('v3.3.5 runtime dependencies and database migrations match; retaining ImageGenius native modules.');
