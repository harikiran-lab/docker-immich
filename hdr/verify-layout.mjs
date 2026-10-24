import assert from 'node:assert/strict';
import {accessSync, constants, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

assert.equal(process.env.IMMICH_MEDIA_LOCATION, '/photos');
assert.equal(process.env.HOME, '/config');
assert.equal(process.env.DEVICE, 'cuda');
assert.equal(process.env.IMMICH_MACHINE_LEARNING_URL, 'http://127.0.0.1:3003');
assert.equal(process.env.MACHINE_LEARNING_CACHE_FOLDER, '/config/machine-learning/models');
for (const service of ['svc-server', 'svc-microservices', 'svc-machine-learning']) {
  accessSync(`/etc/s6-overlay/s6-rc.d/${service}/run`, constants.X_OK);
}
accessSync('/init', constants.X_OK);
assert.match(readFileSync('/etc/s6-overlay/s6-rc.d/svc-server/run', 'utf8'), /SERVER_PORT:-"8080"/);
assert.match(readFileSync('/app/immich/server/dist/repositories/media.repository.js', 'utf8'), /probeFrameColors/);
assert.match(readFileSync('/app/immich/server/dist/services/asset-media.service.js', 'utf8'), /CacheControl\.PrivateWithoutCache/);
accessSync('/app/immich/data/www/index.html');
accessSync('/app/immich/machine-learning/immich_ml/main.py');
const require = createRequire('/app/immich/server/package.json');
const sharp = require('sharp');
await sharp({create:{width:2,height:2,channels:3,background:'#888888'}}).png().toBuffer();
console.log('ImageGenius storage, s6 services, CUDA ML defaults, web files and native sharp verified.');
