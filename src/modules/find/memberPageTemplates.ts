import type { MemberPage, MemberPageBlock, MemberPageBlockType, MemberPageColor } from './types'

// Ready-made member pages ("My Business Page"): four models — four looks of
// the same page system. Each is a set of blocks already filled with example
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
  { type: 'credentials', label: 'Licenses & credentials', hint: 'Shown as stated — not verified by BGrowth' },
  { type: 'products', label: 'Product picks', hint: 'Products you recommend, with your buy links' },
  { type: 'signup', label: 'E-mail list', hint: 'Visitors leave their e-mail for you' },
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

// The four models (decided 19/10/2026): four looks ("skins") of the same page —
// same fields and blocks, different layout and identity. Each comes with
// its sections and example texts in the page's language.
export function memberPageTemplates(lang: Lang): MemberPageTemplate[] {
  const L = (en: string, pt: string) => (lang === 'pt' ? pt : en)
  return [
    {
      id: 'professional',
      name: { en: 'Professional', pt: 'Profissional' },
      description: {
        en: 'For consultants, notaries, bookkeepers and independent professionals. Clean, white and navy — trust first.',
        pt: 'Para consultores, notários, bookkeepers e profissionais independentes. Limpo, branco e azul-marinho — confiança em primeiro lugar.',
      },
      color: 'navy',
      blocks: [
        b('hero'),
        b('contact'),
        b('services'),
        b('credentials', {
          title: L('Licenses & credentials', 'Licenças e credenciais'),
          items: [
            { title: L('Commissioned Notary Public — State of …', 'Notary Public comissionado — Estado de …'), body: L('Commission no. … · expires …', 'Comissão nº … · válida até …') },
            { title: L('Errors & omissions insurance', 'Seguro de erros e omissões (E&O)'), body: L('Coverage: …', 'Cobertura: …') },
          ],
        }),
        b('area', { title: L('Areas I serve', 'Onde eu atendo'), body: L('County 1 · County 2 · Online', 'Condado 1 · Condado 2 · Online') }),
        b('about'),
        b('faq', {
          title: L('Good to know', 'Bom saber'),
          items: [
            { title: L('What do I need to bring?', 'O que preciso levar?'), body: L('A valid government photo ID and your documents.', 'Um documento oficial com foto válido e seus documentos.') },
            { title: L('Do you give legal advice?', 'Você dá orientação jurídica?'), body: L('No — I can’t give legal advice.', 'Não — não posso dar orientação jurídica.') },
          ],
        }),
        b('cta', { title: L('Let’s talk about what you need', 'Vamos conversar sobre o que você precisa'), body: L('Send a message and I’ll get back to you the same day.', 'Mande uma mensagem e eu respondo no mesmo dia.'), button: L('Schedule a call', 'Agendar conversa') }),
      ],
      example: {
        headline: L('Mobile notary & loan signing agent', 'Notary móvel e loan signing agent'),
        services: [
          { title: L('Notary services', 'Serviços de notary'), description: L('Acknowledgments, jurats, affidavits', 'Reconhecimentos, juramentos, declarações'), price: L('per state fee', 'taxa do estado') },
          { title: 'Loan signing', description: L('Refinance, purchase and HELOC packages', 'Refinanciamento, compra e HELOC'), price: L('from $150', 'a partir de $150') },
          { title: L('Consultation', 'Consulta'), description: L('30 minutes, online', '30 minutos, online'), price: '$50' },
        ],
      },
    },
    {
      id: 'local',
      name: { en: 'Local Services', pt: 'Serviços locais' },
      description: {
        en: 'For cleaning, lawn care, handyman, detailing and home services. Your service up front, photos of the work, areas served and a quote button.',
        pt: 'Para limpeza, jardinagem, handyman, detailing e serviços residenciais. Serviço em destaque, fotos do trabalho, regiões atendidas e botão de orçamento.',
      },
      color: 'orange',
      blocks: [
        b('hero'),
        b('services'),
        b('highlights'),
        b('area', { title: L('Areas we serve', 'Regiões atendidas'), body: L('City 1 · City 2 · City 3 · City 4', 'Cidade 1 · Cidade 2 · Cidade 3 · Cidade 4') }),
        b('testimonials', {
          title: L('What clients say', 'O que os clientes dizem'),
          items: [
            { title: L('On time, careful and the house looks brand new.', 'Pontual, cuidadosa e a casa fica como nova.'), body: L('Client name', 'Nome do cliente') },
            { title: L('Fair price and great work. Highly recommend.', 'Preço justo e trabalho ótimo. Recomendo muito.'), body: L('Client name', 'Nome do cliente') },
            { title: L('Easy to book and always reliable.', 'Fácil de agendar e sempre confiável.'), body: L('Client name', 'Nome do cliente') },
          ],
        }),
        b('faq', {
          title: L('Questions', 'Perguntas'),
          items: [
            { title: L('Do you bring the supplies?', 'Vocês levam o material?'), body: L('Yes — tell us if you prefer specific products.', 'Sim — avise se preferir algum produto específico.') },
            { title: L('What are your hours?', 'Qual o horário de atendimento?'), body: L('Monday to Saturday, 8am to 6pm.', 'Segunda a sábado, das 8h às 18h.') },
          ],
        }),
        b('contact'),
        b('cta', { title: L('Get your free quote', 'Peça seu orçamento grátis'), body: L('Tell us what you need — we reply within the day.', 'Conte o que você precisa — respondemos no mesmo dia.'), button: L('Get a free quote', 'Pedir orçamento') }),
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
      id: 'creative',
      name: { en: 'Creative Portfolio', pt: 'Portfólio criativo' },
      description: {
        en: 'For photographers, designers, artisans and creators. Editorial layout, big images and your work in the spotlight.',
        pt: 'Para fotógrafos, designers, artesãos e criadores. Layout editorial, imagens grandes e seu trabalho em destaque.',
      },
      color: 'rose',
      blocks: [
        b('hero'),
        b('highlights'),
        b('gallery', { title: L('Selected work', 'Trabalhos selecionados'), images: [] }),
        b('about'),
        b('services'),
        b('testimonials', {
          title: L('Kind words', 'O que dizem'),
          items: [{ title: L('Every photo told our story exactly as we lived it.', 'Cada foto contou nossa história do jeito que vivemos.'), body: L('Client name', 'Nome do cliente') }],
        }),
        b('contact'),
        b('cta', { title: L('Let’s create something together', 'Vamos criar algo juntos'), body: L('Tell me about your project.', 'Me conte sobre o seu projeto.'), button: L('Start a project', 'Começar um projeto') }),
      ],
      example: {
        headline: L('Photographer & visual designer', 'Fotógrafa e designer visual'),
        services: [
          { title: L('Photo session', 'Ensaio fotográfico'), description: L('2 hours, 40 edited photos', '2 horas, 40 fotos editadas'), price: L('from $350', 'a partir de $350') },
          { title: L('Brand identity', 'Identidade visual'), description: L('Logo, colors and templates', 'Logo, cores e modelos'), price: L('on request', 'sob consulta') },
        ],
      },
    },
    {
      id: 'personal',
      name: { en: 'Personal Brand', pt: 'Marca pessoal' },
      description: {
        en: 'For coaches, educators and experts who sell knowledge. Warm, soft colors, you in the spotlight and clear calls to action.',
        pt: 'Para coaches, educadores e especialistas que vendem conhecimento. Acolhedor, cores suaves, você em destaque e chamadas claras.',
      },
      color: 'green',
      blocks: [
        b('hero'),
        b('about'),
        b('services'),
        b('testimonials', {
          title: L('Transformations', 'Transformações'),
          items: [
            { title: L('In three months I could finally speak with confidence at work.', 'Em três meses consegui finalmente falar com confiança no trabalho.'), body: L('Student name', 'Nome do aluno') },
            { title: L('Practical, kind and always available.', 'Prática, atenciosa e sempre disponível.'), body: L('Client name', 'Nome do cliente') },
          ],
        }),
        b('highlights'),
        b('faq', {
          title: L('Questions', 'Perguntas'),
          items: [
            { title: L('How does the first session work?', 'Como funciona a primeira sessão?'), body: L('We talk about your goal and I build a plan for you.', 'Conversamos sobre seu objetivo e eu monto um plano para você.') },
            { title: L('Online or in person?', 'Online ou presencial?'), body: L('Both — choose what works best for you.', 'Os dois — você escolhe o que for melhor.') },
          ],
        }),
        b('contact'),
        b('cta', { title: L('Let’s start together', 'Vamos começar juntos'), body: L('Book a free first conversation.', 'Agende uma primeira conversa grátis.'), button: L('Book a free call', 'Agendar conversa grátis') }),
      ],
      example: {
        headline: L('I help people … to …', 'Eu ajudo pessoas a …'),
        services: [
          { title: L('1:1 sessions', 'Sessões individuais'), description: L('A plan made for you, weekly follow-up', 'Plano feito para você, acompanhamento semanal'), price: L('$60 / session', '$60 / sessão') },
          { title: L('Group program', 'Programa em grupo'), description: L('8 weeks, live classes and community', '8 semanas, aulas ao vivo e comunidade'), price: '$290' },
          { title: L('Free guide', 'Guia grátis'), description: L('Start here', 'Comece por aqui'), price: L('free', 'grátis') },
        ],
      },
    },
    {
      id: 'affiliate',
      name: { en: 'Affiliate Picks', pt: 'Affiliate Picks' },
      description: {
        en: 'For creators who recommend products. A personal showcase of your picks by category, with your own buy links and a clear affiliate note — not a store.',
        pt: 'Para quem indica produtos. Uma vitrine pessoal das suas indicações por categoria, com seus próprios links de compra e aviso de afiliado — não é uma loja.',
      },
      color: 'blue',
      blocks: [
        b('hero', {
          title: L('Tools · Products · Resources', 'Ferramentas · Produtos · Recursos'),
          body: L('The tools, products and resources I use and recommend for work, home, travel and everyday life.', 'As ferramentas, produtos e recursos que eu uso e indico para trabalho, casa, viagem e dia a dia.'),
        }),
        b('products', { title: L('My picks', 'Minhas indicações'), products: [] }),
        b('about'),
        b('contact'),
      ],
      example: { headline: L('Real products for a better life', 'Produtos de verdade para uma vida melhor') },
    },
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

// The four full-site looks (Sprint 128). The first five models (Sprint 127:
// cleaning, notary, teacher, creator, blank) keep the simple one-column page.
export type MemberPageSkin = 'professional' | 'local' | 'creative' | 'personal' | 'affiliate'
export function pageSkin(template: string | null | undefined): MemberPageSkin | null {
  const id = template ?? ''
  return id === 'professional' || id === 'local' || id === 'creative' || id === 'personal' || id === 'affiliate' ? id : null
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
  const t = all.find((x) => x.id === templateId) ?? all[0]
  return t.blocks.map((block) => ({ ...block, id: blockId(), data: block.data ? JSON.parse(JSON.stringify(block.data)) : undefined }))
}

// Switching model keeps what the person wrote: each of the new model's
// sections reuses a current section of the same kind (its texts, hidden or
// not); sections the new model doesn't have stay, at the end.
export function switchTemplateBlocks(templateId: string, lang: Lang, current: MemberPageBlock[]): MemberPageBlock[] {
  const used = new Set<string>()
  const next = templateBlocks(templateId, lang).map((block) => {
    const same = current.find((c) => c.type === block.type && !used.has(c.id))
    if (!same) return block
    used.add(same.id)
    return same
  })
  return [...next, ...current.filter((c) => !used.has(c.id))]
}

// A complete example page for the model picker's previews.
const SAMPLE: Record<string, { name: string; location: { en: string; pt: string }; bio: { en: string; pt: string } }> = {
  affiliate: {
    name: 'Bruno Santos',
    location: { en: 'USA Lifestyle & Resources', pt: 'Vida nos EUA e recursos' },
    bio: { en: 'I only share what I actually use.', pt: 'Só indico o que eu realmente uso.' },
  },
  cleaning: { name: 'Sparkle Cleaning', location: { en: 'Orlando, FL', pt: 'Orlando, FL' }, bio: { en: 'Careful, on-time cleaning for homes and offices.', pt: 'Limpeza cuidadosa e pontual para casas e escritórios.' } },
  notary: { name: 'Paula Lima', location: { en: 'Tampa, FL · Mobile', pt: 'Tampa, FL · Móvel' }, bio: { en: 'Mobile notary — I come to you.', pt: 'Notary móvel — eu vou até você.' } },
  teacher: { name: 'Marina Costa', location: { en: 'Online', pt: 'Online' }, bio: { en: 'Practical classes for real life.', pt: 'Aulas práticas para a vida real.' } },
  creator: { name: 'Duda Reis', location: { en: 'Miami, FL', pt: 'Miami, FL' }, bio: { en: 'Content that sells, with a real voice.', pt: 'Conteúdo que vende, com voz de verdade.' } },
  blank: { name: 'Your name', location: { en: '', pt: '' }, bio: { en: '', pt: '' } },
  professional: {
    name: 'Ana Ribeiro',
    location: { en: 'Orlando, FL · Online', pt: 'Orlando, FL · Online' },
    bio: { en: 'Ten years helping families and small businesses with their documents — clear, on time and by the book.', pt: 'Dez anos ajudando famílias e pequenas empresas com seus documentos — com clareza, no prazo e dentro das regras.' },
  },
  local: {
    name: 'Bright Home Cleaning',
    location: { en: 'Boca Raton, FL', pt: 'Boca Raton, FL' },
    bio: { en: 'A small, careful team that treats your home like ours.', pt: 'Uma equipe pequena e cuidadosa que trata sua casa como a nossa.' },
  },
  creative: {
    name: 'Lia Moreno',
    location: { en: 'Miami · Worldwide', pt: 'Miami · No mundo todo' },
    bio: { en: 'I photograph people, places and brands with natural light and a lot of patience.', pt: 'Fotografo pessoas, lugares e marcas com luz natural e muita paciência.' },
  },
  personal: {
    name: 'Carla Souza',
    location: { en: 'Online', pt: 'Online' },
    bio: { en: 'I left Brazil with two suitcases and learned everything the hard way. Now I help others get there faster.', pt: 'Saí do Brasil com duas malas e aprendi tudo do jeito difícil. Hoje ajudo outras pessoas a chegarem lá mais rápido.' },
  },
}

export function templatePreview(t: MemberPageTemplate, lang: Lang): MemberPageContent & { blocks: MemberPageBlock[]; theme: { color: MemberPageColor }; template: string } {
  const s = SAMPLE[t.id] ?? SAMPLE.professional
  return {
    display_name: s.name,
    headline: t.example.headline ?? null,
    bio: s.bio[lang],
    photo_url: null,
    location: s.location[lang],
    services: t.example.services ?? [],
    highlights: [],
    links: [
      { type: 'whatsapp', label: '', url: '+1 555 123 4567' },
      { type: 'email', label: '', url: 'hello@example.com' },
      { type: 'instagram', label: '', url: 'https://instagram.com/' },
    ],
    language: lang,
    blocks: t.id === 'affiliate' ? t.blocks.map((block) => (block.type === 'products' ? { ...block, data: { ...block.data, products: samplePicks(lang) } } : block)) : t.blocks,
    theme: { color: t.color },
    template: t.id,
  }
}

// Example picks for the model preview only — a real page shows just what the
// member adds.
function samplePicks(lang: Lang): NonNullable<MemberPageBlock['data']>['products'] {
  const L = (en: string, pt: string) => (lang === 'pt' ? pt : en)
  const url = 'https://example.com'
  return [
    { title: L('Car phone mount', 'Suporte de celular para carro'), description: L('Holds steady on any road.', 'Firme em qualquer estrada.'), url, category: 'car', favorite: true },
    { title: L('Portable jump starter', 'Auxiliar de partida portátil'), description: L('Saved me twice this winter.', 'Me salvou duas vezes neste inverno.'), url, category: 'car', favorite: true },
    { title: L('Laptop stand', 'Suporte para notebook'), description: L('Better posture at the desk.', 'Postura melhor na mesa.'), url, category: 'work', favorite: true },
    { title: L('Travel organizer', 'Organizador de viagem'), description: L('Everything in its place.', 'Tudo no lugar.'), url, category: 'travel', favorite: true },
    { title: L('Budget planner', 'Planner de orçamento'), url, category: 'finance' },
    { title: L('Smart plug', 'Tomada inteligente'), url, category: 'home' },
  ]
}
