import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Search,
  MapPin,
  Users,
  Briefcase,
  Star,
  ChevronRight,
  Sparkles,
  Rocket,
  Globe2,
  AlertCircle,
  X,
} from "lucide-react";

import jobService from "../services/jobService";

const CATEGORY_TABS = [
  {
    id: "All",
    label: "All Companies",
    icon: Building2,
  },
  {
    id: "MNC",
    label: "MNCs & Global Giants",
    icon: Globe2,
  },
  {
    id: "Startup",
    label: "High-Growth Startups",
    icon: Rocket,
  },
  {
    id: "Newly Founded",
    label: "Newly Founded",
    icon: Sparkles,
  },
];

export function CompaniesPage() {
  const [companies, setCompanies] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [activeCategory, setActiveCategory] = useState("All");

  // =========================================================
  // LOAD COMPANIES
  // =========================================================

  const loadCompanies = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await jobService.getCompanies();

      console.log("GET /companies response:", response);

      if (response?.success) {
        setCompanies(
          Array.isArray(response.companies) ? response.companies : [],
        );
      } else {
        throw new Error(response?.message || "Unable to load companies.");
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);

      setCompanies([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load companies catalog. Please check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // =========================================================
  // SEARCH + CATEGORY FILTER
  // =========================================================

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return companies.filter((company) => {
      // -----------------------------------------------------
      // CATEGORY
      // -----------------------------------------------------

      const matchesCategory =
        activeCategory === "All" || company.category === activeCategory;

      if (!matchesCategory) {
        return false;
      }

      // -----------------------------------------------------
      // SEARCH
      // -----------------------------------------------------

      if (!query) {
        return true;
      }

      const name = company.name?.toLowerCase() || "";

      const industry = company.industry?.toLowerCase() || "";

      const location = company.location?.toLowerCase() || "";

      const about = company.about?.toLowerCase() || "";

      const techStack = Array.isArray(company.techStack)
        ? company.techStack
        : [];

      const matchesTech = techStack.some((tech) =>
        String(tech).toLowerCase().includes(query),
      );

      return (
        name.includes(query) ||
        industry.includes(query) ||
        location.includes(query) ||
        about.includes(query) ||
        matchesTech
      );
    });
  }, [companies, activeCategory, searchQuery]);

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
  };

  // =========================================================
  // CATEGORY BADGE
  // =========================================================

  const getCategoryClass = (category) => {
    switch (category) {
      case "Startup":
        return "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20";

      case "Newly Founded":
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20";

      case "MNC":
        return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20";

      default:
        return "bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800";
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-xl">
            <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            Explore Companies
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl">
          Discover technology companies, startups, engineering teams and their
          active job opportunities.
        </p>
      </div>

      {/* ===================================================
          SEARCH + CATEGORY
      =================================================== */}

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 mb-8 shadow-xs">
        {/* Search */}

        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search company, industry, technology or location..."
            className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-900 dark:text-zinc-50 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories */}

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;

            const isActive = activeCategory === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-50 border-slate-200 dark:border-zinc-800"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />

                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================
          RESULT COUNT
      =================================================== */}

      {!isLoading && !error && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Showing{" "}
            <span className="font-bold text-slate-900 dark:text-zinc-50">
              {filteredCompanies.length}
            </span>{" "}
            {filteredCompanies.length === 1 ? "company" : "companies"}
          </p>

          {(searchQuery || activeCategory !== "All") && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ===================================================
          LOADING
      =================================================== */}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div
              key={index}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 rounded-xl bg-slate-200 dark:bg-zinc-700" />

                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-1/2" />
                </div>
              </div>

              <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-3/4" />

              <div className="h-12 bg-slate-100 dark:bg-zinc-800 rounded-xl" />

              <div className="h-8 bg-slate-100 dark:bg-zinc-800 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {!isLoading && error && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-rose-200 dark:border-rose-500/20 p-10 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50 mb-1">
            Failed to load companies
          </h3>

          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">{error}</p>

          <button
            type="button"
            onClick={loadCompanies}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* ===================================================
          EMPTY
      =================================================== */}

      {!isLoading && !error && filteredCompanies.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-slate-400" />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50 mb-1">
            No companies found
          </h3>

          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">
            Try another company name, technology, location or category.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* ===================================================
          COMPANY GRID
      =================================================== */}

      {!isLoading && !error && filteredCompanies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => {
            const techStack = Array.isArray(company.techStack)
              ? company.techStack
              : [];

            const openJobs = Number(company.openJobsCount) || 0;

            return (
              <div
                key={company.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-brand-300 hover:shadow-md transition-all flex flex-col p-6 group"
              >
                {/* TOP */}

                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-13 h-13 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={`${company.name} logo`}
                          className="w-full h-full object-contain rounded-lg"
                          // onError={(event) => {
                          //   event.currentTarget.style.display =
                          //     "none";
                          // }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement.classList.add(
                              "flex",
                              "items-center",
                              "justify-center",
                            );

                            const fallback = document.createElement("span");
                            fallback.className =
                              "text-lg font-bold text-brand-600 dark:text-brand-400";
                            fallback.textContent =
                              company.name?.charAt(0)?.toUpperCase() || "?";

                            e.currentTarget.parentElement.appendChild(fallback);
                          }}
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50 leading-tight truncate group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                        {company.name}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">
                        {company.industry || "Technology"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${getCategoryClass(
                      company.category,
                    )}`}
                  >
                    {company.category || "Company"}
                  </span>
                </div>

                {/* META */}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-zinc-400 mb-4">
                  {company.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {company.location}
                    </span>
                  )}

                  {company.employeeCount && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {company.employeeCount}
                    </span>
                  )}

                  {company.rating != null && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {company.rating}
                    </span>
                  )}
                </div>

                {/* ABOUT */}

                <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-3 leading-relaxed mb-4 min-h-[54px]">
                  {company.about ||
                    "Explore this company and discover available career opportunities."}
                </p>

                {/* TECH STACK */}

                {techStack.length > 0 && (
                  <div className="mb-5">
                    <div className="flex flex-wrap gap-1.5">
                      {techStack.slice(0, 5).map((tech, index) => (
                        <span
                          key={`${tech}-${index}`}
                          className="px-2 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] rounded-md font-medium"
                        >
                          {tech}
                        </span>
                      ))}

                      {techStack.length > 5 && (
                        <span className="px-1.5 py-1 text-slate-400 text-[10px] font-medium">
                          +{techStack.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* FOOTER */}

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1.5 rounded-lg border border-brand-100 dark:border-brand-500/20">
                    <Briefcase className="w-3.5 h-3.5" />
                    {openJobs} {openJobs === 1 ? "Open Role" : "Open Roles"}
                  </span>

                  <Link
                    to={`/companies/${company.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-brand-700 dark:hover:text-brand-300 group-hover:translate-x-0.5 transition-all"
                  >
                    View Profile
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CompaniesPage;
