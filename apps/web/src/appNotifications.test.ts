import { describe, expect, it } from 'vitest';
import {
  detectNewNotifications,
  parseBiologyRssItems,
  type SyncSnapshots
} from './appNotifications';

describe('appNotifications', () => {
  it('saves silent baseline on first run without emitting notifications', () => {
    const snapshots: SyncSnapshots = {
      registros: [{ id: 'reg-1', title: 'Montagem base', tags: ['fll'] }],
      testes: [{ id: 'tst-1', title: 'Teste M01', tags: ['fll'] }],
      eventos: [{ id: 'ev-1', title: 'Treino', date: '2026-11-30' }],
      feedbacks: [{ id: 'fb-1', author: 'Mentor', message: 'Bom trabalho' }],
      documentos: [{ id: 'doc-1', title: 'Manual FLL', updatedAt: '2026-11-01' }],
      atualizacoes: [{ id: 'upd-1', title: 'Regra 01' }],
      seasonProject: {
        article: { sections: [{ id: 'sec-1', title: 'Projeto', updatedAt: '2026-11-01' }] },
        tests: [{ id: 'st-1', title: 'Campo #1', date: '2026-11-10' }]
      },
      biologyFeeds: [
        {
          feed: 'nature',
          xml: `<rss><channel><item><title><![CDATA[Bees and acoustics]]></title><guid>g-1</guid></item></channel></rss>`
        }
      ]
    };

    const { notifications, nextBaseline } = detectNewNotifications(snapshots, null);
    expect(notifications).toHaveLength(0);
    expect(nextBaseline.registros).toEqual(['reg-1']);
    expect(nextBaseline.biologyItems).toEqual(['nature:g-1']);
  });

  it('detects new records, tests, events, comments, rule updates and BIOGLOW biology research', () => {
    const initial: SyncSnapshots = {
      registros: [{ id: 'reg-1', title: 'Antigo', tags: ['fll'] }],
      testes: [{ id: 'tst-1', title: 'Teste 1', tags: ['fll'] }],
      eventos: [{ id: 'ev-1', title: 'Treino 1', date: '2026-11-20' }],
      feedbacks: [{ id: 'fb-1', author: 'Mentor', message: 'Ok' }],
      documentos: [{ id: 'doc-1', title: 'Manual FLL', updatedAt: '2026-11-01' }],
      atualizacoes: [{ id: 'upd-1', title: 'Update 1' }],
      seasonProject: {
        article: { sections: [{ id: 'sec-1', title: 'Projeto', updatedAt: '2026-11-01' }] },
        tests: [{ id: 'st-1', title: 'Campo 1', date: '2026-11-10' }]
      },
      biologyFeeds: [
        {
          feed: 'biology',
          xml: `<rss><channel><item><title>Old bio study</title><guid>bio-1</guid></item></channel></rss>`
        }
      ]
    };

    const { nextBaseline: baseline } = detectNewNotifications(initial, null);

    const updated: SyncSnapshots = {
      registros: [...initial.registros!, { id: 'reg-2', title: 'Nova garra', author: 'Ana', tags: ['obr'] }],
      testes: [...initial.testes!, { id: 'tst-2', title: 'Round #05', tags: ['fll'], date: '2026-11-27' }],
      eventos: [...initial.eventos!, { id: 'ev-2', title: 'Torneio Regional', date: '2026-12-05', priority: 'URGENTE' }],
      feedbacks: [...initial.feedbacks!, { id: 'fb-2', author: 'Técnica', message: 'Revisar sensor de cor' }],
      documentos: [{ id: 'doc-1', title: 'Manual FLL v2', updatedAt: '2026-11-27' }],
      atualizacoes: [...initial.atualizacoes!, { id: 'upd-2', title: 'Mudança na missão M09' }],
      seasonProject: {
        article: { sections: [{ id: 'sec-1', title: 'Projeto', updatedAt: '2026-11-27' }] },
        tests: [...initial.seasonProject!.tests!, { id: 'st-2', title: 'Campo 2 Jataí', date: '2026-11-27' }]
      },
      biologyFeeds: [
        {
          feed: 'biology',
          xml: `<rss><channel>
            <item><title>Stingless bee acoustic pollination discovery</title><guid>bio-2</guid></item>
            <item><title>Old bio study</title><guid>bio-1</guid></item>
          </channel></rss>`
        }
      ]
    };

    const { notifications, nextBaseline } = detectNewNotifications(updated, baseline);
    const categories = notifications.map(n => n.category);

    expect(categories).toContain('registro');
    expect(categories).toContain('teste');
    expect(categories).toContain('evento');
    expect(categories).toContain('comentario');
    expect(categories).toContain('documento');
    expect(categories).toContain('bioglow');
    expect(notifications.some(n => n.route === '/obr/registro/reg-2')).toBe(true);
    expect(notifications.some(n => n.title.includes('[URGENTE]'))).toBe(true);
    expect(notifications.some(n => n.route === '/equipe/sesi-hortobots-fll/projeto')).toBe(true);
    expect(notifications.some(n => n.body.includes('Stingless bee acoustic pollination discovery'))).toBe(true);

    // Re-running with same snapshot emits zero duplicate notifications
    const secondPass = detectNewNotifications(updated, nextBaseline);
    expect(secondPass.notifications).toHaveLength(0);
  });

  it('parses RSS biology items stripping CDATA and HTML tags', () => {
    const xml = `<rss><channel>
      <item><title><![CDATA[<b>New</b> Bee Research]]></title><link>https://example.com/1</link></item>
      <item><title>Second Study</title><guid>id-2</guid></item>
    </channel></rss>`;
    const parsed = parseBiologyRssItems(xml, 'research');
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.title).toBe('New Bee Research');
    expect(parsed[1]?.id).toBe('research:id-2');
  });
});
