/* works.js — one page per card of the /02 “Dépôts GitHub” deck.
 *
 * Bilingual in the DATA, not in the TEXT map of i18n-fr.js: the reader
 * re-renders on `i18n:changed` and picks the branch for the current language.
 * Same contract as articles.js, so the two readers behave alike.
 *
 * Every section below was written against the actual repository — routes,
 * package.json, migrations, CI config — not against memory. Where a project
 * has no public repository (internal work) the page says so instead of
 * pretending otherwise, and lists only what the CV already claims.
 *
 * `id`      — stable slug, also the deep link (#work=<id>)
 * `card`    — the card it belongs to; matched by data-work in index.html
 * `logo`    — real logo asset when the project has one; otherwise the reader
 *             clones the card’s own deco mark, so the plate is never empty
 * `tone/ink`— the card’s two colours, reused for the plate and the rules
 * `sections`— the requested breakdown: what the part is, and per technology
 *             one line on what it is there for
 */
(function () {
  const T = (en, fr) => ({ en, fr });

  window.WORKS_DATA = [

    /* ══════════════════════════════════════════════════════════ 01 */
    {
      id: 'ascofacade',
      card: 'ASCoFacade',
      name: 'ASCoFaçade',
      logo: '/logos/ascofacade.png',
      tone: '#2e2622', ink: '#f4eedd',
      kind: T('client site & back-office', 'site client & back-office'),
      years: '2026',
      status: T('in production', 'en production'),
      stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind 4', 'daisyUI', 'Framer Motion', 'Supabase Auth', 'PostgreSQL', 'Row-Level Security', 'Server Actions', 'Zod', 'react-hook-form', 'pdf-lib', 'jsPDF', 'Uppy + tus', 'exifr', 'Pannellum', 'Recharts', 'Leaflet', 'Google Maps', 'Google Places', 'Resend', 'Telegram Bot API', 'Mistral', 'Gemini', 'RAG', 'PWA', 'Vercel Cron', 'Biome'],
      kick: T(
        'The whole digital side of a façade contractor in the Gard: a shopfront tuned for local search in front, and four role portals behind the login — office, client, sub-contractor and the crew standing on the scaffolding.',
        'Tout le numérique d’un façadier du Gard : une vitrine taillée pour la recherche locale devant, et quatre portails derrière la connexion — bureau, client, sous-traitant et les compagnons sur l’échafaudage.'),
      repo: { url: 'https://github.com/SergeMiro/ASCoFacade', label: 'SergeMiro/ASCoFacade', vis: T('public', 'public') },
      demo: { url: 'https://ascofacade.fr', label: 'ascofacade.fr', note: T('Live client site — the marketing side is open, the four portals sit behind a login.', 'Site client en production — la partie vitrine est ouverte, les quatre portails sont derrière une connexion.') },
      sections: [
        {
          t: T('Shopfront & local SEO', 'Vitrine & référencement local'),
          d: T('Four service pages, six town pages, the realisations gallery, reviews, blog and legal notices — all server-rendered so they can actually be indexed.',
               'Quatre pages services, six pages communes, la galerie de réalisations, les avis, le blog et les mentions légales — tout rendu côté serveur pour être réellement indexable.'),
          tech: [
            { n: 'Next.js 15 App Router', w: T('server rendering plus generated sitemap.ts / robots.ts', 'rendu serveur et sitemap.ts / robots.ts générés') },
            { n: 'Tailwind CSS + daisyUI', w: T('one token set for both the public site and the portals', 'un seul jeu de tokens pour la vitrine et les portails') },
            { n: 'Framer Motion', w: T('page and gallery transitions', 'transitions de page et de galerie') },
            { n: 'Vercel Analytics + Speed Insights', w: T('Core Web Vitals watched on real traffic', 'Core Web Vitals suivis sur le trafic réel') },
          ],
        },
        {
          t: T('Quotes, grants and CERFA forms', 'Devis, aides et formulaires CERFA'),
          d: T('A public estimator for visitors, a fuller calculator for the office, and the French renovation-grant paperwork pre-filled instead of retyped.',
               'Un simulateur public pour les visiteurs, un calculateur complet côté bureau, et la paperasse des aides à la rénovation pré-remplie au lieu d’être resaisie.'),
          tech: [
            { n: 'react-hook-form + Zod', w: T('one schema validates the form and the server action', 'un seul schéma valide le formulaire et l’action serveur') },
            { n: 'pdf-lib / jsPDF', w: T('fills the official CERFA PDFs and prints the quote', 'remplit les PDF CERFA officiels et imprime le devis') },
            { n: 'devis-legal.ts', w: T('the mentions a French quote is legally required to carry', 'les mentions qu’un devis français doit obligatoirement porter') },
          ],
        },
        {
          t: T('Client portal', 'Portail client'),
          d: T('The customer follows their own site: progress reports, photos, documents and a message thread with the office.',
               'Le client suit son propre chantier : comptes rendus, photos, documents et un fil de discussion avec le bureau.'),
          tech: [
            { n: 'Supabase Auth + RLS', w: T('row-level policies, so a client can only ever read their own project', 'politiques au niveau ligne : un client ne lit que son propre chantier') },
            { n: T('Server Actions', 'Server Actions'), w: T('no public API surface for the portals at all', 'aucune surface d’API publique pour les portails') },
          ],
        },
        {
          t: T('Sub-contractor portal', 'Portail sous-traitant'),
          d: T('Projects, tasks, daily logs, material requests, documents and a chat — the paperwork a sub-contractor owes the site, in one place.',
               'Projets, tâches, journaux quotidiens, demandes de matériel, documents et un chat — la paperasse que doit un sous-traitant, au même endroit.'),
          tech: [
            { n: 'frappe-gantt', w: T('the planning view, light enough to stay usable on a tablet', 'la vue planning, assez légère pour rester utilisable sur tablette') },
            { n: T('Zod schemas', 'Schémas Zod'), w: T('the same validation on both sides of every form', 'la même validation des deux côtés de chaque formulaire') },
          ],
        },
        {
          t: T('Site app for the crew', 'Application chantier'),
          d: T('Built for a phone in a work glove: check in, shoot the scaffolding, sign off, leave. Uploads survive a dropped 4G connection.',
               'Pensée pour un téléphone dans un gant de chantier : pointer, photographier l’échafaudage, signer, repartir. Les envois survivent à une coupure de 4G.'),
          tech: [
            { n: 'Uppy + tus', w: T('resumable uploads — a lost signal continues instead of restarting', 'envois reprenables — un signal perdu reprend au lieu de recommencer') },
            { n: 'browser-image-compression', w: T('a 12 Mpx site photo shrinks before it leaves the phone', 'une photo de 12 Mpx est réduite avant de quitter le téléphone') },
            { n: 'exifr', w: T('reads the EXIF geotag to tie a photo to the right site', 'lit le géotag EXIF pour rattacher la photo au bon chantier') },
            { n: 'signature_pad', w: T('sign-off on the screen, stored with the report', 'signature à l’écran, stockée avec le compte rendu') },
            { n: 'Pannellum + lightbox', w: T('360° panoramas of a finished façade', 'panoramas 360° d’une façade terminée') },
          ],
        },
        {
          t: T('Office back-office', 'Back-office du bureau'),
          d: T('Leads, quotes, portfolio, reviews, materials, team, settings and a document vault — the day-to-day desk of the company.',
               'Prospects, devis, portfolio, avis, matériaux, équipe, réglages et un coffre à documents — le bureau au quotidien de l’entreprise.'),
          tech: [
            { n: 'Recharts', w: T('lead and revenue charts on the admin dashboard', 'courbes de prospects et de chiffre sur le tableau de bord') },
            { n: 'Google Places', w: T('pulls the company’s real Google reviews', 'récupère les vrais avis Google de l’entreprise') },
            { n: 'Resend', w: T('transactional mail: lead alerts, quotes, reports', 'mail transactionnel : alertes prospects, devis, comptes rendus') },
            { n: 'Google Maps + Leaflet', w: T('sites on a map, and the intervention zones', 'chantiers sur carte, et les zones d’intervention') },
          ],
        },
        {
          t: T('AI layer', 'Couche IA'),
          d: T('Three narrow jobs, not a chatbot bolted on: draft the blog from industry news, answer from the company’s own documents, and score an incoming lead.',
               'Trois tâches précises, pas un chatbot rajouté : rédiger le blog à partir de l’actualité du métier, répondre depuis les documents de l’entreprise, et qualifier un prospect entrant.'),
          tech: [
            { n: T('Provider-agnostic client', 'Client agnostique du fournisseur'), w: T('ai-providers.ts switches model without touching the features', 'ai-providers.ts change de modèle sans toucher aux fonctionnalités') },
            { n: T('RAG over own documents', 'RAG sur ses propres documents'), w: T('answers cite the company’s files, not the open web', 'les réponses citent les fichiers de l’entreprise, pas le web') },
            { n: T('Vercel cron', 'Cron Vercel'), w: T('the blog-news job runs on a schedule, unattended', 'la tâche blog-news tourne à heure fixe, sans surveillance') },
          ],
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════ 02 */
    {
      id: 'extranet-fimainfo',
      card: 'SDA',
      name: 'Extranet Fimainfo',
      logo: '/logos/fimainfo.svg',
      tone: 'var(--accent)', ink: '#fff',
      kind: T('internal platform · telephony', 'plateforme interne · téléphonie'),
      years: '2026',
      status: T('production · preprod on GitLab CI', 'production · preprod sur GitLab CI'),
      stack: ['Next.js 15.5', 'React 19', 'Tailwind v4', 'shadcn/ui', 'Radix UI', 'Zustand', 'Zod', 'jose JWT', 'RBAC', 'Express 4', 'Sequelize 6', 'SQL Server ×4', 'FastAPI', 'Python', 'Qdrant', 'Docling', 'RAG + ACL', 'Mistral', 'Evidence.dev', 'Pino', 'OpenTelemetry', 'SigNoz', 'Brevo', 'MS Teams', 'WebRTC', 'Playwright', 'Ladle', 'Jest', 'Bruno', 'Docker', 'Traefik', 'GitLab CI'],
      kick: T(
        'Fimainfo’s internal telephony platform: DID numbers and their orders, IVR strategies, campaigns, SMS and WhatsApp broadcasts, BI reporting and an AI assistant — a monorepo of five services, ~786 commits over seventeen months.',
        'La plateforme téléphonie interne de Fimainfo : numéros SDA/DID et leurs commandes, stratégies SVI, campagnes, diffusions SMS et WhatsApp, restitution BI et un assistant IA — un monorepo de cinq services, ~786 commits sur dix-sept mois.'),
      repo: { url: 'https://github.com/SergeMiro/SDA', label: 'SergeMiro/SDA', vis: T('public mirror of an internal GitLab', 'miroir public d’un GitLab interne') },
      demo: null,
      demoNote: T('The production platform runs on Fimainfo’s internal corporate network — no public access to production.',
                  'La plateforme de production tourne sur le réseau interne de Fimainfo : pas d’accès public au prod.'),
      sections: [
        {
          t: T('Web interface — INTERFACE/', 'Interface web — INTERFACE/'),
          d: T('Around sixty screens: DID management, clients, campaigns, orders, reference data, archive, IVR strategies, SMS/WhatsApp, audit, BI and administration. It is also the BFF — the browser never talks to a backend directly.',
               'Une soixantaine d’écrans : gestion des DID, clients, campagnes, commandes, référentiels, archive, stratégies SVI, SMS/WhatsApp, audit, BI et administration. C’est aussi le BFF — le navigateur ne parle jamais directement à un backend.'),
          tech: [
            { n: 'Next.js 15.5 + React 19', w: T('server rendering and the BFF proxy in one deployment', 'rendu serveur et proxy BFF dans un seul déploiement') },
            { n: 'Tailwind v4 + shadcn/ui + Radix', w: T('one design system, tokens in globals.css', 'une seule design system, tokens dans globals.css') },
            { n: 'Zustand + React Context', w: T('seven stores for state, theme and settings', 'sept stores pour l’état, le thème et les réglages') },
            { n: 'react-hook-form + Zod', w: T('every form validated against one schema', 'chaque formulaire validé contre un seul schéma') },
            { n: T('jose in an httpOnly cookie', 'jose dans un cookie httpOnly'), w: T('own JWT auth — no NextAuth, nothing readable from JS', 'auth JWT maison — pas de NextAuth, rien de lisible depuis JS') },
            { n: 'Playwright + Ladle', w: T('role-based e2e runs and visual snapshots of every story', 'e2e par rôle et captures visuelles de chaque story') },
            { n: T('ESLint rule no-unaccented-fr', 'Règle ESLint no-unaccented-fr'), w: T('French diacritics enforced in the UI by CI, not by review', 'diacritiques françaises imposées par la CI, pas par la relecture') },
          ],
        },
        {
          t: T('Unified API — api/', 'API unifiée — api/'),
          d: T('Three APIs merged into one on port 3026: telephony (30 controllers), IVR strategies, and read-only reference data. It reaches four separate SQL Server estates with a pool per estate.',
               'Trois API fusionnées en une seule sur le port 3026 : téléphonie (30 contrôleurs), stratégies SVI, et référentiel en lecture seule. Elle interroge quatre parcs SQL Server distincts, avec un pool par parc.'),
          tech: [
            { n: 'Express 4 + Sequelize 6 + MSSQL', w: T('one API over four database estates', 'une seule API au-dessus de quatre parcs de bases') },
            { n: 'jose HS256 (X-Auth-User)', w: T('service-to-service token only the BFF can sign', 'jeton de service à service que seul le BFF peut signer') },
            { n: 'BaseController', w: T('~1400 lines of generic CRUD, so a new table is a config', '~1400 lignes de CRUD générique : une nouvelle table est une config') },
            { n: 'Pino + OpenTelemetry → SigNoz', w: T('structured logs and traces on the same request id', 'logs structurés et traces sur le même identifiant de requête') },
            { n: T('node-cron driven by system_config', 'node-cron piloté par system_config'), w: T('schedules live in the database, not in the code', 'les horaires vivent en base, pas dans le code') },
            { n: T('Jest + a Bruno collection', 'Jest + une collection Bruno'), w: T('unit tests plus 69 recorded API calls', 'tests unitaires et 69 appels d’API enregistrés') },
          ],
        },
        {
          t: T('AI assistant “Vincenza” — parlant-agent/', 'Assistant IA « Vincenza » — parlant-agent/'),
          d: T('An assistant that reads the platform rather than the web: it can summarise the estate, search the audit trail, quote the documentation and search the knowledge base. Its own function-calling loop, no agent framework.',
               'Un assistant qui lit la plateforme plutôt que le web : il résume le parc, cherche dans la piste d’audit, cite la documentation et interroge la base de connaissances. Boucle de function-calling maison, sans framework d’agents.'),
          tech: [
            { n: T('FastAPI + SSE streaming', 'FastAPI + streaming SSE'), w: T('answers arrive token by token', 'les réponses arrivent jeton par jeton') },
            { n: T('Four tools', 'Quatre outils'), w: T('get_overview, search_audit, get_documentation, search_knowledge', 'get_overview, search_audit, get_documentation, search_knowledge') },
            { n: T('LLM_PROVIDER switch', 'Bascule LLM_PROVIDER'), w: T('Mistral, OpenCode Zen, OpenAI or Anthropic behind one interface', 'Mistral, OpenCode Zen, OpenAI ou Anthropic derrière une seule interface') },
            { n: T('Server-side role from the JWT', 'Rôle serveur issu du JWT'), w: T('the context is filtered by role on the server — a spoofed role in the request changes nothing', 'le contexte est filtré par rôle côté serveur — un rôle falsifié dans la requête ne change rien') },
            { n: '/summarize', w: T('context compression, so a long conversation stays affordable', 'compression du contexte : une longue conversation reste abordable') },
          ],
        },
        {
          t: T('Knowledge service (RAG)', 'Service de connaissance (RAG)'),
          d: T('The document pipeline behind the assistant: files come in from SFTP or S3, are parsed, chunked, embedded, and answered from — with the permission check before the search, not after.',
               'Le pipeline documentaire derrière l’assistant : les fichiers arrivent par SFTP ou S3, sont analysés, découpés, vectorisés, puis interrogés — avec le contrôle de droits avant la recherche, pas après.'),
          tech: [
            { n: 'Docling', w: T('parses PDF, DOCX and HTML into clean structure', 'analyse PDF, DOCX et HTML en structure propre') },
            { n: T('Qdrant + a SQL catalogue', 'Qdrant + un catalogue SQL'), w: T('vectors on one side, ownership and rights on the other', 'les vecteurs d’un côté, la propriété et les droits de l’autre') },
            { n: T('Deny-by-default ACL', 'ACL en refus par défaut'), w: T('roles read from the database, every read written to the audit', 'rôles lus en base, chaque lecture inscrite à l’audit') },
          ],
        },
        {
          t: T('BI reporting — evidence-reports/', 'Restitution BI — evidence-reports/'),
          d: T('The legacy Excel/VBA reports of a Belgian call centre, rebuilt as a web report suite: inbound and missed calls, comments, the weekly report, re-iteration, tickets.',
               'Les rapports Excel/VBA historiques d’un centre d’appels belge, refaits en suite de rapports web : appels entrants et manqués, commentaires, rapport hebdomadaire, réitération, tickets.'),
          tech: [
            { n: 'Evidence.dev (SvelteKit)', w: T('a report is SQL plus Markdown, versioned like code', 'un rapport est du SQL et du Markdown, versionné comme du code') },
            { n: T('MSSQL connector', 'Connecteur MSSQL'), w: T('reports read the production estate directly', 'les rapports lisent directement le parc de production') },
            { n: T('Static builds per scope', 'Builds statiques par périmètre'), w: T('scopes.json builds one bundle per audience', 'scopes.json produit un bundle par audience') },
            { n: T('iframe behind the shared auth', 'iframe derrière l’auth partagée'), w: T('no second login for the user', 'pas de deuxième connexion pour l’utilisateur') },
          ],
        },
        {
          t: T('Rights, tenancy and audit', 'Droits, multi-tenance et audit'),
          d: T('Ten permission flags, five roles with a rank order, two privilege levels, and a single audit table that fills itself. The rules exist twice on purpose — the frontend copy is for the UI, the backend copy is the one that decides.',
               'Dix drapeaux de permission, cinq rôles ordonnés par rang, deux niveaux de privilège, et une seule table d’audit qui se remplit elle-même. Les règles existent deux fois volontairement — la copie front sert à l’UI, la copie back décide.'),
          tech: [
            { n: T('RBAC · 10 flags', 'RBAC · 10 drapeaux'), w: T('read, create, update, delete, admin, archive, affect, history, referentials, orders', 'read, create, update, delete, admin, archive, affect, historique, référentiels, commandes') },
            { n: 'ROLE_RANK', w: T('client → developpeur → tech → admin → admin_plus', 'client → developpeur → tech → admin → admin_plus') },
            { n: 'attachClientScope', w: T('bridges the management client id to the telecom one — the tenancy seam', 'relie l’identifiant client gestion à celui télécom — la couture multi-tenant') },
            { n: 'audit_global', w: T('written from BaseController, filterable and CSV-exportable in the UI', 'écrite depuis BaseController, filtrable et exportable en CSV dans l’UI') },
          ],
        },
        {
          t: T('Infrastructure and CI/CD', 'Infrastructure et CI/CD'),
          d: T('One Docker image per service, Traefik in front, and a GitLab pipeline whose test stage is three watchdogs that fail the build rather than leave a note.',
               'Une image Docker par service, Traefik devant, et un pipeline GitLab dont l’étape de test est composée de trois chiens de garde qui cassent le build au lieu de laisser un commentaire.'),
          tech: [
            { n: 'Docker + Traefik', w: T('five services, three hostnames, TLS terminated once', 'cinq services, trois noms d’hôte, TLS terminé une seule fois') },
            { n: 'GitLab CI · test → preprod → prod', w: T('deploy over SSH with docker compose up --build', 'déploiement par SSH avec docker compose up --build') },
            { n: T('Three quality gates', 'Trois garde-fous qualité'), w: T('dead-code lint, layout-uniqueness lint, Playwright over the Ladle stories', 'lint du code mort, lint d’unicité du chrome, Playwright sur les stories Ladle') },
            { n: T('12 Claude Code agents + codebase-memory MCP', '12 agents Claude Code + MCP codebase-memory'), w: T('the repo is navigated as a graph, not grepped', 'le dépôt se parcourt comme un graphe, pas au grep') },
          ],
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════ 03 */
    {
      id: 'way2buy',
      card: 'way2buy',
      name: 'way2buy',
      logo: null,
      tone: 'oklch(0.42 0.11 340)', ink: '#fef4ec',
      kind: T('Telegram Mini App · loyalty', 'Mini App Telegram · fidélité'),
      years: '2026',
      status: T('going to production', 'en cours de mise en production'),
      stack: ['Node.js 20', 'Express 4', 'SQLite', 'better-sqlite3', '19 tables · 15 indexes', 'Telegram Mini App SDK', 'Telegram Bot API', 'channel_post webhook', 'long-poll fallback', 'vanilla JS', 'zero build', 'CSS design tokens', 'cashback engine', 'gamification', 'rules engine', 'idempotent scheduler', 'margin tracking', 'Gemini 1.5 Flash', 'AI propose → apply', 'node:test ×81', 'Vercel serverless'],
      kick: T(
        'A buyers’ club that sells through Telegram and does not want a website — its customers scroll pictures and message a person. So the app automates everything around that conversation: cashback, tiers, birthday and holiday discounts that fire themselves, a fitting-room cart, both channels in one feed, margin bookkeeping, and an admin office with AI reports. Zero build step, three dependencies.',
        'Un club d’achat qui vend par Telegram et ne veut pas de site — ses clientes font défiler des photos et écrivent à une personne. L’application automatise donc tout ce qui entoure cette conversation : cashback, niveaux, remises anniversaire et fêtes qui se déclenchent seules, un panier-cabine, les deux canaux dans un seul fil, le suivi de marge, et un back-office avec rapports IA. Aucune étape de build, trois dépendances.'),
      repo: { url: 'https://github.com/SergeMiro/way2buy_telegram-app', label: 'SergeMiro/way2buy_telegram-app', vis: T('public', 'public') },
      demo: {
        url: 'https://way2buy-miniapp.vercel.app', label: 'way2buy-miniapp.vercel.app',
        note: T('Both roles are open without a password: the app authenticates on Telegram identity, and in demo mode that identity is picked in the header. Telegram publishing is simulated, and the database is recreated on every cold start — nothing a visitor does is permanent.',
                'Les deux rôles sont ouverts sans mot de passe : l’application s’authentifie sur l’identité Telegram, et en mode démo cette identité se choisit dans l’en-tête. La publication Telegram est simulée et la base est recréée à chaque démarrage à froid — rien de ce que fait un visiteur n’est permanent.'),
        access: [
          { role: T('client', 'client'),
            how: T('Pick any of the seven demo clients in the header — cashback, tier, purchases and discounts follow the one you choose.',
                   'Choisissez l’un des sept clients de démo dans l’en-tête — cashback, niveau, achats et remises suivent celui que vous prenez.') },
          { role: T('admin', 'admin'),
            how: T('The “Кабінет” tab, open in demo mode: clients, publishing, discount rules, promo codes, margin and the report.',
                   'L’onglet « Кабінет », ouvert en mode démo : clients, publication, règles de remise, codes promo, marge et rapport.') },
        ],
      },
      sections: [
        {
          t: T('The constraint that shaped it', 'La contrainte qui l’a façonnée'),
          d: T('The customers are women aged 30 to 50 with very low digital literacy: they will not look up a product code, but they will scroll pictures and message a person. So the Telegram channel keeps working exactly as before and the Mini App is a second, wider entrance to the same content — never a replacement.',
               'Les clientes ont de 30 à 50 ans et une littératie numérique très faible : elles ne chercheront pas une référence produit, mais elles font défiler des photos et écrivent à une personne. Le canal Telegram continue donc de fonctionner exactement comme avant, et la Mini App est une seconde entrée, plus large, vers le même contenu — jamais un remplacement.'),
          tech: [
            { n: T('Zero learning curve', 'Aucune courbe d’apprentissage'), w: T('every screen has to be obvious without explanation', 'chaque écran doit être évident sans explication') },
            { n: T('Ukrainian UI', 'Interface en ukrainien'), w: T('the whole app, because that is what the audience reads', 'toute l’application, parce que c’est ce que lit le public') },
            { n: T('Staff screens: one or two buttons', 'Écrans employés : un ou deux boutons'), w: T('anything more complex simply will not be used', 'plus complexe que ça ne serait pas utilisé') },
            { n: T('The human middle stays human', 'L’intermédiaire humain reste humain'), w: T('factory relationships are the business — the app automates the bookkeeping around them', 'les relations avec les usines sont le métier — l’app automatise la comptabilité autour') },
          ],
        },
        {
          t: T('Membership club', 'Club de fidélité'),
          d: T('The loyalty rule is one line of configuration — every $3000 spent returns $100 — and it is shown as a progress ring rather than a number in a table.',
               'La règle de fidélité tient en une ligne de configuration — 100 $ rendus par 3000 $ dépensés — et s’affiche en anneau de progression plutôt qu’en chiffre dans un tableau.'),
          tech: [
            { n: T('Cashback wallet', 'Portefeuille cashback'), w: T('the step and the reward are both environment variables', 'le palier et la récompense sont deux variables d’environnement') },
            { n: T('Silver / Gold / Platinum', 'Silver / Gold / Platinum'), w: T('tiers derived from spend, never assigned by hand', 'niveaux dérivés des dépenses, jamais attribués à la main') },
            { n: 'loyalty.js', w: T('milestones, badges and streaks — snapshotBatch() builds the whole client list without an N+1', 'jalons, badges et séries — snapshotBatch() construit toute la liste clients sans N+1') },
          ],
        },
        {
          t: T('Discounts that fire themselves', 'Des remises qui se déclenchent seules'),
          d: T('Four kinds of discount — birthday, holiday, VIP and general — driven by a rules table the owner edits herself, so changing a promotion never means changing code.',
               'Quatre types de remise — anniversaire, fête, VIP et générale — pilotés par une table de règles que la propriétaire modifie elle-même : changer une promotion ne demande jamais de changer le code.'),
          tech: [
            { n: 'birthday.js', w: T('a claim window opens around the date, and birthday_claims makes it once per year', 'une fenêtre s’ouvre autour de la date, et birthday_claims la limite à une fois par an') },
            { n: 'campaigns.js', w: T('campaigns activate and expire on schedule, then materialise into per-customer discounts', 'les campagnes s’activent et expirent à l’heure, puis se matérialisent en remises par cliente') },
            { n: 'rules.js', w: T('discount_rules editable from the admin office', 'discount_rules modifiable depuis le back-office') },
            { n: T('Promo codes', 'Codes promo'), w: T('issued per client, copied in one tap, redemption recorded', 'émis par cliente, copiés en un geste, utilisation enregistrée') },
          ],
        },
        {
          t: T('Feed and fitting room', 'Fil et cabine d’essayage'),
          d: T('Both Telegram channels in one scroll, and a cart that turns ten separate “I want this” messages into one request.',
               'Les deux canaux Telegram dans un seul fil, et un panier qui transforme dix messages « je veux ça » en une seule demande.'),
          tech: [
            { n: T('Two-channel feed', 'Fil à deux canaux'), w: T('Ukraine and Luxury posts merged, filterable by channel', 'publications Ukraine et Luxury fusionnées, filtrables par canal') },
            { n: 'cart.js', w: T('cart_events record what was added, removed and sent — that is where the popular-items view comes from', 'cart_events enregistre ce qui a été ajouté, retiré et envoyé — d’où vient la vue des articles populaires') },
            { n: T('Photo proxy', 'Proxy photo'), w: T('/api/photo/:fileId renders channel images inside the Mini App', '/api/photo/:fileId affiche les images du canal dans la Mini App') },
          ],
        },
        {
          t: T('Telegram, both directions', 'Telegram, dans les deux sens'),
          d: T('Publishing goes app → channel from the admin office; the channel_post webhook brings channel → app, so content posted the old way still appears in the feed.',
               'La publication va app → canal depuis le back-office ; le webhook channel_post ramène canal → app, pour que le contenu publié à l’ancienne apparaisse quand même dans le fil.'),
          tech: [
            { n: T('Mini App SDK + Bot API', 'SDK Mini App + Bot API'), w: T('one composer publishes to two channels', 'un seul éditeur publie vers deux canaux') },
            { n: 'polling.js', w: T('long-polling fallback for local work, where no public webhook URL exists', 'repli en long-polling en local, sans URL publique de webhook') },
            { n: T('Demo mode as a real path', 'Mode démo comme vrai chemin'), w: T('with no bot token the app runs fully and publishing is simulated — that is the public demo', 'sans jeton de bot l’app tourne entièrement et la publication est simulée — c’est la démo publique') },
          ],
        },
        {
          t: T('Admin office and margin', 'Back-office et marge'),
          d: T('The sale price is known immediately, the factory cost arrives days later — so the app chases the missing cost entry instead of reporting a profit it cannot know yet.',
               'Le prix de vente est connu tout de suite, le coût usine arrive des jours plus tard — l’app relance donc la saisie manquante au lieu d’annoncer une marge qu’elle ne peut pas encore connaître.'),
          tech: [
            { n: 'profit.js', w: T('sale and cost paired late, real margin only once both exist', 'vente et coût appariés tardivement, marge réelle seulement quand les deux existent') },
            { n: T('Idempotent scheduler', 'Planificateur idempotent'), w: T('three jobs that reconcile state, so a restart can never miss or double a notification', 'trois tâches qui réconcilient l’état : un redémarrage ne peut ni manquer ni doubler une notification') },
            { n: 'Gemini 1.5 Flash', w: T('the weekly report, with a template narrative as fallback when no key is set', 'le rapport hebdomadaire, avec un texte modèle en repli sans clé') },
            { n: T('AI propose → apply', 'IA proposer → appliquer'), w: T('the admin agent proposes an action and only applies it on confirmation', 'l’agent admin propose une action et ne l’applique qu’après confirmation') },
          ],
        },
        {
          t: T('Engineering choices', 'Choix d’ingénierie'),
          d: T('Three runtime dependencies and no build step, because the thing has to stay maintainable by whoever inherits it — and a schema that moves to Postgres the day it needs to.',
               'Trois dépendances d’exécution et aucune étape de build, parce que le projet doit rester maintenable par celui qui en héritera — et un schéma qui passe à Postgres le jour où il le faut.'),
          tech: [
            { n: T('Zero build', 'Zéro build'), w: T('the file you edit is the file the browser runs — no bundler, no framework runtime', 'le fichier que l’on modifie est celui que le navigateur exécute — aucun bundler, aucun runtime de framework') },
            { n: T('SQLite · 19 tables, 15 indexes', 'SQLite · 19 tables, 15 index'), w: T('better-sqlite3 in-process, schema mapped 1:1 onto Postgres/PocketBase for production', 'better-sqlite3 en processus, schéma transposable 1:1 vers Postgres/PocketBase en production') },
            { n: T('Three CSS layers', 'Trois couches CSS'), w: T('tokens, components, screens — custom properties instead of a utility framework', 'tokens, composants, écrans — propriétés personnalisées plutôt qu’un framework utilitaire') },
            { n: T('81 tests on node:test', '81 tests sur node:test'), w: T('cashback, cart, birthday windows, rules, margin and Telegram — no test framework dependency', 'cashback, panier, fenêtres anniversaire, règles, marge et Telegram — sans dépendance de framework de test') },
          ],
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════ 04 */
    {
      id: 'amc-motors-21',
      // #work-morganauto was shareable before the rename, so the old id keeps
      // resolving here instead of opening nothing
      alias: ['morganauto'],
      card: 'AMC Motors 21',
      name: 'AMC Motors 21 : Automobiles-Mobilités-Conseil',
      logo: null,
      tone: 'oklch(0.6 0.1 115)', ink: '#1b1a18',
      kind: T('web app · automotive', 'application web · automobile'),
      years: '2026',
      status: T('built · no live deployment right now', 'réalisé · pas de déploiement en ligne actuellement'),
      stack: ['Next.js', 'React 19', 'TypeScript', 'Tailwind', 'Radix UI ×21', 'TanStack Query', 'TanStack Virtual', 'Supabase', 'PostgreSQL', 'Row-Level Security', 'Vercel AI SDK', 'OpenAI', 'VIN decode', 'BullMQ', 'Redis', 'Three.js', 'React Three Fiber', 'photo-sphere-viewer', 'TipTap', 'PDFKit', 'ECharts', 'Recharts', 'next-intl ×6', 'next-pwa', '@vercel/og', 'Cheerio', 'Playwright', 'Vitest', 'Biome', 'Docker', 'GitHub Actions', 'n8n'],
      kick: T(
        'A used-car dealer’s whole front and back office: catalogue with 360° interiors, an AI matchmaker for buyers, and a CRM that turns an enquiry into a signed quote.',
        'Tout le front et le back-office d’un concessionnaire de véhicules d’occasion : catalogue avec intérieurs à 360°, un assistant IA pour les acheteurs, et un CRM qui transforme une demande en devis signé.'),
      repo: { url: 'https://github.com/SergeMiro/AMC-Motors-21', label: 'SergeMiro/AMC-Motors-21', vis: T('public', 'public') },
      demo: null,
      demoNote: T('The deployment is switched off — no public access to production; the repository is the reference.',
                  'Le déploiement est éteint : pas d’accès public au prod ; le dépôt est la référence.'),
      sections: [
        {
          t: T('Catalogue and vehicle pages', 'Catalogue et fiches véhicule'),
          d: T('Several hundred vehicles browsable without a spinner, each with a gallery, a 360° interior and its finance figures.',
               'Plusieurs centaines de véhicules parcourables sans attente, chacun avec galerie, intérieur à 360° et son plan de financement.'),
          tech: [
            { n: 'TanStack Query + Virtual', w: T('cached lists and windowed rendering for long catalogues', 'listes en cache et rendu fenêtré pour de longs catalogues') },
            { n: 'photo-sphere-viewer', w: T('the 360° interior of a car, on a phone', 'l’intérieur à 360° d’une voiture, sur téléphone') },
            { n: 'Three.js + React Three Fiber', w: T('the 3D pieces of the vehicle page', 'les éléments 3D de la fiche véhicule') },
            { n: 'next-intl', w: T('the site is localised per route segment', 'le site est localisé par segment d’URL') },
          ],
        },
        {
          t: T('AI search and matchmaker', 'Recherche IA et matchmaker'),
          d: T('“A family estate, diesel, under €18k, before 2020” answered as a filtered list — plus a comparator and a VIN decoder for the details the ad never carries.',
               '« Un break familial, diesel, moins de 18 k€, avant 2020 » répondu par une liste filtrée — plus un comparateur et un décodeur de VIN pour les détails que l’annonce ne porte jamais.'),
          tech: [
            { n: 'Vercel AI SDK + OpenAI', w: T('free text turned into catalogue filters', 'texte libre converti en filtres de catalogue') },
            { n: T('VIN decode endpoint', 'Endpoint de décodage VIN'), w: T('fills a listing from the chassis number', 'remplit une annonce depuis le numéro de châssis') },
            { n: T('Comparator', 'Comparateur'), w: T('side-by-side on the criteria that decide a purchase', 'comparaison sur les critères qui décident un achat') },
          ],
        },
        {
          t: T('CRM and quotes', 'CRM et devis'),
          d: T('Leads arrive, get scored and assigned, and leave as a PDF quote — with the proposal drafted by the model and corrected by a human.',
               'Les prospects arrivent, sont notés et affectés, et repartent en devis PDF — avec la proposition rédigée par le modèle et corrigée par un humain.'),
          tech: [
            { n: T('Bulk lead operations', 'Opérations de masse sur les prospects'), w: T('a hundred leads triaged in one pass', 'une centaine de prospects triés en une passe') },
            { n: 'generate-proposal', w: T('a first draft of the offer, from the lead’s own words', 'un premier jet de l’offre, depuis les mots du prospect') },
            { n: 'PDFKit', w: T('the quote as a sendable document', 'le devis en document envoyable') },
          ],
        },
        {
          t: T('Content, reviews and SEO', 'Contenu, avis et référencement'),
          d: T('The dealer’s blog written from real motoring news, Google reviews answered without a copy-paste, and an SEO check before publishing.',
               'Le blog du concessionnaire rédigé depuis la vraie actualité auto, les avis Google traités sans copier-coller, et un contrôle SEO avant publication.'),
          tech: [
            { n: T('scan-news cron + import-article', 'Cron scan-news + import-article'), w: T('finds and ingests the source before writing', 'trouve et ingère la source avant de rédiger') },
            { n: T('TipTap editor', 'Éditeur TipTap'), w: T('the human keeps the last edit', 'l’humain garde la dernière main') },
            { n: 'generate-review-reply', w: T('a reply per review, in the dealer’s voice', 'une réponse par avis, dans la voix du concessionnaire') },
            { n: '@vercel/og', w: T('a share image generated per article and per vehicle', 'une image de partage générée par article et par véhicule') },
          ],
        },
        {
          t: T('Administration and audit', 'Administration et audit'),
          d: T('Users, settings, notifications, an error page fed by the app itself, and an audit of who changed what.',
               'Utilisateurs, réglages, notifications, une page d’erreurs alimentée par l’application elle-même, et un audit de qui a changé quoi.'),
          tech: [
            { n: 'Supabase Auth + RLS', w: T('roles enforced in the database, not in the UI', 'rôles appliqués en base, pas dans l’UI') },
            { n: T('error-tracking endpoint', 'Endpoint error-tracking'), w: T('client errors land in a table the admin can read', 'les erreurs client arrivent dans une table lisible par l’admin') },
            { n: 'ECharts + Recharts', w: T('inventory and sales analytics', 'analytique de stock et de ventes') },
          ],
        },
        {
          t: T('Delivery', 'Livraison'),
          d: T('Background work off the request path, a PWA for the forecourt, and a test suite that includes the security headers.',
               'Le travail de fond hors du chemin de requête, une PWA pour le parc, et une suite de tests qui inclut les en-têtes de sécurité.'),
          tech: [
            { n: 'BullMQ + ioredis', w: T('imports, scans and generation run as jobs', 'imports, scans et génération tournent en tâches de fond') },
            { n: 'next-pwa', w: T('installable, with an offline route', 'installable, avec une route hors ligne') },
            { n: 'Playwright + GitHub Actions', w: T('11 specs, security headers and visual snapshots among them', '11 specs, dont en-têtes de sécurité et captures visuelles') },
            { n: 'Docker', w: T('the same image locally and on the server', 'la même image en local et sur le serveur') },
          ],
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════ 05 */
    {
      id: 'simplifyeu',
      card: 'SimplifyEU',
      name: 'SimplifyEU',
      logo: null,
      tone: '#f4eedd', ink: '#1b1a18',
      kind: T('AI · compliance · EU back-office', 'IA · conformité · back-office UE'),
      years: '2026',
      status: T('deployed', 'déployé'),
      stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind 4', 'Radix UI', 'next-intl ×3', 'Stripe', 'Turborepo', 'pnpm workspaces', 'FastAPI ×4', 'Python', 'Pydantic v2', 'CrewAI ×5 agents', 'Celery', 'Redis', 'APScheduler', 'pandas', 'pdfplumber', 'PyPDF2', 'pytesseract', 'PaddleOCR', 'fuzzywuzzy', 'reportlab', 'openpyxl', 'Twilio', 'slowapi', 'Supabase', 'PostgreSQL', 'Docker', 'Traefik', 'Vercel', 'GitHub Actions'],
      kick: T(
        'Administrative overhead for EU companies, handled by four small Python services instead of one large application: duplicate invoices, forgotten subscriptions, a crew of assistants and the reminders nobody wants to send.',
        'La charge administrative des entreprises européennes, prise en charge par quatre petits services Python plutôt qu’une grosse application : factures en double, abonnements oubliés, une équipe d’assistants et les rappels que personne ne veut envoyer.'),
      repo: { url: 'https://github.com/SergeMiro/SimplifyEU', label: 'SergeMiro/SimplifyEU', vis: T('public', 'public') },
      demo: { url: 'https://simplify-eu.vercel.app', label: 'simplify-eu.vercel.app', note: T('The marketing side is open; the dashboard needs an account.', 'La partie vitrine est ouverte ; le tableau de bord demande un compte.') },
      sections: [
        {
          t: T('Web application', 'Application web'),
          d: T('The one surface a user sees: locale-prefixed routes, Supabase sign-in, and a dashboard that fans out to whichever service answers the question.',
               'La seule surface vue par l’utilisateur : routes préfixées par langue, connexion Supabase, et un tableau de bord qui distribue vers le service capable de répondre.'),
          tech: [
            { n: 'Next.js App Router · [locale]', w: T('every page exists per language by construction', 'chaque page existe par langue par construction') },
            { n: T('Supabase SSR client', 'Client SSR Supabase'), w: T('the session is read on the server, never trusted from the client', 'la session est lue côté serveur, jamais crue depuis le client') },
            { n: 'Tailwind + Radix', w: T('mobile-first, with a bottom bar on small screens', 'mobile-first, avec une barre basse sur petit écran') },
          ],
        },
        {
          t: T('Invoice duplicate detector', 'Détecteur de factures en double'),
          d: T('The same invoice paid twice is a common and expensive accident. This service reads the PDFs, falls back to OCR when there is no text layer, and matches on fuzzy similarity rather than exact fields.',
               'La même facture payée deux fois est un accident courant et coûteux. Ce service lit les PDF, bascule en OCR quand il n’y a pas de couche texte, et rapproche par similarité floue plutôt que par champs exacts.'),
          tech: [
            { n: 'pdfplumber + PyPDF2', w: T('text and table extraction from the invoice', 'extraction du texte et des tableaux de la facture') },
            { n: T('pytesseract fallback', 'Repli pytesseract'), w: T('a scanned invoice still gets read', 'une facture scannée est lue quand même') },
            { n: 'fuzzywuzzy + Levenshtein', w: T('“INV-2026/12” and “INV 2026 12” are the same document', '« INV-2026/12 » et « INV 2026 12 » sont le même document') },
            { n: T('slowapi rate limiting', 'Limitation de débit slowapi'), w: T('an upload endpoint cannot be used as a grinder', 'un endpoint d’upload ne peut pas servir de broyeur') },
          ],
        },
        {
          t: T('Subscription analyser', 'Analyseur d’abonnements'),
          d: T('Feed it a bank export and it tells you what recurs, what rose in price and what nobody uses — then sends the finding as a PDF.',
               'On lui donne un export bancaire et il dit ce qui se répète, ce qui a augmenté et ce que personne n’utilise — puis envoie le constat en PDF.'),
          tech: [
            { n: T('Celery workers', 'Workers Celery'), w: T('a long analysis runs off the request', 'une analyse longue tourne hors requête') },
            { n: T('CSV + PDF parsers, OCR', 'Parseurs CSV + PDF, OCR'), w: T('the same pipeline for an export or a statement', 'le même pipeline pour un export ou un relevé') },
            { n: T('Classifier + detector', 'Classifieur + détecteur'), w: T('recurrence and category, separated on purpose', 'récurrence et catégorie, séparées volontairement') },
            { n: T('Cache layer', 'Couche de cache'), w: T('a re-run of the same file is free', 'relancer le même fichier ne coûte rien') },
          ],
        },
        {
          t: T('CrewAI assistants', 'Assistants CrewAI'),
          d: T('Five specialised agents — financial, tax, documents, operations and client-facing — rather than one prompt asked to be all five.',
               'Cinq agents spécialisés — financier, fiscal, documents, opérations et relation client — plutôt qu’un seul prompt censé être les cinq.'),
          tech: [
            { n: 'CrewAI', w: T('roles, tasks and hand-off between agents', 'rôles, tâches et passation entre agents') },
            { n: 'FastAPI + gunicorn', w: T('each crew is reachable as a plain HTTP service', 'chaque équipe est joignable comme un simple service HTTP') },
            { n: T('API-key auth per service', 'Auth par clé d’API, par service'), w: T('the web app is the only caller', 'l’application web est le seul appelant') },
          ],
        },
        {
          t: T('Team reminder bot', 'Bot de rappels d’équipe'),
          d: T('Deadlines that a small company keeps missing — filings, renewals, payments — chased automatically instead of by whoever remembers.',
               'Les échéances qu’une petite structure rate sans cesse — déclarations, renouvellements, paiements — relancées automatiquement au lieu de dépendre de qui s’en souvient.'),
          tech: [
            { n: T('Teams and reminders API', 'API équipes et rappels'), w: T('who is reminded, of what, and how often', 'qui est relancé, de quoi, et à quelle fréquence') },
            { n: T('Supabase as the store', 'Supabase comme stockage'), w: T('one schema per service, migrated separately', 'un schéma par service, migré séparément') },
          ],
        },
        {
          t: T('Infrastructure', 'Infrastructure'),
          d: T('A pnpm workspace for the JavaScript side, a Dockerfile per Python service, and Traefik in front — the same shape locally and in production.',
               'Un workspace pnpm côté JavaScript, un Dockerfile par service Python, et Traefik devant — la même forme en local et en production.'),
          tech: [
            { n: T('pnpm workspaces + packages/shared', 'Workspaces pnpm + packages/shared'), w: T('types shared between the app and the services', 'types partagés entre l’application et les services') },
            { n: 'docker-compose + Traefik', w: T('production and preprod described in files', 'production et preprod décrites dans des fichiers') },
            { n: T('Supabase migrations', 'Migrations Supabase'), w: T('six dated migrations, one per feature', 'six migrations datées, une par fonctionnalité') },
            { n: 'GitHub Actions + opengrep', w: T('build and a static security pass on every push', 'build et passe de sécurité statique à chaque push') },
          ],
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════ 06 */
    {
      id: 'smiro-dev',
      card: 'smiro.dev',
      name: 'smiro.dev',
      logo: null,
      tone: '#1b1a18', ink: '#f4eedd',
      kind: T('portfolio · AI avatar', 'portfolio · avatar IA'),
      years: '2026',
      status: T('in production — you are reading it', 'en production — vous le lisez'),
      stack: ['Astro 6', 'TypeScript', 'Tailwind 4', 'LightningCSS', 'zero hydration', 'Three.js', 'WebGL', 'CSS 3D', 'OKLCH theming', 'Vercel Edge', 'SSE streaming', 'OpenRouter', 'Groq', 'Gemini 2.5', 'RAG brief', 'Deepgram Aura', 'Web Speech', 'GitHub API', 'hand-rolled i18n', 'MutationObserver', 'Sharp', 'n8n'],
      kick: T(
        'This site. A static build with no framework runtime on the page, a 3D laptop, a hand-written bilingual layer, and an avatar that answers from a Markdown file I can edit without a deploy.',
        'Ce site. Un build statique sans runtime de framework sur la page, un portable en 3D, une couche bilingue écrite à la main, et un avatar qui répond depuis un fichier Markdown que je modifie sans redéployer.'),
      repo: { url: 'https://github.com/SergeMiro/smiro.dev', label: 'SergeMiro/smiro.dev', vis: T('public', 'public') },
      demo: { url: 'https://smiro.dev', label: 'smiro.dev', note: T('No login: the whole site is the demo.', 'Pas de connexion : le site entier est la démo.') },
      sections: [
        {
          t: T('The build', 'Le build'),
          d: T('Astro compiles plain HTML pages to static files. Nothing hydrates, no framework ships to the browser — the JavaScript on the page is the JavaScript I wrote.',
               'Astro compile des pages HTML simples en fichiers statiques. Rien ne s’hydrate, aucun framework n’est envoyé au navigateur — le JavaScript de la page est celui que j’ai écrit.'),
          tech: [
            { n: 'Astro 6', w: T('static output, three pages, zero client framework', 'sortie statique, trois pages, zéro framework client') },
            { n: 'Vercel', w: T('static hosting plus edge functions in the same project', 'hébergement statique et fonctions edge dans le même projet') },
          ],
        },
        {
          t: T('The AI avatar', 'L’avatar IA'),
          d: T('One browser request per answer, one model call behind it. The system prompt is built server-side from public/kb/sergiy.md — editing that file changes what the avatar says, without touching the code.',
               'Une requête navigateur par réponse, un appel de modèle derrière. Le prompt système est assemblé côté serveur depuis public/kb/sergiy.md — modifier ce fichier change ce que dit l’avatar, sans toucher au code.'),
          tech: [
            { n: T('Vercel edge function', 'Fonction edge Vercel'), w: T('/api/agent-chat streams the answer as it is generated', '/api/agent-chat diffuse la réponse au fil de la génération') },
            { n: 'Gemini', w: T('the model behind both the avatar and the agent sandbox', 'le modèle derrière l’avatar et le bac à sable d’agents') },
            { n: T('A single Markdown brief', 'Un seul brief Markdown'), w: T('cached an hour server-side; no deploy to change the persona', 'mis en cache une heure côté serveur ; aucun déploiement pour changer la persona') },
            { n: 'Deepgram', w: T('speech, so the avatar can be talked to', 'la voix, pour pouvoir lui parler') },
          ],
        },
        {
          t: T('Bilingual layer', 'Couche bilingue'),
          d: T('No i18n library. A key map for authored strings, a text map keyed by the English source for everything else, and a MutationObserver that translates nodes inserted later.',
               'Aucune bibliothèque i18n. Une table de clés pour les chaînes rédigées, une table de textes indexée par la source anglaise pour le reste, et un MutationObserver qui traduit les nœuds insérés plus tard.'),
          tech: [
            { n: T('data-i18n attributes', 'Attributs data-i18n'), w: T('the markup declares what it is', 'le balisage déclare ce qu’il est') },
            { n: 'MutationObserver', w: T('dynamic content is translated too, not just the static page', 'le contenu dynamique est traduit aussi, pas seulement la page statique') },
            { n: 'data-i18n-skip', w: T('marks the subtrees that own their translations, like this reader', 'marque les sous-arbres qui gèrent leurs traductions, comme ce lecteur') },
          ],
        },
        {
          t: T('3D and motion', '3D et animation'),
          d: T('A laptop model that plays the screen content, and a coverflow deck of ideas — both hand-rolled rather than pulled from a component library.',
               'Un modèle de portable qui joue le contenu de l’écran, et un carrousel d’idées en coverflow — les deux écrits à la main plutôt que pris dans une bibliothèque.'),
          tech: [
            { n: 'Three.js', w: T('the laptop, with the page rendered onto its screen', 'le portable, avec la page rendue sur son écran') },
            { n: T('CSS 3D transforms', 'Transformations CSS 3D'), w: T('the deck is real perspective, not a carousel of images', 'le carrousel est de la vraie perspective, pas un défilé d’images') },
          ],
        },
        {
          t: T('Reading layer', 'Couche lecture'),
          d: T('Two readers over the same pattern: the ideas deck opens essays, this deck opens project pages. Both are bilingual in the data and repaint on a language switch.',
               'Deux lecteurs sur le même patron : le carrousel d’idées ouvre des essais, ce carrousel ouvre des pages projet. Les deux sont bilingues dans les données et se repeignent au changement de langue.'),
          tech: [
            { n: 'articles.js / works.js', w: T('content as data, not as duplicated markup', 'le contenu comme données, pas comme balisage dupliqué') },
            { n: T('One overlay per reader', 'Un overlay par lecteur'), w: T('escape, backdrop and outside-click close, focus returned', 'fermeture par échap, fond et clic extérieur, focus rendu') },
          ],
        },
        {
          t: T('Agent sandbox', 'Bac à sable d’agents'),
          d: T('The /06 section lets a visitor run the agent profiles I actually work with, against a model, from the browser.',
               'La section /06 permet à un visiteur de faire tourner, depuis le navigateur, les profils d’agents avec lesquels je travaille réellement.'),
          tech: [
            { n: T('Edge function per call', 'Une fonction edge par appel'), w: T('the key stays on the server', 'la clé reste sur le serveur') },
            { n: 'GitHub API', w: T('repository cards enriched live from @SergeMiro', 'les cartes de dépôt enrichies en direct depuis @SergeMiro') },
          ],
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════ 07 */
    {
      id: 'vistalid',
      card: 'Vistalid',
      name: 'Vistalid',
      logo: null,
      tone: '#2e2622', ink: '#f4eedd',
      kind: T('AI agents · back-office', 'agents IA · back-office'),
      years: '2023 → 2026',
      status: T('production · v3.2', 'production · v3.2'),
      stack: ['Next.js', 'TypeScript', 'Claude API', 'executor + reviewer loop', 'score gate ≥ 90%', 'PostgreSQL', 'n8n', 'Docker'],
      kick: T(
        'The multi-agent back-office behind French call-centre campaigns at Fimainfo: one agent does the task, a second grades it, and the loop runs again until the score clears 90%.',
        'Le back-office multi-agents derrière les campagnes de centres d’appels chez Fimainfo : un agent exécute la tâche, un second la note, et la boucle recommence jusqu’à ce que le score dépasse 90 %.'),
      repo: null,
      repoNote: T('Internal work — no public repository. What is described here is what the CV claims and nothing beyond it.',
                  'Travail interne — pas de dépôt public. Ce qui est décrit ici est ce que le CV affirme, et rien de plus.'),
      demo: null,
      demoNote: T('The production platform runs on the client’s internal network — no public access to production.',
                  'La plateforme de production tourne sur le réseau interne du client : pas d’accès public au prod.'),
      sections: [
        {
          t: T('Executor / reviewer loop', 'Boucle exécuteur / relecteur'),
          d: T('The idea the whole system rests on: never trust a single generation. The executor produces, the reviewer scores against the campaign rules, and anything under the bar goes round again.',
               'L’idée sur laquelle tout le système repose : ne jamais faire confiance à une seule génération. L’exécuteur produit, le relecteur note selon les règles de la campagne, et tout ce qui passe sous la barre repart pour un tour.'),
          tech: [
            { n: 'Claude API', w: T('the two roles, with different prompts and different stakes', 'les deux rôles, avec des prompts et des enjeux différents') },
            { n: T('A hard score threshold', 'Un seuil de score strict'), w: T('≥ 90% or it does not ship — the loop is the quality gate', '≥ 90 % ou ça ne part pas — la boucle est le garde-fou qualité') },
          ],
        },
        {
          t: T('Campaign back-office', 'Back-office de campagne'),
          d: T('Where the operators work: the campaign, its rules, its output and its history, in one interface.',
               'Là où travaillent les opérateurs : la campagne, ses règles, sa production et son historique, dans une seule interface.'),
          tech: [
            { n: 'Next.js', w: T('the operator interface', 'l’interface opérateur') },
            { n: 'PostgreSQL', w: T('campaigns, runs, scores and the audit of both', 'campagnes, exécutions, scores et leur audit') },
          ],
        },
        {
          t: T('Automations', 'Automatisations'),
          d: T('The recurring plumbing around the agents — intake, routing, notification — kept out of the application code.',
               'La plomberie récurrente autour des agents — réception, routage, notification — tenue hors du code applicatif.'),
          tech: [
            { n: 'n8n', w: T('workflows that a non-developer can read and change', 'workflows qu’un non-développeur peut lire et modifier') },
          ],
        },
        {
          t: T('Measured result', 'Résultat mesuré'),
          d: T('Around 80% of the back-office hours on the covered teams removed — 30+ hours a week per team, the figure the client signed off on.',
               'Environ 80 % des heures de back-office supprimées sur les équipes couvertes — plus de 30 heures par semaine et par équipe, le chiffre validé par le client.'),
          tech: [
            { n: 'Docker', w: T('the same deployment on every environment', 'le même déploiement sur chaque environnement') },
          ],
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════ 08 */
    {
      id: 'parser-ai',
      card: 'Parser AI',
      name: 'Parser AI',
      logo: null,
      tone: 'oklch(0.6 0.1 115)', ink: '#1b1a18',
      kind: T('AI · documents · n8n', 'IA · documents · n8n'),
      years: '2025 → 2026',
      status: T('production', 'production'),
      stack: ['Node.js', 'OpenAI API', 'executor + reviewer', 'per-field rules', 'gpt-3-encoder', 'frozen sample set', 'parser_config table', 'multi-format intake', 'n8n', 'SQL'],
      kick: T(
        'Sales enquiries arrive as email — from marketplaces, dealer sites, newsletters, forwarded threads. This turns any of them into the same 40-field JSON record, clean enough to write straight into the CRM.',
        'Les demandes commerciales arrivent par e-mail — places de marché, sites concessionnaires, newsletters, fils transférés. Ceci transforme n’importe laquelle d’entre elles en un même enregistrement JSON de 40 champs, assez propre pour aller directement dans le CRM.'),
      repo: null,
      repoNote: T('Private repository — it holds real customer enquiries.',
                  'Dépôt privé — il contient de vraies demandes de clients.'),
      demo: null,
      demoNote: T('It runs inside the client’s internal pipeline — no public access to production.',
                  'Il tourne dans le pipeline interne du client : pas d’accès public au prod.'),
      sections: [
        {
          t: T('The extraction prompt', 'Le prompt d’extraction'),
          d: T('One long, precise French prompt that defines all forty target fields and the rule for each: what a valid postcode is, which titles are allowed, when a field must stay empty rather than be guessed.',
               'Un seul prompt français long et précis qui définit les quarante champs cibles et la règle de chacun : ce qu’est un code postal valide, quelles civilités sont admises, quand un champ doit rester vide plutôt qu’être deviné.'),
          tech: [
            { n: 'OpenAI API', w: T('the extraction itself, forced to valid JSON with no markdown', 'l’extraction elle-même, forcée en JSON valide sans markdown') },
            { n: T('Per-field rules', 'Règles par champ'), w: T('empty beats invented — the rule that makes the output usable', 'vide plutôt qu’inventé — la règle qui rend la sortie exploitable') },
            { n: 'gpt-3-encoder', w: T('token counting, to keep a long email inside the window', 'comptage des jetons, pour tenir un long e-mail dans la fenêtre') },
          ],
        },
        {
          t: T('Prompt versions and comparison', 'Versions de prompt et comparaison'),
          d: T('Five successive prompt versions kept side by side, and a comparison script that runs a fixed set of real emails through each — so “better” is a measurement, not an impression.',
               'Cinq versions successives du prompt conservées côte à côte, et un script de comparaison qui passe un jeu fixe d’e-mails réels dans chacune — pour que « mieux » soit une mesure et non une impression.'),
          tech: [
            { n: T('A frozen sample set', 'Un jeu d’exemples figé'), w: T('the same inputs every time, so versions are comparable', 'les mêmes entrées chaque fois, pour que les versions soient comparables') },
            { n: 'comparation.js', w: T('field-by-field diff between two versions’ output', 'diff champ par champ entre les sorties de deux versions') },
          ],
        },
        {
          t: T('Orchestration', 'Orchestration'),
          d: T('Two runtimes for the same extractor: an n8n workflow for the clients who own their automation, and a background job inside the telephony platform for the rest.',
               'Deux environnements d’exécution pour le même extracteur : un workflow n8n pour les clients qui possèdent leur automatisation, et une tâche de fond dans la plateforme de téléphonie pour les autres.'),
          tech: [
            { n: T('n8n workflow', 'Workflow n8n'), w: T('mailbox in, CRM out, visible to the client', 'boîte mail en entrée, CRM en sortie, visible par le client') },
            { n: T('Node.js background version', 'Version Node.js en tâche de fond'), w: T('the same prompt, run from the platform', 'le même prompt, exécuté depuis la plateforme') },
            { n: T('parser_config table', 'Table parser_config'), w: T('per-client settings in SQL instead of forks of the code', 'réglages par client en SQL au lieu de forks du code') },
          ],
        },
        {
          t: T('Handling messy input', 'Traiter une entrée sale'),
          d: T('The hard part is never the clean case. HTML newsletters, plain-text forwards, .eml threads and marketplace templates all reduce to the same record — and the model is also asked to fix the spelling it finds on the way.',
               'Le cas difficile n’est jamais le cas propre. Newsletters HTML, transferts en texte brut, fils .eml et gabarits de places de marché se réduisent au même enregistrement — et le modèle corrige au passage l’orthographe qu’il rencontre.'),
          tech: [
            { n: T('Multi-format intake', 'Réception multi-format'), w: T('HTML, plain text and .eml through one path', 'HTML, texte brut et .eml par un seul chemin') },
            { n: T('Result corpus in the repo', 'Corpus de résultats dans le dépôt'), w: T('a hundred stored outputs as the regression baseline', 'une centaine de sorties stockées comme référence de non-régression') },
          ],
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════ 09 */
    {
      id: 'supervision',
      card: 'Supervision',
      name: 'Supervision',
      logo: null,
      tone: '#f4eedd', ink: '#1b1a18',
      kind: T('reporting · call centre', 'restitution · centre d’appels'),
      years: '2025',
      status: T('production', 'production'),
      stack: ['JavaScript', 'jQuery', 'ECharts', 'Tabulator', 'T-SQL views', 'SQL Server', 'hermes_sql bridge', 'vendored libraries', 'one CSS + one JS file', 'Hermès 360 embed'],
      kick: T(
        'Custom supervision screens embedded inside the Hermès 360 telephony platform: inbound and outbound call activity, and SMS volumes per campaign, read straight from SQL views.',
        'Des écrans de supervision sur mesure intégrés dans la plateforme de téléphonie Hermès 360 : activité des appels entrants et sortants, et volumes SMS par campagne, lus directement depuis des vues SQL.'),
      repo: null,
      repoNote: T('Private repository — it targets a client platform.',
                  'Dépôt privé — il cible une plateforme cliente.'),
      demo: null,
      demoNote: T('The screens are embedded in the client’s telephony platform, on its internal network — no public access to production.',
                  'Les écrans sont intégrés à la plateforme téléphonie du client, sur son réseau interne : pas d’accès public au prod.'),
      sections: [
        {
          t: T('SQL as the interface', 'Le SQL comme interface'),
          d: T('The reporting logic lives in versioned SQL views rather than in the page. When a definition changes — what counts as a missed call — one view changes and every screen follows.',
               'La logique de restitution vit dans des vues SQL versionnées plutôt que dans la page. Quand une définition change — ce qui compte comme appel manqué — une vue change et tous les écrans suivent.'),
          tech: [
            { n: T('T-SQL views', 'Vues T-SQL'), w: T('one definition of the metric, shared by every screen', 'une seule définition de l’indicateur, partagée par tous les écrans') },
            { n: T('hermes_sql bridge', 'Pont hermes_sql'), w: T('the platform’s own query channel — no extra backend to host', 'le canal de requête de la plateforme — aucun backend à héberger en plus') },
          ],
        },
        {
          t: T('Charts', 'Graphiques'),
          d: T('Activity over time for inbound and outbound, and SMS volume per campaign — readable on a wall screen in a call-centre room.',
               'L’activité dans le temps pour les entrants et les sortants, et le volume SMS par campagne — lisible sur un écran mural en salle.'),
          tech: [
            { n: 'ECharts', w: T('dense time series that stay legible at a distance', 'séries temporelles denses qui restent lisibles de loin') },
          ],
        },
        {
          t: T('Tables', 'Tableaux'),
          d: T('The detail behind each chart, sortable and filterable, exportable when a supervisor wants to take it away.',
               'Le détail derrière chaque graphique, triable et filtrable, exportable quand un superviseur veut l’emporter.'),
          tech: [
            { n: 'Tabulator', w: T('sorting, filtering and export without a framework', 'tri, filtrage et export sans framework') },
            { n: 'jQuery', w: T('the host platform’s own runtime — integrate, do not import a second one', 'le runtime de la plateforme hôte — s’intégrer, pas en importer un second') },
          ],
        },
        {
          t: T('Constraint that shaped it', 'La contrainte qui l’a façonné'),
          d: T('This is a guest inside someone else’s application: a stylesheet and a script injected into Hermès 360. No build step, no bundler, nothing that could conflict with the host.',
               'C’est un invité dans l’application d’un autre : une feuille de style et un script injectés dans Hermès 360. Pas d’étape de build, pas de bundler, rien qui puisse entrer en conflit avec l’hôte.'),
          tech: [
            { n: T('One CSS + one JS file', 'Un fichier CSS + un fichier JS'), w: T('the whole deliverable, droppable into the host', 'tout le livrable, déposable dans l’hôte') },
            { n: T('Vendored libraries', 'Bibliothèques figées dans le dépôt'), w: T('pinned versions, no network fetch at runtime', 'versions figées, aucun téléchargement à l’exécution') },
          ],
        },
      ],
    },

    /* ══════════════════════════════════════════════════════════ 10 */
    {
      id: 'trading-bot',
      card: 'Trading Bot',
      name: 'Trading Bot',
      logo: null,
      tone: '#1b1a18', ink: '#f4eedd',
      kind: T('multi-agent · markets', 'multi-agents · marchés'),
      years: '2026',
      status: T('personal lab · not financial advice', 'laboratoire personnel · pas un conseil financier'),
      stack: ['Python 3.12', 'SQLAlchemy 2', 'Alembic', 'PostgreSQL', 'Supabase', 'pydantic-settings', 'APScheduler', '6 agents', 'IBKR · ib_insync', 'SEC EDGAR', 'yfinance', 'OpenAI-compatible LLM', 'tenacity', 'structlog', 'pytest', 'OpenClaw', 'Docker'],
      kick: T(
        'A multi-agent earnings bot: it reads the earnings calendar and SEC filings, scores the candidates before the open, and only then decides buy, hold or skip. A personal lab, and explicitly not financial advice.',
        'Un bot multi-agents sur les résultats d’entreprises : il lit le calendrier des publications et les dépôts SEC, note les candidats avant l’ouverture, et décide seulement ensuite acheter, conserver ou passer. Un laboratoire personnel, et explicitement pas un conseil financier.'),
      repo: { url: 'https://github.com/SergeMiro/Trading-bot', label: 'SergeMiro/Trading-bot', vis: T('public', 'public') },
      demo: null,
      demoNote: T('No public access to production: it places real orders through a brokerage account.',
                  'Pas d’accès public au prod : il passe de vrais ordres via un compte de courtage.'),
      sections: [
        {
          t: T('The pipeline', 'Le pipeline'),
          d: T('Seven agents on a clock rather than one loop that does everything: calendar at 05:00, SEC events, broker setup, pre-market data at 07:30, scoring and validation at 10:00, then position monitoring until the close.',
               'Sept agents sur une horloge plutôt qu’une boucle qui fait tout : calendrier à 05h00, événements SEC, préparation du courtier, données pré-ouverture à 07h30, notation et validation à 10h00, puis suivi des positions jusqu’à la clôture.'),
          tech: [
            { n: T('An orchestrator + 7 agents', 'Un orchestrateur + 7 agents'), w: T('each agent has one job and one output', 'chaque agent a une tâche et une sortie') },
            { n: T('Cron schedule in YAML', 'Planning cron en YAML'), w: T('the trading day is a config file, not a code path', 'la journée de bourse est un fichier de config, pas un chemin de code') },
            { n: T('Validation before execution', 'Validation avant exécution'), w: T('a separate agent can veto the buy', 'un agent distinct peut refuser l’achat') },
          ],
        },
        {
          t: T('Data sources', 'Sources de données'),
          d: T('Three independent feeds so a single bad source cannot drive a trade: the filings themselves, market data, and the broker’s own view of the position.',
               'Trois flux indépendants pour qu’une seule mauvaise source ne puisse pas déclencher une opération : les dépôts eux-mêmes, les données de marché, et la vue du courtier sur la position.'),
          tech: [
            { n: T('SEC client + RSS monitor', 'Client SEC + moniteur RSS'), w: T('the filing is read at the source', 'le dépôt est lu à la source') },
            { n: T('Yahoo client', 'Client Yahoo'), w: T('prices and pre-market movement', 'cours et mouvement pré-ouverture') },
            { n: T('IBKR client', 'Client IBKR'), w: T('orders, positions and the account’s real state', 'ordres, positions et l’état réel du compte') },
          ],
        },
        {
          t: T('Scoring and risk', 'Notation et risque'),
          d: T('A scoring engine ranks the candidates, and the risk rules are separate from it — stop-loss, take-profit and a maximum holding time, applied by a monitor that runs after the buy.',
               'Un moteur de notation classe les candidats, et les règles de risque en sont séparées — stop-loss, take-profit et durée de détention maximale, appliquées par un moniteur qui tourne après l’achat.'),
          tech: [
            { n: T('Scoring engine', 'Moteur de notation'), w: T('one comparable number per candidate', 'un nombre comparable par candidat') },
            { n: T('Position monitor', 'Moniteur de position'), w: T('the exit is automated, not left to a decision at the time', 'la sortie est automatisée, pas laissée à une décision du moment') },
            { n: T('Self-learning pass', 'Passe d’auto-apprentissage'), w: T('yesterday’s outcomes feed today’s weights', 'les résultats de la veille alimentent les pondérations du jour') },
          ],
        },
        {
          t: T('Model choice', 'Choix du modèle'),
          d: T('The reasoning steps run on an inexpensive open model behind an OpenAI-compatible endpoint, because the loop runs every trading day and a premium model per decision would cost more than the edge.',
               'Les étapes de raisonnement tournent sur un modèle ouvert peu coûteux derrière un endpoint compatible OpenAI, parce que la boucle tourne chaque jour de bourse et qu’un modèle premium par décision coûterait plus que le gain.'),
          tech: [
            { n: T('OpenAI-compatible client', 'Client compatible OpenAI'), w: T('the provider is swappable in one setting', 'le fournisseur se change en un réglage') },
          ],
        },
        {
          t: T('Storage and running it', 'Stockage et exécution'),
          d: T('Every decision, score and fill is written down, so a bad week can be read back instead of guessed at.',
               'Chaque décision, score et exécution est consigné, pour qu’une mauvaise semaine se relise au lieu de se deviner.'),
          tech: [
            { n: 'SQLAlchemy + Alembic', w: T('typed models and versioned migrations', 'modèles typés et migrations versionnées') },
            { n: 'Supabase (Postgres)', w: T('the history, reachable from anywhere', 'l’historique, joignable de partout') },
            { n: 'Docker + healthcheck', w: T('it restarts itself rather than missing an open', 'il redémarre seul plutôt que de manquer une ouverture') },
            { n: T('Daily report', 'Rapport quotidien'), w: T('an end-of-day summary of what it did and why', 'un récapitulatif de fin de journée de ce qu’il a fait et pourquoi') },
          ],
        },
      ],
    },
  ];
})();
