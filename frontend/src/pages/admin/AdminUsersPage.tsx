import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Trash2,
  Mail,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sliders,
  Send,
  X,
  Layers,
  MousePointerClick,
  ShieldAlert,
  Key,
  RefreshCw,
  Eye
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import type { AdminUser, PaginatedAdminUsers, AdminUserDetail } from '../../types';
import type { AdminLayoutContext } from '../../layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../../components/CustomSelect';

const AdminUsersPage: React.FC = () => {
  const { refreshTrigger } = useOutletContext<AdminLayoutContext>();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Drawer state
  const [selectedUserPublicId, setSelectedUserPublicId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Quota Override state inside drawer
  const [customQuotaInput, setCustomQuotaInput] = useState<string>('');
  const [isSavingQuota, setIsSavingQuota] = useState(false);

  // Verification actions state
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  // Delete User Modal state
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const isRoot = currentUser?.role === 'ROOT' || currentUser?.role === 'ROLE_ROOT';

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = {
        page,
        size: 15,
        search: debouncedSearch.trim() || undefined
      };
      const { data } = await axiosInstance.get<PaginatedAdminUsers>('/admin/users', { params });
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load users', err);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchTerm);
    setPage(0);
  };

  const handleToggleSuspend = async (user: AdminUser) => {
    const actionName = (user.isSuspended ?? user.suspended) ? 'reactivate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionName} account "${user.username || user.email}"?`)) {
      return;
    }
    try {
      await axiosInstance.post(`/admin/users/${user.publicId}/suspend`, {
        reason: (user.isSuspended ?? user.suspended) ? null : 'Suspended for platform policy violation'
      });
      toast.success(`Account ${actionName}d successfully`);
      fetchUsers();
      if (selectedUserPublicId === user.publicId) {
        fetchUserDetails(user.publicId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update account status');
    }
  };

  const handleRoleChange = async (user: AdminUser, newRole: 'USER' | 'ADMIN') => {
    if (user.role === newRole) return;
    try {
      await axiosInstance.put(`/admin/users/${user.publicId}/role`, { role: newRole });
      toast.success(`Role for ${user.username} updated to ${newRole}`);
      fetchUsers();
      if (selectedUserPublicId === user.publicId) {
        fetchUserDetails(user.publicId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  // ── Open User Details ──
  const fetchUserDetails = async (publicId: string) => {
    try {
      setIsDetailLoading(true);
      const { data } = await axiosInstance.get<AdminUserDetail>(`/admin/users/${publicId}`);
      setUserDetail(data);
      setCustomQuotaInput(data.customMaxLinks ? String(data.customMaxLinks) : '');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load user details');
      setSelectedUserPublicId(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleOpenUserDetail = (publicId: string) => {
    setSelectedUserPublicId(publicId);
    fetchUserDetails(publicId);
  };

  // ── Email Verification Actions ──
  const handleManualVerifyEmail = async (publicId: string) => {
    try {
      setIsVerifyingEmail(true);
      await axiosInstance.post(`/admin/users/${publicId}/verify-email`);
      toast.success('User email marked as verified');
      fetchUsers();
      if (selectedUserPublicId === publicId) {
        fetchUserDetails(publicId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify email');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleResendVerification = async (publicId: string) => {
    try {
      setIsResendingVerification(true);
      await axiosInstance.post(`/admin/users/${publicId}/resend-verification`);
      toast.success('Verification email sent to user');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setIsResendingVerification(false);
    }
  };

  // ── Quota Override ──
  const handleSaveQuota = async () => {
    if (!userDetail) return;
    try {
      setIsSavingQuota(true);
      const val = customQuotaInput.trim() === '' ? null : parseInt(customQuotaInput.trim(), 10);
      if (val !== null && (isNaN(val) || val < 1 || val > 1000000)) {
        toast.error('Quota must be between 1 and 1,000,000 links');
        return;
      }
      await axiosInstance.put(`/admin/users/${userDetail.publicId}/quota`, {
        customMaxLinks: val
      });
      toast.success(val === null ? 'Reverted to global system quota' : `Custom quota set to ${val.toLocaleString()} links`);
      fetchUsers();
      fetchUserDetails(userDetail.publicId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save quota');
    } finally {
      setIsSavingQuota(false);
    }
  };

  // ── Delete User ──
  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    try {
      setIsDeletingUser(true);
      await axiosInstance.delete(`/admin/users/${userToDelete.publicId}`);
      toast.success(`Account ${userToDelete.email} and all data permanently deleted`);
      setUserToDelete(null);
      setDeleteConfirmText('');
      if (selectedUserPublicId === userToDelete.publicId) {
        setSelectedUserPublicId(null);
        setUserDetail(null);
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-7xl mx-auto"
    >
      {/* ── Search & Filter Controls ───────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-background border border-border p-3 rounded-2xl shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by username, email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground transition-colors"
          />
        </form>

        <span className="text-xs text-muted-foreground">
          {totalElements} registered accounts
        </span>
      </div>

      {/* ── Users Data Table ───────────────────────────────── */}
      <div className="bg-background border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground font-medium">
                <th className="py-3 px-4">User & Auth</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Email Verification</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-center">Links / Quota</th>
                <th className="py-3 px-4 text-center">Total Clicks</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Skeleton circle width={28} height={28} />
                        <div className="space-y-1">
                          <Skeleton width={110} height={14} borderRadius={4} />
                          <Skeleton width={140} height={12} borderRadius={4} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><Skeleton width={60} height={20} borderRadius={8} /></td>
                    <td className="py-3 px-4"><Skeleton width={70} height={18} borderRadius={8} /></td>
                    <td className="py-3 px-4"><Skeleton width={65} height={18} borderRadius={8} /></td>
                    <td className="py-3 px-4 text-center"><Skeleton width={65} height={16} borderRadius={6} /></td>
                    <td className="py-3 px-4 text-center"><Skeleton width={45} height={16} borderRadius={6} /></td>
                    <td className="py-3 px-4"><Skeleton width={75} height={14} borderRadius={4} /></td>
                    <td className="py-3 px-4 text-right"><Skeleton width={120} height={24} borderRadius={8} className="ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {users.map((u) => {
                    const isSelf = u.email === currentUser?.email;
                    const isRootUser = u.role === 'ROOT';
                    const isSuspended = Boolean(u.isSuspended ?? u.suspended);

                    return (
                      <motion.tr 
                        key={u.id} 
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="hover:bg-secondary/70 transition-colors"
                      >
                        {/* User Info & Auth Providers */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => handleOpenUserDetail(u.publicId)}
                              className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center font-bold uppercase text-[10px] border border-border transition-transform active:scale-95 shrink-0"
                              title="View full user details"
                            >
                              {u.username ? u.username.charAt(0) : 'U'}
                            </button>
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate max-w-[170px] flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenUserDetail(u.publicId)}
                                  className="hover:underline text-left truncate font-semibold"
                                >
                                  {u.username || 'User'}
                                </button>
                                {isSelf && (
                                  <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.2 rounded border border-border shrink-0">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate max-w-[170px]">
                                {u.email}
                              </div>

                              {/* Connected Auth Providers Badges */}
                              {u.connectedOAuthProviders && u.connectedOAuthProviders.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  {u.connectedOAuthProviders.map(prov => (
                                    <span key={prov} className="text-[9px] px-1 py-0.2 rounded bg-secondary font-mono text-muted-foreground border border-border">
                                      {prov.toLowerCase()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role Badge / Selector */}
                        <td className="py-3 px-4">
                          {isRoot && !isRootUser && !isSelf ? (
                            <CustomSelect
                              value={u.role}
                              onChange={(val) => handleRoleChange(u, val as 'USER' | 'ADMIN')}
                              options={[
                                { value: 'USER', label: 'USER' },
                                { value: 'ADMIN', label: 'ADMIN' },
                              ]}
                              className="w-24"
                              triggerClassName="py-1 px-2 text-xs"
                              menuClassName="min-w-[96px]"
                            />
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              u.role === 'ROOT' 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                                : u.role === 'ADMIN'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-secondary text-muted-foreground border-border'
                            }`}>
                              <Shield className="w-2.5 h-2.5" />
                              {u.role}
                            </span>
                          )}
                        </td>

                        {/* Email Verification Status */}
                        <td className="py-3 px-4">
                          {u.emailVerified ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              title={u.emailVerifiedAt ? `Verified on ${new Date(u.emailVerifiedAt).toLocaleString()}` : 'Verified account'}
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Clock className="w-2.5 h-2.5" /> Pending
                              </span>
                              {!isRootUser && !isSelf && (
                                <button
                                  onClick={() => handleManualVerifyEmail(u.publicId)}
                                  className="text-[10px] text-primary hover:underline hover:text-primary/80 transition-colors"
                                  title="Mark email verified manually"
                                >
                                  Verify
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {isSuspended ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20"
                              title={u.suspendedReason || 'Suspended'}
                            >
                              <UserX className="w-2.5 h-2.5" /> Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <UserCheck className="w-2.5 h-2.5" /> Active
                            </span>
                          )}
                        </td>

                        {/* Links / Quota */}
                        <td className="py-3 px-4 text-center">
                          <div className="font-medium text-foreground">
                            {u.linkCount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {u.customMaxLinks ? (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold" title="Custom quota assigned">
                                / {u.customMaxLinks.toLocaleString()} (Custom)
                              </span>
                            ) : (
                              <span>/ Default</span>
                            )}
                          </div>
                        </td>

                        {/* Click Count */}
                        <td className="py-3 px-4 text-center font-semibold text-foreground">
                          {u.totalClicks.toLocaleString()}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3 px-4 text-muted-foreground text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Detail Drawer Button */}
                            <button
                              onClick={() => handleOpenUserDetail(u.publicId)}
                              className="p-1.5 text-xs font-medium rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer"
                              title="View user details & analytics"
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>

                            {/* Suspend / Reactivate */}
                            {!isRootUser && !isSelf && (
                              <button
                                onClick={() => handleToggleSuspend(u)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                                  isSuspended
                                    ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                                    : 'border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                                }`}
                              >
                                {isSuspended ? 'Reactivate' : 'Suspend'}
                              </button>
                            )}

                            {/* Delete User Button */}
                            {!isRootUser && !isSelf && (
                              <button
                                onClick={() => {
                                  setUserToDelete(u);
                                  setDeleteConfirmText('');
                                }}
                                className="p-1.5 text-xs font-medium rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                                title="Permanently delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ──────────────────────────────── */}
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page + 1} of {Math.max(1, totalPages)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
              className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isLoading}
              className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── User Detail Slide-Over Drawer ──────────────────────── */}
      <AnimatePresence>
        {selectedUserPublicId && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-background/60 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-lg bg-background border-l border-border h-full shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-sm border border-border">
                    {userDetail?.username ? userDetail.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span>{userDetail?.username || 'User Profile'}</span>
                      {userDetail?.role && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-secondary border border-border text-muted-foreground">
                          {userDetail.role}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">{userDetail?.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedUserPublicId(null);
                    setUserDetail(null);
                  }}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {isDetailLoading || !userDetail ? (
                  <div className="space-y-4 animate-pulse">
                    <Skeleton height={60} borderRadius={12} />
                    <Skeleton height={100} borderRadius={12} />
                    <Skeleton height={120} borderRadius={12} />
                  </div>
                ) : (
                  <>
                    {/* User Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                          <Layers className="w-3 h-3" /> Total Links
                        </div>
                        <div className="text-base font-bold text-foreground">{userDetail.totalLinks}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                          <MousePointerClick className="w-3 h-3" /> Total Clicks
                        </div>
                        <div className="text-base font-bold text-foreground">{userDetail.totalClicks.toLocaleString()}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </div>
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{userDetail.activeLinks}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                          <ShieldAlert className="w-3 h-3" /> Quarantined
                        </div>
                        <div className="text-base font-bold text-red-500">{userDetail.quarantinedLinks}</div>
                      </div>
                    </div>

                    {/* Email Verification & Authentication Card */}
                    <div className="p-4 rounded-2xl border border-border bg-background shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-foreground">Email Verification & Security</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          userDetail.emailVerified 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {userDetail.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        {userDetail.emailVerified 
                          ? `Email address verified ${userDetail.emailVerifiedAt ? 'on ' + new Date(userDetail.emailVerifiedAt).toLocaleString() : ''}.`
                          : 'Account email has not been verified yet. Verification can be triggered or bypassed manually.'}
                      </p>

                      {!userDetail.emailVerified && userDetail.role !== 'ROOT' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleManualVerifyEmail(userDetail.publicId)}
                            disabled={isVerifyingEmail}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isVerifyingEmail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Mark Verified
                          </button>
                          <button
                            onClick={() => handleResendVerification(userDetail.publicId)}
                            disabled={isResendingVerification}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isResendingVerification ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Resend Email
                          </button>
                        </div>
                      )}

                      {/* OAuth Accounts */}
                      <div className="pt-2 border-t border-border">
                        <div className="text-[11px] font-medium text-foreground mb-1.5 flex items-center gap-1">
                          <Key className="w-3 h-3" /> Connected Authentication Providers
                        </div>
                        {userDetail.oauthAccounts && userDetail.oauthAccounts.length > 0 ? (
                          <div className="space-y-1.5">
                            {userDetail.oauthAccounts.map(acc => (
                              <div key={acc.provider} className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/30 border border-border">
                                <span className="font-mono font-semibold uppercase text-[11px]">{acc.provider}</span>
                                <span className="text-[11px] text-muted-foreground font-mono">{acc.providerEmail || 'Linked'}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Standard Email & Password login</span>
                        )}
                      </div>
                    </div>

                    {/* Custom Link Quota Override Card */}
                    <div className="p-4 rounded-2xl border border-border bg-background shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-foreground" />
                          <span className="text-xs font-semibold text-foreground">User Link Quota Override</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Effective: {userDetail.effectiveMaxLinks.toLocaleString()} links
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Customize the maximum link creation ceiling for this account. Clear the input to revert to the global system limit.
                      </p>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Global Default"
                          min="1"
                          max="1000000"
                          value={customQuotaInput}
                          onChange={(e) => setCustomQuotaInput(e.target.value)}
                          className="w-36 px-3 py-1.5 text-xs bg-background border border-border rounded-lg font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                        />
                        <button
                          onClick={handleSaveQuota}
                          disabled={isSavingQuota}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-foreground text-background hover:bg-foreground/85 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isSavingQuota ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                          Save Quota
                        </button>
                        {customQuotaInput && (
                          <button
                            onClick={() => {
                              setCustomQuotaInput('');
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Recent User Links */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Recent Short Links</span>
                        <span className="text-[11px] text-muted-foreground">Latest 10</span>
                      </div>

                      {userDetail.recentLinks && userDetail.recentLinks.length > 0 ? (
                        <div className="space-y-2">
                          {userDetail.recentLinks.map(link => (
                            <div key={link.shortUrl} className="p-3 rounded-xl border border-border bg-background hover:bg-secondary/30 transition-colors text-xs flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-foreground">/{link.shortUrl}</span>
                                  {link.isQuarantined && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 font-semibold border border-red-500/20">
                                      Quarantined
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{link.longUrl}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold text-foreground">{link.totalClicks.toLocaleString()} clicks</div>
                                <div className="text-[10px] text-muted-foreground">{new Date(link.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                          User has not created any links yet.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">ID: {userDetail?.publicId}</span>
                {userDetail && userDetail.role !== 'ROOT' && userDetail.email !== currentUser?.email && (
                  <button
                    onClick={() => {
                      setUserToDelete(users.find(u => u.publicId === userDetail.publicId) || null);
                      setDeleteConfirmText('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Account
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete User Confirmation Modal ────────────────────── */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Permanently Delete User Account
                  </h3>
                  <p className="text-xs text-muted-foreground">This destructive operation cannot be undone</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs mb-4 space-y-1">
                <p className="font-semibold">⚠️ Deleting this user will permanently erase:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>User account ({userToDelete.email}) and credentials</li>
                  <li>All {userToDelete.linkCount} short links and their analytics click records</li>
                  <li>Associated folders, tags, custom channels, and UTM templates</li>
                  <li>Redis caches for all their shortened URLs</li>
                </ul>
              </div>

              <div className="space-y-2 mb-5">
                <label className="text-xs font-medium text-foreground">
                  Type <span className="font-mono font-semibold select-all text-red-500">{userToDelete.email}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={userToDelete.email}
                  className="w-full px-3 py-2 text-xs bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeletingUser}
                  className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUserConfirm}
                  disabled={isDeletingUser || deleteConfirmText.trim().toLowerCase() !== userToDelete.email.toLowerCase()}
                  className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isDeletingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirm Hard Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminUsersPage;
