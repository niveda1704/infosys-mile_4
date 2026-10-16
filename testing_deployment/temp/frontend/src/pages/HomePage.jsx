import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Search,
  Sparkles,
  Target,
  FileCheck,
  Briefcase,
  Building2,
  Users,
  TrendingUp,
  Star,
  Zap,
  ShieldCheck,
  GraduationCap,
  MapPin,
} from "lucide-react";

/*
 * NOTE:
 * The student/company names and statistics below are demo/illustrative
 * content. Replace them with real platform data once your backend is ready.
 */

const hiringCompanies = [
  "TechNova",
  "CloudCore",
  "FinEdge",
  "DataSphere",
  "InnoSoft",
  "NextGen Labs",
];

const stats = [
  {
    value: "10K+",
    label: "Job Opportunities",
    icon: Briefcase,
  },
  {
    value: "2.5K+",
    label: "Students Hired",
    icon: GraduationCap,
  },
  {
    value: "500+",
    label: "Hiring Companies",
    icon: Building2,
  },
  {
    value: "92%",
    label: "Profile Match Accuracy",
    icon: Target,
  },
];

const features = [
  {
    icon: Search,
    title: "Swipe Through Jobs",
    description:
      "Discover relevant opportunities quickly with an intuitive swipe-based job discovery experience.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Recommendations",
    description:
      "Get personalized job recommendations based on your skills, interests, experience and career goals.",
  },
  {
    icon: FileCheck,
    title: "AI Resume Analysis",
    description:
      "Analyze your resume, improve ATS compatibility and discover the skills and keywords recruiters are looking for.",
  },
  {
    icon: Target,
    title: "Career Intelligence",
    description:
      "Understand your career readiness and receive actionable guidance to improve your chances of getting hired.",
  },
];

const placedStudents = [
  {
    name: "Aarav Sharma",
    role: "Software Engineer",
    company: "TechNova",
    package: "12 LPA",
    skills: ["Java", "Spring Boot", "SQL"],
    initials: "AS",
  },
  {
    name: "Priya Singh",
    role: "Frontend Developer",
    company: "CloudCore",
    package: "10 LPA",
    skills: ["React", "JavaScript", "Tailwind"],
    initials: "PS",
  },
  {
    name: "Rahul Verma",
    role: "Data Analyst",
    company: "DataSphere",
    package: "9 LPA",
    skills: ["Python", "SQL", "Power BI"],
    initials: "RV",
  },
  {
    name: "Ananya Gupta",
    role: "Backend Developer",
    company: "FinEdge",
    package: "11 LPA",
    skills: ["Java", "Spring", "PostgreSQL"],
    initials: "AG",
  },
];

const testimonials = [
  {
    name: "Riya Sharma",
    role: "Software Engineer",
    company: "Placed through SwipeX",
    quote:
      "SwipeX made job hunting feel completely different. Instead of applying randomly, I could focus on roles that actually matched my skills.",
    initials: "RS",
  },
  {
    name: "Aditya Kumar",
    role: "Full Stack Developer",
    company: "Placed through SwipeX",
    quote:
      "The resume analysis and job recommendations helped me understand what recruiters were looking for. I became much more confident during my applications.",
    initials: "AK",
  },
  {
    name: "Neha Verma",
    role: "Software Developer",
    company: "Placed through SwipeX",
    quote:
      "The swipe experience is simple, fast and addictive in a good way. I discovered opportunities that I probably would have missed elsewhere.",
    initials: "NV",
  },
];

const steps = [
  {
    number: "01",
    title: "Create Your Profile",
    description:
      "Add your skills, education, experience, preferred roles and career goals.",
    icon: Users,
  },
  {
    number: "02",
    title: "Discover Opportunities",
    description:
      "Swipe through personalized jobs and save the opportunities that interest you.",
    icon: Search,
  },
  {
    number: "03",
    title: "Improve Your Profile",
    description:
      "Use AI-powered resume and career insights to improve your profile.",
    icon: Sparkles,
  },
  {
    number: "04",
    title: "Get Hired",
    description:
      "Apply to the right opportunities and track your journey until you land the role.",
    icon: Briefcase,
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">

      {/* =====================================================
          HERO
          ===================================================== */}
      <section className="relative bg-slate-50 border-b border-slate-200">

        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[450px] h-[450px] rounded-full bg-emerald-50 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[680px] py-20 lg:py-24">

            {/* LEFT */}
            <div>

              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Career Platform
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[0.98]">
                Get Hired.
                <br />

                <span className="text-emerald-600">
                  Get Ahead.
                </span>
              </h1>

              <p className="mt-7 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl">
                SwipeX helps students and job seekers discover the right
                opportunities, improve their resumes and connect with
                companies that are looking for their skills.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 mt-9">

                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
                >
                  Start Your Career
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm transition-all"
                >
                  Explore Jobs
                  <Search className="w-4 h-4" />
                </Link>

              </div>

              {/* Trust */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-8 text-xs font-semibold text-slate-500">

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Free to get started
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  AI career assistance
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Personalized jobs
                </div>

              </div>
            </div>

            {/* RIGHT - PRODUCT PREVIEW */}
            <div className="relative">

              {/* Main card */}
              <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/10 p-5 sm:p-6 max-w-xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">

                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Your Matches
                    </p>

                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                      Jobs For You
                    </h3>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>

                </div>

                {/* Job card */}
                <div className="rounded-2xl border border-slate-200 p-5 shadow-sm">

                  <div className="flex items-start justify-between">

                    <div className="flex items-center gap-3">

                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                        TN
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">
                          Software Engineer
                        </h4>

                        <p className="text-xs text-slate-500 mt-0.5">
                          TechNova
                        </p>
                      </div>

                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                      96% Match
                    </span>

                  </div>

                  <div className="flex flex-wrap gap-2 mt-5">

                    {["Java", "Spring Boot", "SQL", "AWS"].map(
                      (skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-600"
                        >
                          {skill}
                        </span>
                      )
                    )}

                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      Bengaluru / Remote
                    </div>

                    <span className="text-xs font-bold text-slate-900">
                      ₹8–14 LPA
                    </span>

                  </div>

                </div>

                {/* Bottom cards */}
                <div className="grid grid-cols-2 gap-3 mt-3">

                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Match Score
                      </span>
                    </div>

                    <p className="text-2xl font-black mt-2">
                      96%
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-900 text-white p-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        ATS Score
                      </span>
                    </div>

                    <p className="text-2xl font-black mt-2 text-emerald-400">
                      88%
                    </p>
                  </div>

                </div>

              </div>

              {/* Floating success card */}
              <div className="hidden sm:flex absolute -left-8 bottom-8 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Profile Growth
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    +32% this month
                  </p>
                </div>

              </div>

              {/* Floating placed card */}
              <div className="hidden sm:flex absolute -right-6 -top-6 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Recently Hired
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    Software Engineer
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>


      {/* =====================================================
          HIRING COMPANIES
          ===================================================== */}
      <section className="py-14 border-b border-slate-100 bg-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Companies hiring through SwipeX
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">

            {hiringCompanies.map((company, index) => (
              <div
                key={company}
                className="h-16 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-center gap-2 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {company
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <span className="text-xs sm:text-sm font-bold text-slate-700">
                  {company}
                </span>
              </div>
            ))}

          </div>
        </div>
      </section>


      {/* =====================================================
          STATS
          ===================================================== */}
      <section className="py-16 bg-slate-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Icon className="w-5 h-5" />
                  </div>

                  <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-4">
                    {stat.value}
                  </p>

                  <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                    {stat.label}
                  </p>
                </div>
              );
            })}

          </div>

        </div>
      </section>


      {/* =====================================================
          HOW IT WORKS
          ===================================================== */}
      <section className="py-24 bg-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-2xl mx-auto text-center">

            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600">
              <Zap className="w-4 h-4" />
              Simple process
            </span>

            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 mt-4">
              Your next opportunity is
              <span className="text-emerald-600">
                {" "}four steps away.
              </span>
            </h2>

            <p className="text-slate-500 mt-5 leading-relaxed">
              SwipeX combines job discovery, AI career intelligence
              and application tracking into one simple experience.
            </p>

          </div>


          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">

            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="relative rounded-2xl border border-slate-200 bg-white p-6 hover:-translate-y-1 hover:shadow-lg transition-all"
                >

                  <div className="flex items-center justify-between">

                    <span className="text-4xl font-black text-slate-100">
                      {step.number}
                    </span>

                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>

                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 mt-6">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-500 leading-relaxed mt-2">
                    {step.description}
                  </p>

                </div>
              );
            })}

          </div>

        </div>
      </section>


      {/* =====================================================
          AI FEATURES
          ===================================================== */}
      <section className="py-24 bg-slate-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-14 items-center">

            <div>

              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                Career Intelligence
              </span>

              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 mt-4 leading-tight">
                Stop applying
                <br />
                <span className="text-emerald-600">
                  everywhere.
                </span>
              </h2>

              <p className="text-slate-500 leading-relaxed mt-6 max-w-lg">
                SwipeX helps you understand where your profile fits,
                what you should improve and which opportunities are
                actually worth your time.
              </p>

              <Link
                to="/signup"
                className="inline-flex items-center gap-2 mt-7 text-sm font-bold text-emerald-700 hover:text-emerald-800"
              >
                Build my career profile
                <ArrowRight className="w-4 h-4" />
              </Link>

            </div>


            <div className="grid sm:grid-cols-2 gap-4">

              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-200 transition-all"
                  >

                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 mt-5">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-slate-500 leading-relaxed mt-2">
                      {feature.description}
                    </p>

                  </div>
                );
              })}

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          TOP PLACED STUDENTS
          ===================================================== */}
      <section className="py-24 bg-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">

            <div>

              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                Success Stories
              </span>

              <h2 className="text-4xl font-black tracking-tight text-slate-950 mt-3">
                Students who got hired
              </h2>

              <p className="text-slate-500 mt-3 max-w-xl">
                Meet some of the candidates who turned their skills
                into real career opportunities.
              </p>

            </div>

            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700"
            >
              Start your journey
              <ArrowRight className="w-4 h-4" />
            </Link>

          </div>


          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">

            {placedStudents.map((student) => (
              <div
                key={student.name}
                className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
              >

                <div className="h-20 bg-slate-900 relative">

                  <div className="absolute -bottom-7 left-5 w-14 h-14 rounded-2xl bg-emerald-100 border-4 border-white text-emerald-700 flex items-center justify-center font-black">
                    {student.initials}
                  </div>

                  <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hired
                  </span>

                </div>

                <div className="p-5 pt-11">

                  <h3 className="font-extrabold text-slate-900">
                    {student.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    {student.role}
                  </p>

                  <div className="flex items-center gap-2 mt-4">

                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    </div>

                    <span className="text-xs font-bold text-slate-700">
                      {student.company}
                    </span>

                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">

                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Package
                    </span>

                    <span className="text-sm font-black text-emerald-600">
                      {student.package}
                    </span>

                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-4">

                    {student.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[9px] font-semibold text-slate-500"
                      >
                        {skill}
                      </span>
                    ))}

                  </div>

                </div>
              </div>
            ))}

          </div>

        </div>
      </section>


      {/* =====================================================
          TESTIMONIALS
          ===================================================== */}
      <section className="py-24 bg-slate-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto">

            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              What candidates say
            </span>

            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 mt-4">
              Built for the people
              <br />
              looking for their
              <span className="text-emerald-600">
                {" "}next opportunity.
              </span>
            </h2>

          </div>


          <div className="grid md:grid-cols-3 gap-5 mt-14">

            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
              >

                <div className="flex gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-3.5 h-3.5 fill-current"
                    />
                  ))}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mt-5">
                  “{testimonial.quote}”
                </p>

                <div className="flex items-center gap-3 mt-7 pt-5 border-t border-slate-100">

                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                    {testimonial.initials}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {testimonial.name}
                    </p>

                    <p className="text-[11px] text-slate-500">
                      {testimonial.role} · {testimonial.company}
                    </p>
                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>
      </section>


      {/* =====================================================
          RECRUITER CTA
          ===================================================== */}
      <section className="py-24 bg-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 sm:p-12 lg:p-16">

            <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-emerald-600/20 blur-3xl" />

            <div className="relative grid lg:grid-cols-2 gap-10 items-center">

              <div>

                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  <Building2 className="w-4 h-4" />
                  For employers
                </span>

                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mt-4">
                  Find the talent
                  <br />
                  <span className="text-emerald-400">
                    your company needs.
                  </span>
                </h2>

                <p className="text-slate-400 leading-relaxed mt-5 max-w-xl">
                  Discover skilled candidates, post opportunities and
                  build your talent pipeline with SwipeX.
                </p>

                <Link
                  to="/recruiter"
                  className="inline-flex items-center gap-2 mt-7 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
                >
                  Start Hiring
                  <ArrowRight className="w-4 h-4" />
                </Link>

              </div>


              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <p className="text-2xl font-black text-white mt-4">
                    2.5K+
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Active candidates
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <p className="text-2xl font-black text-white mt-4">
                    92%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Match quality
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                  <p className="text-2xl font-black text-white mt-4">
                    10K+
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Opportunities
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <p className="text-2xl font-black text-white mt-4">
                    AI
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Talent intelligence
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          FINAL CTA
          ===================================================== */}
      <section className="py-24 bg-emerald-50 border-y border-emerald-100">

        <div className="max-w-3xl mx-auto px-4 text-center">

          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
            <Sparkles className="w-7 h-7" />
          </div>

          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 mt-6">
            Your next opportunity
            <br />
            could be one swipe away.
          </h2>

          <p className="text-slate-600 mt-5 leading-relaxed">
            Build your profile, discover better opportunities and
            take control of your career with SwipeX.
          </p>

          <Link
            to="/signup"
            className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all"
          >
            Get Started with SwipeX
            <ArrowRight className="w-4 h-4" />
          </Link>

        </div>

      </section>


      {/* =====================================================
          FOOTER
          ===================================================== */}
      <footer className="bg-white border-t border-slate-200">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="lg:col-span-2">

              <Link
                to="/"
                className="inline-flex items-center gap-2.5"
              >

                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  SX
                </div>

                <span className="text-xl font-black text-slate-900">
                  Swipe<span className="text-emerald-600">X</span>
                </span>

              </Link>

              <p className="text-sm text-slate-500 leading-relaxed mt-4 max-w-md">
                AI-powered job discovery and career assistance
                designed to help students and professionals find
                better opportunities.
              </p>

            </div>


            {/* For Candidates */}
            <div>

              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Candidates
              </h3>

              <div className="flex flex-col gap-3 mt-4">

                <Link
                  to="/discover"
                  className="text-sm text-slate-600 hover:text-emerald-600"
                >
                  Find Jobs
                </Link>

                <Link
                  to="/recommendations"
                  className="text-sm text-slate-600 hover:text-emerald-600"
                >
                  AI Recommendations
                </Link>

                <Link
                  to="/resume-analysis"
                  className="text-sm text-slate-600 hover:text-emerald-600"
                >
                  Resume ATS
                </Link>

                <Link
                  to="/signup"
                  className="text-sm text-slate-600 hover:text-emerald-600"
                >
                  Create Profile
                </Link>

              </div>

            </div>


            {/* Companies */}
            <div>

              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Companies
              </h3>

              <div className="flex flex-col gap-3 mt-4">

                <Link
                  to="/companies"
                  className="text-sm text-slate-600 hover:text-emerald-600"
                >
                  Explore Companies
                </Link>

                <Link
                  to="/recruiter"
                  className="text-sm text-slate-600 hover:text-emerald-600"
                >
                  Recruiter Portal
                </Link>

                <Link
                  to="/recruiter/post-job"
                  className="text-sm text-slate-600 hover:text-emerald-600"
                >
                  Post a Job
                </Link>

              </div>

            </div>

          </div>


          <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">

            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} SwipeX. All rights reserved.
            </p>

            <p className="text-xs font-medium text-slate-400">
              Intelligent Swipe-Based Career & Talent Acquisition Platform
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default HomePage;