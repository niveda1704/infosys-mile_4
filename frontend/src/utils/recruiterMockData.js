// Mock realistic data for SwipeX Recruiter Portal
export const INITIAL_RECRUITER_PROFILE = {
  name: "Priya Sharma",
  email: "priya.sharma@technova.io",
  phone: "+91 98450 12345",
  title: "Senior Technical Talent Lead",
  companyName: "TechNova Solutions",
  companyType: "High-Growth Startup",
  website: "https://technova.io",
  location: "Bangalore, India",
  industry: "AI & Cloud Software",
  teamSize: "150–500 employees",
  logo: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=128&auto=format&fit=crop&q=80",
  description: "TechNova is an enterprise intelligence platform building autonomous code generation tools and distributed AI infrastructure for engineering teams worldwide."
};

export const INITIAL_RECRUITER_JOBS = [
  {
    id: "rec-job-1",
    title: "Senior Full Stack Engineer",
    company: "TechNova Solutions",
    location: "Bangalore (Hybrid)",
    employmentType: "Full Time",
    experienceLevel: "3-5 Years",
    salaryRange: "₹24–36 LPA",
    status: "Active", // "Active" | "Inactive" | "Draft" | "Closed"
    postedDate: "2025-05-12",
    deadline: "2025-06-30",
    applicantsCount: 48,
    shortlistedCount: 6,
    interviewCount: 3,
    description: "Looking for an experienced Full Stack Engineer to architect high-throughput APIs in Node.js/Go and craft resilient user interfaces using React and Tailwind CSS.",
    requiredSkills: ["React.js", "Node.js", "TypeScript", "PostgreSQL", "Docker"],
    qualifications: "B.Tech/M.Tech in CS or equivalent practical software engineering experience.",
    workMode: "Hybrid"
  },
  {
    id: "rec-job-2",
    title: "AI / ML Research Associate",
    company: "TechNova Solutions",
    location: "Remote (India)",
    employmentType: "Full Time",
    experienceLevel: "1-3 Years",
    salaryRange: "₹18–28 LPA",
    status: "Active",
    postedDate: "2025-05-14",
    deadline: "2025-06-25",
    applicantsCount: 34,
    shortlistedCount: 5,
    interviewCount: 2,
    description: "Join our Core Intelligence team to benchmark, evaluate, and fine-tune open-weights models and integrate multi-modal agent workflows into production pipelines.",
    requiredSkills: ["Python", "PyTorch", "Hugging Face", "LLMs", "FastAPI"],
    qualifications: "Strong foundation in applied mathematics, transformer models, and Python engineering.",
    workMode: "Remote"
  },
  {
    id: "rec-job-3",
    title: "Frontend Developer (Design Systems)",
    company: "TechNova Solutions",
    location: "Bangalore, India",
    employmentType: "Full Time",
    experienceLevel: "1-3 Years",
    salaryRange: "₹14–22 LPA",
    status: "Active",
    postedDate: "2025-05-10",
    deadline: "2025-06-15",
    applicantsCount: 62,
    shortlistedCount: 8,
    interviewCount: 4,
    description: "Own and evolve our internal component design system, ensuring pixel-perfect fidelity, high accessibility standards, and exceptional web performance.",
    requiredSkills: ["React", "TypeScript", "Tailwind CSS", "Storybook", "Accessibility"],
    qualifications: "Bachelor's degree with a solid portfolio of interactive web components and design systems.",
    workMode: "On-site"
  },
  {
    id: "rec-job-4",
    title: "Junior Cloud Infrastructure Intern",
    company: "TechNova Solutions",
    location: "Bangalore / Remote",
    employmentType: "Internship",
    experienceLevel: "Fresher (0-1 Year)",
    salaryRange: "₹40,000 / month",
    status: "Inactive",
    postedDate: "2025-04-20",
    deadline: "2025-05-30",
    applicantsCount: 112,
    shortlistedCount: 12,
    interviewCount: 5,
    description: "Exciting internship opportunity for students and freshers to learn modern Kubernetes deployments, CI/CD automation, and cloud cost observability.",
    requiredSkills: ["Linux", "Docker", "AWS Basics", "Bash", "Python"],
    qualifications: "Graduating student or recent graduate passionate about DevOps and cloud systems.",
    workMode: "Remote"
  }
];

export const INITIAL_RECRUITER_APPLICANTS = [
  {
    id: "cand-1",
    name: "Ashif Siddique",
    email: "siddiqueashif0786@gmail.com",
    phone: "+91 98765 43210",
    appliedJobId: "rec-job-2",
    appliedJobTitle: "AI / ML Research Associate",
    appliedDate: "2025-05-14",
    status: "Shortlisted", // "Applied" | "Under Review" | "Shortlisted" | "Interview" | "Rejected"
    atsScore: 94,
    location: "Bangalore, India",
    experienceYears: "Fresher / 1 Year",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80",
    currentRole: "Aspiring AI & Software Engineer",
    summary: "Dedicated engineer with hands-on experience building generative AI prototypes, Python backends, and responsive React web tools.",
    skills: ["Python", "PyTorch", "LLMs", "FastAPI", "React.js", "Tailwind CSS", "Git"],
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
        description: "Built responsive UI components in React and optimized async state management."
      }
    ],
    resumeUrl: "#",
    resumeFileName: "Ashif_Siddique_Resume_2025.pdf",
    portfolioUrl: "https://github.com/ashifsiddique",
    linkedinUrl: "https://linkedin.com/in/ashif-siddique",
    recruiterNotes: "Exceptional profile with strong match for our NLP pipeline project. Interview recommended."
  },
  {
    id: "cand-2",
    name: "Ananya Deshmukh",
    email: "ananya.d@gmail.com",
    phone: "+91 98112 34567",
    appliedJobId: "rec-job-1",
    appliedJobTitle: "Senior Full Stack Engineer",
    appliedDate: "2025-05-13",
    status: "Interview",
    atsScore: 88,
    location: "Pune, India",
    experienceYears: "4 Years",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&auto=format&fit=crop&q=80",
    currentRole: "Full Stack Engineer at FinNext",
    summary: "4 years building robust fintech dashboards in React, Node.js, and PostgreSQL with a focus on database query optimization.",
    skills: ["React.js", "Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker", "AWS"],
    education: [
      {
        degree: "B.E. in Information Technology",
        institution: "Pune Institute of Computer Technology",
        year: "2017 – 2021",
        grade: "9.1 CGPA"
      }
    ],
    experience: [
      {
        role: "Full Stack Developer",
        company: "FinNext Corp",
        duration: "2021 – Present",
        description: "Architected transaction tracking services processing 50K daily payment events."
      }
    ],
    resumeUrl: "#",
    resumeFileName: "Ananya_Deshmukh_CV.pdf",
    portfolioUrl: "https://ananya-dev.io",
    linkedinUrl: "https://linkedin.com/in/ananya-deshmukh",
    recruiterNotes: "Completed screening round. Moving to technical architecture round next Tuesday."
  },
  {
    id: "cand-3",
    name: "Rohan Varma",
    email: "rohan.varma@outlook.com",
    phone: "+91 99201 88776",
    appliedJobId: "rec-job-3",
    appliedJobTitle: "Frontend Developer (Design Systems)",
    appliedDate: "2025-05-15",
    status: "Under Review",
    atsScore: 91,
    location: "Bangalore, India",
    experienceYears: "2.5 Years",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80",
    currentRole: "Frontend Developer at CreativEdge",
    summary: "Specialist in UI design systems, micro-animations with Motion, and accessible component architectures.",
    skills: ["React", "TypeScript", "Tailwind CSS", "Storybook", "Motion", "Figma", "Jest"],
    education: [
      {
        degree: "B.Tech in Computer Engineering",
        institution: "PES University, Bangalore",
        year: "2019 – 2023",
        grade: "8.4 CGPA"
      }
    ],
    experience: [
      {
        role: "Frontend Engineer",
        company: "CreativEdge Labs",
        duration: "2023 – Present",
        description: "Maintained component library across 4 internal SaaS products."
      }
    ],
    resumeUrl: "#",
    resumeFileName: "Rohan_Varma_Resume.pdf",
    portfolioUrl: "https://github.com/rohanvarma-ui",
    linkedinUrl: "https://linkedin.com/in/rohanvarma",
    recruiterNotes: "Great portfolio link. Checking team availability for code pairing session."
  },
  {
    id: "cand-4",
    name: "Meera Nair",
    email: "meera.nair@techmail.com",
    phone: "+91 97401 22334",
    appliedJobId: "rec-job-2",
    appliedJobTitle: "AI / ML Research Associate",
    appliedDate: "2025-05-11",
    status: "Applied",
    atsScore: 78,
    location: "Kochi, India",
    experienceYears: "1 Year",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&auto=format&fit=crop&q=80",
    currentRole: "Junior ML Engineer",
    summary: "Passionate about computer vision and OCR data extraction pipelines using PyTorch and OpenCV.",
    skills: ["Python", "PyTorch", "OpenCV", "Scikit-Learn", "Flask"],
    education: [
      {
        degree: "B.Tech in Electronics & Communication",
        institution: "Cochin University of Science and Technology",
        year: "2020 – 2024",
        grade: "8.2 CGPA"
      }
    ],
    experience: [
      {
        role: "ML Intern",
        company: "VisionAI",
        duration: "Jan 2024 – Jun 2024",
        description: "Implemented document classification models with 92% precision."
      }
    ],
    resumeUrl: "#",
    resumeFileName: "Meera_Nair_Resume.pdf",
    portfolioUrl: "",
    linkedinUrl: "https://linkedin.com/in/meera-nair",
    recruiterNotes: "Good baseline, but missing LLM prompt evaluation experience."
  },
  {
    id: "cand-5",
    name: "Vikram Malhotra",
    email: "vikram.m@domain.co",
    phone: "+91 98800 99887",
    appliedJobId: "rec-job-1",
    appliedJobTitle: "Senior Full Stack Engineer",
    appliedDate: "2025-05-08",
    status: "Rejected",
    atsScore: 62,
    location: "Delhi NCR, India",
    experienceYears: "5 Years",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&auto=format&fit=crop&q=80",
    currentRole: "Backend Developer",
    summary: "Experienced in legacy PHP & MySQL monoliths looking to pivot into modern React stack.",
    skills: ["PHP", "Laravel", "MySQL", "jQuery", "Bootstrap"],
    education: [
      {
        degree: "MCA",
        institution: "Delhi University",
        year: "2016 – 2019",
        grade: "7.5 CGPA"
      }
    ],
    experience: [
      {
        role: "Senior PHP Developer",
        company: "WebCraft Solutions",
        duration: "2019 – 2024",
        description: "Maintained CRM portal for regional retail clients."
      }
    ],
    resumeUrl: "#",
    resumeFileName: "Vikram_Malhotra.pdf",
    portfolioUrl: "",
    linkedinUrl: "https://linkedin.com/in/vikram-m",
    recruiterNotes: "Does not meet modern React and TypeScript requirements for this senior role."
  }
];

export const RECRUITER_OVERVIEW_STATS = {
  totalJobs: 4,
  activeJobs: 3,
  totalApplicants: 156,
  pendingApplications: 28,
  shortlistedCandidates: 19,
  scheduledInterviews: 9
};
