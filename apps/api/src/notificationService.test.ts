import { afterEach, describe, expect, it, vi } from 'vitest';
import { emailHtml, importantEventManagementUrl, sendImportantEventEmail } from './notificationService.js';

const event = {
  id: 'a1b2c3d4',
  date: '2026-10-20',
  title: 'Reunião de estratégia',
  priority: 'URGENTE',
  status: 'PENDENTE',
  period: 'TARDE',
  lesson: '3ª e 4ª aulas',
  comments: 'Revisar as missões compartilhadas.'
};

afterEach(() => vi.unstubAllEnvs());

describe('important event email', () => {
  it('creates the management login deep link with the event preserved', () => {
    vi.stubEnv('PUBLIC_APP_URL', 'https://planner.example/');
    const url = importantEventManagementUrl(event);
    expect(url).toContain('https://planner.example/login?profile=gestao&returnTo=');
    expect(decodeURIComponent(url)).toContain('/calendario?date=2026-10-20&event=a1b2c3d4');
  });

  it('renders a fluid themed HTML email with description and action', () => {
    const html = emailHtml(event, importantEventManagementUrl(event));
    expect(html).toContain('name="viewport"');
    expect(html).toContain('max-width:640px');
    expect(html).toContain('Revisar as missões compartilhadas.');
    expect(html).toContain('Um novo evento foi enviado!');
    expect(html).toContain('VISUALIZAR EVENTO NA PLATAFORMA');
  });

  it('does not call Gmail when one of the three Mentor recipients is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await sendImportantEventEmail(event, {
      managementEmail: 'gestao@example.com', coordinationEmail: '', technicalEmail: 'tecnico@example.com'
    });
    expect(result.sent).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
