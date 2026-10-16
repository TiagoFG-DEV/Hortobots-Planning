import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Leaf, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SESI_BIOGLOW_PORTAL } from './teamPortals';

const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;

function connectedPortalUrl() {
  const url = new URL(SESI_BIOGLOW_PORTAL.bundledPath, window.location.origin);
  url.searchParams.set('plannerUrl', window.location.origin);
  url.searchParams.set('plannerApi', apiBase);
  url.searchParams.set('integration', 'planner');
  return url.href;
}

export function TeamPortalFrame() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const portalUrl = useMemo(connectedPortalUrl, [reloadKey]);
  const portalOrigin = useMemo(() => new URL(portalUrl).origin, [portalUrl]);

  useEffect(() => {
    setReady(false);
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 12000);
    const receive = (event: MessageEvent) => {
      if (event.origin !== portalOrigin || event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'hortobots-bioglow:ready') {
        window.clearTimeout(timer);
        setReady(true);
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
  }, [navigate, portalOrigin, reloadKey]);

  const reload = useCallback(() => setReloadKey(value => value + 1), []);

  return <main className="team-portal-host page-transition">
    <header className="team-portal-toolbar">
      <Link to="/" className="team-portal-return"><ArrowLeft /> <span>Voltar ao Planner</span></Link>
      <div><Leaf /><span><strong>Hortobots BIOGLOW</strong><small>Site independente do SESI Hortobots FLL</small></span></div>
    </header>
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
  </main>;
}
