import sharp from 'sharp'; import { mkdir } from 'node:fs/promises'; import { join } from 'node:path';
const src='apps/web/src/assets/originals', out='apps/web/src/assets/generated'; await mkdir(out,{recursive:true});
for(const width of [1280,1920]) await sharp(join(src,'fundo.png')).resize({width,withoutEnlargement:true}).webp({quality:78}).toFile(join(out,`fundo-${width}.webp`));
for(const width of [1280,1920]) await sharp(join(src,'fundo_obr.png')).resize({width,withoutEnlargement:true}).webp({quality:78}).toFile(join(out,`fundo-obr-${width}.webp`));
for(const [name,width] of [['Logo.png',640],['novo_registro_button.png',960],['registros_salvos_button.png',960],['fll_team_logo.png',480],['obr_team_logo.png',480],['mascote.png',720]]) await sharp(join(src,name)).resize({width,withoutEnlargement:true}).webp({quality:84}).toFile(join(out,name.replace('.png','.webp')));
for(const [name,width] of [['fll_book.png',720],['obr_book.png',720]]) await sharp(join(src,name)).resize({width,withoutEnlargement:true}).webp({quality:86}).toFile(join(out,name.replace('.png','.webp')));
for(const size of [16,32,180,192,512]) await sharp(join(src,'icon.png')).resize(size,size,{fit:'cover'}).png().toFile(join(out,`icon-${size}.png`));
