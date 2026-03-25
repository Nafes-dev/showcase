export const templates = [
  {
    id: "apex",
    title: "Apex SaaS",
    category: "SaaS",
    tag: "Premium",
    url: "https://apex-saas-seven.vercel.app/",
    description: "Revenue acceleration platform with liquid glass aesthetic",
    gradient: "from-violet-600/20 to-blue-600/20",
  },
  {
    id: "ai-builder",
    title: "AI Builder",
    category: "Hero Section",
    tag: null,
    url: "https://ai-builder-zeta-three.vercel.app/",
    description: "AI website builder with motion animations",
    gradient: "from-blue-600/20 to-cyan-600/20",
  },
  {
    id: "velorah",
    title: "Velorah",
    category: "Landing Page",
    tag: null,
    url: "https://velorah-blush.vercel.app/",
    description: "Focus-driven hero with Instrument Serif typography",
    gradient: "from-emerald-600/20 to-teal-600/20",
  },
  {
    id: "studio",
    title: "Studio Agency",
    category: "Agency",
    tag: "Premium",
    url: "https://studio-agency-theta.vercel.app/",
    description: "AI-powered web design agency with blur text animations",
    gradient: "from-orange-600/20 to-rose-600/20",
  },
] as const;

export type Template = (typeof templates)[number];
