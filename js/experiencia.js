/* ==========================================================================
   TravelBuenaVista — motion da página "Experiência".
   Técnica portada do awwwards-kit e adaptada à marca (paleta clara).
   Arquivo isolado: não interfere em main.js, carrossel.js ou revelar.js.

   Requer: gsap, ScrollTrigger, Lenis, SplitType (via CDN no HTML).
   ========================================================================== */
(function () {
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 1. smooth scroll ----------
     O redesign.css define `html { scroll-behavior: smooth }`. Isso BRIGA
     com o Lenis: os dois tentam suavizar o mesmo scroll e a página passa
     a pular sozinha. O Lenis tem que ser o único dono do scroll. */
  document.documentElement.style.scrollBehavior = 'auto';

  /* ---------- MENU MOBILE ----------
     As outras páginas ligam o hambúrguer num script inline no rodapé.
     Esta página não tinha esse script: o botão existia, o CSS escondia o
     .nav no celular e nada abria — o menu ficava inalcançável.
     Mesmo contrato do resto do site (.nav.open), com Esc e resize a mais. */
  (function menuMobile() {
    const botao = document.getElementById('navToggle');
    const menu = document.getElementById('mainNav');
    if (!botao || !menu) return;

    const fechar = () => { menu.classList.remove('open'); botao.setAttribute('aria-expanded', 'false'); };

    botao.addEventListener('click', () => {
      const aberto = menu.classList.toggle('open');
      botao.setAttribute('aria-expanded', String(aberto));
    });
    menu.addEventListener('click', e => { if (e.target.tagName === 'A') fechar(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });
    // volta pro desktop com o menu aberto: limpa o estado
    matchMedia('(min-width: 821px)').addEventListener('change', e => { if (e.matches) fechar(); });
  })();

  /* Mede quanto a topbar + header ocupam ANTES do hero e expõe como
     --xp-topo. O CSS usa isso para o hero caber exatamente na primeira
     tela em vez de estourar e cortar o conteúdo. */
  function medirTopo() {
    const hero = document.querySelector('.xp-hero');
    if (!hero) return;
    const topo = hero.getBoundingClientRect().top + window.scrollY;
    document.documentElement.style.setProperty('--xp-topo', Math.round(topo) + 'px');
  }
  medirTopo();
  addEventListener('resize', medirTopo);

  if (window.Lenis && !semMovimento) {
    const lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    if (!location.hash) lenis.scrollTo(0, { immediate: true });
    // exposto p/ debug: o Lenis é dono do scroll, então window.scrollTo()
    // nativo é revertido por ele no frame seguinte. Use lenis.scrollTo().
    window.lenis = lenis;
  }

  /* Tudo que MEDE layout (reveal, parallax, pin) precisa rodar depois do
     `load` — com as fotos já baixadas. Se medir antes, o ScrollTrigger
     calcula o pin com posição errada (chega a dar start negativo) e sobra
     um buraco em branco do tamanho do pin-spacer. */
  function iniciar() {

  /* ---------- 2. reveal de texto por linha ---------- */
  function revelar(el, imediato) {
    if (semMovimento || !window.SplitType) return;
    const split = new SplitType(el, { types: 'lines,words' });
    split.lines.forEach(l => {
      const m = document.createElement('span');
      m.className = 'reveal';
      l.parentNode.insertBefore(m, l);
      m.appendChild(l);
    });
    gsap.from(split.words, {
      yPercent: 115, opacity: 0, duration: 1, ease: 'power4.out', stagger: .035,
      scrollTrigger: imediato ? null : { trigger: el, start: 'top 85%' },
      delay: imediato ? .25 : 0
    });
  }
  document.querySelectorAll('[data-split]').forEach(el => revelar(el, !!el.closest('[data-hero]')));

  gsap.utils.toArray('[data-fade]').forEach(el => {
    if (semMovimento) return;
    gsap.from(el, { y: 22, opacity: 0, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* ---------- 3. contador dos números ---------- */
  gsap.utils.toArray('[data-contador]').forEach(el => {
    const alvo = parseFloat(el.dataset.contador);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: alvo, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: () => { el.firstChild.textContent = Math.round(obj.v).toLocaleString('pt-BR'); }
    });
  });

  /* ---------- 4. parallax vertical ----------
     CONTENÇÃO: a camada tem inset -12% (altura 124%). yPercent é % da
     altura DELA: 7% = 7 × 1.24 = 8.7% do frame, menor que os 12% de folga.
     Se aumentar o range, aumente o inset no CSS junto. */
  const PARALLAX_Y = 7;
  gsap.utils.toArray('[data-parallax]').forEach(el => {
    if (semMovimento) return;
    gsap.fromTo(el, { yPercent: PARALLAX_Y }, {
      yPercent: -PARALLAX_Y, ease: 'none',
      scrollTrigger: { trigger: el, scrub: true, start: 'top bottom', end: 'bottom top' }
    });
  });

  /* ---------- 4b. DESFOQUE DE SAÍDA ----------
     A seção que você acabou de passar embaça e some, em vez de só sair da
     tela. Dá a impressão de que ela "dissolve" e joga o foco na próxima.

     CUIDADO: `filter` cria um containing block novo, o que QUEBRA
     position:sticky/fixed lá dentro. Por isso este efeito nunca entra na
     seção do scroll horizontal (que depende de sticky) nem no hero.

     NÃO combine com data-fade no mesmo elemento: os dois animam `opacity`
     e brigam. Por isso a ENTRADA já está embutida aqui — o item chega
     desembaçando e sai embaçando, o mesmo gesto nos dois sentidos. */
  /* UMA timeline, não dois tweens. Com dois `fromTo` no mesmo elemento o
     de saída aplica o estado inicial dele já no load e atropela a entrada
     (o item nascia nítido em vez de embaçado). Aqui as três fases —
     entra, fica nítido, sai — vivem num scrub só. */
  gsap.utils.toArray('[data-desfoca]').forEach(sec => {
    if (semMovimento) return;
    gsap.timeline({
      scrollTrigger: { trigger: sec, start: 'top 95%', end: 'bottom 5%', scrub: true }
    })
      .fromTo(sec,
        { filter: 'blur(9px)', opacity: 0, y: 40 },
        { filter: 'blur(0px)', opacity: 1, y: 0, ease: 'none', duration: .28 })
      .to(sec, { duration: .44 })                                   // nítido no meio
      .to(sec, { filter: 'blur(8px)', opacity: .15, ease: 'none', duration: .28 });
  });

  /* ---------- 5. scroll horizontal pinado + parallax por camada ---------- */
  const secao = document.querySelector('[data-horizontal]');
  if (secao && !semMovimento) {
    const track = secao.querySelector('.xp-hscroll__track');
    const distancia = () => Math.max(0, track.scrollWidth - innerWidth);

    /* a altura da seção É a duração do scroll horizontal:
       um viewport pra ficar travado + a distância a percorrer. */
    const medir = () => { secao.style.height = (innerHeight + distancia()) + 'px'; };
    medir();

    const tween = gsap.to(track, {
      x: () => -distancia(), ease: 'none',
      scrollTrigger: {
        trigger: secao,
        start: 'top top', end: 'bottom bottom',   // sem pin: o sticky trava
        scrub: 1, invalidateOnRefresh: true,
        onRefreshInit: medir
      }
    });

    /* contenção horizontal: inset lateral -20% (largura 140%).
       xPercent máx = 12 × 1.40 = 16.8% do painel, dentro dos 20%. */
    secao.querySelectorAll('[data-hp]').forEach(camada => {
      gsap.fromTo(camada, { xPercent: -12 }, {
        xPercent: 12, ease: 'none',
        scrollTrigger: {
          trigger: camada.closest('.xp-panel'),
          containerAnimation: tween,      // essencial p/ parallax dentro do horizontal
          scrub: true, start: 'left right', end: 'right left'
        }
      });
    });

    secao.querySelectorAll('.xp-panel__cap').forEach(cap => {
      gsap.from(cap, {
        yPercent: 40, opacity: 0, duration: .9, ease: 'power3.out',
        scrollTrigger: { trigger: cap.closest('.xp-panel'), containerAnimation: tween, start: 'left 78%' }
      });
    });
  }

    ScrollTrigger.refresh();
  } /* fim de iniciar() */

  if (document.readyState === 'complete') iniciar();
  else addEventListener('load', iniciar);
  addEventListener('resize', () => ScrollTrigger.refresh());

  /* ---------- 5b. ROTA DE VOO no hero ----------
     Arco pontilhado que se desenha + avião percorrendo. Usa
     getPointAtLength() nativo do SVG para posição E ângulo, então não
     precisa do MotionPathPlugin do GSAP. */
  (function rotaDeVoo() {
    const rota = document.getElementById('xpRota');
    const aviao = document.getElementById('xpAviao');
    const origem = document.getElementById('xpOrigem');
    if (!rota || !aviao) return;

    const total = rota.getTotalLength();

    // ponto de partida (a "cidade de origem")
    if (origem) {
      const p0 = rota.getPointAtLength(0);
      origem.setAttribute('transform', `translate(${p0.x} ${p0.y})`);
    }

    // posiciona o avião numa fração do caminho, já rotacionado pela tangente
    function porNaRota(frac) {
      const d = total * frac;
      const p = rota.getPointAtLength(d);
      const q = rota.getPointAtLength(Math.min(d + 2, total));   // 2px à frente = tangente
      const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
      aviao.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang})`);
    }

    if (semMovimento) { porNaRota(.62); aviao.style.opacity = 1; return; }

    /* No celular o viewBox é cortado pelo "slice": boa parte do arco fica fora
       da tela e o avião some por vários segundos. Com a tela estreita o voo
       roda mais rápido e espera menos entre uma passagem e outra. */
    const estreito = matchMedia('(max-width: 700px)').matches;

    // 1. a rota se desenha
    rota.style.strokeDasharray = `${total}`;
    rota.style.strokeDashoffset = `${total}`;
    gsap.to(rota, {
      strokeDashoffset: 0, duration: estreito ? 1.5 : 2.4, ease: 'power2.inOut', delay: .35,
      onComplete: () => { rota.style.strokeDasharray = '1 12'; rota.style.strokeDashoffset = '0'; }
    });

    // 2. o avião decola e cruza, em loop lento
    const voo = { p: 0 };
    gsap.timeline({ repeat: -1, repeatDelay: estreito ? .8 : 1.4, delay: estreito ? .7 : 1.1 })
      .set(aviao, { opacity: 1 })
      .to(voo, {
        p: 1, duration: estreito ? 4.5 : 9, ease: 'power1.inOut',
        onUpdate: () => porNaRota(voo.p)
      })
      .to(aviao, { opacity: 0, duration: .5 }, '-=0.5')
      .set(voo, { p: 0 })
      .set(aviao, { opacity: 0 });
  })();

  /* ---------- 6. shader do hero (versão CLARA, azul da marca) ---------- */
  (function shader() {
    const canvas = document.querySelector('[data-shader]');
    if (!canvas) return;

    /* Um <canvas> que não consegue alocar o contexto vira ÍCONE DE IMAGEM
       QUEBRADA no Chrome Android — foi exatamente o que apareceu no hero no
       celular. Então TODA desistência daqui pra baixo tem que tirar o
       elemento do DOM. O .xp-hero--liso repõe um degradê da marca no lugar,
       para o hero não virar um retângulo branco. */
    let morto = false;
    const desistir = () => {
      morto = true;
      canvas.closest('.xp-hero')?.classList.add('xp-hero--liso');
      canvas.remove();
    };

    const celular = matchMedia('(pointer: coarse)').matches;

    /* Buffer enxuto: é um quad de tela cheia, não precisa de antialias,
       profundidade nem stencil — e cada um desses é memória de GPU que no
       celular faz falta. `alpha:false` ainda evita a composição extra. */
    const attrs = {
      alpha: false, antialias: false, depth: false, stencil: false,
      preserveDrawingBuffer: false, powerPreference: celular ? 'low-power' : 'default'
    };
    const gl = canvas.getContext('webgl', attrs) || canvas.getContext('experimental-webgl', attrs);
    if (!gl) return desistir();                       // sem WebGL: degradê de CSS

    // contexto perdido (aba em segundo plano, GPU reiniciada): some com o canvas
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); desistir(); });

    /* Nem toda GPU de celular tem `highp` no fragment shader. Pedir mesmo
       assim faz o shader NÃO COMPILAR — e aí o hero ficava sem nada. */
    const alta = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const precisao = alta && alta.precision > 0 ? 'highp' : 'mediump';

    // fill rate é o gargalo no celular: uma oitava a menos e ninguém percebe
    const OITAVAS = celular ? 4 : 5;

    const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const FRAG = `
      precision ${precisao} float;
      uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;
      float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y);
      }
      float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<${OITAVAS};i++){ v+=a*noise(p); p*=2.; a*=.5; } return v; }
      void main(){
        vec2 uv = gl_FragCoord.xy/u_res.xy;
        // Normaliza pelo MENOR lado. Escalar por aspect deixava o padrão
        // esticado em retrato (aspect ~0.46 no celular) e o hero virava
        // um vazio branco. Assim a densidade é igual em qualquer tela.
        float m = min(u_res.x, u_res.y);
        vec2 st = gl_FragCoord.xy / m;
        float t = u_time*0.05;

        // domain warping — dá o escorrer de água
        vec2 q = vec2(fbm(st+vec2(0.,t)), fbm(st+vec2(5.2,-t)));
        vec2 r = vec2(fbm(st+2.*q+vec2(1.7,9.2)+.14*t), fbm(st+2.*q+vec2(8.3,2.8)-.11*t));
        float f = fbm(st+2.4*r);

        vec2 mo = u_mouse * u_res.xy / m;      // mouse no mesmo espaço de st
        f += .14*exp(-distance(st,mo)*3.5);

        // paleta CLARA: papel -> azul da marca, com um respiro âmbar
        vec3 papel  = vec3(1.0, 1.0, 1.0);
        vec3 azul   = vec3(0.157, 0.373, 0.761);   // #285fc2
        vec3 ambar  = vec3(0.961, 0.620, 0.043);   // #f59e0b
        // O fbm fica quase todo entre .35 e .65, então limiares altos
        // resultavam em ~7% de azul — invisível em tela pequena. A faixa
        // aqui é estreita de propósito, para o fluido realmente aparecer.
        vec3 col = papel;
        col = mix(col, azul,  smoothstep(.30,.72,f)*.80);
        col = mix(col, ambar, smoothstep(.55,.95,f)*.28);

        // clareia o rodapé pro texto escuro respirar — de leve, senão em
        // retrato isso apaga quase o hero inteiro
        col = mix(col, papel, smoothstep(.45,.0,uv.y)*.55);
        gl_FragColor = vec4(col,1.);
      }`;

    function compilar(tipo, src) {
      const s = gl.createShader(tipo);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    const vs = compilar(gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl.FRAGMENT_SHADER, FRAG);
    // sem os dois shaders, attachShader estoura — melhor cair fora limpo
    if (!vs || !fs) return desistir();

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return desistir(); }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    /* No celular a barra de URL entra e sai o tempo todo e cada evento desses
       é um `resize`. Realocar o buffer da GPU a cada um é justamente o que
       derruba o contexto em aparelho apertado de memória — daí o ícone de
       imagem quebrada. Então: dpr menor no toque, e só realoca quando a
       LARGURA muda de verdade (mudança só de altura = barra de URL). */
    let larguraAnterior = 0;
    function redimensionar() {
      if (morto) return;
      const l = canvas.clientWidth, a = canvas.clientHeight;
      if (!l || !a) return;
      if (l === larguraAnterior) return;
      larguraAnterior = l;

      /* No celular o buffer é desenhado PEQUENO e o CSS estica de volta. Como
         a imagem é fluido borrado, a subida de escala não aparece — mas o
         custo cai ~6x, que é o que faz a diferença entre rodar e a GPU
         derrubar o contexto. Teto no lado maior; o menor segue a proporção. */
      const dpr = Math.min(devicePixelRatio || 1, celular ? 1.5 : 2);
      const escala = celular ? Math.min(1, 900 / (Math.max(l, a) * dpr)) : 1;
      canvas.width = Math.max(1, Math.round(l * dpr * escala));
      canvas.height = Math.max(1, Math.round(a * dpr * escala));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    addEventListener('resize', redimensionar); redimensionar();
    if (gl.isContextLost()) return desistir();

    let mx = .5, my = .5, tx = .5, ty = .5;
    addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = 1 - (e.clientY - r.top) / r.height;
    });

    let visivel = true, raf = null;
    new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel && !raf) loop(0);
    }).observe(canvas);

    /* Vigia de desempenho: em vez de adivinhar pelo user-agent quais aparelhos
       aguentam, a gente MEDE. Se depois do aquecimento o shader passar mais de
       um segundo abaixo de 10fps, ele sai de cena e entra o degradê — melhor
       um fundo estático bonito que um hero travando o scroll. */
    const ALVO = celular ? 33 : 0;      // ms entre quadros (celular trava em 30fps)
    let ultimo = 0, medidos = 0, lentos = 0;

    function loop(ts) {
      if (morto || !visivel) { raf = null; return; }
      raf = semMovimento ? null : requestAnimationFrame(loop);

      const dt = ultimo ? ts - ultimo : 0;
      if (ALVO && dt && dt < ALVO) return;             // pula o quadro: 30fps
      ultimo = ts;

      // os 20 primeiros quadros são compilação/upload — não contam
      if (dt > 0 && ++medidos > 20) {
        if (dt > 100) lentos++; else lentos = 0;
        if (lentos >= 12) return desistir();           // ~1,2s seguidos abaixo de 10fps
      }

      mx += (tx - mx) * .05; my += (ty - my) * .05;
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uTime, semMovimento ? 6 : ts * .001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    loop(0);
  })();

  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
