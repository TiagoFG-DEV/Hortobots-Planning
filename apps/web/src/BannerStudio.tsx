import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import type { AccountUser } from '@hortobots/shared/permissions';
import { canManageBanner } from '@hortobots/shared/permissions';
import { API, api } from './client';
import { TEAMS, type TeamKey } from './teams';

type BannerContent = {
  kicker: string; title: string; subtitle: string; problem: string;
  research: string[]; innovation: string[]; learning: string[]; robotDesign: string[]; footer: string;
};
type Banner = {
  teamKey: TeamKey; widthCm: number; heightCm: number; problemQuestion: string;
  content: BannerContent; version: number; updatedAt: string; sources?: { generatedBy?: string };
};

const toDataUrl = (file: File) => new Promise<{ name: string; type: string; data: string }>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ name: file.name, type: file.type, data: String(reader.result || '') });
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export function BannerStudio({ teamKey, user }: { teamKey: TeamKey; user: AccountUser }) {
  const team = TEAMS[teamKey];
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [problemQuestion, setProblemQuestion] = useState('');
  const [widthCm, setWidthCm] = useState(90);
  const [heightCm, setHeightCm] = useState(120);
  const [researchFiles, setResearchFiles] = useState<File[]>([]);
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const canManage = canManageBanner(user, team.modality);

  useEffect(() => {
    api(`/api/banners/${teamKey}`)
      .then(value => {
        setBanner(value); setProblemQuestion(value.problemQuestion); setWidthCm(value.widthCm); setHeightCm(value.heightCm);
      })
      .catch(() => setBanner(null))
      .finally(() => setLoading(false));
  }, [teamKey]);

  const aspect = useMemo(() => ({ aspectRatio: `${widthCm} / ${heightCm}` }), [widthCm, heightCm]);

  const save = async (update: boolean) => {
    if (problemQuestion.trim().length < 10) { setStatus('Descreva a pergunta-problema com pelo menos 10 caracteres.'); return; }
    setSaving(true); setStatus('Lendo documentos e sintetizando o conteúdo...');
    try {
      const [researchPayload, designPayload] = await Promise.all([
        Promise.all(researchFiles.map(toDataUrl)), Promise.all(designFiles.map(toDataUrl))
      ]);
      const created = await api(`/api/banners/${teamKey}`, {
        method: update ? 'PUT' : 'POST',
        body: JSON.stringify({ problemQuestion, widthCm, heightCm, researchFiles: researchPayload, designFiles: designPayload })
      });
      setBanner(created); setResearchFiles([]); setDesignFiles([]);
      const action = update ? 'atualizado' : 'criado';
      setStatus(created.sources?.generatedBy === 'openai' ? `Banner ${action} com síntese por IA.` : `Banner ${action} com síntese local; configure OPENAI_API_KEY para usar IA.`);
    } catch (error) {
      setStatus((error as Error).message);
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    try {
      await api(`/api/banners/${teamKey}`, { method: 'DELETE' });
      setBanner(null); setConfirmDelete(false); setStatus('Banner excluído. Um novo modelo poderá ser criado.');
    } catch (error) { setStatus((error as Error).message); }
    finally { setSaving(false); }
  };

  if (loading) return <main className="content"><p className="empty-public">Carregando estúdio de banner...</p></main>;
  return <main className="content banner-studio page-transition">
    <header className="banner-studio-head"><div><span className="kicker">CANVA • ELEMENTOS EDITÁVEIS</span><h1>Banner A × B</h1><p>{team.label}</p></div><Sparkles size={42} /></header>
    <div className="banner-studio-grid">
      <section className="banner-controls">
        <label>Pergunta-problema
          <textarea rows={4} value={problemQuestion} disabled={!canManage} onChange={event => setProblemQuestion(event.target.value)} placeholder="Qual problema a equipe investigou e por que ele importa?" />
        </label>
        <div className="two">
          <label>Largura A (cm)<input type="number" min="20" max="142" value={widthCm} disabled={!canManage} onChange={event => setWidthCm(Number(event.target.value))} /></label>
          <label>Altura B (cm)<input type="number" min="20" max="142" value={heightCm} disabled={!canManage} onChange={event => setHeightCm(Number(event.target.value))} /></label>
        </div>
        {canManage && <>
          <label className="banner-file-field"><FileText size={18} /> Projeto de pesquisa
            <input type="file" multiple accept=".pdf,.docx,.txt,.md" onChange={event => setResearchFiles(Array.from(event.target.files || []))} />
            <small>{researchFiles.length ? researchFiles.map(file => file.name).join(', ') : 'PDF, Word ou texto'}</small>
          </label>
          <label className="banner-file-field"><FileText size={18} /> Design do robô
            <input type="file" multiple accept=".pdf,.docx,.xlsx,.xlsm,.csv,.txt" onChange={event => setDesignFiles(Array.from(event.target.files || []))} />
            <small>{designFiles.length ? designFiles.map(file => file.name).join(', ') : 'Testes do caderno + Word, Excel, PDF ou texto'}</small>
          </label>
        </>}
        <p className="banner-help">A síntese prioriza a pergunta-problema, depois a documentação de pesquisa e por fim os testes e anexos de design. O conteúdo enviado à IA é compactado para reduzir tokens.</p>
        {!banner && canManage && <button className="button" disabled={saving} onClick={() => save(false)}><Sparkles size={18} /> {saving ? 'CRIANDO...' : 'CRIAR BANNER'}</button>}
        {banner && <div className="banner-actions">
          {canManage && <button className="button" disabled={saving} onClick={() => save(true)}><RefreshCw size={18} /> {saving ? 'ATUALIZANDO...' : 'ATUALIZAR BANNER'}</button>}
          {canManage && <button className={`banner-delete ${confirmDelete ? 'confirming' : ''}`} disabled={saving} onClick={remove}><Trash2 size={17} /> {confirmDelete ? 'CONFIRMAR EXCLUSÃO' : 'EXCLUIR BANNER'}</button>}
        </div>}
        {banner && <a className="banner-download" href={`${API}/api/banners/${teamKey}/canva`}><Download size={18} /> Baixar modelo editável para o Canva (.pptx)</a>}
        {confirmDelete && <button className="banner-cancel-delete" onClick={() => setConfirmDelete(false)}>Cancelar exclusão</button>}
        {status && <p className="banner-status" role="status">{status}</p>}
      </section>
      <section className="banner-preview-shell" aria-label="Prévia do banner">
        {banner ? <article className="banner-preview" data-team={teamKey} style={aspect}>
          <header><small>{banner.content.kicker}</small><h2>{banner.content.title}</h2><p>{banner.content.subtitle}</p></header>
          <div className="banner-problem"><span>PERGUNTA-PROBLEMA</span><strong>{banner.content.problem}</strong></div>
          <div className="banner-preview-grid">
            {[['PESQUISA', banner.content.research], ['INOVAÇÃO', banner.content.innovation], ['NOVOS CONHECIMENTOS', banner.content.learning], ['DESIGN DO ROBÔ', banner.content.robotDesign]].map(([title, items]) => <section key={title as string}><h3>{title as string}</h3><ul>{(items as string[]).map(item => <li key={item}>{item}</li>)}</ul></section>)}
          </div>
          <footer>{banner.content.footer}<small>Versão {banner.version}</small></footer>
        </article> : <div className="banner-empty"><Sparkles size={46} /><h2>O banner ainda não foi criado</h2><p>Preencha a pergunta-problema para transformar o caderno da equipe em uma narrativa visual.</p></div>}
      </section>
    </div>
  </main>;
}
