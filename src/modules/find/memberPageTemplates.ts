import type { MemberPage, MemberPageBlock, MemberPageBlockType, MemberPageColor } from './types'

// Ready-made member pages (decided 19/10/2026): four models by kind of work
// plus a blank one. Each is a set of blocks already filled with example
// texts, plus a color; the person replaces the examples with their own.
// Pro subscribers keep the model's blocks as they are (fixed layout);
// Enterprise and the team add, reorder and hide blocks.

export type MemberPageContent = Pick<
  MemberPage,
  'display_name' | 'headline' | 'bio' | 'photo_url' | 'location' | 'services' | 'highlights' | 'links' | 'language'
>

export interface MemberPageTemplate {
  id: string
  name: { en: string; pt: string }
  description: { en: string; pt: string }
  color: MemberPageColor
  blocks: MemberPageBlock[]
  // Example texts that fill an empty page when the model is chosen.
  example: Partial<MemberPageContent>
}

export const BLOCK_TYPES: { type: MemberPageBlockType; label: string; hint: string }[] = [
  { type: 'hero', label: 'Top', hint: 'Photo, name, what you do, where' },
  { type: 'contact', label: 'Contact buttons', hint: 'WhatsApp, e-mail, Instagram…' },
  { type: 'highlights', label: 'Featured work', hint: 'Photos or videos of your work' },
  { type: 'services', label: 'Services & prices', hint: 'What you offer' },
  { type: 'about', label: 'About', hint: 'Your story' },
  { type: 'testimonials', label: 'Testimonials', hint: 'What clients say' },
  { type: 'gallery', label: 'Photo gallery', hint: 'Several photos side by side' },
  { type: 'text', label: 'Free text', hint: 'A title and a paragraph' },
  { type: 'faq', label: 'Questions & answers', hint: 'Frequent questions' },
  { type: 'area', label: 'Area served', hint: 'Cities or regions you cover' },
  { type: 'cta', label: 'Final call', hint: 'A closing message with a button' },
]

export const PAGE_COLORS: { id: MemberPageColor; label: string; rgb: string }[] = [
  { id: 'blue', label: 'Blue', rgb: '16 97 236' },
  { id: 'teal', label: 'Teal', rgb: '13 148 136' },
  { id: 'green', label: 'Green', rgb: '22 163 74' },
  { id: 'purple', label: 'Purple', rgb: '124 58 237' },
  { id: 'rose', label: 'Rose', rgb: '225 29 72' },
  { id: 'orange', label: 'Orange', rgb: '234 88 12' },
  { id: 'navy', label: 'Navy', rgb: '15 23 42' },
]

let seq = 0
export function blockId() {
  seq += 1
  return `b${Date.now().toString(36)}${seq}`
}

type Lang = 'en' | 'pt'
const b = (type: MemberPageBlockType, data?: MemberPageBlock['data']): MemberPageBlock => ({ id: `${type}-tpl`, type, ...(data ? { data } : {}) })

// The models in the page's language (example texts in English or Portuguese).
export function memberPageTemplates(lang: Lang): MemberPageTemplate[] {
  const L = (en: string, pt: string) => (lang === 'pt' ? pt : en)
  return [
    {
      id: 'cleaning',
      name: { en: 'Cleaning & home services', pt: 'Limpeza e serviços para casa' },
      description: { en: 'Services with prices, area served and reviews up front.', pt: 'Serviços com preço, área atendida e avaliações em destaque.' },
      color: 'teal',
      blocks: [
        b('hero'),
        b('contact'),
        b('services'),
        b('highlights'),
        b('testimonials', {
          title: L('What clients say', 'O que os clientes dizem'),
          items: [
            { title: L('Always on time and the house looks brand new.', 'Sempre pontual e a casa fica como nova.'), body: L('Client name', 'Nome do cliente') },
            { title: L('Trustworthy and careful with every detail.', 'Confiável e cuidadosa em cada detalhe.'), body: L('Client name', 'Nome do cliente') },
          ],
        }),
        b('area', { title: L('Areas I serve', 'Onde eu atendo'), body: L('City 1 · City 2 · City 3', 'Cidade 1 · Cidade 2 · Cidade 3') }),
        b('faq', {
          title: L('Questions', 'Perguntas'),
          items: [
            { title: L('Do you bring the cleaning products?', 'Você leva os produtos de limpeza?'), body: L('Yes — tell me if you prefer specific products.', 'Sim — me avise se preferir algum produto específico.') },
            { title: L('How do I book?', 'Como eu agendo?'), body: L('Send a message on WhatsApp with your address and the day you prefer.', 'Mande uma mensagem no WhatsApp com o endereço e o dia que prefere.') },
          ],
        }),
        b('cta', { title: L('Ready for a clean home?', 'Pronta para uma casa limpinha?'), body: L('Ask for a free estimate today.', 'Peça seu orçamento grátis hoje.'), button: L('Get a free estimate', 'Pedir orçamento') }),
      ],
      example: {
        headline: L('Residential, deep and move-out cleaning', 'Limpeza residencial, pesada e de mudança'),
        services: [
          { title: L('Standard cleaning', 'Limpeza padrão'), description: L('Kitchen, bathrooms, bedrooms and living areas', 'Cozinha, banheiros, quartos e salas'), price: L('from $120', 'a partir de $120') },
          { title: L('Deep cleaning', 'Limpeza pesada'), description: L('Inside appliances, baseboards and details', 'Dentro dos eletrodomésticos, rodapés e detalhes'), price: L('from $220', 'a partir de $220') },
          { title: 'Move-in / move-out', description: L('Empty house, ready for the next family', 'Casa vazia, pronta para a próxima família'), price: L('from $250', 'a partir de $250') },
        ],
      },
    },
    {
      id: 'notary',
      name: { en: 'Notary & loan signing', pt: 'Notary e loan signing' },
      description: { en: 'Clear services, where you go and how to schedule.', pt: 'Serviços claros, onde você atende e como agendar.' },
      color: 'navy',
      blocks: [
        b('hero'),
        b('contact'),
        b('services'),
        b('area', { title: L('Mobile notary — I come to you', 'Notary móvel — eu vou até você'), body: L('County 1 · County 2 · Online (RON, where allowed)', 'Condado 1 · Condado 2 · Online (RON, onde for permitido)') }),
        b('about'),
        b('faq', {
          title: L('Before your appointment', 'Antes do seu atendimento'),
          items: [
            { title: L('What do I need to bring?', 'O que preciso levar?'), body: L('A valid government photo ID and the unsigned document.', 'Um documento oficial com foto válido e o documento ainda sem assinatura.') },
            { title: L('Can you give legal advice?', 'Você dá orientação jurídica?'), body: L('No — a notary public can’t give legal advice or prepare legal documents.', 'Não — o notary public não pode dar orientação jurídica nem preparar documentos legais.') },
          ],
        }),
        b('cta', { title: L('Need a document notarized?', 'Precisa reconhecer um documento?'), body: L('Send a message with the document type and your location.', 'Mande uma mensagem com o tipo de documento e onde você está.'), button: L('Schedule now', 'Agendar agora') }),
      ],
      example: {
        headline: L('Mobile notary public & loan signing agent', 'Notary public móvel e loan signing agent'),
        services: [
          { title: L('General notary work', 'Serviços de notary'), description: 'Acknowledgments, jurats, affidavits', price: L('per state fee', 'taxa do estado') },
          { title: 'Loan signing', description: L('Refinance, purchase, HELOC packages', 'Refinanciamento, compra, HELOC'), price: L('from $150', 'a partir de $150') },
          { title: L('Travel fee', 'Taxa de deslocamento'), description: L('Within my service area', 'Dentro da minha área de atendimento'), price: L('from $25', 'a partir de $25') },
        ],
      },
    },
    {
      id: 'teacher',
      name: { en: 'Teacher & tutor', pt: 'Professor e tutor' },
      description: { en: 'Classes, method and results, with a call to book.', pt: 'Aulas, método e resultados, com chamada para agendar.' },
      color: 'purple',
      blocks: [
        b('hero'),
        b('contact'),
        b('highlights'),
        b('services'),
        b('text', {
          title: L('How my classes work', 'Como são minhas aulas'),
          body: L('Tell here how a class goes: level test, plan, materials, homework and follow-up.', 'Conte aqui como é a aula: teste de nível, plano, materiais, tarefas e acompanhamento.'),
        }),
        b('testimonials', {
          title: L('Students say', 'O que os alunos dizem'),
          items: [{ title: L('In three months I could handle my job interview in English.', 'Em três meses consegui fazer minha entrevista de emprego em inglês.'), body: L('Student name', 'Nome do aluno') }],
        }),
        b('about'),
        b('cta', { title: L('Book a trial class', 'Agende uma aula experimental'), body: L('Let’s find your level and your goal together.', 'Vamos descobrir juntos seu nível e seu objetivo.'), button: L('Book a trial class', 'Agendar aula') }),
      ],
      example: {
        headline: L('Private classes, online and in person', 'Aulas particulares, online e presenciais'),
        services: [
          { title: L('Private class (60 min)', 'Aula particular (60 min)'), price: '$40' },
          { title: L('Package — 8 classes', 'Pacote — 8 aulas'), description: L('Two classes a week for a month', 'Duas aulas por semana durante um mês'), price: '$280' },
        ],
      },
    },
    {
      id: 'creator',
      name: { en: 'Content creator', pt: 'Criador de conteúdo' },
      description: { en: 'Videos first, then your links and partnerships.', pt: 'Vídeos em destaque, depois seus links e parcerias.' },
      color: 'rose',
      blocks: [
        b('hero'),
        b('contact'),
        b('highlights'),
        b('gallery', { title: L('Recent work', 'Trabalhos recentes'), images: [] }),
        b('services'),
        b('text', {
          title: L('Partnerships', 'Parcerias'),
          body: L('Brands I have worked with, my audience and what I create. Ask for my media kit.', 'Marcas com quem já trabalhei, meu público e o que eu crio. Peça meu media kit.'),
        }),
        b('cta', { title: L('Let’s work together', 'Vamos trabalhar juntos'), body: L('Send a message with your brand and your idea.', 'Mande uma mensagem com sua marca e sua ideia.'), button: L('Talk to me', 'Fale comigo') }),
      ],
      example: {
        headline: L('Videos about … for … · Partnerships open', 'Vídeos sobre … para … · Parcerias abertas'),
        services: [
          { title: L('Sponsored video', 'Vídeo patrocinado'), description: 'TikTok / Reels / Shorts', price: L('on request', 'sob consulta') },
          { title: L('UGC content', 'Conteúdo UGC'), description: L('Videos for your brand’s ads', 'Vídeos para os anúncios da sua marca'), price: L('on request', 'sob consulta') },
        ],
      },
    },
    {
      id: 'blank',
      name: { en: 'Blank', pt: 'Em branco' },
      description: { en: 'Just the top and contacts — build the rest your way.', pt: 'Só o topo e os contatos — monte o resto do seu jeito.' },
      color: 'blue',
      blocks: [b('hero'), b('contact')],
      example: {},
    },
  ]
}

export const MEMBER_PAGE_TEMPLATES = memberPageTemplates('en')

// The blocks a page shows: its own, or — for pages made before blocks —
// the original fixed layout.
export const LEGACY_BLOCKS: MemberPageBlock[] = [
  { id: 'legacy-hero', type: 'hero' },
  { id: 'legacy-contact', type: 'contact' },
  { id: 'legacy-highlights', type: 'highlights' },
  { id: 'legacy-services', type: 'services' },
  { id: 'legacy-about', type: 'about' },
]

export function pageBlocks(page: { blocks?: MemberPageBlock[] | null }): MemberPageBlock[] {
  return page.blocks && page.blocks.length ? page.blocks : LEGACY_BLOCKS
}

// A fresh copy of a model's blocks (new ids, so two pages never share them).
export function templateBlocks(templateId: string, lang: Lang = 'en'): MemberPageBlock[] {
  const all = memberPageTemplates(lang)
  const t = all.find((x) => x.id === templateId) ?? all[all.length - 1]
  return t.blocks.map((block) => ({ ...block, id: blockId(), data: block.data ? JSON.parse(JSON.stringify(block.data)) : undefined }))
}
