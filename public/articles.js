/* ═══════════════════════════════════════════════════════════════════════════
   articles.js — the writing behind the /04 ideas deck.

   Every card in the carousel opens a full article. Content is bilingual in the
   data rather than in i18n-fr.js: these are long-form texts, and keying whole
   paragraphs by their English source in the TEXT map would be unreadable and
   would break the moment a comma moved. The reader picks body[lang] and
   re-renders on `i18n:changed`.

   Card faces (tag/title/sum) are bilingual for the same reason.

   Block types the reader understands:
     {h}      section heading
     {p}      paragraph (inline <b> / <em> / <a> allowed — authored here, not user input)
     {ul}     bullet list
     {stats}  the number strip — [{v: '7.8×', l: 'label'}]
     {quote}  pull quote, optional {by}
     {note}   small aside, mono
     {sources} link list

   Every figure quoted below is traceable to the sources block of its article.
   Nothing here is invented: if a number has no source, it does not go in.
   ═══════════════════════════════════════════════════════════════════════════ */

window.ARTICLES = [
  /* ───────────────────────────── 1 · HARNESS ───────────────────────────── */
  {
    id: 'harness',
    tag:   { en: 'essay · 2026',     fr: 'essai · 2026' },
    title: { en: 'the agent\nharness', fr: 'le harness\nde l’agent' },
    sum:   {
      en: 'The model is the engine. The harness is the rest of the car — and it moves the score more than the engine does.',
      fr: 'Le modèle est le moteur. Le harness est tout le reste de la voiture — et il déplace le score plus que le moteur.',
    },
    byline: { en: 'anthropic', fr: 'anthropic' },
    year: 2026,
    read: { en: '9 min read', fr: '9 min de lecture' },
    bg: 'oklch(0.42 0.09 250)', fg: '#eef3fb',
    ico: 'M4 6h16M4 12h16M4 18h10 M20 15l-3 3 3 3',
    authors: [
      { name: 'Anthropic',
        wiki: { en: 'https://en.wikipedia.org/wiki/Anthropic', fr: 'https://fr.wikipedia.org/wiki/Anthropic' } },
    ],
    source: {
      title: 'Harness design for long-running application development',
      url: 'https://www.anthropic.com/engineering/harness-design-long-running-apps',
      where: { en: 'Anthropic engineering blog, 2026', fr: 'blog ingénierie d’Anthropic, 2026' },
    },
    body: {
      en: [
        { p: 'The model is the part everyone argues about. The <b>harness</b> is everything else: the loop that calls the model, the tools it can reach, the context it is allowed to see, the way work is handed from one agent to the next, and the gate that decides whether “done” means anything. Keep the weights, swap the harness, and the same model can look state of the art or look broken.' },

        { h: 'What a harness actually is' },
        { ul: [
          '<b>The loop.</b> Call the model, parse the output, run the tool it asked for, feed the result back, decide when to stop.',
          '<b>The tools.</b> An API designed for a caller that never asks a clarifying question — shell, files, database, search, MCP servers. Error messages are part of the interface.',
          '<b>The context.</b> System prompt, history, retrieved documents, and the compaction that happens when the window fills. A budget, not a bucket.',
          '<b>The handoff.</b> How agent B learns what agent A did without reading its entire transcript.',
          '<b>The gate.</b> What has to be true before work counts as finished: a test, a build, a boot, a score.',
        ] },
        { p: 'Anthropic’s engineering write-up on harness design compresses the whole design rule into one sentence, and it is the most useful sentence I have read on the subject:' },
        { quote: 'Every component in a harness encodes an assumption about what the model can’t do on its own.',
          by: 'Anthropic · Harness design for long-running application development' },
        { p: 'Which also tells you when to delete a component: the day the assumption stops being true. Half of harness engineering is removal.' },

        { h: 'How much does it move the number?' },
        { p: 'Enough that a benchmark score with an undisclosed harness is barely a number at all. Every figure below holds the model fixed and changes only the scaffolding around it.' },
        { stats: [
          { v: '7.8×', l: 'harness-induced variance vs model-induced variance' },
          { v: '+9.5 pt', l: 'same Opus 4.5, SWE-bench Pro, two harnesses' },
          { v: '34 pt', l: 'spread for one model across harnesses' },
          { v: '6 / 9', l: 'model pairs that swapped rank on harness alone' },
        ] },
        { ul: [
          'In a controlled 3×3 grid — three models × three harnesses — harness-induced variance averaged <b>18.48 pp²</b> against <b>2.37 pp²</b> for the model. The harness moved the result <b>7.8× more than the model did</b>, and <b>six of nine</b> model pairs changed places when only the harness changed.',
          'SWE-bench Pro, Claude Opus 4.5: <b>45.9%</b> under the standardised SEAL scaffold, <b>55.4%</b> under Claude Code. <b>+9.5 points</b> on identical weights.',
          'Terminal-Bench 2: changing nothing but the harness took pass@1 from <b>69.7% to 77.0%</b> (+7.3 points).',
          'Cross-harness spread on a single model, SWE-bench Verified Mini: Claude Sonnet 4.5 <b>68% → 34%</b>, GPT-5 Medium <b>46% → 12%</b>. Same weights, half the score.',
          'Low versus high elicitation on one model/benchmark pair: Claude Sonnet 3.5 on SWE-bench Verified, <b>33% → 62.2%</b>. About <b>30 points</b> of “how well was it asked”.',
          'Independent benchmark monitoring puts scaffold-only variation on SWE-bench Verified at up to <b>15 points</b>.',
        ] },
        { p: 'Read those backwards and you get the engineering conclusion. On a mature model, <b>most of the headroom left is in the harness</b>: roughly <b>10 to 30 points</b> of task success on weights you cannot change, and — the part that should worry anyone buying — enough to flip the ranking between two vendors. “We use the best model” answers almost nothing.' },
        { note: 'pp² = squared percentage points, the unit variance comes in. “pt” = percentage points of pass rate.' },

        { h: 'Four questions for anybody’s agent system' },
        { ul: [
          'Does the loop have a stop condition that isn’t a token limit?',
          'Do tool errors tell the model what to do next, or do they just say <em>500</em>?',
          'Is context compacted on purpose, or merely truncated when it overflows?',
          'Is “done” a gate with evidence behind it, or the model’s own opinion of its work?',
        ] },
        { p: 'A system that answers those four badly will underperform a weaker model in a better harness. That is not a theory — it is the 34-point spread above.' },

        { h: 'How my own system is wired' },
        { p: 'The agents further down this page are a harness argument in practice. Three harnesses, adapted per profile: <b>Claude Code</b>, <b>Codex</b> and <b>OpenCode</b>, because each one has a different idea of the loop, the permissions and the context — and dev, SEO and marketing do not need the same idea. <b>Manager (Hermes Agent AI)</b> is the outer harness: it reads the task, picks the profile, the model tier and the harness, then holds the handoff.' },
        { ul: [
          'Context management → a shared scratchpad file, so the next agent reads a page of state instead of an entire transcript.',
          'The stop condition → an adversarial reviewer scoring the work 0–100 against acceptance criteria, evidence only.',
          'The proof → a runtime verifier that migrates the database, boots the stack and hits the endpoints.',
          'The rule → below 90, the loop runs again with the critique attached. Nothing ships on a model’s self-assessment.',
        ] },
        { p: 'That is the whole bet: the model is rented and identical for everyone. The harness is the part you actually build.' },

        { sources: [
          { t: 'Anthropic — Harness design for long-running application development', u: 'https://www.anthropic.com/engineering/harness-design-long-running-apps' },
          { t: 'Zhang, Wang, Ge, Xu, Hamm, Reddy — Stop Comparing LLM Agents Without Disclosing the Harness (arXiv, 2026): the 3×3 variance decomposition, and the collected SWE-bench / Terminal-Bench figures', u: 'https://arxiv.org/abs/2605.23950' },
          { t: 'METR — Measuring the impact of post-training enhancements (the elicitation gap)', u: 'https://metr.github.io/autonomy-evals-guide/elicitation-gap/' },
        ] },
      ],
      fr: [
        { p: 'Le modèle, c’est la partie dont tout le monde débat. Le <b>harness</b>, c’est tout le reste : la boucle qui appelle le modèle, les outils auxquels il accède, le contexte qu’on l’autorise à voir, la façon dont le travail passe d’un agent à l’autre, et le gate qui décide si « terminé » veut dire quelque chose. Gardez les poids, changez le harness : le même modèle peut sembler à l’état de l’art ou complètement cassé.' },

        { h: 'Ce qu’est réellement un harness' },
        { ul: [
          '<b>La boucle.</b> Appeler le modèle, lire sa sortie, exécuter l’outil demandé, réinjecter le résultat, décider quand s’arrêter.',
          '<b>Les outils.</b> Une API conçue pour un appelant qui ne pose jamais de question — shell, fichiers, base de données, recherche, serveurs MCP. Les messages d’erreur font partie de l’interface.',
          '<b>Le contexte.</b> Prompt système, historique, documents récupérés, et la compaction quand la fenêtre se remplit. Un budget, pas un seau.',
          '<b>Le handoff.</b> Comment l’agent B apprend ce que l’agent A a fait sans relire toute sa transcription.',
          '<b>Le gate.</b> Ce qui doit être vrai avant qu’un travail compte comme fini : un test, un build, un démarrage, une note.',
        ] },
        { p: 'Le billet d’ingénierie d’Anthropic sur le design de harness résume toute la règle en une phrase, et c’est la plus utile que j’aie lue sur le sujet :' },
        { quote: 'Chaque composant d’un harness encode une hypothèse sur ce que le modèle ne sait pas faire seul.',
          by: 'Anthropic · Harness design for long-running application development' },
        { p: 'Ce qui indique aussi quand supprimer un composant : le jour où l’hypothèse devient fausse. La moitié du travail de harness engineering consiste à retirer des choses.' },

        { h: 'De combien ça déplace le score ?' },
        { p: 'Assez pour qu’un score de benchmark sans harness déclaré ne soit presque pas un chiffre. Toutes les valeurs ci-dessous gardent le modèle fixe et ne changent que l’échafaudage autour.' },
        { stats: [
          { v: '7,8×', l: 'variance due au harness vs variance due au modèle' },
          { v: '+9,5 pt', l: 'même Opus 4.5, SWE-bench Pro, deux harnesses' },
          { v: '34 pt', l: 'écart d’un seul modèle selon le harness' },
          { v: '6 / 9', l: 'paires de modèles qui changent de rang sur le seul harness' },
        ] },
        { ul: [
          'Dans une grille contrôlée 3×3 — trois modèles × trois harnesses — la variance due au harness atteint en moyenne <b>18,48 pp²</b> contre <b>2,37 pp²</b> pour le modèle. Le harness déplace le résultat <b>7,8× plus que le modèle</b>, et <b>six paires sur neuf</b> s’inversent quand seul le harness change.',
          'SWE-bench Pro, Claude Opus 4.5 : <b>45,9 %</b> avec le scaffold standardisé SEAL, <b>55,4 %</b> avec Claude Code. <b>+9,5 points</b>, poids identiques.',
          'Terminal-Bench 2 : en ne changeant que le harness, le pass@1 passe de <b>69,7 % à 77,0 %</b> (+7,3 points).',
          'Écart entre harnesses pour un seul modèle, SWE-bench Verified Mini : Claude Sonnet 4.5 <b>68 % → 34 %</b>, GPT-5 Medium <b>46 % → 12 %</b>. Mêmes poids, moitié du score.',
          'Élicitation faible contre forte sur un seul couple modèle/benchmark : Claude Sonnet 3.5 sur SWE-bench Verified, <b>33 % → 62,2 %</b>. Environ <b>30 points</b> de « comment la question a été posée ».',
          'Un suivi indépendant des benchmarks mesure jusqu’à <b>15 points</b> de variation due au seul scaffold sur SWE-bench Verified.',
        ] },
        { p: 'Lisez ces chiffres à l’envers et vous obtenez la conclusion d’ingénieur. Sur un modèle mature, <b>l’essentiel de la marge restante est dans le harness</b> : environ <b>10 à 30 points</b> de réussite sur des poids que vous ne pouvez pas modifier — et, ce qui devrait inquiéter tout acheteur, de quoi inverser le classement entre deux fournisseurs. « On utilise le meilleur modèle » ne répond presque à rien.' },
        { note: 'pp² = points de pourcentage au carré, l’unité de la variance. « pt » = points de pourcentage de taux de réussite.' },

        { h: 'Quatre questions à poser à n’importe quel système d’agents' },
        { ul: [
          'La boucle a-t-elle une condition d’arrêt qui n’est pas une limite de tokens ?',
          'Les erreurs d’outil disent-elles au modèle quoi faire ensuite, ou seulement <em>500</em> ?',
          'Le contexte est-il compacté volontairement, ou simplement tronqué quand il déborde ?',
          '« Terminé » est-il un gate avec des preuves, ou l’avis du modèle sur son propre travail ?',
        ] },
        { p: 'Un système qui répond mal à ces quatre questions se fera battre par un modèle plus faible dans un meilleur harness. Ce n’est pas une théorie : c’est l’écart de 34 points ci-dessus.' },

        { h: 'Comment mon propre système est câblé' },
        { p: 'Les agents plus bas sur cette page sont cet argument mis en pratique. Trois harnesses, adaptés par profil : <b>Claude Code</b>, <b>Codex</b> et <b>OpenCode</b>, parce que chacun a une idée différente de la boucle, des permissions et du contexte — et dev, SEO et marketing n’ont pas besoin de la même idée. <b>Manager (Hermes Agent AI)</b> est le harness extérieur : il lit la tâche, choisit le profil, le palier de modèle et le harness, puis tient le handoff.' },
        { ul: [
          'Gestion du contexte → un scratchpad partagé : l’agent suivant lit une page d’état, pas une transcription entière.',
          'Condition d’arrêt → un relecteur adverse qui note le travail de 0 à 100 sur les critères d’acceptation, preuves à l’appui.',
          'La preuve → un vérificateur runtime qui migre la base, démarre la stack et interroge les endpoints.',
          'La règle → en dessous de 90, la boucle repart avec la critique attachée. Rien ne part en prod sur l’auto-évaluation d’un modèle.',
        ] },
        { p: 'Tout le pari est là : le modèle est loué et identique pour tout le monde. Le harness, c’est la partie qu’on construit vraiment.' },

        { sources: [
          { t: 'Anthropic — Harness design for long-running application development', u: 'https://www.anthropic.com/engineering/harness-design-long-running-apps' },
          { t: 'Zhang, Wang, Ge, Xu, Hamm, Reddy — Stop Comparing LLM Agents Without Disclosing the Harness (arXiv, 2026) : la décomposition de variance 3×3 et les chiffres SWE-bench / Terminal-Bench compilés', u: 'https://arxiv.org/abs/2605.23950' },
          { t: 'METR — Measuring the impact of post-training enhancements (l’écart d’élicitation)', u: 'https://metr.github.io/autonomy-evals-guide/elicitation-gap/' },
        ] },
      ],
    },
  },

  /* ────────────────────── 2 · SOFTWARE EATING THE WORLD ────────────────── */
  {
    id: 'eating-the-world',
    tag:   { en: 'essay · 2011', fr: 'essai · 2011' },
    title: { en: 'why software is\neating the world', fr: 'pourquoi le logiciel\ndévore le monde' },
    sum: {
      en: 'Every company is a software company now. This was the op-ed that lit the match.',
      fr: 'Toute entreprise est désormais une entreprise logicielle. Voici la tribune qui a allumé la mèche.',
    },
    byline: { en: 'marc andreessen', fr: 'marc andreessen' },
    year: 2011,
    read: { en: '4 min read', fr: '4 min de lecture' },
    bg: 'oklch(0.62 0.16 38)', fg: '#fff8ef',
    ico: 'M3 3h18v18H3z M3 9h18 M9 3v18',
    authors: [
      { name: 'Marc Andreessen',
        wiki: { en: 'https://en.wikipedia.org/wiki/Marc_Andreessen', fr: 'https://fr.wikipedia.org/wiki/Marc_Andreessen' } },
    ],
    source: {
      title: 'Why Software Is Eating The World',
      url: 'https://a16z.com/why-software-is-eating-the-world/',
      where: { en: 'The Wall Street Journal, August 2011', fr: 'The Wall Street Journal, août 2011' },
    },
    body: {
      en: [
        { p: 'Andreessen wrote this in 2011, when the dominant opinion was that tech was in another bubble. His argument was the opposite: the companies then being called overvalued were in the early stage of eating industries that had nothing to do with computing.' },
        { quote: 'More and more major businesses and industries are being run on software and delivered as online services.', by: 'Marc Andreessen · WSJ, 2011' },
        { p: 'The examples have aged into obviousness. Bookshops became a distribution API. Music became a subscription. Film became a recommendation engine with a CDN. Cars became a fleet dispatch problem. In each case the incumbent had the physical assets and lost anyway, because the coordination layer moved into software and the software company owned it.' },
        { h: 'Why I keep returning to it' },
        { p: 'Because it is the honest job description for what I do. Nobody hires an engineer to write code; they hire one because a business process is being rebuilt as software and somebody has to do the rebuilding. The pipeline on this page is a small version of the same move: “looking for work” used to be a human ritual of tabs and refreshes, and it is now a scheduled job with a filter and a queue.' },
        { p: 'The 2026 footnote writes itself. Software is being eaten in turn — by systems that write it. That does not repeal Andreessen’s argument, it accelerates it: the coordination layer moves again, from code somebody maintains to an agent loop somebody designs. The people who understood the first move are the ones building the second.' },
        { sources: [
          { t: 'Marc Andreessen — Why Software Is Eating The World (a16z reprint of the WSJ essay)', u: 'https://a16z.com/why-software-is-eating-the-world/' },
        ] },
      ],
      fr: [
        { p: 'Andreessen écrit ce texte en 2011, quand l’opinion dominante voyait dans la tech une nouvelle bulle. Son argument est inverse : les entreprises qu’on qualifiait alors de surévaluées n’étaient qu’au début de la digestion d’industries entières, sans rapport avec l’informatique.' },
        { quote: 'De plus en plus d’entreprises et d’industries majeures tournent sur du logiciel et se livrent comme des services en ligne.', by: 'Marc Andreessen · WSJ, 2011' },
        { p: 'Les exemples ont vieilli jusqu’à devenir des évidences. La librairie est devenue une API de distribution. La musique, un abonnement. Le cinéma, un moteur de recommandation posé sur un CDN. La voiture, un problème de répartition de flotte. Chaque fois, l’acteur en place possédait les actifs physiques et a perdu quand même, parce que la couche de coordination est passée dans le logiciel — et que c’est l’éditeur du logiciel qui la détenait.' },
        { h: 'Pourquoi j’y reviens' },
        { p: 'Parce que c’est la description de poste honnête de mon métier. Personne n’embauche un ingénieur pour écrire du code ; on l’embauche parce qu’un processus métier est reconstruit en logiciel et qu’il faut quelqu’un pour le reconstruire. Le pipeline de cette page est une version miniature du même mouvement : « chercher un emploi » était un rituel humain d’onglets et de rafraîchissements ; c’est devenu une tâche planifiée avec un filtre et une file d’attente.' },
        { p: 'La note de bas de page 2026 s’écrit d’elle-même. Le logiciel est dévoré à son tour — par des systèmes qui l’écrivent. Cela n’annule pas l’argument d’Andreessen, cela l’accélère : la couche de coordination se déplace encore, du code que quelqu’un maintient vers une boucle d’agents que quelqu’un conçoit. Ceux qui ont compris le premier mouvement construisent le second.' },
        { sources: [
          { t: 'Marc Andreessen — Why Software Is Eating The World (réédition a16z de la tribune du WSJ)', u: 'https://a16z.com/why-software-is-eating-the-world/' },
        ] },
      ],
    },
  },

  /* ───────────────────────── 3 · AGILE MANIFESTO ───────────────────────── */
  {
    id: 'agile-manifesto',
    tag:   { en: 'manifesto · 2001', fr: 'manifeste · 2001' },
    title: { en: 'the agile\nmanifesto', fr: 'le manifeste\nagile' },
    sum: {
      en: 'Individuals and interactions over processes and tools. Still misread 25 years on.',
      fr: 'Les personnes et leurs interactions plutôt que les processus et les outils. Toujours mal lu 25 ans après.',
    },
    byline: { en: 'kent beck & 16 others', fr: 'kent beck & 16 autres' },
    year: 2001,
    read: { en: '4 min read', fr: '4 min de lecture' },
    bg: 'oklch(0.42 0.11 340)', fg: '#fef4ec',
    ico: 'M4 19l16-6-6-16-4 10z',
    authors: [
      { name: 'Kent Beck',
        wiki: { en: 'https://en.wikipedia.org/wiki/Kent_Beck', fr: 'https://fr.wikipedia.org/wiki/Kent_Beck' } },
    ],
    source: {
      title: 'Manifesto for Agile Software Development',
      url: 'https://agilemanifesto.org/',
      where: { en: 'Snowbird, Utah, February 2001 — 17 signatories', fr: 'Snowbird, Utah, février 2001 — 17 signataires' },
    },
    body: {
      en: [
        { p: 'Seventeen people, a ski lodge in Utah, four lines. The whole document is shorter than most of the process manuals written to enforce it, which is the first joke and also the point.' },
        { ul: [
          'Individuals and interactions <b>over</b> processes and tools',
          'Working software <b>over</b> comprehensive documentation',
          'Customer collaboration <b>over</b> contract negotiation',
          'Responding to change <b>over</b> following a plan',
        ] },
        { p: 'The sentence everyone skips comes right after: <em>that is, while there is value in the items on the right, we value the items on the left more</em>. Not “documentation is bad”. Not “planning is waste”. A statement about which side wins when the two collide.' },
        { quote: 'Working software over comprehensive documentation.', by: 'agilemanifesto.org, 2001' },
        { h: 'Why I keep returning to it' },
        { p: 'Because “agile” now mostly names its own opposite — a certification, a ticket workflow, a ceremony calendar. When a team tells me it is agile I listen for one thing: how long between a decision and something running. Everything else is theatre with a stand-up.' },
        { p: 'The second line is the one I actually work by, and it is why every agent in my system is gated on a runtime check rather than a written report. Working software over comprehensive documentation applies with more force, not less, when the thing producing the documentation can generate a thousand convincing words about code that does not compile.' },
        { sources: [
          { t: 'Manifesto for Agile Software Development (the original four lines and twelve principles)', u: 'https://agilemanifesto.org/' },
        ] },
      ],
      fr: [
        { p: 'Dix-sept personnes, un chalet de ski dans l’Utah, quatre lignes. Le document entier est plus court que la plupart des manuels de processus écrits pour l’imposer — c’est la première blague, et aussi le fond du propos.' },
        { ul: [
          'Les personnes et leurs interactions <b>plutôt que</b> les processus et les outils',
          'Un logiciel qui fonctionne <b>plutôt que</b> une documentation exhaustive',
          'La collaboration avec le client <b>plutôt que</b> la négociation contractuelle',
          'L’adaptation au changement <b>plutôt que</b> le suivi d’un plan',
        ] },
        { p: 'La phrase que tout le monde saute vient juste après : <em>nous reconnaissons de la valeur aux éléments de droite, mais nous privilégions ceux de gauche</em>. Pas « la documentation, c’est mal ». Pas « planifier, c’est du gaspillage ». Une règle d’arbitrage quand les deux entrent en collision.' },
        { quote: 'Un logiciel qui fonctionne plutôt qu’une documentation exhaustive.', by: 'agilemanifesto.org, 2001' },
        { h: 'Pourquoi j’y reviens' },
        { p: 'Parce que « agile » désigne aujourd’hui surtout son contraire : une certification, un workflow de tickets, un calendrier de cérémonies. Quand une équipe me dit qu’elle est agile, j’écoute une seule chose : combien de temps entre une décision et quelque chose qui tourne. Le reste est du théâtre avec un stand-up.' },
        { p: 'La deuxième ligne est celle qui régit mon travail, et c’est pourquoi chaque agent de mon système est jugé sur un contrôle d’exécution et non sur un rapport écrit. « Un logiciel qui fonctionne plutôt qu’une documentation exhaustive » vaut d’autant plus quand la chose qui produit la documentation peut générer mille mots convaincants sur du code qui ne compile pas.' },
        { sources: [
          { t: 'Manifesto for Agile Software Development (les quatre lignes originales et les douze principes)', u: 'https://agilemanifesto.org/' },
        ] },
      ],
    },
  },

  /* ───────────────────────── 4 · WORSE IS BETTER ───────────────────────── */
  {
    id: 'worse-is-better',
    tag:   { en: 'principle · 1989', fr: 'principe · 1989' },
    title: { en: 'worse is\nbetter', fr: 'le pire est\nle mieux' },
    sum: {
      en: 'MIT vs New Jersey school. The essay that explains why Unix won.',
      fr: 'École du MIT contre école du New Jersey. L’essai qui explique pourquoi Unix a gagné.',
    },
    byline: { en: 'richard p. gabriel', fr: 'richard p. gabriel' },
    year: 1989,
    read: { en: '4 min read', fr: '4 min de lecture' },
    bg: 'oklch(0.6 0.1 115)', fg: '#1b1a18',
    ico: 'M3 12h18M12 3v18M5 5l14 14',
    authors: [
      { name: 'Richard P. Gabriel',
        // No French Wikipedia article exists for Gabriel — the reader falls back
        // to the English one and labels the link "en".
        wiki: { en: 'https://en.wikipedia.org/wiki/Richard_P._Gabriel', fr: null } },
    ],
    source: {
      title: 'Lisp: Good News, Bad News, How to Win Big — “The Rise of Worse is Better”',
      url: 'https://www.dreamsongs.com/RiseOfWorseIsBetter.html',
      where: { en: 'Lucid Inc. / dreamsongs.com, 1989–1991', fr: 'Lucid Inc. / dreamsongs.com, 1989-1991' },
    },
    body: {
      en: [
        { p: 'Gabriel sets two design philosophies against each other. The MIT school wants correctness, completeness and consistency, whatever it costs in simplicity. The New Jersey school — Unix, C — wants simplicity of implementation above all, and will accept an interface that is slightly wrong to get it.' },
        { p: 'His conclusion, written by someone who preferred the MIT side and admitted defeat anyway: the worse design wins. It ships earlier, it is small enough to port everywhere, it spreads, and by the time the better design is finished the worse one has the users, the tooling and the habits.' },
        { quote: 'It is slightly better to be simple than to be correct — the “worse is better” philosophy.', by: 'Richard P. Gabriel, 1989' },
        { h: 'Why I keep returning to it' },
        { p: 'Because it is the most useful correction to my own instinct. My instinct is the MIT one: model it properly, make bad states unrepresentable, do it once. That instinct is exactly what keeps a project in a branch for three months.' },
        { p: 'The essay is not permission to ship rubbish. It is a claim about sequencing: get the simple version in front of the real world, let the world tell you which parts of “correct” actually mattered, then harden those. That is the loop I run daily — prototype fast with the AI, then spend the real engineering effort on the 20% the users touch. Half the beautiful abstractions I skip turn out never to have been needed.' },
        { sources: [
          { t: 'Richard P. Gabriel — The Rise of “Worse is Better” (from Lisp: Good News, Bad News, How to Win Big)', u: 'https://www.dreamsongs.com/RiseOfWorseIsBetter.html' },
        ] },
      ],
      fr: [
        { p: 'Gabriel oppose deux philosophies de conception. L’école du MIT veut l’exactitude, la complétude et la cohérence, quel qu’en soit le coût en simplicité. L’école du New Jersey — Unix, C — veut d’abord la simplicité d’implémentation, et accepte une interface légèrement fausse pour l’obtenir.' },
        { p: 'Sa conclusion, écrite par quelqu’un qui préférait le camp du MIT et reconnaissait sa défaite : c’est la conception « pire » qui gagne. Elle sort plus tôt, elle est assez petite pour être portée partout, elle se diffuse — et quand la meilleure conception est enfin terminée, la pire possède déjà les utilisateurs, l’outillage et les habitudes.' },
        { quote: 'Il vaut légèrement mieux être simple que d’être correct — la philosophie « worse is better ».', by: 'Richard P. Gabriel, 1989' },
        { h: 'Pourquoi j’y reviens' },
        { p: 'Parce que c’est le correctif le plus utile à mon propre réflexe. Mon réflexe est celui du MIT : bien modéliser, rendre les états invalides impossibles, le faire une fois pour toutes. C’est exactement ce réflexe qui garde un projet dans une branche pendant trois mois.' },
        { p: 'L’essai n’autorise pas à livrer n’importe quoi. Il parle d’ordre des opérations : mettre la version simple devant le monde réel, laisser le monde dire quelles parties de « correct » comptaient vraiment, puis durcir celles-là. C’est la boucle que je fais tourner tous les jours — prototyper vite avec l’IA, puis mettre l’effort d’ingénierie réel sur les 20 % que les utilisateurs touchent. La moitié des belles abstractions que je saute n’ont, en fait, jamais servi.' },
        { sources: [
          { t: 'Richard P. Gabriel — The Rise of “Worse is Better” (extrait de Lisp: Good News, Bad News, How to Win Big)', u: 'https://www.dreamsongs.com/RiseOfWorseIsBetter.html' },
        ] },
      ],
    },
  },

  /* ──────────────────── 5 · ANATOMY OF A SEARCH ENGINE ─────────────────── */
  {
    id: 'anatomy-search-engine',
    tag:   { en: 'paper · 1998', fr: 'papier · 1998' },
    title: { en: 'the anatomy of\na search engine', fr: 'anatomie d’un\nmoteur de recherche' },
    sum: {
      en: 'Google in 20 pages. Reread it — most of it still rhymes with the modern stack.',
      fr: 'Google en 20 pages. Relisez-le : presque tout rime encore avec la stack moderne.',
    },
    byline: { en: 'brin & page', fr: 'brin & page' },
    year: 1998,
    read: { en: '5 min read', fr: '5 min de lecture' },
    bg: '#f4eedd', fg: '#1b1a18',
    ico: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    authors: [
      { name: 'Sergey Brin',
        wiki: { en: 'https://en.wikipedia.org/wiki/Sergey_Brin', fr: 'https://fr.wikipedia.org/wiki/Sergey_Brin' } },
      { name: 'Larry Page',
        wiki: { en: 'https://en.wikipedia.org/wiki/Larry_Page', fr: 'https://fr.wikipedia.org/wiki/Larry_Page' } },
    ],
    source: {
      title: 'The Anatomy of a Large-Scale Hypertextual Web Search Engine',
      url: 'http://infolab.stanford.edu/~backrub/google.html',
      where: { en: 'Stanford, WWW7 conference, 1998', fr: 'Stanford, conférence WWW7, 1998' },
    },
    body: {
      en: [
        { p: 'Two graduate students describe a prototype called Google: the crawler, the repository, the inverted index, the sort by document ID, and PageRank — the idea that a page’s importance can be read off the graph of who links to it, recursively, because a link is a person spending their own reputation on somebody else.' },
        { p: 'What makes it worth rereading is not the algorithm, it is the engineering honesty. The paper contains disk sizes, index layouts, a note that they compress the repository with zlib rather than bzip for speed, and a frank section on what does not work yet. It is a systems paper that happens to have changed the economy.' },
        { quote: 'The citation (link) graph of the web is an important resource that has largely gone unused in existing web search engines.', by: 'Brin & Page, 1998' },
        { h: 'Why I keep returning to it' },
        { p: 'Two reasons. First, it is the cleanest example I know of a ranking signal built on an external, hard-to-fake behaviour rather than on what the document says about itself. Every SEO argument since 1998 is a fight over that sentence, and my SEO agents are built around it: authority is earned in the graph, on-page work only removes obstacles.' },
        { p: 'Second, retrieval came back. RAG is this paper with embeddings where the inverted index was — the same problem of finding the twenty documents worth putting in front of an expensive reader, the same trade-off between recall and cost. When someone tells me their RAG pipeline is “just a vector search”, I think of the twenty pages Brin and Page needed to explain why it is not.' },
        { sources: [
          { t: 'Sergey Brin & Lawrence Page — The Anatomy of a Large-Scale Hypertextual Web Search Engine (Stanford)', u: 'http://infolab.stanford.edu/~backrub/google.html' },
          { t: 'PageRank — Wikipedia', u: 'https://en.wikipedia.org/wiki/PageRank' },
        ] },
      ],
      fr: [
        { p: 'Deux doctorants décrivent un prototype nommé Google : le crawler, le dépôt de pages, l’index inversé, le tri par identifiant de document, et le PageRank — l’idée que l’importance d’une page se lit dans le graphe de qui pointe vers elle, récursivement, parce qu’un lien est quelqu’un qui dépense sa propre réputation pour un autre.' },
        { p: 'Ce qui mérite une relecture n’est pas l’algorithme, c’est l’honnêteté d’ingénierie. Le papier donne des tailles de disque, des formats d’index, une note expliquant qu’ils compressent le dépôt en zlib plutôt qu’en bzip pour la vitesse, et une section franche sur ce qui ne marche pas encore. Un papier de systèmes qui, accessoirement, a changé l’économie.' },
        { quote: 'Le graphe de citations (de liens) du web est une ressource importante restée largement inexploitée par les moteurs de recherche existants.', by: 'Brin & Page, 1998' },
        { h: 'Pourquoi j’y reviens' },
        { p: 'Deux raisons. D’abord, c’est l’exemple le plus net que je connaisse d’un signal de classement fondé sur un comportement externe et difficile à falsifier, plutôt que sur ce qu’un document dit de lui-même. Tous les débats SEO depuis 1998 sont une bagarre autour de cette phrase, et mes agents SEO sont construits dessus : l’autorité se gagne dans le graphe, le travail on-page ne fait que retirer des obstacles.' },
        { p: 'Ensuite, la recherche d’information est revenue. Le RAG, c’est ce papier avec des embeddings à la place de l’index inversé — même problème : trouver les vingt documents qui méritent d’être placés devant un lecteur coûteux, même compromis entre rappel et coût. Quand on me dit qu’un pipeline RAG « c’est juste une recherche vectorielle », je repense aux vingt pages qu’il a fallu à Brin et Page pour expliquer que non.' },
        { sources: [
          { t: 'Sergey Brin & Lawrence Page — The Anatomy of a Large-Scale Hypertextual Web Search Engine (Stanford)', u: 'http://infolab.stanford.edu/~backrub/google.html' },
          { t: 'PageRank — Wikipédia', u: 'https://fr.wikipedia.org/wiki/PageRank' },
        ] },
      ],
    },
  },

  /* ─────────────────── 6 · THE LAST PROGRAMMING LANGUAGE ────────────────── */
  {
    id: 'last-language',
    tag:   { en: 'talk · 2007', fr: 'conférence · 2007' },
    title: { en: 'the last\nprogramming\nlanguage', fr: 'le dernier\nlangage de\nprogrammation' },
    sum: {
      en: 'A case that Clojure — or its descendants — will be our final abstraction. Controversial, still.',
      fr: 'La thèse que Clojure — ou ses descendants — sera notre dernière abstraction. Toujours polémique.',
    },
    byline: { en: 'robert c. martin', fr: 'robert c. martin' },
    year: 2007,
    read: { en: '4 min read', fr: '4 min de lecture' },
    bg: '#1b1a18', fg: '#f4eedd',
    ico: 'M8 3h8l4 4v14H4V7zM8 3v6h8V3',
    authors: [
      { name: 'Robert C. Martin',
        wiki: { en: 'https://en.wikipedia.org/wiki/Robert_C._Martin', fr: 'https://fr.wikipedia.org/wiki/Robert_C._Martin' } },
    ],
    source: {
      title: 'The Last Programming Language',
      url: 'https://cleancoders.com/episode/clean-code-episode-1',
      where: { en: 'conference talk, from 2007 onwards', fr: 'conférence, à partir de 2007' },
    },
    body: {
      en: [
        { p: 'Martin’s argument runs through the history of programming as a history of removing choices. Structured programming took away <em>goto</em>. Object orientation took away the raw function pointer. Functional programming takes away assignment. Each step removes a freedom that turned out to cost more than it was worth, and the removal is what makes large systems possible.' },
        { p: 'His conclusion was that the last language would be a Lisp — s-expressions, homoiconic, functional by default — because there is nothing left to take away and nothing the syntax cannot absorb. Whether or not you buy Clojure as the endpoint, the framing has held up better than the prediction.' },
        { quote: 'Every advance in language design has been about taking something away from the programmer.', by: 'Robert C. Martin, paraphrased from the talk' },
        { h: 'Why I keep returning to it' },
        { p: 'Because it gives me a rule for judging tools instead of collecting them: what does this take away? TypeScript takes away the implicit any. Rust takes away the dangling pointer. Postgres row-level security takes away the possibility of forgetting the tenant filter. Good abstractions are subtractive, and they are the ones I want in a codebase somebody else will inherit.' },
        { p: 'And it reframes what AI coding actually is. Prompting takes nothing away — it adds a very large freedom, and a very large way to be wrong. Which is why my system spends its effort putting constraints back: one owner per decision, a reviewer that scores against acceptance criteria, a verifier that boots the stack. The harness is where the freedoms get removed again.' },
        { sources: [
          { t: 'Robert C. Martin — Clean Coders / The Last Programming Language', u: 'https://cleancoders.com/episode/clean-code-episode-1' },
          { t: 'Robert C. Martin — Wikipedia', u: 'https://en.wikipedia.org/wiki/Robert_C._Martin' },
        ] },
      ],
      fr: [
        { p: 'Martin relit l’histoire de la programmation comme une histoire de suppressions. La programmation structurée a retiré le <em>goto</em>. L’orienté objet a retiré le pointeur de fonction brut. Le fonctionnel retire l’affectation. Chaque étape supprime une liberté dont le coût s’est révélé supérieur au bénéfice — et c’est cette suppression qui rend les grands systèmes possibles.' },
        { p: 'Sa conclusion : le dernier langage serait un Lisp — s-expressions, homoiconique, fonctionnel par défaut — parce qu’il n’y a plus rien à retirer et rien que la syntaxe ne puisse absorber. Qu’on adhère ou non à Clojure comme point final, le cadre a mieux vieilli que la prédiction.' },
        { quote: 'Chaque progrès dans la conception des langages a consisté à retirer quelque chose au programmeur.', by: 'Robert C. Martin, paraphrase de la conférence' },
        { h: 'Pourquoi j’y reviens' },
        { p: 'Parce que cela me donne une règle pour juger un outil au lieu de les collectionner : que retire-t-il ? TypeScript retire le <em>any</em> implicite. Rust retire le pointeur pendant. La sécurité au niveau des lignes dans Postgres retire la possibilité d’oublier le filtre par locataire. Les bonnes abstractions sont soustractives — et ce sont celles que je veux dans un code que quelqu’un d’autre héritera.' },
        { p: 'Et cela reformule ce qu’est vraiment le code assisté par IA. Le prompt ne retire rien : il ajoute une liberté énorme, et une façon énorme de se tromper. D’où l’effort de mon système pour remettre des contraintes : un responsable par décision, un relecteur qui note sur des critères d’acceptation, un vérificateur qui démarre la stack. Le harness, c’est l’endroit où l’on retire à nouveau des libertés.' },
        { sources: [
          { t: 'Robert C. Martin — Clean Coders / The Last Programming Language', u: 'https://cleancoders.com/episode/clean-code-episode-1' },
          { t: 'Robert C. Martin — Wikipédia', u: 'https://fr.wikipedia.org/wiki/Robert_C._Martin' },
        ] },
      ],
    },
  },
];
