import { createContext, useContext, useState, type ReactNode } from 'react';
import { TEAMS, type TeamKey } from './teams';

const ThemeContext = createContext<{ team: TeamKey; setTeam: (value: TeamKey) => void }>({ team: 'fll', setTeam: () => {} });
export function TeamThemeProvider({ children }: { children: ReactNode }) {
  const [team, update] = useState<TeamKey>(() => {
    try { return localStorage.getItem('hortobots-fll-theme') === 'under' ? 'under' : 'fll'; } catch { return 'fll'; }
  });
  const setTeam = (value: TeamKey) => {
    const selected = value === 'under' ? 'under' : 'fll';
    update(selected);
    try { localStorage.setItem('hortobots-fll-theme', selected); } catch { /* Preference still works for this session. */ }
  };
  return <ThemeContext.Provider value={{ team, setTeam }}>{children}</ThemeContext.Provider>;
}
export const useTeamTheme = () => useContext(ThemeContext);
export function ThemePicker() {
  const { team, setTeam } = useTeamTheme();
  return <label className="theme-picker"><span>TEMA · FLL</span><select aria-label="Tema da equipe FLL" value={team} onChange={event => setTeam(event.target.value as TeamKey)}>
    <option value="fll">{TEAMS.fll.short}</option><option value="under">{TEAMS.under.short}</option>
  </select></label>;
}
