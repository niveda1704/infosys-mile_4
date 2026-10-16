// Mock Companies Data for SwipeX (SRS 2 Company and Startup Pages)
export const INITIAL_COMPANIES = [
  {
    id: "comp-microsoft",
    name: "Microsoft",
    slug: "microsoft",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
    category: "MNC",
    industry: "Cloud & Artificial Intelligence",
    location: "Bangalore, India",
    headquarters: "Redmond, WA, USA",
    employeeCount: "10,000+ in India",
    foundedYear: 1975,
    website: "https://microsoft.com",
    rating: 4.5,
    reviewsCount: 3820,
    about: "Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge. Its mission is to empower every person and every organization on the planet to achieve more.",
    culture: [
      "Growth mindset culture encouraging experimentation",
      "Flexible hybrid and remote working frameworks",
      "Generous annual learning and wellness stipends",
      "Global employee resource groups and diversity chapters"
    ],
    techStack: ["Python", "PyTorch", "Azure Cloud", "TypeScript", "C#", "Kubernetes"],
    openJobsCount: 3,
    benefits: [
      "Target annual bonuses and RSUs",
      "Comprehensive family health insurance",
      "On-site wellness centers and cafes",
      "Parental leave up to 6 months"
    ]
  },
  {
    id: "comp-google",
    name: "Google",
    slug: "google",
    logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
    category: "MNC",
    industry: "Internet & Cloud Computing",
    location: "Hyderabad, India",
    headquarters: "Mountain View, CA, USA",
    employeeCount: "10,000+ in India",
    foundedYear: 1998,
    website: "https://careers.google.com",
    rating: 4.7,
    reviewsCount: 4500,
    about: "Google's mission is to organize the world's information and make it universally accessible and useful. Google Cloud, Search, and Android touch billions of daily lives.",
    culture: [
      "Open source contributions and 20% innovation time",
      "High emphasis on psychological safety and inclusive engineering",
      "Data-driven career growth and peer recognition programs"
    ],
    techStack: ["Go", "TypeScript", "React", "Python", "Kubernetes", "Borg"],
    openJobsCount: 2,
    benefits: [
      "Alphabet equity compensation (GSUs)",
      "Free 3-course gourmet meals and micro-kitchens",
      "Full medical, dental, and vision coverage",
      "Comprehensive education sponsorship"
    ]
  },
  {
    id: "comp-cred",
    name: "CRED",
    slug: "cred",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80",
    category: "Startup",
    industry: "FinTech & Digital Commerce",
    location: "Bangalore, India",
    headquarters: "Bangalore, India",
    employeeCount: "500–1,000",
    foundedYear: 2018,
    website: "https://cred.club",
    rating: 4.4,
    reviewsCount: 890,
    about: "CRED is a high-trust community of creditworthy individuals, brands, and institutions. Building consumer financial products that delight with world-class design and engineering craftsmanship.",
    culture: [
      "Design-first engineering and obsession with high aesthetic standards",
      "Fast iteration cycles and high individual ownership",
      "Direct mentorship from senior technical leads"
    ],
    techStack: ["Node.js", "React Native", "Kafka", "PostgreSQL", "AWS", "Golang"],
    openJobsCount: 2,
    benefits: [
      "Lucrative ESOP program with fair buyback terms",
      "Top-tier health coverage for self and dependents",
      "Flexible, goal-driven working hours",
      "Annual workstation and gadget grants"
    ]
  },
  {
    id: "comp-razorpay",
    name: "Razorpay",
    slug: "razorpay",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80",
    category: "Startup",
    industry: "Payments & Banking Infrastructure",
    location: "Bangalore, India",
    headquarters: "Bangalore, India",
    employeeCount: "2,000–5,000",
    foundedYear: 2014,
    website: "https://razorpay.com",
    rating: 4.3,
    reviewsCount: 1420,
    about: "Razorpay is India's leading full-stack financial solutions company powering frictionless payments, banking APIs, and payroll for millions of businesses.",
    culture: [
      "Customer-first engineering mindset",
      "Hackathons and quarterly innovation sprints",
      "Transparent leadership all-hands"
    ],
    techStack: ["PHP", "Go", "React.js", "Kafka", "Docker", "AWS"],
    openJobsCount: 2,
    benefits: [
      "Generous ESOP wealth creation programs",
      "Medical insurance including parents",
      "Learning stipends and books reimbursement",
      "Catered lunches and wellness perks"
    ]
  },
  {
    id: "comp-zerodha",
    name: "Zerodha",
    slug: "zerodha",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
    category: "Startup",
    industry: "FinTech & Stock Broking",
    location: "Bangalore, India",
    headquarters: "Bangalore, India",
    employeeCount: "1,000–2,000",
    foundedYear: 2010,
    website: "https://zerodha.com",
    rating: 4.8,
    reviewsCount: 920,
    about: "Zerodha is India's biggest retail stockbroker, known for its lean engineering, zero-brokerage model, FOSS advocacy, and calm, low-stress work philosophy.",
    culture: [
      "Zero-meeting culture with deep focus time",
      "Commitment to Free and Open Source Software (FOSS)",
      "Long-term stability and sustainable pacing without burnout"
    ],
    techStack: ["Go", "Python", "PostgreSQL", "Vue.js", "C", "Linux"],
    openJobsCount: 1,
    benefits: [
      "Industry-leading profit-share bonuses",
      "No overtime or late night pings policy",
      "Complete health insurance for family",
      "Free gym and health club memberships"
    ]
  },
  {
    id: "comp-neuralpulse",
    name: "NeuralPulse Labs",
    slug: "neuralpulse-labs",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
    category: "Newly Founded",
    industry: "Generative AI & Agentic Systems",
    location: "Bangalore, India",
    headquarters: "Bangalore, India",
    employeeCount: "20–50",
    foundedYear: 2024,
    website: "https://neuralpulse.ai",
    rating: 4.9,
    reviewsCount: 42,
    about: "NeuralPulse Labs is a frontier AI startup pioneering multi-agent autonomous reasoning engines for biomedical discovery and legal workflow automation.",
    culture: [
      "Frontier AI research with immediate production impact",
      "Small high-density talent team with direct founder access",
      "Generous GPU compute allocations for personal experiments"
    ],
    techStack: ["PyTorch", "Rust", "FastAPI", "Next.js", "Triton", "CUDA"],
    openJobsCount: 2,
    benefits: [
      "Top-decile founding team equity (0.5%–2%)",
      "Brand new MacBook Pro M3 Max workstation",
      "Unlimited paid time off (PTO)",
      "Daily team meals and artisan coffee"
    ]
  },
  {
    id: "comp-devsync",
    name: "DevSync Technologies",
    slug: "devsync-technologies",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&auto=format&fit=crop&q=80",
    category: "Newly Founded",
    industry: "Cloud Infrastructure & Developer Tools",
    location: "Pune, India",
    headquarters: "Pune, India",
    employeeCount: "15–30",
    foundedYear: 2024,
    website: "https://devsync.tech",
    rating: 4.8,
    reviewsCount: 35,
    about: "DevSync Technologies builds next-generation CI/CD caching and real-time remote collaboration environments for high-velocity engineering teams.",
    culture: [
      "Remote-first async communication",
      "Strong culture of written RFCs and documentation",
      "High autonomy and self-directed problem solving"
    ],
    techStack: ["Go", "TypeScript", "Docker", "Wasm", "Tailwind CSS"],
    openJobsCount: 1,
    benefits: [
      "Competitive base with early employee equity",
      "$2,000 home office setup budget",
      "Coworking space stipend worldwide",
      "Flexible hours across time zones"
    ]
  },
  {
    id: "comp-swiggy",
    name: "Swiggy",
    slug: "swiggy",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
    category: "Startup",
    industry: "Quick Commerce & Food Delivery",
    location: "Bangalore, India",
    headquarters: "Bangalore, India",
    employeeCount: "5,000+",
    foundedYear: 2014,
    website: "https://swiggy.com",
    rating: 4.2,
    reviewsCount: 2900,
    about: "Swiggy is India's premier on-demand convenience platform, delivering food, groceries, and essentials via cutting-edge routing and logistics algorithms.",
    culture: [
      "Extreme ownership and bias for action",
      "Solving hyper-local scale problems for 100M+ users",
      "Continuous internal upskilling programs"
    ],
    techStack: ["Java", "Go", "React.js", "AWS", "Kafka", "Cassandra"],
    openJobsCount: 1,
    benefits: [
      "Publicly listed company stock options (ESOPs)",
      "Comprehensive medical coverage",
      "Remote-first policy for tech teams",
      "Employee discounts on all orders"
    ]
  },
  {
    id: "comp-postman",
    name: "Postman",
    slug: "postman",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop&q=80",
    category: "Startup",
    industry: "API Platform & Developer Tooling",
    location: "Bangalore, India",
    headquarters: "San Francisco, CA & Bangalore",
    employeeCount: "1,000–2,000",
    foundedYear: 2014,
    website: "https://postman.com",
    rating: 4.6,
    reviewsCount: 1100,
    about: "Postman is the world's leading API platform used by over 30 million developers and 500,000 organizations to build, test, and share APIs.",
    culture: [
      "Community-driven roadmap and developer empathy",
      "Collaborative and global engineering culture",
      "Generous conference travel and speaker budgets"
    ],
    techStack: ["Node.js", "Electron", "React", "GraphQL", "AWS", "Docker"],
    openJobsCount: 2,
    benefits: [
      "Competitive salary and global equity compensation",
      "Comprehensive family health insurance",
      "Home office setup grant",
      "Generous wellness and learning benefits"
    ]
  }
];
