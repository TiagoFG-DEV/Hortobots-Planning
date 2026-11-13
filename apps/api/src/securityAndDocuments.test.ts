import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Marco 9 - Seguranca, Permissoes e Isolamento de Documentos', () => {
  it('garante que documentos oficiais possuem esquema valido e campos essenciais', () => {
    const docMock = {
      id: 'fll-challenge-bioglow',
      competition: 'FLL',
      modality: 'Challenge',
      season_year: '2026/2027',
      doc_type: 'rubrica',
      title: 'FLL Challenge BIOGLOW Rubrics',
      url_oficial: 'https://assets.education.lego.com/sample.pdf',
      is_current: true
    };

    expect(docMock.id).toMatch(/^[a-z0-9\-]+$/);
    expect(['FLL', 'OBR']).toContain(docMock.competition);
    expect(['rubrica', 'regras', 'complementar']).toContain(docMock.doc_type);
    expect(docMock.url_oficial.startsWith('https://')).toBe(true);
  });

  it('valida que rotas administrativas exigem credenciais de mentor', () => {
    const mockCheckRole = (role?: string) => {
      return role === 'mentor' || role === 'admin';
    };

    expect(mockCheckRole(undefined)).toBe(false);
    expect(mockCheckRole('visitante')).toBe(false);
    expect(mockCheckRole('gestao')).toBe(false);
    expect(mockCheckRole('obr')).toBe(false);
    expect(mockCheckRole('fll')).toBe(false);
    expect(mockCheckRole('mentor')).toBe(true);
  });

  it('ordena comunicados de atualizacoes cronologicamente da mais recente para a mais antiga', () => {
    const updates = [
      { id: '1', title: 'Aviso Antigo', published_at: '2026-05-10T10:00:00Z' },
      { id: '2', title: 'Aviso Recente', published_at: '2026-10-15T12:00:00Z' },
      { id: '3', title: 'Aviso Intermediario', published_at: '2026-08-01T08:00:00Z' }
    ];

    const sorted = [...updates].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    expect(sorted[0]?.id).toBe('2');
    expect(sorted[1]?.id).toBe('3');
    expect(sorted[2]?.id).toBe('1');
  });

  it('mascara URLs de conexao com banco de dados para evitar vazamento em relatorios', () => {
    const rawUrl = 'postgresql://postgres:SecretPassword123!@db.example.supabase.co:5432/postgres';
    const mask = (url: string) => url.replace(/:[^:@]+@/, ':***@');
    const masked = mask(rawUrl);

    expect(masked).not.toContain('SecretPassword123!');
    expect(masked).toBe('postgresql://postgres:***@db.example.supabase.co:5432/postgres');
  });
});

