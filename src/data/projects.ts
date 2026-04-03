export interface Project {
  name: string;
  repoName: string;
  description: string;
  stack: string[];
  category: 'ai' | 'web' | 'devops' | 'oss';
  status?: 'Production' | 'Active' | 'Testing';
  highlight?: string;
  github?: string;
  homepage?: string;
}

export const projects: Project[] = [
  {
    name: 'Vistalid',
    repoName: 'Vistalid',
    description: 'AI-powered back-office automation for French companies. Smart email parsing, ticket routing, URSSAF integration.',
    stack: ['Next.js', 'Claude API', 'PostgreSQL', 'n8n', 'Docker'],
    category: 'ai',
    status: 'Production',
    highlight: 'Reduces manual work by 80%',
  },
  {
    name: 'SimplifyEU',
    repoName: 'SimplifyEU',
    description: 'AI solutions for EU business compliance and workflow automation. Multi-language support.',
    stack: ['Python', 'LangChain', 'Supabase', 'FastAPI'],
    category: 'ai',
    status: 'Active',
    github: 'https://github.com/SergeMiro/SimplifyEU',
  },
  {
    name: 'API Téléphonie SDA',
    repoName: 'API-Telephonie-SDA',
    description: 'Telephony API integration with real-time call data processing and T-SQL analytics.',
    stack: ['T-SQL', 'SQL Server', 'JavaScript', 'REST API'],
    category: 'web',
    status: 'Production',
    github: 'https://github.com/SergeMiro/API-Telephonie-SDA',
  },
  {
    name: 'Parser AI',
    repoName: 'Parser-AI',
    description: 'Intelligent document and email parser. Extracts structured data from unstructured content.',
    stack: ['Python', 'OpenAI', 'n8n', 'PostgreSQL'],
    category: 'ai',
    status: 'Production',
  },
  {
    name: 'Charte Graphique Fimainfo',
    repoName: 'Charte-Graphique-Fimainfo',
    description: 'Design system and brand guidelines platform for Fimainfo One.',
    stack: ['TypeScript', 'Next.js', 'Tailwind'],
    category: 'web',
    github: 'https://github.com/SergeMiro/Charte-Graphique-Fimainfo',
  },
  {
    name: 'Trading Automation',
    repoName: 'Trading-Automation',
    description: 'Multi-exchange crypto trading bot with signal generation and risk management.',
    stack: ['Python', 'WebSocket APIs', 'PostgreSQL'],
    category: 'devops',
    status: 'Testing',
  },
];

export const featuredProjects = projects.slice(0, 3);

export const filters = [
  { label: 'All', value: 'all' },
  { label: 'AI & Automation', value: 'ai' },
  { label: 'Web Apps', value: 'web' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Open Source', value: 'oss' },
] as const;
