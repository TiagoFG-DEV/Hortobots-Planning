import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.tsx', import.meta.url), 'utf8');
const responsiveStyles = readFileSync(new URL('./responsive.css', import.meta.url), 'utf8');

describe('Home background', () => {
  it('mounts the neutral backdrop layer in the global background stack', () => {
    expect(mainSource).toContain('backdrop-layer backdrop-home');
  });

  it('activates fundo_neutro on the diary selection and credits screens', () => {
    expect(responsiveStyles).toContain("background-image: url('./assets/originals/fundo_neutro.png')");
    expect(responsiveStyles).toContain('#root:has(.cover) .backdrop-home');
    expect(responsiveStyles).toContain('#root:has(.credits) .backdrop-home { opacity: 1; }');
  });
});
