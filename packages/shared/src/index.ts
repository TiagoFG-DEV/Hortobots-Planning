import { z } from 'zod';

export const MODALITIES = ['FLL', 'OBR'] as const;
export const TAGS = ['programacao','eletronica','mecanica','estrategia','pesquisa','treino','competicao','reuniao','documentacao','problema','solucao'] as const;
export const modalitySchema = z.enum(MODALITIES);
export type Modality = z.infer<typeof modalitySchema>;
const dateSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).refine(value => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day || year < 2000 || year > 2100) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}, 'Data inválida');
const markSchema = z.discriminatedUnion('type', [z.object({type:z.literal('bold')}),z.object({type:z.literal('italic')}),z.object({type:z.literal('underline')}),z.object({type:z.literal('code')}),z.object({type:z.literal('link'),href:z.string().url().refine(v=>/^(https?:|mailto:)/.test(v))})]);
export const inlineSchema = z.discriminatedUnion('type', [z.object({type:z.literal('text'),text:z.string().min(1).max(5000),marks:z.array(markSchema).optional()}),z.object({type:z.literal('break')})]);
const content = z.array(inlineSchema);
const base = z.object({id:z.string().regex(/^[a-z0-9]{10}$/)});
export const blockSchema = z.union([
  base.extend({type:z.literal('heading'),level:z.union([z.literal(2),z.literal(3)]),content}),
  base.extend({type:z.literal('paragraph'),content}), base.extend({type:z.literal('list'),ordered:z.boolean(),items:z.array(content)}),
  base.extend({type:z.literal('quote'),content,cite:z.string().optional()}), base.extend({type:z.literal('divider')}),
  base.extend({type:z.literal('image'),mediaId:z.string(),width:z.enum(['full','half'])}),
  base.extend({type:z.literal('video'),source:z.literal('upload'),mediaId:z.string()}),
  base.extend({type:z.literal('video'),source:z.literal('external'),provider:z.enum(['youtube','vimeo']),url:z.string().url(),caption:z.string().optional()}),
  base.extend({type:z.literal('table'),header:z.boolean(),rows:z.array(z.array(content)).max(20)}),
  base.extend({type:z.literal('callout'),variant:z.enum(['observation','problem','solution','decision']),title:z.string().optional(),content}),
  base.extend({type:z.literal('code'),language:z.string().optional(),text:z.string().max(20000)})
]);
export const mediaSchema = z.object({id:z.string().regex(/^[a-z0-9]{10}$/),kind:z.enum(['image','video']),path:z.string(),thumbPath:z.string().optional(),originalName:z.string(),mime:z.string(),size:z.number().nonnegative(),width:z.number().optional(),height:z.number().optional(),durationSec:z.number().optional(),uploadedAt:z.string().datetime(),caption:z.string().optional(),alt:z.string().optional()});
export const recordDocumentSchema = z.object({id:z.string().regex(/^[a-f0-9]{8}$/),version:z.literal(1),status:z.literal('published'),modality:modalitySchema,date:dateSchema,title:z.string().min(3).max(140),summary:z.string().max(500),tags:z.array(z.enum(TAGS)).max(8),author:z.object({name:z.string().min(2).max(80)}),coverMediaId:z.string().nullable(),content:z.array(blockSchema).max(500),media:z.array(mediaSchema),gallery:z.array(z.string()),createdAt:z.string().datetime(),updatedAt:z.string().datetime()}).superRefine((doc,ctx)=>{const ids=new Set(doc.media.map(m=>m.id)); for(const id of doc.gallery) if(!ids.has(id)) ctx.addIssue({code:'custom',message:'Mídia da galeria não encontrada'}); if(doc.coverMediaId&&!ids.has(doc.coverMediaId)) ctx.addIssue({code:'custom',message:'Capa não encontrada'});});
export type RecordDocument = z.infer<typeof recordDocumentSchema>;
export const slugify = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60).replace(/-[^-]*$/,'') || 'registro';
export const formatDateLong = (value:string) => {const [y,m,d]=value.split('-').map(Number); return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date(y!,m!-1,d!)).replace(' de ', ' de ').replace(/^./,c=>c.toUpperCase());};
export const normalizeSearch = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
