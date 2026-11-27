import React from 'react';
import { CheckCircle2, Download, Loader2, WifiOff, Trash2 } from 'lucide-react';
import { offlinePrefs, useMobileDataPreference, useOfflineMedia, useOnlineStatus } from './offlineStorage';

interface OfflineMediaButtonProps {
  url: string;
  name: string;
  compact?: boolean;
}

/**
 * Botão exibido junto à imagem/vídeo para baixar sob demanda quando houver internet,
 * ou indicar que o arquivo já está salvo localmente no dispositivo.
 */
export function OfflineMediaButton({ url, name, compact = false }: OfflineMediaButtonProps) {
  const { isOnline } = useOnlineStatus();
  const { mobileDataAllowed } = useMobileDataPreference();
  const canUseNetwork = isOnline && (mobileDataAllowed || !offlinePrefs.isOnCellular());
  const { downloaded, downloading, download, remove } = useOfflineMedia(url);

  if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (downloaded) {
      void remove();
    } else if (canUseNetwork && !downloading) {
      void download(name);
    }
  };

  if (downloaded) {
    return (
      <button
        type="button"
        className={`offline-media-btn saved ${compact ? 'compact' : ''}`}
        onClick={handleClick}
        title="Salvo para visualização sem Wi-Fi (clique para remover do cache local)"
      >
        <CheckCircle2 size={13} />
        <span>{compact ? 'Offline' : 'Salvo offline'}</span>
        {!compact && <Trash2 size={11} className="offline-media-remove-icon" />}
      </button>
    );
  }

  if (!canUseNetwork) {
    return (
      <span
        className={`offline-media-btn unavailable ${compact ? 'compact' : ''}`}
        title={isOnline ? 'Modo Somente Wi-Fi ativo. Conecte-se ao Wi-Fi para baixar.' : 'Conecte-se ao Wi-Fi para baixar esta mídia'}
      >
        <WifiOff size={13} />
        <span>{compact ? (isOnline ? 'Só Wi-Fi' : 'Sem Wi-Fi') : (isOnline ? 'Somente Wi-Fi' : 'Não baixado')}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`offline-media-btn download ${compact ? 'compact' : ''}`}
      onClick={handleClick}
      disabled={downloading}
      title="Baixar imagem/vídeo para visualizar mesmo sem Wi-Fi"
    >
      {downloading ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
      <span>{downloading ? 'Baixando...' : 'Baixar'}</span>
    </button>
  );
}

interface OfflineAwareMediaProps {
  url: string;
  name: string;
  isVideo: boolean;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  loading?: 'lazy' | 'eager';
}

/**
 * Renderiza imagem ou vídeo usando o Blob local quando salvo offline,
 * ou exibe aviso claro quando estiver sem Wi-Fi e a mídia não tiver sido baixada.
 */
export function OfflineAwareMedia({
  url,
  name,
  isVideo,
  controls,
  autoPlay,
  muted,
  playsInline,
  preload = 'metadata',
  loading = 'lazy'
}: OfflineAwareMediaProps) {
  const { isOnline } = useOnlineStatus();
  const { mobileDataAllowed } = useMobileDataPreference();
  const canUseNetwork = isOnline && (mobileDataAllowed || !offlinePrefs.isOnCellular());
  const { downloaded, localUrl } = useOfflineMedia(url);

  const effectiveSrc = localUrl || (canUseNetwork ? url : '');

  if (!effectiveSrc && !downloaded) {
    return (
      <div className="offline-media-placeholder">
        <WifiOff size={20} />
        <span>
          {isOnline
            ? 'Mídia bloqueada no modo Somente Wi-Fi. Conecte-se ao Wi-Fi para visualizar.'
            : 'Mídia não baixada. Conecte-se ao Wi-Fi para baixar.'}
        </span>
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        src={effectiveSrc}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        preload={preload}
      />
    );
  }

  return <img src={effectiveSrc} alt={name} loading={loading} />;
}
