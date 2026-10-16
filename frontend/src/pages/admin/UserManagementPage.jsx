import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Trash2,
  Power,
  UserCheck,
  Building2,
  Mail,
  Calendar,
  X
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export function UserManagementPage() {
  const { user: me, adminUsers, adminLoading, adminError, toggleUserStatus, deleteUser, updateUserRole } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  const filteredUsers = adminUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "All" || u.role.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            User Base Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage permissions, modify account roles, suspend fraudulent actors, or delete profiles.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-800/80 dark:bg-zinc-700/80 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["All", "Job Seeker", "Recruiter", "Admin"].map((rf) => (
            <button
              key={rf}
              type="button"
              onClick={() => setRoleFilter(rf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                roleFilter === rf
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700"
              }`}
            >
              {rf}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-zinc-950/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                  {/* User Column */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-700 dark:text-purple-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {(u.name || "?").trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role Selector */}
                  <td className="py-4 px-4">
                    <select
                      value={u.role}
                      disabled={u.id === me?.id}
                      title={u.id === me?.id ? "You cannot change your own role" : undefined}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      className="px-2.5 py-1 bg-slate-800 dark:bg-zinc-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="Job Seeker">Job Seeker</option>
                      <option value="Recruiter">Recruiter</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>

                  {/* Joined Date */}
                  <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium">
                    {u.joinedDate}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === "Active"
                          ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                          : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.status === "Active" ? "bg-brand-400" : "bg-rose-400"
                        }`}
                      />
                      <span>{u.status}</span>
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={u.id === me?.id}
                        onClick={() => toggleUserStatus(u.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.status === "Active"
                            ? "text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            : "text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        }`}
                        title={u.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        disabled={u.id === me?.id || u.role === "Admin"}
                        onClick={() => setDeleteConfirmUser(u)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {adminError && <p className="p-6 text-xs text-rose-600 dark:text-rose-400">{adminError}</p>}
          {!adminError && filteredUsers.length === 0 && (
            <p className="p-6 text-xs text-slate-500 dark:text-slate-400 text-center">
              {adminLoading ? "Loading users..." : "No users match this filter."}
            </p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete User Account?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <span className="font-bold text-slate-900 dark:text-white">{deleteConfirmUser.name}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 px-4 py-2.5 bg-slate-800 dark:bg-zinc-700 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(deleteConfirmUser.id);
                  setDeleteConfirmUser(null);
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;
