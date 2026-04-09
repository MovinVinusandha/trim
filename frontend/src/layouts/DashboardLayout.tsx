import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Link as LinkIcon, BarChart2, Folder as FolderIcon, Tag as TagIcon, ChevronDown, FolderPlus, Search, HelpCircle, User, Settings, Gift, LogOut, ArrowLeft, Shield, Download, Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axiosInstance from '../api/axiosInstance';
import type { Tag, Folder, UrlEntry } from '../types';
import CreateLinkModal from '../components/CreateLinkModal';
import CreateTagModal from '../components/CreateTagModal';
import FolderModal from '../components/FolderModal';
import BrandLogo from '../components/BrandLogo';
import ClickArrowIcon from '../components/icons/ClickArrowIcon';
import { Toaster, toast } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';

export type DashboardLayoutContext = {
  triggerRefresh: UrlEntry | null;
  tags: Tag[];
  folders: Folder[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  activeFolderId: number | null;
  setActiveFolderId: React.Dispatch<React.SetStateAction<number | null>>;
  setIsFolderModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCreateTagModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setFolderToEdit: React.Dispatch<React.SetStateAction<any | null>>;
  setTagToEdit: React.Dispatch<React.SetStateAction<any | null>>;
  isTagsLoading: boolean;
  isFoldersLoading: boolean;
};

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  
  const [folderToEdit, setFolderToEdit] = useState<any | null>(null);
  const [tagToEdit, setTagToEdit] = useState<any | null>(null);

  const [tags, setTags] = useState<Tag[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  
  const [isFolderSwitcherOpen, setIsFolderSwitcherOpen] = useState(false);
  const [folderSearch, setFolderSearch] = useState('');
  const folderSwitcherRef = useRef<HTMLDivElement>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (folderSwitcherRef.current && !folderSwitcherRef.current.contains(event.target as Node)) {
        setIsFolderSwitcherOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Stats for the sub-nav (populated by children)
  const [navStats, setNavStats] = useState({ totalClicks: 0, linkCount: 0 });
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Function to pass down to children to trigger refresh
  const [latestNewEntry, setLatestNewEntry] = useState<UrlEntry | null>(null);
  
  const triggerRefresh = (newEntry: UrlEntry) => {
    setLatestNewEntry(newEntry);
  };

  useEffect(() => {
    let isMounted = true;
    const loadTags = async () => {
      try {
        const { data } = await axiosInstance.get<Tag[]>('/tags');
        if (isMounted) setTags(data);
      } catch (err) {} finally {
        if (isMounted) setIsTagsLoading(false);
      }
    };

    const loadFolders = async () => {
      try {
        const { data } = await axiosInstance.get<Folder[]>('/folders');
        if (isMounted) setFolders(data);
      } catch (err) {} finally {
        if (isMounted) setIsFoldersLoading(false);
      }
    };

    if (user && user.role !== 'ROOT' && user.role !== 'ROLE_ROOT') {
      loadTags();
      loadFolders();
    } else {
      setIsTagsLoading(false);
      setIsFoldersLoading(false);
    }

    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const loadUsageStats = async () => {
      try {
        const { data } = await axiosInstance.get('/analytics/usage');
        if (isMounted) setNavStats({ totalClicks: data.totalClicks, linkCount: data.totalLinks });
      } catch (err) {
        console.error("Failed to load usage stats", err);
      } finally {
        if (isMounted) setIsStatsLoading(false);
      }
    };

    if (user && user.role !== 'ROOT' && user.role !== 'ROLE_ROOT') {
      loadUsageStats();
    } else {
      setIsStatsLoading(false);
    }
    return () => { isMounted = false; };
  }, [user, latestNewEntry]);

  const getTitle = () => {
    if (location.pathname.startsWith('/analytics')) return 'Analytics';
    if (location.pathname.startsWith('/folders')) return 'Folders';
    if (location.pathname.startsWith('/tags')) return 'Tags';
    return 'Links';
  };

  const renderHeaderButton = () => {
    if (location.pathname.startsWith('/analytics')) {
      return (
        <button 
          onClick={() => toast.success('Export functionality coming soon!')}
          className="bg-black text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-slate-200 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      );
    }
    if (location.pathname.startsWith('/folders')) {
      return (
        <button 
          onClick={() => {
            setFolderToEdit(null);
            setIsFolderModalOpen(true);
          }} 
          className="bg-black text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-slate-200 transition-colors shadow-sm"
        >
          <FolderPlus className="w-4 h-4" /> Create folder
        </button>
      );
    }
    if (location.pathname.startsWith('/tags')) {
      return (
        <button 
          onClick={() => {
            setTagToEdit(null);
            setIsCreateTagModalOpen(true);
          }} 
          className="bg-black text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-slate-200 transition-colors shadow-sm"
        >
          <TagIcon className="w-4 h-4" /> Create tag
        </button>
      );
    }
    // Default case for /dashboard
    return (
      <button 
        onClick={() => setIsCreateModalOpen(true)}
        className="bg-black text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-slate-200 transition-colors shadow-sm"
      >
        <LinkIcon className="w-4 h-4" /> Create link
      </button>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#E4E4E4] dark:bg-[#111113] text-gray-900 dark:text-[#EDEDED] font-sans">
      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className="w-20 shrink-0 bg-transparent hidden sm:flex flex-col items-center py-4 z-20">
        <div className="mb-8 flex items-center justify-center w-full px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <BrandLogo className="w-10 h-10 text-black dark:text-[#EDEDED]" />
        </div>
        <nav className="flex-1 flex flex-col items-center gap-4">
        </nav>
        <div className="mt-auto flex flex-col items-center gap-4">
          <button 
            onClick={() => toast('Help & Support coming soon!', { icon: '👋' })}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
          
          <div className="relative" ref={themeMenuRef}>
            <button 
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-[#EDEDED] transition-colors"
            >
              {theme === 'system' ? <Monitor className="w-5 h-5" /> : theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <AnimatePresence>
            {isThemeMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-full ml-4 bottom-0 z-50 bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] shadow-xl rounded-lg w-32 p-1 flex flex-col gap-1"
              >
                <button
                  onClick={() => { setTheme('light'); setIsThemeMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-full text-left ${theme === 'light' ? 'bg-gray-100 dark:bg-[#222222] text-gray-900 dark:text-[#EDEDED]' : 'text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30]'}`}
                >
                  <Sun className="w-4 h-4" /> Light
                </button>
                <button
                  onClick={() => { setTheme('dark'); setIsThemeMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-full text-left ${theme === 'dark' ? 'bg-gray-100 dark:bg-[#222222] text-gray-900 dark:text-[#EDEDED]' : 'text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30]'}`}
                >
                  <Moon className="w-4 h-4" /> Dark
                </button>
                <button
                  onClick={() => { setTheme('system'); setIsThemeMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-full text-left ${theme === 'system' ? 'bg-gray-100 dark:bg-[#222222] text-gray-900 dark:text-[#EDEDED]' : 'text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30]'}`}
                >
                  <Monitor className="w-4 h-4" /> System
                </button>
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2B2B30] text-gray-700 dark:text-gray-200 flex items-center justify-center text-sm font-medium uppercase border border-gray-300 dark:border-slate-600 shadow-sm cursor-pointer"
            >
              {user?.name ? user.name.charAt(0) : user?.email ? user.email.charAt(0) : 'U'}
            </button>

            <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-xl z-50 p-2"
              >
                <div className="px-3 py-2 border-b border-gray-100 dark:border-[#2B2B30] mb-1">
                  <div className="font-medium text-gray-900 dark:text-[#EDEDED] truncate">{user?.name || 'User'}</div>
                  <div className="text-sm text-gray-500 dark:text-[#A1A1AA] truncate">{user?.email}</div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      toast('Profile page coming soon!', { icon: '👤' });
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded-md transition-colors w-full text-left"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Profile
                  </button>
                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded-md transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Account settings
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      toast("What's new coming soon!", { icon: '🎁' });
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded-md transition-colors w-full text-left"
                  >
                    <Gift className="w-4 h-4 text-gray-400" />
                    What's new
                  </button>
                  <div className="border-t border-gray-100 dark:border-[#2B2B30] my-1"></div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area (The "Island") ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen pt-2 pr-2 pb-2 pl-0 gap-1.5">
        
        {/* Combined Top Header and Navigation Tabs */}
        <div className="flex flex-col rounded-xl shrink-0 shadow-sm border border-gray-200 dark:border-[#2B2B30] relative z-40">
          {/* Top Header */}
          <header className="h-16 bg-[#F5F5F5] dark:bg-[#1D1D1F] px-6 flex items-center justify-between relative z-[60] rounded-t-xl border-b border-gray-200 dark:border-[#2B2B30]">
          <div className="flex items-center gap-2 relative" ref={folderSwitcherRef}>
            {location.pathname.startsWith('/settings') ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#2B2B30] text-gray-500 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-[#EDEDED]">
                  Settings
                </h1>
              </div>
            ) : location.pathname === '/dashboard' ? (
              <>
                <button 
                  onClick={() => setIsFolderSwitcherOpen(!isFolderSwitcherOpen)}
                  className="text-lg font-semibold text-gray-900 dark:text-[#EDEDED] flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2B2B30] px-2 py-1 rounded-md transition-colors"
                >
                  {activeFolderId ? folders.find(f => f.id === activeFolderId)?.name || 'Links' : 'Links'}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                <AnimatePresence>
                {isFolderSwitcherOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] shadow-xl rounded-lg p-2 z-[100] flex flex-col gap-2"
                  >
                    <div className="relative flex items-center justify-between gap-2 border border-gray-200 dark:border-[#2B2B30] rounded-md bg-white dark:bg-[#1E1E21] focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-shadow px-2">
                      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <input 
                        type="text" 
                        placeholder="Search folders..." 
                        value={folderSearch}
                        onChange={(e) => setFolderSearch(e.target.value)}
                        className="flex-grow w-full py-1.5 bg-transparent border-none focus:ring-0 text-sm dark:text-[#EDEDED] px-1"
                      />
                      <button
                        onClick={() => {
                          navigate('/folders');
                          setIsFolderSwitcherOpen(false);
                        }}
                        className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-[#A1A1AA] dark:hover:text-white flex-shrink-0 whitespace-nowrap"
                      >
                        View All
                      </button>
                    </div>
                    
                    <button
                      onClick={() => {
                        setActiveFolderId(null);
                        navigate('/dashboard');
                        setIsFolderSwitcherOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${activeFolderId === null ? 'bg-gray-100 dark:bg-[#222222] text-gray-900 dark:text-[#EDEDED] font-medium' : 'text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30]'}`}
                    >
                      <FolderIcon className="w-4 h-4 text-gray-400" />
                      All Links
                    </button>
                    
                    <div className="max-h-48 overflow-y-auto flex flex-col gap-1 border-y border-gray-100 dark:border-[#2B2B30] py-1">
                      {folders.filter(f => f.name.toLowerCase().includes(folderSearch.toLowerCase())).map(folder => (
                        <motion.button
                          layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                          key={folder.id}
                          onClick={() => {
                            setActiveFolderId(folder.id);
                            navigate('/dashboard');
                            setIsFolderSwitcherOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${activeFolderId === folder.id ? 'bg-gray-100 dark:bg-[#222222] text-gray-900 dark:text-[#EDEDED] font-medium' : 'text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30]'}`}
                        >
                          <FolderIcon className="w-4 h-4 text-emerald-500" />
                          {folder.name}
                        </motion.button>
                      ))}
                      {folders.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No folders found</div>}
                    </div>
                    
                    <button
                      onClick={() => {
                        navigate('/folders?create=true');
                        setIsFolderSwitcherOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] rounded-md transition-colors flex items-center gap-2 font-medium"
                    >
                      <FolderPlus className="w-4 h-4 text-gray-400" />
                      Create new folder
                    </button>
                  </motion.div>
                )}
                </AnimatePresence>
              </>
            ) : (
              <h1 className="text-lg font-semibold text-gray-900 dark:text-[#EDEDED] px-2 py-1">
                {getTitle()}
              </h1>
            )}
          </div>
          {!location.pathname.startsWith('/settings') && renderHeaderButton()}
        </header>

          {/* Top Navigation Tabs */}
          <div className="h-14 bg-[#F5F5F5] dark:bg-[#1D1D1F] px-6 flex items-center justify-between text-sm relative z-[40] rounded-b-xl">
          <div className="flex items-center overflow-x-auto whitespace-nowrap gap-2">
            {location.pathname.startsWith('/settings') ? (
              <>
                <Link 
                  to="/settings" 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname === '/settings' ? 'bg-[#E7EFF9] text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-[#EAEAEA] hover:text-gray-900 dark:text-[#A1A1AA] dark:hover:bg-[#2B2B30] dark:hover:text-gray-100'}`}
                >
                  <Settings className="w-4 h-4" />
                  General
                </Link>
                <Link 
                  to="/settings/security" 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname === '/settings/security' ? 'bg-[#E7EFF9] text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-[#EAEAEA] hover:text-gray-900 dark:text-[#A1A1AA] dark:hover:bg-[#2B2B30] dark:hover:text-gray-100'}`}
                >
                  <Shield className="w-4 h-4" />
                  Security
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard" 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname === '/dashboard' ? 'bg-[#E7EFF9] text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-[#EAEAEA] hover:text-gray-900 dark:text-[#A1A1AA] dark:hover:bg-[#2B2B30] dark:hover:text-gray-100'}`}
                >
                  <LinkIcon className="w-4 h-4" />
                  Links
                </Link>
                <Link 
                  to={activeFolderId ? `/analytics?folderId=${activeFolderId}` : "/analytics"} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname.startsWith('/analytics') ? 'bg-[#E7EFF9] text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-[#EAEAEA] hover:text-gray-900 dark:text-[#A1A1AA] dark:hover:bg-[#2B2B30] dark:hover:text-gray-100'}`}
                >
                  <BarChart2 className="w-4 h-4" />
                  Analytics
                </Link>
                <Link 
                  to="/folders" 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname === '/folders' ? 'bg-[#E7EFF9] text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-[#EAEAEA] hover:text-gray-900 dark:text-[#A1A1AA] dark:hover:bg-[#2B2B30] dark:hover:text-gray-100'}`}
                >
                  <FolderIcon className="w-4 h-4" />
                  Folders
                </Link>
                <Link 
                  to="/tags" 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${location.pathname === '/tags' ? 'bg-[#E7EFF9] text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-[#EAEAEA] hover:text-gray-900 dark:text-[#A1A1AA] dark:hover:bg-[#2B2B30] dark:hover:text-gray-100'}`}
                >
                  <TagIcon className="w-4 h-4" />
                  Tags
                </Link>
              </>
            )}
          </div>
          
          {!location.pathname.startsWith('/settings') && (
            <div className="flex items-center gap-4 ml-auto pl-4 text-xs text-gray-500 shrink-0">
              {isStatsLoading ? (
                <>
                  <div className="flex items-center gap-1.5"><Skeleton width={40} height={16} /></div>
                  <div className="flex items-center gap-1.5"><Skeleton width={40} height={16} /></div>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5" title={`Total Clicks: ${navStats.totalClicks}`}>
                    <ClickArrowIcon className="w-4 h-4 text-gray-500" />
                    {navStats.totalClicks}
                  </span>
                  <span className="flex items-center gap-1.5" title={`Total Links: ${navStats.linkCount}`}>
                    <LinkIcon className="w-4 h-4" />
                    {navStats.linkCount}
                  </span>
                </>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Main Content Rendered Here */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#FFFFFF] dark:bg-[#1E1E21] rounded-xl shadow-sm border border-gray-200 dark:border-[#2B2B30]">
          <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <Outlet key={location.pathname} context={{ 
                triggerRefresh: latestNewEntry, 
                tags, 
                folders, 
                setTags, 
                setFolders, 
                activeFolderId, 
                setActiveFolderId,
                setIsFolderModalOpen,
                setIsCreateTagModalOpen,
                setFolderToEdit,
                setTagToEdit,
                isTagsLoading,
                isFoldersLoading
              } satisfies DashboardLayoutContext} />
            </AnimatePresence>
          </div>
        </main>

      </div>

      {/* ── Create Link Modal ────────────────────────────── */}
      <CreateLinkModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newEntry) => {
          if (newEntry) triggerRefresh(newEntry);
        }}
        folders={folders}
        tags={tags}
        onOpenFolderModal={() => setIsFolderModalOpen(true)}
      />

      {/* ── Create Tag Modal ────────────────────────────── */}
      <CreateTagModal
        isOpen={isCreateTagModalOpen}
        tagToEdit={tagToEdit}
        onClose={() => {
          setIsCreateTagModalOpen(false);
          setTagToEdit(null);
        }}
        onSuccess={(updatedTag) => {
          if (tagToEdit) {
            setTags(tags.map(t => t.id === updatedTag.id ? updatedTag : t));
          } else {
            setTags([...tags, updatedTag]);
          }
        }}
      />

      {/* ── Create Folder Modal ────────────────────────────── */}
      <FolderModal
        isOpen={isFolderModalOpen}
        folderToEdit={folderToEdit}
        onClose={() => {
          setIsFolderModalOpen(false);
          setFolderToEdit(null);
        }}
        onSuccess={(updatedFolder) => {
          if (folderToEdit) {
            setFolders(folders.map(f => f.id === updatedFolder.id ? updatedFolder : f));
          } else {
            setFolders([...folders, updatedFolder]);
          }
        }}
      />
      
      <Toaster position="bottom-center" />
    </div>
  );
};

export default DashboardLayout;
