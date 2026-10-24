# ImageGenius-compatible Immich HDR CUDA image

Use `ghcr.io/harikiran-lab/immich:cuda` in place of
`ghcr.io/imagegenius/immich:cuda` on an **Immich v3.3.5** installation.
The immutable deployment tag is `sha-<full-recipe-commit>-cuda`;
`3.3.5-cuda-hdr` is also published.

## Compatibility

This image derives from the exact ImageGenius **3.3.5 CUDA** image pinned in
`Dockerfile.hdr`. It inherits `/init`, the s6 services, `PUID`/`PGID` handling,
the default web port **8080**, `/photos`, `/config`, `/libraries`, the bundled
CUDA machine-learning environment, and the model cache location. Keep all
existing volume mappings, ports, database/Redis variables, GPU parameters,
Docker mods and other ImageGenius settings. No extra ML container is required.

If you added `IMMICH_MEDIA_LOCATION=/data` or changed mappings for the earlier
standard-server image, restore your original ImageGenius template settings.
An explicit environment override takes precedence over this image's defaults.
Do not bypass mount checks or create replacement `.immich` markers for a
missing library mount.

## Changes and source

- Official Jellyfin FFmpeg **8.1.3-1**, Ubuntu Resolute AMD64, replaces FFmpeg 7.
  The download is SHA-256 pinned in `hdr/ffmpeg.json`. This includes the upstream
  [CUDA HLG reference-white correction](https://github.com/jellyfin/jellyfin-ffmpeg/issues/775).
- Compiled server and web files come from the verified image at
  [harikiran-lab/immich@081bc03](https://github.com/harikiran-lab/immich/commit/081bc03c1f48cbeb7bc633b3de1c23deba030f57),
  also pinned by image digest. That source adds bounded HDR frame-metadata
  recovery and original-first playback with one automatic fallback on a terminal
  network/decoding/unsupported-format media error. Playback position and intent
  are preserved. The menu stays in sync and the next asset tries the original again.
- Regenerated encoded files require cache validation. Playback URLs also bypass
  old cache entries, so a browser does not keep playing an old dark conversion
  after it has been regenerated. The thumbnail hash alone does not change when
  a video is encoded again. Unchanged cached bytes remain reusable after validation.
- Native Node dependencies, CLI, core plugins and machine learning stay from the
  ImageGenius image. No Debian libraries or Node modules are copied into Ubuntu.
  The build refuses mismatched runtime package dependencies or executable database
  migrations. There are no schema changes relative to v3.3.5.

The app-source workflow gates publication on regression tests, web type checks and
container HDR CPU checks. This recipe's workflow checks the inherited layout,
native Sharp, CUDA ONNX provider availability, HLG/PQ CPU conversion, and actual
API plus ML health using a new disposable database and Redis before publishing.
Hosted runners have no NVIDIA GPU; provider availability is not GPU inference
or a hardware video-decoding test.

## Use and rollback

1. Back up the existing database/library and preserve your original Unraid
   template plus current ImageGenius image digest. Keep both builds on v3.3.5.
2. Change only the repository field to `ghcr.io/harikiran-lab/immich:cuda`
   (prefer the immutable `sha-...-cuda` tag for deployment), keeping the original
   ImageGenius template values. Apply/recreate the container.
3. Existing browsers may retain an old preference. Enable **Account Settings →
   App Settings → Play original video** and reload the web app. Saved encoded
   copies are needed for fallback unless experimental real-time transcoding is
   enabled. This changes web playback, not official mobile apps.
4. Run the isolated GPU check before re-enabling hardware decoding:

   ```sh
   docker run --rm --gpus all --entrypoint node \
     ghcr.io/harikiran-lab/immich:cuda \
     /app/immich/server/bin/verify-hdr.mjs --cuda
   ```

   It mounts no library or database and compares NVDEC/CUDA/NVENC HLG/PQ
   luminance with CPU conversion. The recipe carries the synthetic verification
   script in `hdr/verify-hdr.mjs`, using 256×256 clips to meet NVDEC's minimum
   decoder dimensions. Regenerate previously dark encoded videos
   after validation, starting with one sample.
5. To roll back, stop this container and restore the saved ImageGenius image
   digest with the same original template. Run only one server against the
   database at a time. This is a packaging switch at v3.3.5, not a supported
   downgrade from a later Immich version. Restore backups if a future upgrade
   has changed the database.

## Publishing and maintenance

`Publish compatible HDR CUDA image` builds `Dockerfile.hdr` on changes to the
recipe, scripts or workflow, or via manual dispatch. It uses `GITHUB_TOKEN`
with package-write permission only in this publishing job. Other inherited
workflows are not needed. The original upstream Dockerfile remains available
for reference and full source builds; this publishing workflow uses the pinned
binary-composition recipe so the original ImageGenius CUDA runtime is preserved.

Update both pinned images deliberately and together. Rerun compatibility,
startup and HDR tests before publishing an update. The package does not
automatically track Immich releases. The inherited ImageGenius license and
Immich AGPL source/license are retained; application source is linked above.
