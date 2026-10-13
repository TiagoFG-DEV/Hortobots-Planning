export type TeamPortal = {
  id: 'sesi-hortobots-bioglow';
  team: 'fll';
  label: string;
  description: string;
  route: string;
  externalUrl: string;
};

const bioglowUrl = import.meta.env.VITE_BIOGLOW_URL || (
  import.meta.env.DEV
    ? 'http://localhost:4174/'
    : 'https://hortobots.github.io/BIOGLOW-site/'
);

// Registry intentionally contains only portals that actually exist. Future team
// sites can be connected without coupling their source or release cycle to Planner.
export const TEAM_PORTALS: readonly TeamPortal[] = [{
  id: 'sesi-hortobots-bioglow',
  team: 'fll',
  label: 'Hortobots BIOGLOW',
  description: 'Missões, estratégia e acervo do SESI Hortobots FLL',
  route: '/portal/sesi-hortobots',
  externalUrl: bioglowUrl
}];

export const SESI_BIOGLOW_PORTAL = TEAM_PORTALS[0]!;
