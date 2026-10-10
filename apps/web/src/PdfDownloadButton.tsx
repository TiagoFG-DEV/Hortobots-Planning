import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';

type PdfDownloadButtonProps = {
  item: Record<string, any>;
  kind: 'record' | 'test';
  team: 'fll' | 'under' | 'obr';
  resolveMediaUrl: (media: Record<string, any>) => string;
};

export function PdfDownloadButton({ item, kind, team, resolveMediaUrl }: PdfDownloadButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const download = async () => {
    if (state === 'loading') return;
    setState('loading');
    try {
      const { generateActivityPdf } = await import('./activityPdf');
      await generateActivityPdf({ item, kind, team, resolveMediaUrl });
      setState('idle');
    } catch (error) {
      console.error('[PDF] Não foi possível gerar o documento:', error);
      setState('error');
      window.setTimeout(() => setState('idle'), 4200);
    }
  };

  return (
    <button
      type="button"
      className="pdf-download-button"
      onClick={download}
      disabled={state === 'loading'}
      aria-live="polite"
    >
      {state === 'loading' ? <LoaderCircle className="pdf-download-spinner" size={17} /> : <Download size={17} />}
      {state === 'loading' ? 'Preparando PDF…' : state === 'error' ? 'Tentar novamente' : 'Baixar PDF'}
    </button>
  );
}
