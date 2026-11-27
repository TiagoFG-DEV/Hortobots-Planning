import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Leaf, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { AccountUser } from '@hortobots/shared/permissions';
import { SESI_BIOGLOW_PORTAL } from './teamPortals';
import { SeasonProjectView } from './SeasonProjectView';
import './seasonProject.css';

const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;

function connectedPortalUrl() {
  const url = new URL(SESI_BIOGLOW_PORTAL.bundledPath, window.location.origin);
  url.searchParams.set('plannerUrl', window.location.origin);
  url.searchParams.set('plannerApi', apiBase);
  url.searchParams.set('integration', 'planner');
  return url.href;
}

export function TeamPortalFrame({
  user = null,
  initialTab = 'portal'
}: {
  user?: AccountUser | null;
  initialTab?: 'portal' | 'projeto';
}) {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState<'portal' | 'projeto'>(initialTab);
  const [reloadKey, setReloadKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const portalUrl = useMemo(connectedPortalUrl, [reloadKey]);
  const portalOrigin = useMemo(() => new URL(portalUrl).origin, [portalUrl]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab !== 'portal') return;
    setReady(false);
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 12000);
    const receive = (event: MessageEvent) => {
      if (event.origin !== portalOrigin || event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'hortobots-bioglow:ready') {
        window.clearTimeout(timer);
        setReady(true);
      }
      if (event.data?.type === 'hortobots-bioglow:open-season-project') {
        navigate(`${SESI_BIOGLOW_PORTAL.route}/projeto`);
      }
      if (event.data?.type === 'hortobots-bioglow:navigate-planner') {
        const targetPath = event.data?.path || event.data?.url || '/';
        navigate(targetPath.startsWith('http') ? new URL(targetPath).pathname : targetPath);
      }
      if (event.data?.type === 'hortobots-bioglow:navigate') {
        const targetPath = event.data?.path || event.data?.url;
        if (targetPath) {
          navigate(targetPath.startsWith('http') ? new URL(targetPath).pathname : targetPath);
        }
      }
    };
    window.addEventListener('message', receive);
    return () => { window.clearTimeout(timer); window.removeEventListener('message', receive); };
  }, [activeTab, navigate, portalOrigin, reloadKey]);

  const reload = useCallback(() => setReloadKey(value => value + 1), []);

  return <main className="team-portal-host page-transition">
    <header className="team-portal-toolbar">
      {activeTab === 'projeto' ? (
        <Link to={SESI_BIOGLOW_PORTAL.route} className="team-portal-return"><ArrowLeft /> <span>Voltar ao Portal BIOGLOW</span></Link>
      ) : (
        <Link to="/" className="team-portal-return"><ArrowLeft /> <span>Voltar ao Planner</span></Link>
      )}
      <div className="team-portal-brand">
        <Leaf />
        <span>
          <strong>{activeTab === 'projeto' ? 'Projeto da Temporada' : 'Hortobots BIOGLOW'}</strong>
          <small>{activeTab === 'projeto' ? 'The Beezy Box · SESI Hortobots FLL' : 'Site independente do SESI Hortobots FLL'}</small>
        </span>
      </div>
    </header>
    {activeTab === 'portal' ? (
      <>
        <iframe
          key={reloadKey}
          ref={iframeRef}
          className={ready ? 'ready' : ''}
          src={portalUrl}
          title="Portal Hortobots BIOGLOW"
          onLoad={() => window.setTimeout(() => setReady(true), 180)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-top-navigation-by-user-activation"
          allow="fullscreen"
        />
        {!ready && <div className="team-portal-loading" role="status">
          <Leaf />
          <strong>{slow ? 'O portal está demorando para responder.' : 'Abrindo portal da equipe…'}</strong>
          {slow && <><span>Confira se o BIOGLOW está publicado ou abra a versão externa.</span><button type="button" onClick={reload}><RefreshCw /> Tentar novamente</button></>}
        </div>}
      </>
    ) : (
      <SeasonProjectView user={user} />
    )}
  </main>;
}
