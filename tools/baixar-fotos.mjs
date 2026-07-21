/* ==========================================================================
   Baixa fotos de marcos reais do Wikimedia Commons para a página Experiência.

   Por quê: as imagens antigas foram pegas soltas na internet e várias não
   representam o lugar (a de "Ásia" é um pagode colado num skyline da Flórida;
   a de "África" é uma ilustração). Cada destino precisa de um marco
   identificável — e em resolução que aguente layout imersivo.

   Commons: licença livre, alta resolução, sem API key. Guardamos autor e
   licença de cada foto em CREDITOS.md — atribuição é exigência da licença.

   Salva em img/xp/ para NÃO sobrescrever as imagens usadas pelas outras
   páginas do site.

     node tools/baixar-fotos.mjs
   ========================================================================== */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const UA = 'TravelBuenaVista-site/1.0 (contato@tbvtagencia.com)';
const LARGURA = 1800;
const DESTINO = path.resolve(import.meta.dirname, '..', 'img', 'xp');

/* Marcos escolhidos por serem INEQUÍVOCOS — você bate o olho e sabe onde é.
   As buscas apontam para o monumento, não para "paisagem bonita". */
const ALVOS = [
  { slug: 'america-sul',     busca: 'Machu Picchu Peru',                  legenda: 'Machu Picchu, Peru' },
  { slug: 'europa',          busca: 'Eiffel Tower Paris',                 legenda: 'Torre Eiffel, Paris' },
  { slug: 'asia',            busca: 'Mount Fuji Japan',                   legenda: 'Monte Fuji, Japão' },
  { slug: 'africa',          busca: 'Kilimanjaro Amboseli elephants',     legenda: 'Kilimanjaro, Tanzânia' },
  { slug: 'america-norte',   busca: 'Grand Canyon Arizona',               legenda: 'Grand Canyon, EUA' },
  { slug: 'america-central', busca: 'Chichen Itza El Castillo pyramid',   legenda: 'Chichén Itzá, México' },
  { slug: 'oceania',         busca: 'Sydney Opera House harbour',         legenda: 'Ópera de Sydney, Austrália' },
  { slug: 'brasil',          busca: 'Sugarloaf Mountain Rio de Janeiro',  legenda: 'Pão de Açúcar, Rio' }
];

const api = 'https://commons.wikimedia.org/w/api.php';

async function buscarFoto(busca) {
  const url = `${api}?${new URLSearchParams({
    action: 'query', format: 'json', origin: '*',
    generator: 'search',
    gsrsearch: `${busca} filetype:bitmap`,
    gsrnamespace: '6',            // namespace Arquivo:
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: String(LARGURA)
  })}`;

  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`busca falhou: HTTP ${res.status}`);
  const json = await res.json();
  const paginas = Object.values(json?.query?.pages || {});
  if (!paginas.length) return null;

  const candidatos = paginas
    .map(p => {
      const ii = p.imageinfo?.[0];
      if (!ii) return null;
      const meta = ii.extmetadata || {};
      const limpar = s => String(s || '').replace(/<[^>]*>/g, '').trim();
      return {
        titulo: p.title,
        larguraOriginal: ii.width,
        alturaOriginal: ii.height,
        urlRedimensionada: ii.thumburl || ii.url,
        licenca: limpar(meta.LicenseShortName?.value) || 'ver página do Commons',
        autor: limpar(meta.Artist?.value) || 'desconhecido',
        pagina: ii.descriptionurl
      };
    })
    .filter(Boolean)
    // precisa ser grande e preferencialmente paisagem (os painéis são amplos)
    .filter(c => c.larguraOriginal >= 1600)
    .sort((a, b) => (b.larguraOriginal * b.alturaOriginal) - (a.larguraOriginal * a.alturaOriginal));

  return candidatos[0] || null;
}

async function baixar(url, destino) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`download falhou: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destino, buf);
  return buf.length;
}

await mkdir(DESTINO, { recursive: true });

const creditos = [];
for (const alvo of ALVOS) {
  try {
    const foto = await buscarFoto(alvo.busca);
    if (!foto) { console.log(`  ✗ ${alvo.slug} — nada encontrado`); continue; }

    const ext = (foto.urlRedimensionada.split('.').pop().split('?')[0] || 'jpg').toLowerCase();
    const arquivo = `${alvo.slug}.${ext === 'png' ? 'png' : 'jpg'}`;
    const bytes = await baixar(foto.urlRedimensionada, path.join(DESTINO, arquivo));

    creditos.push({ ...alvo, ...foto, arquivo, bytes });
    console.log(`  ✓ ${alvo.slug.padEnd(16)} ${arquivo.padEnd(22)} ${(bytes/1024).toFixed(0).padStart(5)}KB  ${foto.larguraOriginal}px  ${foto.licenca}`);
    console.log(`      ${foto.titulo.replace('File:', '')}`);

    await new Promise(r => setTimeout(r, 700));    // educado com a API
  } catch (e) {
    console.log(`  ✗ ${alvo.slug} — ${e.message}`);
  }
}

/* atribuição é obrigação da licença, não gentileza */
const md = `# Créditos das fotos — página Experiência

Fotos obtidas do [Wikimedia Commons](https://commons.wikimedia.org), todas sob
licença livre. Mantenha esta atribuição ao publicar.

| Arquivo | Local | Autor | Licença | Fonte |
|---|---|---|---|---|
${creditos.map(c =>
  `| \`img/xp/${c.arquivo}\` | ${c.legenda} | ${c.autor} | ${c.licenca} | [Commons](${c.pagina}) |`
).join('\n')}
`;
await writeFile(path.join(DESTINO, 'CREDITOS.md'), md);

console.log(`\n${creditos.length}/${ALVOS.length} baixadas. Créditos em img/xp/CREDITOS.md\n`);
