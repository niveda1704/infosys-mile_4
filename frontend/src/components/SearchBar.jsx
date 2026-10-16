import React, { useEffect, useState } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";

import { useApp } from "../context/AppContext";

export function SearchBar({
  placeholder = "Search jobs, skills, roles or companies...",
  onOpenFilters,
  onSearch,
}) {
  const {
    searchQuery,
    setSearchQuery,
    setIsFilterModalOpen,
  } = useApp();

  const [inputValue, setInputValue] = useState(
    searchQuery || ""
  );

  // Keep local input synchronized with AppContext
  useEffect(() => {
    setInputValue(searchQuery || "");
  }, [searchQuery]);

  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------

  const handleSubmit = (event) => {
    event.preventDefault();

    const value = inputValue.trim();

    // Update global search state
    setSearchQuery(value);

    // Optional callback from DiscoverPage
    if (onSearch) {
      onSearch(value);
    }
  };

  // ---------------------------------------------------------
  // CLEAR
  // ---------------------------------------------------------

  const handleClear = () => {
    setInputValue("");
    setSearchQuery("");

    if (onSearch) {
      onSearch("");
    }
  };

  // ---------------------------------------------------------
  // INPUT CHANGE
  // ---------------------------------------------------------

  const handleInputChange = (event) => {
    const value = event.target.value;

    setInputValue(value);

    // Keep AppContext synchronized
    setSearchQuery(value);
  };

  // ---------------------------------------------------------
  // FILTERS
  // ---------------------------------------------------------

  const handleFiltersClick = () => {
    if (onOpenFilters) {
      onOpenFilters();
    } else {
      setIsFilterModalOpen(true);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center w-full max-w-3xl mx-auto"
    >
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <Search className="w-4.5 h-4.5" />
      </div>

      {/* Search Input */}
      <input
        type="text"
        id="main-job-search-input"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        autoComplete="off"
        aria-label="Search jobs, skills, roles or companies"
        className="
          w-full
          pl-11
          pr-28
          py-3
          sm:py-3.5
          bg-white dark:bg-zinc-900
          border
          border-slate-200 dark:border-zinc-800
          rounded-2xl
          text-slate-900 dark:text-zinc-50
          placeholder:text-slate-400
          text-xs
          sm:text-sm
          focus:outline-none
          focus:ring-2
          focus:ring-brand-500/20
          focus:border-brand-500
          transition-all
          shadow-sm
        "
      />

      {/* Right Controls */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">

        {/* Clear */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="
              p-1.5
              text-slate-400
              hover:text-slate-700 dark:hover:text-zinc-200
              hover:bg-slate-100 dark:hover:bg-zinc-800
              rounded-lg
              transition-colors
            "
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Filters */}
        <button
          type="button"
          onClick={handleFiltersClick}
          id="btn-trigger-filters"
          className="
            flex
            items-center
            gap-1.5
            px-2.5
            sm:px-3
            py-1.5
            bg-slate-100 dark:bg-zinc-800
            hover:bg-slate-200 dark:hover:bg-zinc-700
            text-slate-700 dark:text-zinc-200
            rounded-xl
            text-[11px]
            sm:text-xs
            font-semibold
            transition-all
            border
            border-slate-200 dark:border-zinc-800
          "
          aria-label="Open job filters"
          title="Filter jobs"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />

          <span className="hidden sm:inline">
            Filters
          </span>
        </button>

        {/* Search */}
        <button
          type="submit"
          className="
            flex
            items-center
            justify-center
            w-8
            h-8
            bg-brand-600
            hover:bg-brand-700
            text-white
            rounded-xl
            transition-all
            active:scale-95
          "
          aria-label="Search jobs"
          title="Search jobs"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

export default SearchBar;


// import React, { useEffect, useState } from "react";
// import {
//   Search,
//   X,
//   SlidersHorizontal,
//   ArrowRight,
// } from "lucide-react";

// import { useApp } from "../context/AppContext";

// export function SearchBar({
//   placeholder = "Search jobs, skills, roles or companies...",
//   onOpenFilters,
//   onSearch,
// }) {
//   const {
//     searchQuery,
//     setSearchQuery,
//     setIsFilterModalOpen,
//   } = useApp();

//   const [inputValue, setInputValue] = useState(
//     searchQuery || ""
//   );

//   // Keep local input synchronized with AppContext
//   useEffect(() => {
//     setInputValue(searchQuery || "");
//   }, [searchQuery]);

//   // ---------------------------------------------------------
//   // SEARCH
//   // ---------------------------------------------------------

//   const handleSubmit = (event) => {
//     event.preventDefault();

//     const value = inputValue.trim();

//     // Update global search state
//     setSearchQuery(value);

//     // Optional callback from DiscoverPage
//     if (onSearch) {
//       onSearch(value);
//     }
//   };

//   // ---------------------------------------------------------
//   // CLEAR
//   // ---------------------------------------------------------

//   const handleClear = () => {
//     setInputValue("");
//     setSearchQuery("");

//     if (onSearch) {
//       onSearch("");
//     }
//   };

//   // ---------------------------------------------------------
//   // INPUT CHANGE
//   // ---------------------------------------------------------

//   const handleInputChange = (event) => {
//     const value = event.target.value;

//     setInputValue(value);

//     // Keep AppContext synchronized
//     setSearchQuery(value);
//   };

//   // ---------------------------------------------------------
//   // FILTERS
//   // ---------------------------------------------------------

//   const handleFiltersClick = () => {
//     if (onOpenFilters) {
//       onOpenFilters();
//     } else {
//       setIsFilterModalOpen(true);
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="relative flex items-center w-full max-w-3xl mx-auto"
//     >
//       {/* Search Icon */}
//       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
//         <Search className="w-4.5 h-4.5" />
//       </div>

//       {/* Search Input */}
//       <input
//         type="text"
//         id="main-job-search-input"
//         value={inputValue}
//         onChange={handleInputChange}
//         placeholder={placeholder}
//         autoComplete="off"
//         aria-label="Search jobs, skills, roles or companies"
//         className="
//           w-full
//           pl-11
//           pr-28
//           py-3
//           sm:py-3.5
//           bg-white dark:bg-zinc-900
//           border
//           border-slate-200 dark:border-zinc-800
//           rounded-2xl
//           text-slate-900 dark:text-zinc-50
//           placeholder:text-slate-400
//           text-xs
//           sm:text-sm
//           focus:outline-none
//           focus:ring-2
//           focus:ring-brand-500/20
//           focus:border-brand-500
//           transition-all
//           shadow-sm
//         "
//       />

//       {/* Right Controls */}
//       <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">

//         {/* Clear */}
//         {inputValue && (
//           <button
//             type="button"
//             onClick={handleClear}
//             className="
//               p-1.5
//               text-slate-400
//               hover:text-slate-700 dark:hover:text-zinc-200
//               hover:bg-slate-100 dark:hover:bg-zinc-800
//               rounded-lg
//               transition-colors
//             "
//             aria-label="Clear search"
//             title="Clear search"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         )}

//         {/* Filters */}
//         <button
//           type="button"
//           onClick={handleFiltersClick}
//           id="btn-trigger-filters"
//           className="
//             flex
//             items-center
//             gap-1.5
//             px-2.5
//             sm:px-3
//             py-1.5
//             bg-slate-100 dark:bg-zinc-800
//             hover:bg-slate-200 dark:hover:bg-zinc-700
//             text-slate-700 dark:text-zinc-200
//             rounded-xl
//             text-[11px]
//             sm:text-xs
//             font-semibold
//             transition-all
//             border
//             border-slate-200 dark:border-zinc-800
//           "
//           aria-label="Open job filters"
//           title="Filter jobs"
//         >
//           <SlidersHorizontal className="w-3.5 h-3.5" />

//           <span className="hidden sm:inline">
//             Filters
//           </span>
//         </button>

//         {/* Search */}
//         <button
//           type="submit"
//           className="
//             flex
//             items-center
//             justify-center
//             w-8
//             h-8
//             bg-brand-600
//             hover:bg-brand-700
//             text-white
//             rounded-xl
//             transition-all
//             active:scale-95
//           "
//           aria-label="Search jobs"
//           title="Search jobs"
//         >
//           <ArrowRight className="w-4 h-4" />
//         </button>
//       </div>
//     </form>
//   );
// }

// export default SearchBar;

// // import React from "react";
// // import {
// //   Search,
// //   X,
// //   SlidersHorizontal,
// //   ArrowRight,
// // } from "lucide-react";

// // import { useApp } from "../context/AppContext";

// // export function SearchBar({
// //   placeholder = "Search jobs, skills, roles or companies...",
// //   onOpenFilters,
// // }) {
// //   const {
// //     searchQuery,
// //     setSearchQuery,
// //     setIsFilterModalOpen,
// //   } = useApp();

// //   const handleClear = () => {
// //     setSearchQuery("");
// //   };

// //   const handleFiltersClick = () => {
// //     if (onOpenFilters) {
// //       onOpenFilters();
// //     } else {
// //       setIsFilterModalOpen(true);
// //     }
// //   };

// //   const handleSubmit = (event) => {
// //     event.preventDefault();

// //     // Search is controlled by AppContext.
// //     // DiscoverPage reacts to searchQuery changes.
// //   };

// //   return (
// //     <form
// //       onSubmit={handleSubmit}
// //       className="relative flex items-center w-full max-w-3xl mx-auto"
// //     >
// //       {/* Search Icon */}
// //       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
// //         <Search className="w-4.5 h-4.5" />
// //       </div>

// //       {/* Search Input */}
// //       <input
// //         type="text"
// //         id="main-job-search-input"
// //         value={searchQuery || ""}
// //         onChange={(event) =>
// //           setSearchQuery(event.target.value)
// //         }
// //         placeholder={placeholder}
// //         autoComplete="off"
// //         aria-label="Search jobs, skills, roles or companies"
// //         className="
// //           w-full
// //           pl-11
// //           pr-28
// //           py-3
// //           sm:py-3.5
// //           bg-white dark:bg-zinc-900
// //           border
// //           border-slate-200 dark:border-zinc-800
// //           rounded-2xl
// //           text-slate-900 dark:text-zinc-50
// //           placeholder:text-slate-400
// //           text-xs
// //           sm:text-sm
// //           focus:outline-none
// //           focus:ring-2
// //           focus:ring-brand-500/20
// //           focus:border-brand-500
// //           transition-all
// //           shadow-sm
// //         "
// //       />

// //       {/* Right Controls */}
// //       <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">

// //         {/* Clear */}
// //         {searchQuery && (
// //           <button
// //             type="button"
// //             onClick={handleClear}
// //             className="
// //               p-1.5
// //               text-slate-400
// //               hover:text-slate-700 dark:hover:text-zinc-200
// //               hover:bg-slate-100 dark:hover:bg-zinc-800
// //               rounded-lg
// //               transition-colors
// //             "
// //             aria-label="Clear search"
// //             title="Clear search"
// //           >
// //             <X className="w-4 h-4" />
// //           </button>
// //         )}

// //         {/* Filters */}
// //         <button
// //           type="button"
// //           onClick={handleFiltersClick}
// //           id="btn-trigger-filters"
// //           className="
// //             flex
// //             items-center
// //             gap-1.5
// //             px-2.5
// //             sm:px-3
// //             py-1.5
// //             bg-slate-100 dark:bg-zinc-800
// //             hover:bg-slate-200 dark:hover:bg-zinc-700
// //             text-slate-700 dark:text-zinc-200
// //             rounded-xl
// //             text-[11px]
// //             sm:text-xs
// //             font-semibold
// //             transition-all
// //             border
// //             border-slate-200 dark:border-zinc-800
// //           "
// //           aria-label="Open job filters"
// //           title="Filter jobs"
// //         >
// //           <SlidersHorizontal className="w-3.5 h-3.5" />

// //           <span className="hidden sm:inline">
// //             Filters
// //           </span>
// //         </button>

// //         {/* Search Button */}
// //         <button
// //           type="submit"
// //           className="
// //             hidden
// //             sm:flex
// //             items-center
// //             justify-center
// //             w-8
// //             h-8
// //             bg-brand-600
// //             hover:bg-brand-700
// //             text-white
// //             rounded-xl
// //             transition-all
// //             active:scale-95
// //           "
// //           aria-label="Search jobs"
// //           title="Search"
// //         >
// //           <ArrowRight className="w-4 h-4" />
// //         </button>
// //       </div>
// //     </form>
// //   );
// // }

// // export default SearchBar;