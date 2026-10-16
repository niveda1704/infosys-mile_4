// Mock realistic data for SwipeX Platform Administration
export const INITIAL_ADMIN_PROFILE = {
  name: "System Admin",
  email: "admin@swipex.io",
  phone: "+91 80000 11223",
  role: "Super Administrator",
  department: "Platform Operations & Trust",
  location: "Bangalore HQ",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=256&auto=format&fit=crop&q=80",
  lastLogin: "Today at 09:15 AM",
  systemVersion: "v2.4.0-production",
  securityStatus: "MFA Enabled • Compliant"
};

export const INITIAL_ADMIN_USERS = [
  {
    id: "usr-1",
    name: "Ashif Siddique",
    email: "siddiqueashif0786@gmail.com",
    role: "Job Seeker",
    status: "Active",
    joinedDate: "2025-04-10",
    lastActive: "15 mins ago",
    appliedJobsCount: 8,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-2",
    name: "Priya Sharma",
    email: "priya.sharma@technova.io",
    role: "Recruiter",
    status: "Active",
    joinedDate: "2025-03-15",
    lastActive: "1 hour ago",
    company: "TechNova Solutions",
    postedJobsCount: 4,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-3",
    name: "Kabir Mehta",
    email: "kabir.mehta@cred.club",
    role: "Recruiter",
    status: "Active",
    joinedDate: "2025-02-20",
    lastActive: "3 hours ago",
    company: "CRED",
    postedJobsCount: 6,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-4",
    name: "Tanvi Saxena",
    email: "tanvi.s@gmail.com",
    role: "Job Seeker",
    status: "Active",
    joinedDate: "2025-05-01",
    lastActive: "Yesterday",
    appliedJobsCount: 14,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-5",
    name: "Rajesh Kothari",
    email: "rajesh@spammydomain.xyz",
    role: "Recruiter",
    status: "Suspended",
    joinedDate: "2025-05-02",
    lastActive: "5 days ago",
    company: "Unverified Agency",
    postedJobsCount: 1,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-6",
    name: "System Admin",
    email: "admin@swipex.io",
    role: "Admin",
    status: "Active",
    joinedDate: "2025-01-01",
    lastActive: "Now",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=256&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-7",
    name: "Devika Rao",
    email: "devika.rao@google.com",
    role: "Recruiter",
    status: "Active",
    joinedDate: "2025-03-01",
    lastActive: "2 days ago",
    company: "Google India",
    postedJobsCount: 8,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&auto=format&fit=crop&q=80"
  }
];

export const INITIAL_ADMIN_RECRUITERS = [
  {
    id: "rec-org-1",
    name: "Priya Sharma",
    company: "TechNova Solutions",
    email: "priya.sharma@technova.io",
    phone: "+91 98450 12345",
    website: "https://technova.io",
    industry: "AI & Cloud Software",
    companyType: "Startup",
    status: "Approved", // "Approved" | "Pending" | "Suspended"
    jobsPosted: 4,
    activeJobs: 3,
    joinedDate: "2025-03-15",
    verifiedDomain: true
  },
  {
    id: "rec-org-2",
    name: "Devika Rao",
    company: "Google India",
    email: "devika.rao@google.com",
    phone: "+91 98111 22334",
    website: "https://careers.google.com",
    industry: "Consumer Tech & Cloud",
    companyType: "MNC",
    status: "Approved",
    jobsPosted: 8,
    activeJobs: 7,
    joinedDate: "2025-03-01",
    verifiedDomain: true
  },
  {
    id: "rec-org-3",
    name: "Kabir Mehta",
    company: "CRED",
    email: "kabir.mehta@cred.club",
    phone: "+91 99000 88776",
    website: "https://cred.club",
    industry: "Fintech",
    companyType: "Startup",
    status: "Approved",
    jobsPosted: 6,
    activeJobs: 5,
    joinedDate: "2025-02-20",
    verifiedDomain: true
  },
  {
    id: "rec-org-4",
    name: "Suresh Pillai",
    company: "HyperScale Dynamics",
    email: "suresh@hyperscale.ai",
    phone: "+91 97123 45678",
    website: "https://hyperscale.ai",
    industry: "Blockchain / Web3",
    companyType: "Newly Founded",
    status: "Pending",
    jobsPosted: 2,
    activeJobs: 0,
    joinedDate: "2025-05-14",
    verifiedDomain: false
  },
  {
    id: "rec-org-5",
    name: "Rajesh Kothari",
    company: "FastCareers Agency",
    email: "rajesh@fastcareers.net",
    phone: "+91 91234 56789",
    website: "https://fastcareers.net",
    industry: "Staffing Agency",
    companyType: "Agency",
    status: "Suspended",
    jobsPosted: 1,
    activeJobs: 0,
    joinedDate: "2025-05-02",
    verifiedDomain: false
  }
];

export const INITIAL_ADMIN_JOBS = [
  {
    id: "job-1",
    title: "AI Engineer",
    company: "Microsoft",
    recruiter: "Microsoft Talent Team",
    location: "Bangalore, India",
    salary: "₹18–28 LPA",
    status: "Active", // "Active" | "Pending Approval" | "Rejected" | "Deactivated"
    jobType: "Full Time",
    applicants: 124,
    postedDate: "2025-05-15",
    verified: true
  },
  {
    id: "job-2",
    title: "Frontend Developer (React)",
    company: "Google",
    recruiter: "Devika Rao",
    location: "Hyderabad, India",
    salary: "₹20–32 LPA",
    status: "Active",
    jobType: "Full Time",
    applicants: 310,
    postedDate: "2025-05-14",
    verified: true
  },
  {
    id: "job-3",
    title: "Full Stack Engineer",
    company: "CRED",
    recruiter: "Kabir Mehta",
    location: "Bangalore, India",
    salary: "₹24–36 LPA",
    status: "Active",
    jobType: "Full Time",
    applicants: 156,
    postedDate: "2025-05-12",
    verified: true
  },
  {
    id: "rec-job-1",
    title: "Senior Full Stack Engineer",
    company: "TechNova Solutions",
    recruiter: "Priya Sharma",
    location: "Bangalore (Hybrid)",
    salary: "₹24–36 LPA",
    status: "Active",
    jobType: "Full Time",
    applicants: 48,
    postedDate: "2025-05-12",
    verified: true
  },
  {
    id: "job-pending-1",
    title: "Web3 Smart Contract Auditor",
    company: "HyperScale Dynamics",
    recruiter: "Suresh Pillai",
    location: "Remote",
    salary: "₹30–45 LPA",
    status: "Pending Approval",
    jobType: "Contract",
    applicants: 0,
    postedDate: "2025-05-15",
    verified: false
  },
  {
    id: "job-flagged-1",
    title: "Data Entry - Work from Home",
    company: "FastCareers Agency",
    recruiter: "Rajesh Kothari",
    location: "Remote",
    salary: "₹50,000 / week",
    status: "Rejected",
    jobType: "Part Time",
    applicants: 14,
    postedDate: "2025-05-02",
    verified: false
  }
];

export const INITIAL_ADMIN_APPLICATIONS = [
  {
    id: "adm-app-1",
    applicantName: "Ashif Siddique",
    applicantEmail: "siddiqueashif0786@gmail.com",
    jobTitle: "AI Engineer",
    company: "Microsoft",
    recruiterName: "Azure Talent Team",
    appliedDate: "2025-05-10",
    status: "Shortlisted",
    matchScore: 94
  },
  {
    id: "adm-app-2",
    applicantName: "Ashif Siddique",
    applicantEmail: "siddiqueashif0786@gmail.com",
    jobTitle: "Frontend Developer (React)",
    company: "Google",
    recruiterName: "Devika Rao",
    appliedDate: "2025-05-04",
    status: "Interview",
    matchScore: 91
  },
  {
    id: "adm-app-3",
    applicantName: "Ananya Deshmukh",
    applicantEmail: "ananya.d@gmail.com",
    jobTitle: "Senior Full Stack Engineer",
    company: "TechNova Solutions",
    recruiterName: "Priya Sharma",
    appliedDate: "2025-05-13",
    status: "Interview",
    matchScore: 88
  },
  {
    id: "adm-app-4",
    applicantName: "Rohan Varma",
    applicantEmail: "rohan.varma@outlook.com",
    jobTitle: "Frontend Developer (Design Systems)",
    company: "TechNova Solutions",
    recruiterName: "Priya Sharma",
    appliedDate: "2025-05-15",
    status: "Under Review",
    matchScore: 91
  },
  {
    id: "adm-app-5",
    applicantName: "Tanvi Saxena",
    applicantEmail: "tanvi.s@gmail.com",
    jobTitle: "Full Stack Engineer",
    company: "CRED",
    recruiterName: "Kabir Mehta",
    appliedDate: "2025-05-11",
    status: "Applied",
    matchScore: 85
  }
];

export const ADMIN_PLATFORM_STATS = {
  totalUsers: 3482,
  totalJobSeekers: 3120,
  totalRecruiters: 354,
  totalJobs: 486,
  activeJobs: 412,
  totalApplications: 14850,
  pendingReports: 3,
  userGrowthPct: "+18.4% this month",
  jobsGrowthPct: "+12.1% this month",
  applicationRatePerDay: 240,
  serverUptime: "99.98%",
  averageAtsMatch: "84.2%"
};

export const ADMIN_ACTIVITY_CHART = [
  { month: "Jan", users: 1800, jobs: 240, applications: 6200 },
  { month: "Feb", users: 2150, jobs: 290, applications: 7800 },
  { month: "Mar", users: 2600, jobs: 350, applications: 9900 },
  { month: "Apr", users: 3050, jobs: 420, applications: 12400 },
  { month: "May", users: 3482, jobs: 486, applications: 14850 }
];
