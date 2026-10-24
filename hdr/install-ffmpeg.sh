#!/bin/bash
set -euo pipefail

. /etc/os-release
test "$VERSION_CODENAME" = resolute
test "$(dpkg --print-architecture)" = amd64
metadata=/opt/immich-hdr/ffmpeg.json
version=$(node -p "JSON.parse(require('fs').readFileSync('$metadata')).version")
checksum=$(node -p "JSON.parse(require('fs').readFileSync('$metadata')).sha256")
url="https://github.com/jellyfin/jellyfin-ffmpeg/releases/download/v${version}/jellyfin-ffmpeg8_${version}-resolute_amd64.deb"
curl --fail --location --retry 3 --output /tmp/immich-hdr-ffmpeg.deb "$url"
echo "$checksum  /tmp/immich-hdr-ffmpeg.deb" | sha256sum --check -
apt-get update
apt-get install --yes --no-install-recommends /tmp/immich-hdr-ffmpeg.deb
ldconfig /usr/lib/jellyfin-ffmpeg/lib
ffmpeg -version
ffprobe -version
node --input-type=module <<'JS'
import fs from 'node:fs';
const path = '/app/immich/data/build-lock.json';
const lock = JSON.parse(fs.readFileSync(path));
const fixed = JSON.parse(fs.readFileSync('/opt/immich-hdr/ffmpeg.json'));
if (!lock.packages.some(p => p.name === 'ffmpeg')) throw new Error('FFmpeg build-lock entry missing');
lock.packages = lock.packages.map(p => p.name === 'ffmpeg' ? {...p, ...fixed} : p);
fs.writeFileSync(path, JSON.stringify(lock, null, 2));
JS
rm /tmp/immich-hdr-ffmpeg.deb
apt-get clean
rm -rf /var/lib/apt/lists/*
