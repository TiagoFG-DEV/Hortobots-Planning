export type TeamPortal = {
  id: 'sesi-hortobots-bioglow';
  team: 'fll';
  label: string;
  description: string;
  route: string;
  bundledPath: string;
};

// Registry intentionally contains only portals that actually exist. Future team
// sites can be connected without coupling their source or release cycle to Planner.
export const TEAM_PORTALS: readonly TeamPortal[] = [{
  id: 'sesi-hortobots-bioglow',
  team: 'fll',
  label: 'Hortobots BIOGLOW',
  description: 'Missões, estratégia e acervo do SESI Hortobots FLL',
  route: '/portal/sesi-hortobots',
  bundledPath: '/bioglow/index.html'
}];

export const SESI_BIOGLOW_PORTAL = TEAM_PORTALS[0]!;
