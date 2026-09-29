import { compareVersions, releaseAssetUrl } from '../../scripts/release-guard.mjs';

/** La 3.9.2 est publiée : la page Installation propose son tag, qui ne bouge plus. */
export const INSTALL_REF = 'v3.9.2';
export const INSTALL_REF_KIND: 'branch' | 'tag' = 'tag';

/* LIV-05 — Les releases portent une archive construite (`npm pack`) à partir
   de la 3.9.0. Les tags antérieurs n'en ont pas : proposer son adresse
   donnerait une commande morte. */
export const FIRST_ARCHIVE_VERSION = '3.9.0';

/** L'adresse de l'archive construite pour `ref`, ou `null` si la release n'en porte pas. */
export function releaseArchiveUrl(ref: string, kind: 'branch' | 'tag' = 'tag'): string | null {
  if (kind !== 'tag' || !/^v\d+\.\d+\.\d+$/.test(ref)) return null;
  const version = ref.slice(1);
  if (compareVersions(version, FIRST_ARCHIVE_VERSION) < 0) return null;
  return releaseAssetUrl(ref, version);
}
