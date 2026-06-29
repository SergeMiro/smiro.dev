/* ═══════════════════════════════════════════════════════════════
   i18n-fr.js — French translations
   - KEYS  : keyed lookups (data-i18n / data-i18n-html attrs)
   - TEXT  : English source-text → French (for pages without keys
              and for dynamically inserted strings)
   Whitespace is normalised before lookup; do not include leading
   or trailing whitespace in keys, and collapse internal whitespace
   to single spaces.
   ════════════════════════════════════════════════════════════════ */

window.I18N_FR = {

  /* ──────────────── keyed (smiro-v2.html) ──────────────── */
  KEYS: {
    "nav.about":          "à propos",
    "nav.work":           "réalisations",
    "nav.ideas":          "idées",
    "nav.stack":          "stack",
    "nav.agents":         "agents",
    "nav.contact":        "contact",
    "nav.cv":             "CV",
    "nav.hire":           "↗ pour recruteurs",
    "nav.jobAlerts":      "Mes alertes emploi",
    "nav.live":           "en direct",

    "hero.eyebrow":       "Dijon, FR · full-stack · agents IA · n8n",
    "hero.title":         "Je construis",
    "hero.sub":           "Serge Miro — dev full-stack, 5+ ans à livrer, beaucoup trop à débugger. Je conçois des systèmes multi-agents : un <strong>exécuteur</strong> bosse sur une tâche, un <strong>réviseur</strong> le note — boucle jusqu'à ce que le score atteigne 90 %. Le reste de mes journées : automatiser les corvées d'entreprise avec n8n pour que les humains s'occupent du reste.",
    "hero.cta1":          "projets sélectionnés →",
    "hero.cta2":          "voir le CV / télécharger",
    "hero.years":         "ans de dev",
    "hero.repos":         "boucles d'agents livrées",
    "hero.coffee":        "vendor lock-in",

    "about.idx":          "à propos",
    "about.h2":           "Cinq ans d'IA en production.",
    "about.kick":         "Démarré à la Légion étrangère — maintenance de serveurs et site du magazine <em>Képi&nbsp;Blanc</em>. Aujourd'hui je construis des boucles agentiques, fine-tune des LLM open-source au budget, et les fais tourner sur de l'infra qui m'appartient vraiment. Allergique au vendor lock-in, gros fan de n8n.",
    "about.s1":           "dev en production",
    "about.s2":           "score de validation réviseur",
    "about.s3":           "back-office manuel supprimé",
    "about.s4":           "vendor lock-in",

    "work.idx":           "réalisations sélectionnées",
    "work.h2":            "Des agents en production.<br><em>Pas</em> dans des pitch decks.",
    "work.kick":          "Boucles multi-agents, automatisation back-office, outils dev. Le genre de trucs qui supprime discrètement 30h par semaine et que personne ne remarque — c'est le but.",

    "proj.1.cat":         "agents IA · back-office",
    "proj.1.d":           "Back-office multi-agents pour campagnes call-center FR. L'exécuteur bosse, le réviseur note, la boucle tourne jusqu'à un score ≥ 90 %. 30+ h/semaine économisées par équipe. URSSAF inclus.",
    "status.production":  "production · v3.2",
    "proj.2.cat":         "IA · conformité",
    "proj.2.d":           "Conformité UE que personne ne veut lire — confiée à des agents que ça ne dérange pas. Multi-langue.",
    "status.active":      "actif",
    "proj.3.cat":         "web · téléphonie",
    "proj.3.d":           "API téléphonie temps réel + agent stats sur chaque appel. T-SQL fait le gros, les dashboards font le bruit.",
    "status.production2": "production",
    "proj.4.cat":         "IA · documents · n8n",
    "proj.4.d":           "Inbox → JSON structuré. L'exécuteur extrait, le réviseur vérifie, n8n route. Avale les e-mails en désordre.",
    "proj.5.cat":         "stats · sécurité · monitoring",
    "proj.5.d":           "Agents stats collectent, agents sécu reniflent, dashboards râlent à ma place. Multi-tenant, SLA-aware, compatible sommeil.",
    "proj.6.cat":         "devops · crypto",
    "proj.6.d":           "Bot multi-exchange — signaux, gestion du risque, back-tests. Labo perso. Pas un conseil financier (please).",
    "status.testing":     "en test",

    "ideas.idx":          "idées & écrits",
    "ideas.h2":           "Idées sur lesquelles je reviens",
    "ideas.kick":         "Papiers fondateurs, essais et moments en IA, programmation & systèmes. Glisser / faire défiler la pile.",
    "ideas.hint":         "Rotation automatique — glisser pour prendre la main",

    "stack.idx":          "le stack",
    "stack.h2":            "Les outils que j'attrape",
    "stack.kick":         "Opiniâtre. Self-hosted par défaut. Sobre où il faut l'être, tranchant là où ça compte.",
    "stack.hint":         "glisser pour réorganiser · double-clic pour éditer · recruteurs : déposez un outil →",
    "stack.shuffle":      "↻ mélanger",
    "stack.tidy":         "⊞ ranger",
    "stack.add":          "proposer un outil",

    "nm.kick":            "épingler sur le tableau",
    "nm.title":           "Quel outil devrait figurer sur <em>mon CV ?</em>",
    "nm.sub":             "Épinglez la techno que vous aimeriez me voir utiliser. Elle apparaît sur le tableau comme un post-it — à votre nom.",
    "nm.tech":            "Technologie",
    "nm.tech_ph":         "GraphQL, Kubernetes, Rust…",
    "nm.name":            "Votre nom",
    "nm.name_ph":         "Marie Dupont",
    "nm.company":         "Entreprise",
    "nm.company_ph":      "Acme",
    "nm.link":            "Lien",
    "nm.link_ph":         "linkedin.com/in/…",
    "nm.site":            "Site de l'entreprise",
    "nm.site_ph":         "acme.com",
    "nm.optional":        "facultatif",
    "nm.cancel":          "annuler",
    "nm.submit":          "épingler sur le tableau ↗",
    "close":              "fermer",

    "agents.idx":         "agents IA",
    "agents.h2":          "Un casting d'",
    "agents.kick":        "50+ agents dédiés, groupés par rôle. Choisissez-en un — son orbe s'éveille, écoute, réfléchit, génère.",
    "orb.session":        "session",
    "orb.start":          "▶ démarrer",
    "orb.stop":           "stop",
    "orb.idle":           "au repos",
    "orb.listening":      "écoute",
    "orb.thinking":       "réfléchit",
    "orb.generating":     "génère",
    "orb.speaking":       "parle",

    "contact.idx":        "me contacter",
    "contact.h2":         "Besoin d'un",
        "contact.kick":       "Je prends quelques projets sélectionnés — systèmes multi-agents, automatisation n8n back-office, apps full-stack natives IA, ou sauvetage de codebase en rade. Je réponds sous 24h (l'agent exécuteur me le rappelle).",
    "footer.left":        "© 2026 Serge Miro · fait main à Dijon, FR",
    "footer.right":       "smiro"
  },

  /* ──────────────── source-text lookups (for-employers.html etc.) ──────────────── */
  TEXT: {
    /* nav / header */
    "miro":                          "miro",
    "work":                          "réalisations",
    "stack":                         "stack",
    "agents":                        "agents",
    "↗ hire me":                     "↗ me recruter",
    "Chat with my":                  "Parlez avec mon",
    "AI avatar":                     "avatar IA",
    "ask anything · before we meet": "posez vos questions · avant qu'on se rencontre",
    "Serge's":                       "Serge,",
    "online · ready to talk":        "en ligne · prêt à discuter",
    "Talk by voice":                 "Parler à la voix",
    "or pick a question":            "ou choisissez une question",
    "Hi 👋 I'm Serge's":             "Salut 👋 Je suis l'avatar IA de Serge",
    "— trained on his CV, projects and case studies. Ask me anything.":
                                     "— entraîné sur son CV, ses projets et ses études de cas. Posez-moi vos questions.",
    "HR":                            "RH",
    "Key projects from the last 5 years":
                                     "Projets clés des 5 dernières années",
    "CTO":                           "CTO",
    "How do you work with a team?":  "Comment travaillez-vous en équipe ?",
    "How do you build AI agents?":   "Comment construisez-vous des agents IA ?",
    "Talk by voice":                 "Parler par la voix",
    "or pick a question":            "ou choisis une question",
    "Or type a question…":          "Ou tape une question…",
    "What's your stack?":            "C'est quoi votre stack ?",
    "Open to relocation?":           "Ouvert à la mobilité ?",

    /* hero */
    "for":                           "pour",
    "recruiters & hiring managers":  "recruteurs & responsables embauche",
    "I don't":                       "Je ne",
    "apply":                         "postule",
    "for jobs.":                     "pas aux offres.",
    "I":                             "Je",
    "build a system":                "construis un système",
    "to find them.":                 "pour les trouver.",
    "My n8n+AI pipeline spots a vacancy 4–8 min after it's posted, filters it, drafts the application, pings me on Telegram.":
      "Mon pipeline n8n+IA détecte une offre 4 à 8 min après publication, la filtre, prépare la candidature, me pingue sur Telegram.",
    "While other candidates refresh job boards and miss windows, my n8n+AI pipeline sees a vacancy 4–8 minutes after it's posted, filters it, drafts the application, and pings me on Telegram.":
      "Pendant que les autres candidats rafraîchissent les job boards et ratent les créneaux, mon pipeline n8n+IA voit une offre 4 à 8 minutes après sa publication, la filtre, rédige la candidature et me pingue sur Telegram.",
    "You're reading this because the system worked.":
      "Si vous lisez ceci, c'est que le système a fonctionné.",
    "avg. detection":                "détection moy.",
    "min":                           "min",
    "platforms":                     "plateformes",
    "years building":                "ans d'expérience",
    "based in":                      "basé à",
    "Dijon":                         "Dijon",

    /* tl;dr */
    "tl;dr — what you get":          "tl;dr — ce que vous obtenez",
    "A senior who":                  "Un senior qui",
    "ships":                         "livre",
    ", not just talks.":             ", pas qui parle.",
    "Full-stack + AI & automation. Frameworks, not just code.":
      "Full-stack + IA & automatisation. Des frameworks, pas juste du code.",
    "Full-stack engineer with deep AI & automation experience. I bring frameworks, not just code.":
      "Ingénieur full-stack avec une expérience poussée en IA & automatisation. J'apporte des frameworks, pas juste du code.",
    "AI engineer on a 15-year IT foundation. I build with AI daily — and ship working products in days.":
      "Ingénieur IA sur 15 ans de fondations IT. Je construis avec l'IA au quotidien — et je livre des produits qui marchent en quelques jours.",
    "Vibe coding daily · Claude Code · Cursor": "Vibe coding au quotidien · Claude Code · Cursor",
    "Multi-agent systems · RAG · MCP": "Systèmes multi-agents · RAG · MCP",
    "Full-stack: React · Node · Python · TypeScript": "Full-stack : React · Node · Python · TypeScript",
    "Self-hosted infra: VPS, Docker, n8n, security": "Infra self-hosted : VPS, Docker, n8n, sécurité",
    "Production mindset — not prototypes":
      "Mentalité production — pas prototype",
    "↗ contact serge@smiro.dev":     "↗ contact serge@smiro.dev",

    /* pillars */
    "Full-stack":                    "Full-stack",
    "development":                   "dev",
    "Full-stack at":                 "Full-stack à la",
    "AI speed":                      "vitesse de l'IA",
    "I prototype with Claude Code & Cursor and harden with 15 years of engineering. Frontend, backend, infrastructure — idea to production in days, not sprints.":
      "Je prototype avec Claude Code & Cursor et je consolide avec 15 ans d'ingénierie. Frontend, backend, infrastructure — de l'idée à la production en jours, pas en sprints.",
    "Front, back, infra — I own the whole stack. 25 years shipping things that survive production.":
      "Front, back, infra — toute la stack m'appartient. 25 ans à livrer du code qui tient en production.",
    "Frontend, backend, infrastructure — I own the whole stack. Twenty-five years of shipping things that actually work in production.":
      "Frontend, backend, infrastructure — toute la stack m'appartient. Vingt-cinq ans à livrer des choses qui marchent vraiment en production.",
    "AI":                            "IA",
    "Agentic systems that do real work — not chatbots. Multi-step, tool-use, RAG, eval, fallbacks.":
      "Des systèmes agentiques qui font du vrai travail — pas des chatbots. Multi-étapes, tool-use, RAG, eval, fallbacks.",
    "I build agentic systems that do real work — not chatbots. Multi-step pipelines, tool-use, RAG, eval, fallbacks. Production-grade.":
      "Je construis des systèmes agentiques qui font du vrai travail — pas des chatbots. Pipelines multi-étapes, tool-use, RAG, eval, fallbacks. Niveau production.",
    "Agentic systems that do real work — not chatbots. An executor performs, a reviewer scores, the loop runs until ≥90% quality. RAG, MCP, evals, fallbacks.":
      "Des systèmes agentiques qui font du vrai travail — pas des chatbots. Un exécuteur agit, un relecteur note, la boucle tourne jusqu'à ≥90 % de qualité. RAG, MCP, evals, fallbacks.",
    "automation":                    "automatisation",
    "Self-hosted n8n on my VPS. Workflows that run 24/7, integrate 50+ services, kill manual ops.":
      "n8n self-hosted sur mon VPS. Des workflows qui tournent 24/7, intègrent 50+ services, tuent les tâches manuelles.",
    "Self-hosted n8n on my own VPS. I architect workflows that run 24/7, integrate 50+ services, and replace 90% of manual ops.":
      "n8n self-hosted sur mon propre VPS. J'architecture des workflows qui tournent 24/7, intègrent 50+ services et remplacent 90 % des opérations manuelles.",
    "Self-hosted n8n on a VPS I provision, deploy and harden myself. Workflows that run 24/7, integrate 50+ services, and replace 90% of manual ops.":
      "n8n self-hosted sur un VPS que je provisionne, déploie et durcis moi-même. Des workflows qui tournent 24/7, intègrent 50+ services et remplacent 90 % des opérations manuelles.",

    /* case study */
    "case study · my job alerts":    "étude de cas · mes alertes emploi",
    "How I get to":                  "Comment j'arrive dans",
    "the inbox":                     "la boîte mail",
    "first.":                        "en premier.",
    "A live system I built and run for myself. Proof that pillars 02–03 ship. Full pipeline below.":
      "Un système live que j'ai construit et que je fais tourner pour moi. La preuve que les piliers 02–03 livrent. Pipeline complet ci-dessous.",
    "A live system I built and run for myself. It's also the proof that what I describe in pillar 02–03 actually works in production. Here's the entire pipeline.":
      "Un système live que j'ai construit et que je fais tourner pour moi. C'est aussi la preuve que ce que je décris aux piliers 02–03 fonctionne vraiment en production. Voici le pipeline complet.",
    "My Job Alerts":                 "Mes alertes emploi",
    "· workflow":                    "· workflow",

    /* stage labels */
    "source":                        "source",
    "ai agent":                      "agent IA",
    "filter":                        "filtre",
    "database":                      "base de données",
    "output":                        "sortie",
    "trigger":                       "déclencheur",
    "sources":                       "sources",
    "scrape":                        "scrape",
    "store":                         "stockage",
    "act":                           "action",

    "swipe to explore the pipeline": "glissez pour explorer le pipeline",
    "live · a job moving through":   "en direct · une offre traverse",
    "at":                            "chez",
    "LinkedIn":                      "LinkedIn",
    "platforms unified":             "plateformes unifiées",
    "manual scrolling":              "scroll manuel",
    "running on my VPS":             "tourne sur mon VPS",

    /* what this means */
    "open source · github":          "open source · github",
    "Pinned":                         "Dépôts",
    "repositories":                   "épinglés",
    "The work I keep on top of my GitHub — AI products, full-stack apps and the platform code behind them. Live from":
      "Le travail que je garde en haut de mon GitHub — produits IA, apps full-stack et le code de plateforme derrière. En direct depuis",
    "view all 16 repositories on GitHub":
      "voir les 16 dépôts sur GitHub",
    "what this means for you":       "ce que ça veut dire pour vous",
    "The pipeline is the":           "Le pipeline EST le",
    "portfolio":                     "portfolio",
    "Hiring for senior IC with AI / automation / platform? These are the patterns I bring day one.":
      "Vous recrutez un senior IC avec IA / automatisation / plateforme ? Voilà les patterns que j'apporte dès le premier jour.",
    "If you're hiring for a senior engineering role with AI, automation, or platform components — these are the patterns I'd bring to your team on day one.":
      "Si vous recrutez pour un poste d'ingénieur senior avec une composante IA, automatisation ou plateforme — voilà les patterns que j'apporterais à votre équipe dès le premier jour.",
    "I think in":                    "Je pense en",
    "systems":                       "systèmes",
    ", not tickets.":                ", pas en tickets.",
    "The pipeline above wasn't a ticket — I saw a workflow problem, designed end-to-end, shipped. Same approach to product work.":
      "Le pipeline ci-dessus n'était pas un ticket — j'ai vu un problème de workflow, j'ai conçu de bout en bout, j'ai livré. Même approche côté produit.",
    "\"Production over prototype\" isn't a slogan — it's how I scope.":
      "« Production plutôt que prototype » n'est pas un slogan — c'est comme ça que je cadre.",
    "AI is a":                       "L'IA est un",
    "tool":                          "outil",
    ", not the product.":            ", pas le produit.",
    "Shipping LLM features since GPT-3.5. I know where AI breaks (eval, hallucination, cost, latency) and how to ship around it. Claude is one piece — deterministic code catches its mistakes.":
      "Je livre des features LLM depuis GPT-3.5. Je sais où l'IA casse (eval, hallucinations, coût, latence) et comment livrer autour. Claude n'est qu'un morceau — du code déterministe rattrape ses erreurs.",
    "\"Senior\" with AI means knowing when":
      "« Senior » avec l'IA, c'est savoir quand",
    "not":                           "ne pas",
    "to use it.":                    "l'utiliser.",
    "I run my own":                  "Je gère ma propre",
    "infra":                         "infra",
    "VPS, Docker, n8n, Postgres, Firecrawl, Telegram bots — self-hosted and hardened (OWASP, firewalls, secrets), on hardware I pay for. I'd rather understand a system than rent it.":
      "VPS, Docker, n8n, Postgres, Firecrawl, bots Telegram — self-hosted et durci (OWASP, pare-feu, secrets), sur du matériel que je paie. Je préfère comprendre un système que le louer.",
    "If I can't run it locally, I don't trust it in prod.":
      "Si je ne peux pas le lancer en local, je ne lui fais pas confiance en prod.",
    "I write":                       "J'écris en",
    "French":                        "français",
    "& English.":                    "& anglais.",
    "Dijon, FR — open to remote / hybrid across FR & EU. Specs, reviews, customer copy in both.":
      "Dijon, FR — ouvert à distance / hybride en FR & UE. Specs, revues, copy client dans les deux langues.",
    "Native FR. Senior-level EN. C++ in CSS.":
      "FR natif. EN niveau senior. C++ en CSS.",
    "Fluent FR · senior-level EN · native UA/RU. C++ in CSS.":
      "FR courant · EN niveau senior · UA/RU natif. C++ en CSS.",

    /* CTA */
    "Want this kind of":             "Vous voulez ce genre de",
    "system thinking":               "pensée systémique",
    "on your team?":                 "dans votre équipe ?",
    "Senior IC / tech lead. France or EU-remote. CV on request — though honestly, this page is most of it.":
      "Senior IC / tech lead. France ou EU-remote. CV sur demande — mais honnêtement, cette page en est l'essentiel.",
    "I'm open to senior IC and tech lead roles in France or EU-remote. CV in FR or EN on request — though honestly, this page is most of it.":
      "Je suis ouvert à des postes senior IC et tech lead en France ou en EU-remote. CV en FR ou EN sur demande — mais honnêtement, cette page en est l'essentiel.",
    "I'm open to AI engineering and senior full-stack roles — fully remote across EU, or hybrid in France. The CV is one click away — though honestly, this page is most of it.":
      "Je suis ouvert aux postes d'ingénieur IA et senior full-stack — full remote en UE, ou hybride en France. Le CV est à un clic — mais honnêtement, cette page en est l'essentiel.",
    "CV · AI engineer (EN)":         "CV · ingénieur IA (EN)",
    "see my projects":               "voir mes projets",
    "↗ serge@smiro.dev":             "↗ serge@smiro.dev",
    "see selected work":             "voir les projets",
    "↗ github":                      "↗ github",
    "© 2026 Serge Miro · handcrafted in Dijon, FR":
      "© 2026 Serge Miro · fait main à Dijon, FR",
    "← back to portfolio":           "← retour au portfolio",
    "· v2 · apr '26":                "· v2 · avr. '26",

    /* dynamic JS strings — pipeline nodes (descriptions, titles, meta, stage labels) */
    "Cron trigger":                  "Déclencheur cron",
    "Every 5 min n8n wakes up and queries every job source in parallel. The heartbeat.":
      "Toutes les 5 min, n8n se réveille et interroge chaque source d'offres en parallèle. Le battement de cœur.",
    "n8n · every 5 min":             "n8n · toutes les 5 min",
    "Saved filter URL — role, seniority, geo, freshness. Polled every 5 min.":
      "URL filtrée — poste, séniorité, géo, fraîcheur. Polled toutes les 5 min.",
    "cron · every 5m":               "cron · toutes les 5 min",
    "France Travail":                "France Travail",
    "Official API + saved searches. Most active FR source.":
      "API officielle + recherches sauvegardées. Source FR la plus active.",
    "Indeed":                        "Indeed",
    "Role + location + 24h freshness filter.":
      "Filtre poste + lieu + fraîcheur 24 h.",
    "Firecrawl":                     "Firecrawl",
    "Fetches the search page. Returns clean markdown for the LLM.":
      "Récupère la page de résultats. Renvoie du markdown propre pour le LLM.",
    "api · self-hosted":             "api · self-hosted",
    "Extractor agent":               "Agent extracteur",
    "LLM reads markdown, drops noise, emits uniform JSON — title, company, salary, location, url, posted_at.":
      "Le LLM lit le markdown, jette le bruit, sort un JSON uniforme — titre, société, salaire, lieu, url, posted_at.",
    "claude · structured output":    "claude · output structuré",
    "Geo allowlist":                 "Liste blanche géo",
    "Country, city, hybrid / remote / in-office rules.":
      "Pays, ville, règles hybride / remote / présentiel.",
    "Salary floor":                  "Plancher salaire",
    "Per-role minimum. Auto-skips low-balls.":
      "Minimum par poste. Saute auto les low-balls.",
    "Stack denylist":                "Liste noire stack",
    "Blocked tech, industries, red-flag phrasing.":
      "Techs bloquées, secteurs, formulations red-flag.",
    "Cross-platform dedupe":         "Dédup multi-plateformes",
    "Same job often posted 3×. Fingerprint by company + title + location, keep the earliest.":
      "Une même offre publiée 3× souvent. Empreinte société + titre + lieu, on garde la plus ancienne.",
    "Postgres":                      "Postgres",
    "All vacancies with status, source, scores. Feeds the analytics dashboard.":
      "Toutes les offres avec statut, source, scores. Alimente le dashboard analytics.",
    "postgres · supabase":           "postgres · supabase",
    "Telegram alert":                "Alerte Telegram",
    "Push with role, salary, deep link. I see it within minutes.":
      "Notification poste, salaire, deep-link. Je la vois en quelques minutes.",
    "bot · realtime":                "bot · temps réel",
    "Application agent":             "Agent candidature",
    "For shortlisted roles: tailors CV + drafts":
      "Pour les postes shortlistés : ajuste le CV + rédige la",  /* before <em> */
    ". I review and submit.":        ". Je relis et envoie.",
    "claude · template-aware":       "claude · gabarit-aware",
    "Analytics agent":               "Agent analytics",
    "Weekly digest — salary trends, hot stacks, hiring velocity. All from my DB.":
      "Digest hebdo — tendances salaires, stacks chauds, vélocité de recrutement. Le tout depuis ma DB.",
    "scheduled · digest":            "planifié · digest",

    /* stage label compositions used in node info */
    "00 · trigger":                  "00 · déclencheur",
    "01 · source":                   "01 · source",
    "02 · scrape":                   "02 · scrape",
    "02 · extract":                  "02 · extraction",
    "03 · filter":                   "03 · filtre",
    "04 · dedupe":                   "04 · dédup",
    "04 · store":                    "04 · stockage",
    "05 · alert":                    "05 · alerte",
    "05 · apply":                    "05 · candidature",
    "05 · learn":                    "05 · apprentissage"
  }
};
