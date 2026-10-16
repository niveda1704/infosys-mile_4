// Mock realistic data for SwipeX
export const INITIAL_JOBS = [
  {
    id: "job-1",
    title: "AI Engineer",
    company: "Microsoft",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    companyType: "MNC",
    location: "Bangalore, India",
    salary: "₹18–28 LPA",
    salaryMin: 18,
    salaryMax: 28,
    jobType: "Full Time",
    experience: "1-3 Years",
    experienceLevel: "Mid-Level",
    isFresherFriendly: false,
    isRemote: false,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["Python", "PyTorch", "LLMs", "Azure", "NLP", "FastAPI"],
    matchPercentage: 94,
    competition: "Low",
    applicants: 124,
    postedTime: "2 hours ago",
    description: "Join Microsoft Azure AI core team to build cutting-edge generative AI models, agentic workflows, and cloud-scale intelligence services that empower millions of enterprises worldwide.",
    responsibilities: [
      "Design and deploy scalable machine learning and large language model pipelines on Azure AI infrastructure.",
      "Collaborate with product and research teams to integrate agentic workflows into enterprise software.",
      "Optimize inference latency and token efficiency for production AI APIs.",
      "Implement robust evaluation benchmarks, safety guardrails, and automated validation tests."
    ],
    requiredSkills: ["Python", "PyTorch", "Transformer Architectures", "Azure Cloud Services", "REST APIs"],
    preferredSkills: ["LangChain", "Vector Databases", "Docker & Kubernetes", "C++"],
    benefits: [
      "Competitive base salary with stock awards (RSUs)",
      "Comprehensive medical insurance for family",
      "Flexible hybrid working schedule (2 days remote)",
      "Annual wellness & learning allowance ($1,500/yr)",
      "World-class cafeteria and campus amenities"
    ]
  },
  {
    id: "job-2",
    title: "Frontend Developer (React)",
    company: "Google",
    logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&auto=format&fit=crop&q=80",
    companyType: "MNC",
    location: "Hyderabad, India",
    salary: "₹20–32 LPA",
    salaryMin: 20,
    salaryMax: 32,
    jobType: "Full Time",
    experience: "Fresher / 0-2 Years",
    experienceLevel: "Entry-Level",
    isFresherFriendly: true,
    isRemote: false,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["React.js", "TypeScript", "Tailwind CSS", "Next.js", "Redux", "Web Performance"],
    matchPercentage: 91,
    competition: "Medium",
    applicants: 310,
    postedTime: "5 hours ago",
    description: "Google Cloud Console team is looking for a passionate Frontend Developer to craft accessible, highly responsive web interfaces for cloud observability and enterprise developer tooling.",
    responsibilities: [
      "Develop responsive, pixel-perfect user interfaces using modern React and TypeScript.",
      "Architect reusable component design systems and state management solutions.",
      "Profile and optimize bundle sizes, Core Web Vitals, and interactive rendering performance.",
      "Participate in design reviews, accessibility audits (WCAG AA), and code reviews."
    ],
    requiredSkills: ["React.js", "JavaScript (ES6+)", "HTML5/CSS3", "Git & CI/CD"],
    preferredSkills: ["TypeScript", "Tailwind CSS", "Jest/React Testing Library", "GraphQL"],
    benefits: [
      "Target bonus & Alphabet equity package",
      "Free gourmet meals, micro-kitchen snacks, and barista coffee",
      "Comprehensive health coverage including dental & vision",
      "Generous parental leave and childcare assistance",
      "Education reimbursement and conference budgets"
    ]
  },
  {
    id: "job-3",
    title: "Full Stack Engineer",
    company: "CRED",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    companyType: "Startup",
    location: "Bangalore, India",
    salary: "₹24–36 LPA",
    salaryMin: 24,
    salaryMax: 36,
    jobType: "Full Time",
    experience: "1-4 Years",
    experienceLevel: "Mid-Level",
    isFresherFriendly: false,
    isRemote: true,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["React.js", "Node.js", "PostgreSQL", "Redis", "Kafka", "Microservices"],
    matchPercentage: 88,
    competition: "Low",
    applicants: 89,
    postedTime: "1 day ago",
    description: "Build ultra-smooth financial experiences, high-throughput payment transaction pipelines, and gamified reward systems trusted by millions of high-trust credit users.",
    responsibilities: [
      "Build scalable, resilient microservices handling thousands of financial transactions per second.",
      "Craft fluid mobile-first web frontends with 60fps animations and instant micro-interactions.",
      "Work with event-driven architectures utilizing Kafka, Redis caching, and relational databases.",
      "Ensure zero-downtime deployments and real-time observability."
    ],
    requiredSkills: ["React.js", "Node.js", "PostgreSQL", "Distributed Systems"],
    preferredSkills: ["Kafka", "Redis", "Framer Motion", "Docker", "AWS"],
    benefits: [
      "Generous ESOP grants from Series D valuation",
      "MacBook Pro M3 Max workstation provided",
      "Unlimited paid time off (PTO) policy",
      "Complete health insurance including parents",
      "Home office setup reimbursement (₹50,000)"
    ]
  },
  {
    id: "job-4",
    title: "Data Science Intern",
    company: "Amazon",
    logo: "https://images.unsplash.com/photo-1523474255658-4af910049b14?w=128&auto=format&fit=crop&q=80",
    companyType: "MNC",
    location: "Bangalore, India",
    salary: "₹60,000 / month",
    salaryMin: 7,
    salaryMax: 8,
    jobType: "Internship",
    experience: "Fresher / Student",
    experienceLevel: "Entry-Level",
    isFresherFriendly: true,
    isRemote: true,
    isInternship: true,
    isNewlyFounded: false,
    skills: ["Python", "SQL", "Machine Learning", "Pandas", "Tableau", "Statistics"],
    matchPercentage: 92,
    competition: "Low",
    applicants: 95,
    postedTime: "3 hours ago",
    description: "Exciting 6-month internship with Amazon Supply Chain Intelligence team. Work directly on predictive inventory modeling and customer demand forecasting across APAC retail nodes.",
    responsibilities: [
      "Extract and analyze petabyte-scale transaction datasets using SQL and Spark.",
      "Train predictive time-series models to forecast customer demand trends.",
      "Build executive dashboards in Tableau to communicate actionable operational insights.",
      "Present findings to principal data scientists and engineering directors."
    ],
    requiredSkills: ["Python", "SQL", "Pandas/NumPy", "Foundational Statistics"],
    preferredSkills: ["Scikit-Learn", "Tableau", "AWS S3/Redshift", "Jupyter"],
    benefits: [
      "High Pre-Placement Offer (PPO) conversion rate",
      "Full monthly stipend of ₹60,000 + housing allowance",
      "Mentorship from Amazon Principal Scientists",
      "Free Prime membership & employee product discounts"
    ]
  },
  {
    id: "job-5",
    title: "Junior Cloud & DevOps Associate",
    company: "Deloitte",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80",
    companyType: "MNC",
    location: "Mumbai, India",
    salary: "₹7.5–10 LPA",
    salaryMin: 7.5,
    salaryMax: 10,
    jobType: "Full Time",
    experience: "0-2 Years",
    experienceLevel: "Entry-Level",
    isFresherFriendly: true,
    isRemote: false,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["AWS", "Docker", "Linux", "Terraform", "CI/CD", "Bash"],
    matchPercentage: 83,
    competition: "Low",
    applicants: 142,
    postedTime: "6 hours ago",
    description: "Support Fortune 500 client cloud modernization programs. Automate deployment pipelines, design secure AWS VPC architectures, and ensure SOC-2 compliance across cloud estates.",
    responsibilities: [
      "Write Infrastructure as Code using Terraform and CloudFormation.",
      "Configure automated GitHub Actions and Jenkins CI/CD deployment pipelines.",
      "Monitor system health, alerts, and cost optimization opportunities.",
      "Troubleshoot Linux container environments and network ingress configurations."
    ],
    requiredSkills: ["AWS Fundamentals", "Docker", "Linux Shell Scripting", "Git"],
    preferredSkills: ["Terraform", "Kubernetes", "Python", "Prometheus/Grafana"],
    benefits: [
      "Certification sponsorship (AWS Solutions Architect, CKA)",
      "Global mobility and client onsite exchange programs",
      "Comprehensive medical & term life insurance",
      "Defined career progression paths with biannual reviews"
    ]
  },
  {
    id: "job-6",
    title: "Product Designer (UI/UX)",
    company: "Zerodha",
    logo: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=128&auto=format&fit=crop&q=80",
    companyType: "Startup",
    location: "Bangalore, India",
    salary: "₹16–26 LPA",
    salaryMin: 16,
    salaryMax: 26,
    jobType: "Full Time",
    experience: "1-3 Years",
    experienceLevel: "Mid-Level",
    isFresherFriendly: false,
    isRemote: true,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["Figma", "Design Systems", "User Research", "Prototyping", "Information Architecture"],
    matchPercentage: 85,
    competition: "Medium",
    applicants: 178,
    postedTime: "1 day ago",
    description: "Join India's largest discount broker to simplify complex capital market instruments. Design frictionless onboarding, accessible charting tools, and transparent order execution interfaces.",
    responsibilities: [
      "Lead UX architecture and interface design for mobile (Kite) and desktop trading platforms.",
      "Conduct user interviews, usability testing, and quantitative funnel analyses.",
      "Maintain and evolve an open-source design system with strict accessibility guidelines.",
      "Collaborate directly with founders and frontend engineers on rapid iterations."
    ],
    requiredSkills: ["Figma", "Wireframing & Prototyping", "Design Systems", "User Testing"],
    preferredSkills: ["Basic HTML/CSS", "Micro-animations", "Financial Market Knowledge"],
    benefits: [
      "100% remote-first culture with asynchronous communication",
      "Generous profit-sharing annual bonuses",
      "Ergonomic home office equipment provided",
      "Books and self-development budget with no approvals needed"
    ]
  },
  {
    id: "job-7",
    title: "Graduate Software Trainee",
    company: "TCS",
    logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=128&auto=format&fit=crop&q=80",
    companyType: "MNC",
    location: "Pune, India",
    salary: "₹4.5–7 LPA",
    salaryMin: 4.5,
    salaryMax: 7,
    jobType: "Full Time",
    experience: "Fresher / 0-1 Year",
    experienceLevel: "Entry-Level",
    isFresherFriendly: true,
    isRemote: false,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["Java", "SQL", "Spring Boot", "HTML/CSS", "JavaScript", "OOP"],
    matchPercentage: 79,
    competition: "High",
    applicants: 850,
    postedTime: "2 days ago",
    description: "TCS Digital / Ninja hiring track for ambitious fresh graduates. Undergo enterprise Java and cloud training before deployment on global banking and aerospace client projects.",
    responsibilities: [
      "Develop backend REST APIs using Java and Spring Boot frameworks.",
      "Write unit tests and perform automated code quality checks.",
      "Participate in Agile sprint ceremonies and client documentation reviews.",
      "Resolve software defects and support integration test cycles."
    ],
    requiredSkills: ["Java or C++", "Object-Oriented Programming", "Basic SQL", "Problem Solving"],
    preferredSkills: ["Spring Boot", "Git", "REST APIs"],
    benefits: [
      "Initial 3-month comprehensive technical onboarding academy",
      "Higher salary bands for TCS Digital top assessment scorers",
      "Medical insurance and subsidised transport",
      "Higher education sponsorship (BITS Pilani M.Tech tie-up)"
    ]
  },
  {
    id: "job-8",
    title: "Backend Engineer (Go/Node)",
    company: "Razorpay",
    logo: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80",
    companyType: "Startup",
    location: "Bangalore, India",
    salary: "₹22–34 LPA",
    salaryMin: 22,
    salaryMax: 34,
    jobType: "Full Time",
    experience: "2-4 Years",
    experienceLevel: "Mid-Level",
    isFresherFriendly: false,
    isRemote: true,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["Golang", "Node.js", "Redis", "MySQL", "Kafka", "Docker", "System Design"],
    matchPercentage: 90,
    competition: "Low",
    applicants: 112,
    postedTime: "4 hours ago",
    description: "Work on Razorpay's core banking and instant payout rails. Process billions in annualized GMV with sub-50ms latency guarantees and 99.999% uptime resilience.",
    responsibilities: [
      "Architect high-concurrency microservices in Go and Node.js.",
      "Integrate secure payment gateways with banking APIs and webhook delivery engines.",
      "Optimize database queries, connection pooling, and multi-tier Redis caching.",
      "Participate in on-call rotations and post-mortem reliability reviews."
    ],
    requiredSkills: ["Go or Node.js", "Relational Databases", "Concurrency Patterns", "REST/gRPC"],
    preferredSkills: ["Kafka", "Kubernetes", "FinTech Experience", "AWS"],
    benefits: [
      "ESOP buyback programs every 18 months",
      "Generous health & term life cover for whole family",
      "Wellness leaves and mental health support (1-on-1 counseling)",
      "Hybrid flexible work setup with daily meal vouchers"
    ]
  },
  {
    id: "job-9",
    title: "Associate Technology Consultant",
    company: "Accenture",
    logo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=128&auto=format&fit=crop&q=80",
    companyType: "MNC",
    location: "Gurgaon, India",
    salary: "₹8–12 LPA",
    salaryMin: 8,
    salaryMax: 12,
    jobType: "Full Time",
    experience: "0-2 Years",
    experienceLevel: "Entry-Level",
    isFresherFriendly: true,
    isRemote: false,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["Python", "SQL", "Cloud Analytics", "Business Intelligence", "Agile"],
    matchPercentage: 86,
    competition: "Medium",
    applicants: 220,
    postedTime: "8 hours ago",
    description: "Help enterprise clients transform legacy operational models through modern analytics, cloud migration, and automated business workflows.",
    responsibilities: [
      "Analyze business requirements and translate them into data pipeline architectures.",
      "Build automated data integration workflows using Python and enterprise ETL tools.",
      "Create analytical reports and executive presentations.",
      "Ensure data governance and compliance with client privacy standards."
    ],
    requiredSkills: ["Python", "SQL", "Analytical Thinking", "Communication Skills"],
    preferredSkills: ["PowerBI/Tableau", "Cloud Foundations (Azure/AWS)", "Git"],
    benefits: [
      "Industry-recognized certification sponsorships",
      "Structured mentorship and leadership development tracks",
      "Group medical, dental, and life insurance",
      "Employee share purchase plan with 15% company discount"
    ]
  },
  {
    id: "job-10",
    title: "AI Research & Development Intern",
    company: "NeuralPulse Labs",
    logo: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=128&auto=format&fit=crop&q=80",
    companyType: "Newly Founded",
    location: "Remote",
    salary: "₹45,000 / month",
    salaryMin: 5,
    salaryMax: 6,
    jobType: "Internship",
    experience: "Fresher / Student",
    experienceLevel: "Entry-Level",
    isFresherFriendly: true,
    isRemote: true,
    isInternship: true,
    isNewlyFounded: true,
    skills: ["Python", "PyTorch", "Hugging Face", "LLMs", "RAG", "Vector Search"],
    matchPercentage: 96,
    competition: "Low",
    applicants: 42,
    postedTime: "1 hour ago",
    description: "Stealth Y Combinator-backed AI startup developing autonomous agents for legal document analysis. Gain hands-on experience fine-tuning open-weights models and building RAG pipelines.",
    responsibilities: [
      "Experiment with state-of-the-art open-weights LLMs (Llama 3, Mistral, Qwen).",
      "Build hybrid retrieval-augmented generation (RAG) pipelines with semantic vector indexing.",
      "Benchmark model outputs against industry legal standard datasets.",
      "Ship working prototypes directly into the staging web application."
    ],
    requiredSkills: ["Python", "PyTorch or TensorFlow", "Transformers", "Git"],
    preferredSkills: ["ChromaDB/Pinecone", "LangChain/LlamaIndex", "FastAPI"],
    benefits: [
      "Stipend of ₹45,000/mo with equity upside upon full-time offer",
      "Direct daily mentorship from ex-DeepMind & Stanford alumni founders",
      "Full remote flexibility across any timezone",
      "Access to high-end GPU clusters (A100/H100) for research"
    ]
  },
  {
    id: "job-11",
    title: "Systems Engineer",
    company: "Infosys",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80",
    companyType: "MNC",
    location: "Mysore / Bangalore, India",
    salary: "₹5–8 LPA",
    salaryMin: 5,
    salaryMax: 8,
    jobType: "Full Time",
    experience: "Fresher / 0-2 Years",
    experienceLevel: "Entry-Level",
    isFresherFriendly: true,
    isRemote: false,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["Python", "Java", "Database Management", "Linux", "Web Technologies"],
    matchPercentage: 76,
    competition: "High",
    applicants: 710,
    postedTime: "3 days ago",
    description: "Launch your IT career at Infosys Global Education Centre Mysore. Receive world-class foundational training and deploy on core banking, telecom, or retail client solutions.",
    responsibilities: [
      "Write, test, and document modular application code adhering to quality guidelines.",
      "Work with relational databases to design schemas and optimize queries.",
      "Collaborate with quality assurance teams to resolve defect tickets.",
      "Participate in continuous learning and agile delivery ceremonies."
    ],
    requiredSkills: ["Basic Python or Java", "Relational Database Concepts", "Logical Reasoning"],
    preferredSkills: ["HTML/CSS/JS", "Linux commands", "Git"],
    benefits: [
      "Iconic Mysore campus residential training experience",
      "Structured career growth into Specialist Programmer bands",
      "Health insurance for self and family",
      "Subsidized recreational and sports facilities"
    ]
  },
  {
    id: "job-12",
    title: "Software Engineer – Core Platform",
    company: "Swiggy",
    logo: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&auto=format&fit=crop&q=80",
    companyType: "Startup",
    location: "Bangalore, India",
    salary: "₹20–30 LPA",
    salaryMin: 20,
    salaryMax: 30,
    jobType: "Full Time",
    experience: "1-3 Years",
    experienceLevel: "Mid-Level",
    isFresherFriendly: false,
    isRemote: true,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["Java", "Spring Boot", "Kafka", "AWS", "DynamoDB", "Microservices"],
    matchPercentage: 87,
    competition: "Medium",
    applicants: 195,
    postedTime: "7 hours ago",
    description: "Power the real-time logistics engine dispatching millions of food and grocery orders in under 10 minutes across 500+ Indian cities.",
    responsibilities: [
      "Develop low-latency microservices powering restaurant catalog and rider dispatch engines.",
      "Architect Kafka stream processing applications for live driver location tracking.",
      "Ensure fault-tolerant failovers during peak IPL and New Year order surges.",
      "Participate in high-scale load testing and Chaos Engineering exercises."
    ],
    requiredSkills: ["Java or Go", "Distributed Systems", "SQL & NoSQL", "Kafka"],
    preferredSkills: ["AWS DynamoDB", "Redis", "Docker/K8s", "Elasticsearch"],
    benefits: [
      "Remote-first policy with quarterly team offsites",
      "Substantial Swiggy One premium & food delivery allowances",
      "Vested stock options with regular liquidity events",
      "Comprehensive medical cover including mental wellness support"
    ]
  },
  {
    id: "job-13",
    title: "Project Engineer",
    company: "Wipro",
    logo: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=128&auto=format&fit=crop&q=80",
    companyType: "MNC",
    location: "Hyderabad, India",
    salary: "₹4.5–6.5 LPA",
    salaryMin: 4.5,
    salaryMax: 6.5,
    jobType: "Full Time",
    experience: "Fresher / 0-1 Year",
    experienceLevel: "Entry-Level",
    isFresherFriendly: true,
    isRemote: false,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["C#", ".NET Core", "SQL Server", "HTML5", "JavaScript", "Agile"],
    matchPercentage: 74,
    competition: "High",
    applicants: 620,
    postedTime: "4 days ago",
    description: "Elite National Talent Hunt program opportunity at Wipro. Work on enterprise application modernization, API integration, and database management for global clients.",
    responsibilities: [
      "Develop and maintain enterprise web applications using .NET and modern web tools.",
      "Create stored procedures, functions, and relational schemas in SQL Server.",
      "Perform code debugging, automated unit testing, and documentation.",
      "Collaborate with global technical leads across US and European timezones."
    ],
    requiredSkills: ["Basic C# or Java", "SQL Fundamentals", "Problem Solving"],
    preferredSkills: [".NET Core", "Angular or React", "Git"],
    benefits: [
      "Wipro School of IT specialized skills training",
      "Health insurance with maternity and dependent coverage",
      "Higher education tie-up programs (WILP M.Tech)",
      "Employee recognition awards and annual increments"
    ]
  },
  {
    id: "job-14",
    title: "Frontend Engineering Intern",
    company: "Postman",
    logo: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=128&auto=format&fit=crop&q=80",
    companyType: "Startup",
    location: "Bangalore, India",
    salary: "₹50,000 / month",
    salaryMin: 6,
    salaryMax: 6,
    jobType: "Internship",
    experience: "Fresher / Student",
    experienceLevel: "Entry-Level",
    isFresherFriendly: true,
    isRemote: true,
    isInternship: true,
    isNewlyFounded: false,
    skills: ["React.js", "JavaScript", "Electron", "CSS3", "REST APIs", "Git"],
    matchPercentage: 93,
    competition: "Low",
    applicants: 84,
    postedTime: "2 hours ago",
    description: "Join the team building the world's most popular API development platform used by over 30 million developers worldwide. Work on API workspaces and collaboration UI.",
    responsibilities: [
      "Build dynamic React components for Postman's web and desktop applications.",
      "Optimize rendering speed for large API response JSON payloads and schema trees.",
      "Write end-to-end integration tests using Cypress and Jest.",
      "Collaborate with UX designers on developer-first tool interactions."
    ],
    requiredSkills: ["React.js", "Modern JavaScript", "HTML/CSS", "REST APIs"],
    preferredSkills: ["TypeScript", "Electron", "WebSockets", "State Machines"],
    benefits: [
      "₹50,000/month stipend with strong full-time PPO potential",
      "100% remote working option with hardware allowance",
      "Direct mentorship from senior engineers at a global SaaS unicorn",
      "Regular tech talks and developer community events"
    ]
  },
  {
    id: "job-15",
    title: "Junior Backend Developer",
    company: "DevSync Technologies",
    logo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=128&auto=format&fit=crop&q=80",
    companyType: "Newly Founded",
    location: "Remote",
    salary: "₹8–14 LPA",
    salaryMin: 8,
    salaryMax: 14,
    jobType: "Full Time",
    experience: "0-2 Years",
    experienceLevel: "Entry-Level",
    isFresherFriendly: true,
    isRemote: true,
    isInternship: false,
    isNewlyFounded: true,
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "Git"],
    matchPercentage: 91,
    competition: "Low",
    applicants: 56,
    postedTime: "30 mins ago",
    description: "High-growth early-stage developer tools startup building automated code review agents. Looking for an energetic junior engineer who loves Python, clean APIs, and shipping fast.",
    responsibilities: [
      "Develop async REST and WebSocket APIs using FastAPI and asyncpg.",
      "Integrate GitHub and GitLab webhooks for automated repository scanning.",
      "Write clean SQL migrations and optimize indexed database queries.",
      "Deploy containerized microservices to cloud container runners."
    ],
    requiredSkills: ["Python", "FastAPI or Django", "SQL Basics", "Git"],
    preferredSkills: ["Docker", "Redis", "GitHub API", "PyTest"],
    benefits: [
      "High equity grant in a rapidly growing YC-backed startup",
      "Complete remote autonomy and flexible working hours",
      "Latest M3 MacBook Pro provided on day one",
      "Quarterly company retreats in Goa and Bali"
    ]
  },
  {
    id: "job-16",
    title: "Security & Cloud Architect",
    company: "Amazon Web Services",
    logo: "https://images.unsplash.com/photo-1523474255658-4af910049b14?w=128&auto=format&fit=crop&q=80",
    companyType: "MNC",
    location: "Hyderabad, India",
    salary: "₹26–42 LPA",
    salaryMin: 26,
    salaryMax: 42,
    jobType: "Full Time",
    experience: "3-6 Years",
    experienceLevel: "Senior",
    isFresherFriendly: false,
    isRemote: false,
    isInternship: false,
    isNewlyFounded: false,
    skills: ["AWS", "IAM", "Kubernetes", "DevSecOps", "Zero Trust", "Terraform"],
    matchPercentage: 81,
    competition: "Low",
    applicants: 68,
    postedTime: "12 hours ago",
    description: "Design impenetrable cloud security postures and compliance automation frameworks for strategic APAC enterprise cloud adoptions.",
    responsibilities: [
      "Architect AWS Landing Zones and zero-trust IAM governance controls.",
      "Automate security vulnerability scanning and continuous compliance checks.",
      "Lead threat modeling workshops and incident response drills.",
      "Advise enterprise CTOs and CISOs on secure cloud migrations."
    ],
    requiredSkills: ["AWS Architecture", "Cloud Security", "Infrastructure as Code", "Networking"],
    preferredSkills: ["CISSP / AWS Security Specialty", "Kubernetes Security", "Python"],
    benefits: [
      "Top-tier Amazon salary + sign-on bonus + RSU grant",
      "Executive coaching and global career mobility",
      "Premium family health and wellness plan",
      "Generous relocation support"
    ]
  }
];

export const INITIAL_USER = {
  id: "user-1",
  name: "Niveda Sree",
  email: "nivedasree1704@gmail.com",
  role: "Aspiring AI & Software Engineer",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80",
  location: "Bangalore, India",
  phone: "+91 98765 43210",
  bio: "Passionate software engineer focused on building intelligent web applications, modern React interfaces, and scalable machine learning workflows.",
  skills: ["React.js", "Python", "JavaScript", "Machine Learning", "SQL", "Tailwind CSS", "Git", "FastAPI"],
  experienceLevel: "Entry-Level (0-2 Years)",
  preferredJobType: "Full Time",
  preferredLocation: "Bangalore / Remote",
  education: [
    {
      degree: "B.Tech in Computer Science & Engineering",
      institution: "National Institute of Technology",
      year: "2021 – 2025",
      grade: "8.8 CGPA"
    }
  ],
  experience: [
    {
      role: "Frontend Engineering Intern",
      company: "TechNova Solutions",
      duration: "Jun 2024 – Nov 2024",
      description: "Built responsive dashboard features using React, Tailwind CSS, and optimized API state management."
    }
  ],
  portfolio: "https://github.com/ashifsiddique",
  linkedin: "https://linkedin.com/in/ashif-siddique",
  resumeName: "Ashif_Siddique_Resume_2025.pdf",
  resumeSize: "1.4 MB",
  resumeUploadedDate: "Yesterday at 4:30 PM",
  profileCompletion: 85,
  atsScore: 82
};

export const INITIAL_APPLICATIONS = [
  {
    id: "app-1",
    jobId: "job-1",
    title: "AI Engineer",
    company: "Microsoft",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    location: "Bangalore, India",
    salary: "₹18–28 LPA",
    status: "Shortlisted",
    appliedDate: "2025-05-10",
    lastUpdated: "2 days ago",
    matchPercentage: 94,
    timeline: [
      { step: "Applied", date: "May 10, 2025", done: true },
      { step: "Resume Screened", date: "May 12, 2025", done: true },
      { step: "Shortlisted", date: "May 15, 2025", done: true },
      { step: "Technical Interview", date: "Scheduled for May 22", done: false },
      { step: "Final Decision", date: "Pending", done: false }
    ],
    notes: "HR reached out via email regarding round 1 AI architecture evaluation."
  },
  {
    id: "app-2",
    jobId: "job-2",
    title: "Frontend Developer (React)",
    company: "Google",
    logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&auto=format&fit=crop&q=80",
    location: "Hyderabad, India",
    salary: "₹20–32 LPA",
    status: "Interview",
    appliedDate: "2025-05-04",
    lastUpdated: "Yesterday",
    matchPercentage: 91,
    timeline: [
      { step: "Applied", date: "May 04, 2025", done: true },
      { step: "Online Assessment", date: "May 07, 2025", done: true },
      { step: "Technical Round 1", date: "May 11, 2025", done: true },
      { step: "System & UI Design", date: "Scheduled for May 18", done: false },
      { step: "Hiring Committee", date: "Pending", done: false }
    ],
    notes: "Passed coding round with 100% test cases. Next round is UI architecture."
  },
  {
    id: "app-3",
    jobId: "job-4",
    title: "Data Science Intern",
    company: "Amazon",
    logo: "https://images.unsplash.com/photo-1523474255658-4af910049b14?w=128&auto=format&fit=crop&q=80",
    location: "Bangalore, India",
    salary: "₹60,000 / month",
    status: "Applied",
    appliedDate: "2025-05-14",
    lastUpdated: "1 day ago",
    matchPercentage: 92,
    timeline: [
      { step: "Applied", date: "May 14, 2025", done: true },
      { step: "Application Under Review", date: "In Progress", done: false },
      { step: "Assessment", date: "Pending", done: false },
      { step: "Interview", date: "Pending", done: false }
    ],
    notes: "Application submitted with tailored ML portfolio projects."
  },
  {
    id: "app-4",
    jobId: "job-7",
    title: "Graduate Software Trainee",
    company: "TCS",
    logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=128&auto=format&fit=crop&q=80",
    location: "Pune, India",
    salary: "₹4.5–7 LPA",
    status: "Rejected",
    appliedDate: "2025-04-20",
    lastUpdated: "1 week ago",
    matchPercentage: 79,
    timeline: [
      { step: "Applied", date: "Apr 20, 2025", done: true },
      { step: "Aptitude Test", date: "Apr 25, 2025", done: true },
      { step: "Status", date: "Position Filled / Candidate Capacity Reached", done: true }
    ],
    notes: "Batch quota filled for location preference."
  }
];

export const INITIAL_RECOMMENDATIONS = [
  {
    id: "rec-1",
    jobId: "job-10",
    title: "AI Research & Development Intern",
    company: "NeuralPulse Labs",
    logo: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=128&auto=format&fit=crop&q=80",
    matchPercentage: 96,
    location: "Remote",
    salary: "₹45,000 / month",
    jobType: "Internship",
    matchingSkills: ["Python", "PyTorch", "LLMs", "Machine Learning"],
    missingSkills: ["Vector Search", "Hugging Face"],
    recommendationReason: "Your strong background in Python, PyTorch, and deep interest in LLMs perfectly matches this role's core requirement."
  },
  {
    id: "rec-2",
    jobId: "job-1",
    title: "AI Engineer",
    company: "Microsoft",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    matchPercentage: 94,
    location: "Bangalore, India",
    salary: "₹18–28 LPA",
    jobType: "Full Time",
    matchingSkills: ["Python", "FastAPI", "NLP", "Machine Learning"],
    missingSkills: ["Azure Cloud", "Docker & Kubernetes"],
    recommendationReason: "High compatibility with your AI project portfolio and Python backend expertise."
  },
  {
    id: "rec-3",
    jobId: "job-14",
    title: "Frontend Engineering Intern",
    company: "Postman",
    logo: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=128&auto=format&fit=crop&q=80",
    matchPercentage: 93,
    location: "Bangalore, India",
    salary: "₹50,000 / month",
    jobType: "Internship",
    matchingSkills: ["React.js", "JavaScript", "Tailwind CSS", "Git"],
    missingSkills: ["Electron", "WebSockets"],
    recommendationReason: "Direct match with your verified React.js components and frontend workflow experience."
  },
  {
    id: "rec-4",
    jobId: "job-15",
    title: "Junior Backend Developer",
    company: "DevSync Technologies",
    logo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=128&auto=format&fit=crop&q=80",
    matchPercentage: 91,
    location: "Remote",
    salary: "₹8–14 LPA",
    jobType: "Full Time",
    matchingSkills: ["Python", "SQL", "FastAPI", "Git"],
    missingSkills: ["Docker", "Redis"],
    recommendationReason: "Low competition newly founded role looking for proactive Python & API builders."
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "New Job Match Alert",
    message: "New AI Engineer job at Microsoft matches 94% of your profile skills.",
    time: "10 mins ago",
    read: false,
    type: "match",
    jobId: "job-1"
  },
  {
    id: "notif-2",
    title: "Low Competition Opportunity",
    message: "AI Research & Development Intern at NeuralPulse Labs has only 42 applicants.",
    time: "2 hours ago",
    read: false,
    type: "opportunity",
    jobId: "job-10"
  },
  {
    id: "notif-3",
    title: "Resume ATS Score Update",
    message: "Your resume ATS score is evaluated at 82%. Adding 'Docker' and 'AWS' could push it to 94%.",
    time: "5 hours ago",
    read: false,
    type: "ats",
    link: "/resume-analysis"
  },
  {
    id: "notif-4",
    title: "Application Status Update",
    message: "Google moved your application for 'Frontend Developer (React)' to Interview stage.",
    time: "1 day ago",
    read: true,
    type: "application",
    link: "/applications"
  },
  {
    id: "notif-5",
    title: "New Startup Hiring Alert",
    message: "DevSync Technologies just posted a remote Junior Backend role.",
    time: "2 days ago",
    read: true,
    type: "startup",
    jobId: "job-15"
  }
];

export const MOCK_RESUME_ANALYSIS = {
  atsScore: 82,
  jobMatch: 89,
  fileName: "Ashif_Siddique_Resume_2025.pdf",
  fileSize: "1.4 MB",
  analyzedDate: "Just now",
  detectedSkills: [
    "Python",
    "Machine Learning",
    "SQL",
    "Pandas",
    "Scikit-learn",
    "React.js",
    "JavaScript",
    "Tailwind CSS",
    "Git",
    "REST APIs"
  ],
  missingSkills: [
    "AWS",
    "Docker",
    "FastAPI",
    "Kubernetes",
    "CI/CD"
  ],
  missingKeywords: [
    "REST API Architecture",
    "Cloud Deployment",
    "Microservices",
    "Unit Testing",
    "Agile Methodology"
  ],
  suggestions: [
    {
      title: "Add missing cloud keywords",
      detail: "Include practical AWS/GCP deployment mentions to increase ATS parser indexing by +8%.",
      impact: "High"
    },
    {
      title: "Quantify project impact with metrics",
      detail: "Convert bullet points to format: 'Accomplished X by doing Y, resulting in Z% improvement'.",
      impact: "High"
    },
    {
      title: "Add containerization tools",
      detail: "Mention Docker in your technical skills and project descriptions.",
      impact: "Medium"
    },
    {
      title: "Optimize section headings",
      detail: "Ensure standard headings (Education, Experience, Skills, Projects) are clearly delineated.",
      impact: "Medium"
    }
  ],
  scoreBreakdown: {
    keywordMatch: 84,
    formattingScore: 92,
    experienceRelevance: 78,
    skillsDepth: 86
  }
};

export const MOCK_DASHBOARD_STATS = {
  totalApplications: 12,
  shortlisted: 4,
  interviews: 2,
  rejected: 3,
  profileCompletion: 85,
  averageAtsScore: 82,
  recommendedJobsCount: 24,
  weeklyActivity: [
    { day: "Mon", swipes: 14, applied: 2 },
    { day: "Tue", swipes: 22, applied: 3 },
    { day: "Wed", swipes: 18, applied: 1 },
    { day: "Thu", swipes: 30, applied: 4 },
    { day: "Fri", swipes: 25, applied: 2 },
    { day: "Sat", swipes: 12, applied: 0 },
    { day: "Sun", swipes: 16, applied: 1 }
  ],
  topSkillGaps: [
    { skill: "AWS / Cloud", frequency: "78% of matched jobs", progress: 45 },
    { skill: "Docker & Containerization", frequency: "65% of matched jobs", progress: 50 },
    { skill: "System Design", frequency: "58% of matched jobs", progress: 60 },
    { skill: "FastAPI / Microservices", frequency: "52% of matched jobs", progress: 75 }
  ],
  hiringTrends: [
    { role: "AI & ML Engineers", growth: "+42%", demand: "Very High" },
    { role: "Frontend (React/Next)", growth: "+28%", demand: "High" },
    { role: "Full Stack (Node/Go)", growth: "+35%", demand: "High" },
    { role: "Cloud & DevOps", growth: "+31%", demand: "High" }
  ]
};
