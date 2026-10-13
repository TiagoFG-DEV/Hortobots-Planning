const compactTeamValue = (value: unknown) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

/**
 * Public BIOGLOW data is deliberately limited to the SESI Hortobots FLL
 * notebook. Legacy records did not always persist an explicit team, so an
 * FLL item is treated as SESI Hortobots unless it carries an Under
 * Construction marker.
 */
export const belongsToSesiHortobotsFll = (item: unknown) => {
  const candidate = item as { modality?: unknown; team?: unknown; tags?: unknown } | null;
  if (String(candidate?.modality || '').toUpperCase() !== 'FLL') return false;

  const tags = Array.isArray(candidate?.tags) ? candidate.tags : [];
  const labels = [candidate?.team, ...tags].map(compactTeamValue);
  return !labels.some(label => label.includes('underconstruction'));
};
