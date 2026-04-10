import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useOutletContext } from 'react-router-dom';
import type { DashboardLayoutContext } from '../layouts/DashboardLayout';
import { 
  ArrowLeft, MousePointerClick, Globe, Monitor, 
  Link as LinkIcon, Activity,
  Users, Percent, Share2, Folder as FolderIcon,
  Tag, X, Search, Filter, ChevronDown, ChevronLeft
} from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import type { UrlDto } from '../types';

interface AnalyticsData {
  totalClicks: number;
  clicksByDate: { date: string; count: number }[];
  clicksByCountry: { country: string; count: number }[];
  clicksByDevice: { device: string; count: number }[];
  clicksByBrowser: { browser: string; count: number }[];
}

const COLORS = ['#7c3aed', '#c4b5fd', '#8b5cf6', '#a78bfa', '#ddd6fe'];

const extractHash = (shortUrl: string): string =>
  shortUrl.split('/').pop() ?? shortUrl;

const AnalyticsPage: React.FC = () => {
  const { hash, folderSlug } = useParams<{ hash?: string; folderSlug?: string }>();
  const navigate = useNavigate();
  const { folders = [], tags = [], activeFolderId, setActiveFolderId } = useOutletContext<DashboardLayoutContext>() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const folderIdParam = searchParams.get('folderId');
  const tagIdParam = searchParams.get('tagId');
  const hashParam = searchParams.get('hash') || hash;
  
  const currentFolder = folderSlug
    ? folders?.find(f => (f.slug && f.slug.toLowerCase() === folderSlug.toLowerCase()) || f.name.toLowerCase() === folderSlug.toLowerCase() || f.name.toLowerCase().replace(/\s+/g, '-') === folderSlug.toLowerCase())
    : (folderIdParam ? folders?.find(f => f.id === Number(folderIdParam)) : (activeFolderId ? folders?.find(f => f.id === activeFolderId) : null));
  
  // Filter dropdown state
  const filterRef = useRef<HTMLDivElement>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'none' | 'link' | 'tag' | 'folder'>('none');
  const [filterSearch, setFilterSearch] = useState('');
  
  const [urls, setUrls] = useState<UrlDto[]>([]);
  const [isUrlsLoading, setIsUrlsLoading] = useState(false);

  const tagPillPopoverRef = useRef<HTMLDivElement>(null);
  const [isTagPillPopoverOpen, setIsTagPillPopoverOpen] = useState(false);
  const [tagPillSearch, setTagPillSearch] = useState('');

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    let isMounted = true;
    setIsUrlsLoading(true);
    axiosInstance.get<UrlDto[]>('/url/all')
      .then(res => {
        if (isMounted) setUrls(res.data);
      })
      .catch(err => console.error("Failed to load URLs for analytics filter", err))
      .finally(() => {
        if (isMounted) setIsUrlsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
        setActiveFilter('none');
      }
      if (tagPillPopoverRef.current && !tagPillPopoverRef.current.contains(event.target as Node)) {
        setIsTagPillPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        let endpoint = '/analytics';
        const params: any = { period };
        if (tagIdParam) {
          params.tagId = tagIdParam;
        }

        if (hashParam) {
          endpoint = `/analytics/${hashParam}`;
        } else if (folderSlug) {
          endpoint = `/analytics/folder/slug/${folderSlug}`;
        } else if (folderIdParam) {
          endpoint = `/analytics/folder/${folderIdParam}`;
        } else {
          endpoint = '/analytics';
        }

        const response = await axiosInstance.get<AnalyticsData>(endpoint, { params });
        setData(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.status === 404 ? 'Analytics not found or unauthorized.' : 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [hashParam, folderSlug, folderIdParam, tagIdParam, period]);

  if (loading) {
    return (
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton width={250} height={28} />
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-6 flex flex-col gap-1">
              <Skeleton width={120} height={16} />
              <div className="mt-2"><Skeleton width={80} height={36} /></div>
              <Skeleton width={60} height={12} className="mt-1" />
            </div>
          ))}
        </section>

        <section className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <Skeleton width={150} height={24} />
              <div className="mt-1"><Skeleton width={200} height={16} /></div>
            </div>
            <Skeleton width={180} height={32} borderRadius={6} />
          </div>
          <div className="relative w-full h-[300px]">
            <Skeleton height="100%" borderRadius={8} />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-0 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-[#2B2B30] flex items-center gap-2">
                <Skeleton width={120} height={20} />
              </div>
              <div className="p-4 flex flex-col gap-3">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} height={40} borderRadius={4} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </motion.main>
    );
  }

  if (error || !data) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1E1E21] rounded-lg shadow-sm border border-gray-200 dark:border-[#2B2B30] p-8 text-center max-w-md w-full">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-[#EDEDED] mb-2">Error Loading Analytics</h2>
          <p className="text-gray-500 dark:text-[#A1A1AA] mb-6">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-md transition-colors text-sm font-medium w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-md shadow-xl text-sm border border-gray-700">
          <p className="text-gray-400 mb-1">{label}</p>
          <p className="font-semibold text-white">{payload[0].value} clicks</p>
        </div>
      );
    }
    return null;
  };

  const totalClicks = data?.totalClicks || 0;
  const clicksByDate = data?.clicksByDate || [];
  const clicksByCountry = data?.clicksByCountry || [];
  const clicksByDevice = data?.clicksByDevice || [];
  const clicksByBrowser = data?.clicksByBrowser || [];

  const activeTagIds = tagIdParam ? tagIdParam.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n)) : [];
  const activeFilterCount = (hashParam ? 1 : 0) + (activeTagIds.length > 0 ? activeTagIds.length : 0) + (folderSlug || folderIdParam ? 1 : 0);

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        <div className="flex flex-col gap-4">
          {/* Action Bar with Filter Dropdown */}
          <div className="flex items-center justify-between">
            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium shadow-sm transition-colors ${activeFilterCount > 0 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50' : 'bg-white dark:bg-[#222222] border-gray-200 dark:border-[#2B2B30] text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30]'}`}
              >
                <Filter className="w-4 h-4" />
                Filter
                {activeFilterCount > 0 && <span className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs px-1.5 py-0.5 rounded-full leading-none">{activeFilterCount}</span>}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 top-full mt-2 w-72 rounded-lg shadow-xl bg-white dark:bg-[#1E1E21] ring-1 ring-black/5 dark:ring-white/10 border border-gray-200 dark:border-[#2B2B30] divide-y divide-gray-100 dark:divide-slate-800 focus:outline-none z-[60] overflow-hidden"
                  >
                    {activeFilter === 'none' ? (
                      <>
                        <div className="p-2">
                          <div className="relative">
                            <input 
                              type="text"
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Filter..." 
                              className="block w-full pl-3 pr-8 py-2 border-none bg-white dark:bg-[#111113] text-sm text-gray-900 dark:text-[#EDEDED] placeholder-gray-400 focus:ring-0"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <kbd className="inline-flex items-center border border-gray-200 dark:border-[#2B2B30] rounded px-1.5 text-xs font-medium text-gray-400 bg-gray-50 dark:bg-[#222222]">F</kbd>
                            </div>
                          </div>
                        </div>
                        <div className="py-1 p-1">
                          <button 
                            onClick={() => { setActiveFilter('link'); setFilterSearch(''); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] rounded-md transition-colors group"
                          >
                            <div className="flex items-center">
                              <LinkIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                              Link
                            </div>
                            <span className="text-xs text-gray-400 group-hover:text-gray-500">L</span>
                          </button>
                          <button 
                            onClick={() => { setActiveFilter('tag'); setFilterSearch(''); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] rounded-md transition-colors group"
                          >
                            <div className="flex items-center">
                              <Tag className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                              Tag
                            </div>
                            <span className="text-xs text-gray-400 group-hover:text-gray-500">T</span>
                          </button>
                          <button 
                            onClick={() => { setActiveFilter('folder'); setFilterSearch(''); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] rounded-md transition-colors group"
                          >
                            <div className="flex items-center">
                              <FolderIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                              Folder
                            </div>
                            <span className="text-xs text-gray-400 group-hover:text-gray-500">F</span>
                          </button>
                        </div>
                      </>
                    ) : activeFilter === 'link' ? (
                      <>
                        <div className="p-2 border-b border-gray-100 dark:border-[#2B2B30] flex items-center gap-2">
                          <button 
                            onClick={() => { setActiveFilter('none'); setFilterSearch(''); }} 
                            className="p-1 hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded text-gray-500"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                              type="text"
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Search links..." 
                              className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-[#2B2B30] rounded-md text-sm bg-white dark:bg-[#1E1E21] text-gray-900 dark:text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-56 overflow-y-auto">
                          {urls.filter(u => {
                            const h = extractHash(u.shortUrl).toLowerCase();
                            const l = (u.longUrl || '').toLowerCase();
                            const q = filterSearch.toLowerCase();
                            return h.includes(q) || l.includes(q);
                          }).map(u => {
                            const linkHash = extractHash(u.shortUrl);
                            const isSelected = hashParam === linkHash;
                            return (
                              <button
                                key={u.id || u.shortUrl}
                                onClick={() => {
                                  navigate(`/analytics/${linkHash}`);
                                  setIsFilterOpen(false);
                                  setActiveFilter('none');
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30]'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <LinkIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span className="truncate font-mono text-xs">/{linkHash}</span>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono ml-2 shrink-0">
                                  {u.accessed_times ?? 0} clicks
                                </span>
                              </button>
                            );
                          })}
                          {urls.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">{isUrlsLoading ? 'Loading links...' : 'No links found'}</div>}
                        </div>
                      </>
                    ) : activeFilter === 'tag' ? (
                      <>
                        <div className="p-2 border-b border-gray-100 dark:border-[#2B2B30] flex items-center gap-2">
                          <button 
                            onClick={() => { setActiveFilter('none'); setFilterSearch(''); }} 
                            className="p-1 hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded text-gray-500"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                              type="text"
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Tag..." 
                              className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-[#2B2B30] rounded-md text-sm bg-white dark:bg-[#1E1E21] text-gray-900 dark:text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-48 overflow-y-auto">
                          {tags.filter(t => t.name.toLowerCase().includes(filterSearch.toLowerCase())).map(t => {
                            const activeIds = (tagIdParam || '').split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
                            const isChecked = activeIds.includes(t.id);
                            return (
                              <label key={t.id} className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] rounded-md cursor-pointer group">
                                <div className="flex items-center gap-2 min-w-0">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => {
                                      const updatedTagIds = isChecked 
                                        ? activeIds.filter(id => id !== t.id)
                                        : [...activeIds, t.id];
                                      
                                      const newParams = new URLSearchParams(searchParams);
                                      if (updatedTagIds.length > 0) {
                                        newParams.set('tagId', updatedTagIds.join(','));
                                      } else {
                                        newParams.delete('tagId');
                                      }
                                      setSearchParams(newParams);
                                    }}
                                    className="rounded border-gray-300 dark:border-slate-600 text-black dark:text-[#EDEDED] focus:ring-black dark:focus:ring-white bg-white dark:bg-[#1E1E21]"
                                  />
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                                    style={{ backgroundColor: t.color || '#374151' }}
                                  />
                                  <span className="truncate">{t.name}</span>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono ml-2 shrink-0">
                                  {t.linkCount ?? 0}
                                </span>
                              </label>
                            );
                          })}
                          {tags.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No tags found</div>}
                        </div>
                      </>
                    ) : activeFilter === 'folder' ? (
                      <>
                        <div className="p-2 border-b border-gray-100 dark:border-[#2B2B30] flex items-center gap-2">
                          <button 
                            onClick={() => { setActiveFilter('none'); setFilterSearch(''); }} 
                            className="p-1 hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded text-gray-500"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                              type="text"
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Search folders..." 
                              className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-[#2B2B30] rounded-md text-sm bg-white dark:bg-[#1E1E21] text-gray-900 dark:text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-56 overflow-y-auto">
                          {folders.filter(f => f.name.toLowerCase().includes(filterSearch.toLowerCase())).map(folder => {
                            const isDefault = folder.name.toLowerCase() === 'links';
                            const slug = folder.slug || encodeURIComponent(folder.name.toLowerCase().replace(/\s+/g, '-'));
                            const isSelected = folderSlug === slug || folderIdParam === String(folder.id);
                            return (
                              <button
                                key={folder.id}
                                onClick={() => {
                                  navigate(`/analytics/f/${slug}`);
                                  setIsFilterOpen(false);
                                  setActiveFilter('none');
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30]'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FolderIcon className={`w-4 h-4 ${isDefault ? 'text-blue-500' : 'text-emerald-500'} shrink-0`} />
                                  <span className="truncate">{folder.name}</span>
                                </div>
                                {folder.linkCount !== undefined && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono ml-2 shrink-0">
                                    {folder.linkCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {folders.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No folders found</div>}
                        </div>
                      </>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active Compound Filter Pills */}
          {(hashParam || folderSlug || folderIdParam || tagIdParam) && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {hashParam && (
                <div className="flex items-center shadow-sm rounded-md">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-l-md text-xs font-medium text-gray-700 dark:text-gray-300">
                    <LinkIcon className="w-3.5 h-3.5" />
                    Link
                  </div>
                  <div className="px-2 py-1 bg-gray-50 dark:bg-slate-800/50 border-y border-gray-200 dark:border-slate-800 text-xs text-gray-400 font-medium">
                    is
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-medium text-gray-900 dark:text-white">
                    /{hashParam}
                  </div>
                  <button 
                    type="button"
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-l-0 border-gray-200 dark:border-slate-800 rounded-r-md text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors flex items-center justify-center"
                    onClick={() => {
                      if (hash) {
                        navigate(folderSlug ? `/analytics/f/${folderSlug}` : '/analytics');
                      } else {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('hash');
                        setSearchParams(newParams);
                      }
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {(folderSlug || folderIdParam) && (
                <div className="flex items-center shadow-sm rounded-md">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-l-md text-xs font-medium text-gray-700 dark:text-gray-300">
                    <FolderIcon className="w-3.5 h-3.5" />
                    Folder
                  </div>
                  <div className="px-2 py-1 bg-gray-50 dark:bg-slate-800/50 border-y border-gray-200 dark:border-slate-800 text-xs text-gray-400 font-medium">
                    is
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-medium text-gray-900 dark:text-white">
                    {currentFolder?.name || folderSlug || folderIdParam}
                  </div>
                  <button 
                    type="button"
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-l-0 border-gray-200 dark:border-slate-800 rounded-r-md text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors flex items-center justify-center"
                    onClick={() => {
                      if (folderSlug) {
                        navigate('/analytics');
                      } else {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('folderId');
                        setSearchParams(newParams);
                      }
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {tagIdParam && (
                <div className="relative flex items-center shadow-sm rounded-md" ref={tagPillPopoverRef}>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-l-md text-xs font-medium text-gray-700 dark:text-gray-300">
                    <Tag className="w-3.5 h-3.5" />
                    Tag
                  </div>
                  <div className="px-2 py-1 bg-gray-50 dark:bg-slate-800/50 border-y border-gray-200 dark:border-slate-800 text-xs text-gray-400 font-medium">
                    is
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsTagPillPopoverOpen(prev => !prev)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#2B2B30] cursor-pointer transition-colors"
                  >
                    {(() => {
                      const tagIds = tagIdParam.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
                      if (tagIds.length === 1) {
                        const tag = tags.find(t => t.id === tagIds[0]);
                        return (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag?.color || '#374151' }} />
                            <span>{tag?.name || tagIds[0]}</span>
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1.5">
                          <div className="flex items-center -space-x-1">
                            {tagIds.slice(0, 4).map(id => {
                              const tag = tags.find(t => t.id === id);
                              return (
                                <span 
                                  key={id} 
                                  className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-white dark:ring-slate-900" 
                                  style={{ backgroundColor: tag?.color || '#374151' }} 
                                />
                              );
                            })}
                          </div>
                          <span>{tagIds.length} Tags</span>
                        </span>
                      );
                    })()}
                  </button>
                  <button 
                    type="button"
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-l-0 border-gray-200 dark:border-slate-800 rounded-r-md text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors flex items-center justify-center"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete('tagId');
                      setSearchParams(newParams);
                      setIsTagPillPopoverOpen(false);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Popover Dropdown */}
                  <AnimatePresence>
                    {isTagPillPopoverOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-2 w-64 rounded-lg shadow-xl bg-white dark:bg-[#1E1E21] ring-1 ring-black/5 dark:ring-white/10 border border-gray-200 dark:border-[#2B2B30] divide-y divide-gray-100 dark:divide-slate-800 focus:outline-none z-[70] overflow-hidden"
                      >
                        <div className="p-2 border-b border-gray-100 dark:border-[#2B2B30]">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                              type="text"
                              value={tagPillSearch}
                              onChange={e => setTagPillSearch(e.target.value)}
                              placeholder="Tag..." 
                              className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-[#2B2B30] rounded-md text-sm bg-white dark:bg-[#1E1E21] text-gray-900 dark:text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-48 overflow-y-auto">
                          {tags.filter(t => t.name.toLowerCase().includes(tagPillSearch.toLowerCase())).map(t => {
                            const activeIds = (tagIdParam || '').split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
                            const isChecked = activeIds.includes(t.id);
                            return (
                              <label key={t.id} className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] rounded-md cursor-pointer group">
                                <div className="flex items-center gap-2 min-w-0">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => {
                                      const updatedTagIds = isChecked 
                                        ? activeIds.filter(id => id !== t.id)
                                        : [...activeIds, t.id];
                                      
                                      const newParams = new URLSearchParams(searchParams);
                                      if (updatedTagIds.length > 0) {
                                        newParams.set('tagId', updatedTagIds.join(','));
                                      } else {
                                        newParams.delete('tagId');
                                      }
                                      setSearchParams(newParams);
                                    }}
                                    className="rounded border-gray-300 dark:border-slate-600 text-black dark:text-[#EDEDED] focus:ring-black dark:focus:ring-white bg-white dark:bg-[#1E1E21]"
                                  />
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                                    style={{ backgroundColor: t.color || '#374151' }}
                                  />
                                  <span className="truncate">{t.name}</span>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono ml-2 shrink-0">
                                  {t.linkCount ?? 0}
                                </span>
                              </label>
                            );
                          })}
                          {tags.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No tags found</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(hashParam || folderSlug || folderIdParam || tagIdParam) && (
                <button 
                  onClick={() => {
                    navigate('/analytics');
                  }}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-[#2B2B30] hover:bg-gray-100 dark:hover:bg-[#2B2B30] text-gray-500 dark:text-[#A1A1AA] transition-colors"
                  title="Clear all filters"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-[#EDEDED] flex items-center gap-2">
                  {hashParam ? (
                    <>Analytics for <span className="text-[#7c3aed]">/{hashParam}</span></>
                  ) : folderSlug || folderIdParam ? (
                    <>
                      <FolderIcon className={`w-5 h-5 ${currentFolder?.name.toLowerCase() === 'links' ? 'text-blue-500' : 'text-emerald-500'} shrink-0`} />
                      <span>Analytics for Folder:</span>
                      <span className={currentFolder?.name.toLowerCase() === 'links' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {currentFolder?.name || folderSlug || folderIdParam}
                      </span>
                    </>
                  ) : tagIdParam ? (
                    <>
                      <Tag className="w-5 h-5 text-[#7c3aed] shrink-0" />
                      <span>Analytics for Tag:</span>
                      <span className="text-[#8b5cf6]">
                        {(() => {
                          const tagIds = tagIdParam.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
                          if (tagIds.length === 1) {
                            return tags?.find(t => t.id === tagIds[0])?.name || tagIds[0];
                          }
                          return `${tagIds.length} Tags`;
                        })()}
                      </span>
                    </>
                  ) : (
                    'Overall Analytics'
                  )}
                </h1>
                {currentFolder && (
                  <p className="text-xs text-gray-500 dark:text-[#A1A1AA] mt-0.5">
                    Filtered by folder • {currentFolder.linkCount ?? 0} {(currentFolder.linkCount === 1) ? 'link' : 'links'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-6 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-[#A1A1AA] text-sm font-medium flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" /> Total Clicks
              </p>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-gray-900 dark:text-[#EDEDED] text-3xl font-semibold tracking-tight">{totalClicks.toLocaleString()}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </div>

          <div className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-6 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-[#A1A1AA] text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" /> Unique Visitors
              </p>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-gray-900 dark:text-[#EDEDED] text-3xl font-semibold tracking-tight">-</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">Not tracked yet</p>
          </div>

          <div className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-6 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-[#A1A1AA] text-sm font-medium flex items-center gap-2">
                <Percent className="w-4 h-4" /> Avg. CTR
              </p>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-gray-900 dark:text-[#EDEDED] text-3xl font-semibold tracking-tight">-</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">Not tracked yet</p>
          </div>

          <div className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-6 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-[#A1A1AA] text-sm font-medium flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Top Source
              </p>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-gray-900 dark:text-[#EDEDED] text-3xl font-semibold tracking-tight truncate">
                {clicksByBrowser.length > 0 ? clicksByBrowser[0].browser : 'N/A'}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-1">Top Referrer</p>
          </div>

        </section>

        {/* Main Chart */}
        <section className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#EDEDED]">Clicks over time</h2>
              <p className="text-sm text-gray-500 dark:text-[#A1A1AA]">Daily breakdown of link performance</p>
            </div>
            <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#222222] p-1">
              {['24h', '7d', '30d', 'all'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    period === p 
                    ? 'bg-white dark:bg-[#2B2B30] text-black dark:text-[#EDEDED] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {p === 'all' ? 'All time' : p}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative w-full h-[300px]">
            {clicksByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clicksByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#7c3aed" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorClicks)" 
                    activeDot={{ r: 6, fill: '#ffffff', stroke: '#7c3aed', strokeWidth: 2 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 border border-dashed border-gray-200 dark:border-[#2B2B30] rounded-lg">
                No data available for the selected period
              </div>
            )}
          </div>
        </section>

        {/* Breakdown Grids */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Countries */}
          <div className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-[#2B2B30] flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500 dark:text-[#A1A1AA]" />
              <h3 className="font-medium text-sm text-gray-900 dark:text-[#EDEDED]">Top Countries</h3>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto max-h-[300px]">
              {clicksByCountry.length > 0 ? (
                clicksByCountry.slice(0, 5).map((country) => {
                  const pct = totalClicks > 0 ? (country.count / totalClicks) * 100 : 0;
                  return (
                    <div key={country.country} className="group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2B2B30]/50 transition-colors border-b border-gray-100 dark:border-[#2B2B30]/50 last:border-0 relative">
                      <div className="absolute left-0 top-0 bottom-0 bg-[#7c3aed]/10 z-0 rounded-r-sm transition-all" style={{ width: `${pct}%` }}></div>
                      <div className="flex items-center gap-3 z-10">
                        <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-[#EDEDED] truncate">{country.country}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-[#A1A1AA] z-10">{country.count}</span>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center p-8 text-sm text-gray-400 dark:text-gray-600">No data</div>
              )}
            </div>
          </div>

          {/* Devices */}
          <div className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-[#2B2B30] flex items-center gap-2">
              <Monitor className="w-4 h-4 text-gray-500 dark:text-[#A1A1AA]" />
              <h3 className="font-medium text-sm text-gray-900 dark:text-[#EDEDED]">Devices</h3>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center items-center h-[300px]">
              {clicksByDevice.length > 0 ? (
                <>
                  <div className="relative w-full h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clicksByDevice}
                          innerRadius="70%"
                          outerRadius="90%"
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="device"
                          stroke="none"
                        >
                          {clicksByDevice.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {clicksByDevice.map((device, i) => {
                      const pct = totalClicks > 0 ? Math.round((device.count / totalClicks) * 100) : 0;
                      return (
                        <div key={device.device} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                          <span className="text-xs text-gray-500 dark:text-[#A1A1AA]">{device.device} ({pct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-400 dark:text-gray-600">No data</div>
              )}
            </div>
          </div>

          {/* Referrers */}
          <div className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-[#2B2B30] flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-gray-500 dark:text-[#A1A1AA]" />
              <h3 className="font-medium text-sm text-gray-900 dark:text-[#EDEDED]">Referrers</h3>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto max-h-[300px]">
              {clicksByBrowser.length > 0 ? (
                clicksByBrowser.slice(0, 5).map((browser) => {
                  const pct = totalClicks > 0 ? (browser.count / totalClicks) * 100 : 0;
                  return (
                    <div key={browser.browser} className="group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2B2B30]/50 transition-colors border-b border-gray-100 dark:border-[#2B2B30]/50 last:border-0 relative">
                      <div className="absolute left-0 top-0 bottom-0 bg-[#7c3aed]/10 z-0 rounded-r-sm transition-all" style={{ width: `${pct}%` }}></div>
                      <div className="flex items-center gap-3 z-10">
                        <div className="w-6 h-6 bg-white dark:bg-[#222222] border border-gray-200 dark:border-[#2B2B30] rounded flex items-center justify-center text-[10px] font-bold text-gray-900 dark:text-[#EDEDED] shadow-sm uppercase">
                          {browser.browser.substring(0, 1)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-[#EDEDED] truncate">{browser.browser}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-[#A1A1AA] z-10">{browser.count}</span>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center p-8 text-sm text-gray-400 dark:text-gray-600">No data</div>
              )}
            </div>
          </div>

        </section>
      </motion.main>
  );
};

export default AnalyticsPage;
