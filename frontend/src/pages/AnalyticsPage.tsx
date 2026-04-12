import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { DateRangePicker } from '../components/DateRangePicker';
import type { DateRangeValue } from '../components/DateRangePicker';
import { format, parseISO } from 'date-fns';

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

  const folderPillPopoverRef = useRef<HTMLDivElement>(null);
  const [isFolderPillPopoverOpen, setIsFolderPillPopoverOpen] = useState(false);
  const [folderPillSearch, setFolderPillSearch] = useState('');

  const linkPillPopoverRef = useRef<HTMLDivElement>(null);
  const [isLinkPillPopoverOpen, setIsLinkPillPopoverOpen] = useState(false);
  const [linkPillSearch, setLinkPillSearch] = useState('');

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeValue>({ type: 'preset', value: '30d' });

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
      if (folderPillPopoverRef.current && !folderPillPopoverRef.current.contains(event.target as Node)) {
        setIsFolderPillPopoverOpen(false);
      }
      if (linkPillPopoverRef.current && !linkPillPopoverRef.current.contains(event.target as Node)) {
        setIsLinkPillPopoverOpen(false);
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
        const params: any = {};
        if (dateRange.type === 'preset') {
          params.period = dateRange.value;
        } else {
          params.startDate = format(dateRange.start, "yyyy-MM-dd'T'HH:mm:ss");
          params.endDate = format(dateRange.end, "yyyy-MM-dd'T'HH:mm:ss");
        }
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
  }, [hashParam, folderSlug, folderIdParam, tagIdParam, dateRange]);

  const activeTagIds = useMemo(() => {
    return tagIdParam ? tagIdParam.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0) : [];
  }, [tagIdParam]);

  const activeFilterCount = (hashParam ? 1 : 0) + (activeTagIds.length > 0 ? activeTagIds.length : 0) + (folderSlug || folderIdParam ? 1 : 0);

  const availableUrls = useMemo(() => {
    let list = urls;
    if (currentFolder && currentFolder.name.toLowerCase() !== 'links') {
      list = list.filter(u => u.folderId === currentFolder.id);
    } else if (folderIdParam) {
      list = list.filter(u => u.folderId === Number(folderIdParam));
    }
    if (activeTagIds.length > 0) {
      list = list.filter(u => u.tags?.some(t => activeTagIds.includes(t.id)));
    }
    return list;
  }, [urls, currentFolder, folderIdParam, activeTagIds]);

  const availableTags = useMemo(() => {
    let list = tags;
    if (currentFolder && currentFolder.name.toLowerCase() !== 'links') {
      const folderLinks = urls.filter(u => u.folderId === currentFolder.id);
      const tagIdsInFolder = new Set(folderLinks.flatMap(u => u.tags?.map(t => t.id) || []));
      list = list.filter(t => tagIdsInFolder.has(t.id));
    }
    if (hashParam) {
      const activeUrl = urls.find(u => extractHash(u.shortUrl).toLowerCase() === hashParam.toLowerCase());
      if (activeUrl) {
        const linkTagIds = new Set(activeUrl.tags?.map(t => t.id) || []);
        list = list.filter(t => linkTagIds.has(t.id));
      }
    }
    return list;
  }, [tags, urls, currentFolder, hashParam]);

  const availableFolders = useMemo(() => {
    let list = folders;
    if (activeTagIds.length > 0) {
      const matchingLinks = urls.filter(u => u.tags?.some(t => activeTagIds.includes(t.id)));
      const folderIdsWithTags = new Set(matchingLinks.map(u => u.folderId).filter(Boolean));
      list = list.filter(f => f.name.toLowerCase() === 'links' || folderIdsWithTags.has(f.id));
    }
    if (hashParam) {
      const activeUrl = urls.find(u => extractHash(u.shortUrl).toLowerCase() === hashParam.toLowerCase());
      if (activeUrl && activeUrl.folderId) {
        list = list.filter(f => f.name.toLowerCase() === 'links' || f.id === activeUrl.folderId);
      }
    }
    return list;
  }, [folders, urls, activeTagIds, hashParam]);



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

  const formatXAxisTick = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = parseISO(dateStr.length === 10 ? dateStr + 'T00:00:00Z' : (dateStr.endsWith('Z') ? dateStr : dateStr + 'Z'));
      if (isNaN(date.getTime())) return dateStr;
      if (dateRange.type === 'preset' && dateRange.value === '24h') {
        return format(date, 'h:mm a');
      }
      if (dateRange.type === 'preset' && (dateRange.value === '7d' || dateRange.value === '30d')) {
        return format(date, 'EEE, MMM d');
      }
      return format(date, 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const formatTooltipLabel = (label: any) => {
    const dateStr = typeof label === 'string' ? label : (label ? String(label) : '');
    if (!dateStr) return '';
    try {
      const date = parseISO(dateStr.length === 10 ? dateStr + 'T00:00:00Z' : (dateStr.endsWith('Z') ? dateStr : dateStr + 'Z'));
      if (isNaN(date.getTime())) return dateStr;
      if (dateRange.type === 'preset' && dateRange.value === '24h') {
        return format(date, 'EEE, MMM d, h:mm a');
      }
      return format(date, 'EEE, MMM d');
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formattedLabel = formatTooltipLabel(label);
      return (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-3 shadow-md text-xs min-w-[140px]">
          <div className="text-gray-500 dark:text-slate-400 pb-1.5 mb-1.5 border-b border-gray-100 dark:border-slate-800 font-medium">
            {formattedLabel}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-slate-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shrink-0" />
              <span>Clicks</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white font-mono">
              {payload[0].value?.toLocaleString()}
            </span>
          </div>
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

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        <div className="flex flex-col gap-4">
          {/* Action Bar with Filter Dropdown and Date Range Picker */}
          <div className="flex items-center gap-2">
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
                      <div className="py-1 p-1">
                        <button 
                          onClick={() => { setActiveFilter('link'); setFilterSearch(''); }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] rounded-md transition-colors group"
                        >
                          <div className="flex items-center">
                            <LinkIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                            Link
                          </div>
                        </button>
                        <button 
                          onClick={() => { setActiveFilter('tag'); setFilterSearch(''); }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] rounded-md transition-colors group"
                        >
                          <div className="flex items-center">
                            <Tag className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                            Tag
                          </div>
                        </button>
                        <button 
                          onClick={() => { setActiveFilter('folder'); setFilterSearch(''); }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] rounded-md transition-colors group"
                        >
                          <div className="flex items-center">
                            <FolderIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                            Folder
                          </div>
                        </button>
                      </div>
                    ) : activeFilter === 'link' ? (
                      <>
                        <div className="p-1 border-b border-gray-100 dark:border-slate-800 flex items-center">
                          <button 
                            onClick={() => { setActiveFilter('none'); setFilterSearch(''); }} 
                            className="p-1 hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded text-gray-500 ml-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="relative flex-1 flex items-center">
                            <Search className="w-3.5 h-3.5 text-gray-400 ml-2" />
                            <input 
                              type="text"
                              autoFocus={true}
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Search links..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-56 overflow-y-auto">
                          {availableUrls.filter(u => {
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
                                  setSearchParams(prev => {
                                    const updated = new URLSearchParams(prev);
                                    updated.set('hash', linkHash);
                                    return updated;
                                  });
                                  setIsFilterOpen(false);
                                  setActiveFilter('none');
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30]'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <LinkIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate font-mono text-xs font-medium">/{linkHash}</span>
                                    <span className="truncate text-xs text-gray-400 dark:text-gray-500">{u.longUrl}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono ml-2 shrink-0">
                                  {u.accessed_times ?? 0} clicks
                                </span>
                              </button>
                            );
                          })}
                          {availableUrls.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">{isUrlsLoading ? 'Loading links...' : 'No links found'}</div>}
                        </div>
                      </>
                    ) : activeFilter === 'tag' ? (
                      <>
                        <div className="p-1 border-b border-gray-100 dark:border-slate-800 flex items-center">
                          <button 
                            onClick={() => { setActiveFilter('none'); setFilterSearch(''); }} 
                            className="p-1 hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded text-gray-500 ml-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="relative flex-1 flex items-center">
                            <Search className="w-3.5 h-3.5 text-gray-400 ml-2" />
                            <input 
                              type="text"
                              autoFocus={true}
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Tag..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-48 overflow-y-auto">
                          {availableTags.filter(t => t.name.toLowerCase().includes(filterSearch.toLowerCase())).map(t => {
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
                                      
                                      setSearchParams(prev => {
                                        const next = new URLSearchParams(prev);
                                        if (updatedTagIds.length > 0) {
                                          next.set('tagId', updatedTagIds.join(','));
                                        } else {
                                          next.delete('tagId');
                                        }
                                        return next;
                                      });
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
                          {availableTags.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No tags found</div>}
                        </div>
                      </>
                    ) : activeFilter === 'folder' ? (
                      <>
                        <div className="p-1 border-b border-gray-100 dark:border-slate-800 flex items-center">
                          <button 
                            onClick={() => { setActiveFilter('none'); setFilterSearch(''); }} 
                            className="p-1 hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded text-gray-500 ml-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="relative flex-1 flex items-center">
                            <Search className="w-3.5 h-3.5 text-gray-400 ml-2" />
                            <input 
                              type="text"
                              autoFocus={true}
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Search folders..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-56 overflow-y-auto">
                          {availableFolders.filter(f => f.name.toLowerCase().includes(filterSearch.toLowerCase())).map(folder => {
                            const isDefault = folder.name.toLowerCase() === 'links';
                            const slug = folder.slug || encodeURIComponent(folder.name.toLowerCase().replace(/\s+/g, '-'));
                            const isSelected = folderSlug === slug || folderIdParam === String(folder.id);
                            return (
                              <button
                                key={folder.id}
                                onClick={() => {
                                  const query = searchParams.toString();
                                  navigate(`/analytics/f/${slug}${query ? `?${query}` : ''}`);
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
                          {availableFolders.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No folders found</div>}
                        </div>
                      </>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>

          {/* Active Compound Filter Pills */}
          {(hashParam || folderSlug || folderIdParam || activeTagIds.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {hashParam && (
                <div className="relative inline-flex items-center" ref={linkPillPopoverRef}>
                  <div className="inline-flex items-center h-7 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs shadow-sm overflow-hidden divide-x divide-gray-200 dark:divide-slate-700">
                    <div className="flex items-center gap-1.5 px-2.5 h-full font-medium text-gray-700 dark:text-gray-300">
                      <LinkIcon className="w-3.5 h-3.5" />
                      Link
                    </div>
                    <div className="flex items-center px-2 h-full bg-gray-50 dark:bg-slate-800 text-gray-400 font-medium">
                      is
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsLinkPillPopoverOpen(prev => !prev)}
                      className="flex items-center gap-1 px-2.5 h-full font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      /{hashParam}
                    </button>
                    <button 
                      type="button"
                      className="flex items-center justify-center px-2 h-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      onClick={() => {
                        setSearchParams(prev => {
                          const updated = new URLSearchParams(prev);
                          updated.delete('hash');
                          return updated;
                        });
                        if (hash) {
                          navigate(folderSlug ? `/analytics/f/${folderSlug}` : '/analytics');
                        }
                        setIsLinkPillPopoverOpen(false);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Link Popover Dropdown */}
                  <AnimatePresence>
                    {isLinkPillPopoverOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-2 w-72 rounded-lg shadow-xl bg-white dark:bg-[#1E1E21] ring-1 ring-black/5 dark:ring-white/10 border border-gray-200 dark:border-[#2B2B30] divide-y divide-gray-100 dark:divide-slate-800 focus:outline-none z-[70] overflow-hidden"
                      >
                        <div className="p-1 border-b border-gray-100 dark:border-slate-800">
                          <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-gray-400 ml-2" />
                            <input 
                              type="text"
                              autoFocus={true}
                              value={linkPillSearch}
                              onChange={e => setLinkPillSearch(e.target.value)}
                              placeholder="Search links..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-56 overflow-y-auto">
                          {availableUrls.filter(u => {
                            const h = extractHash(u.shortUrl).toLowerCase();
                            const l = (u.longUrl || '').toLowerCase();
                            const q = linkPillSearch.toLowerCase();
                            return h.includes(q) || l.includes(q);
                          }).map(u => {
                            const linkHash = extractHash(u.shortUrl);
                            const isSelected = hashParam === linkHash;
                            return (
                              <button
                                key={u.id || u.shortUrl}
                                onClick={() => {
                                  setSearchParams(prev => {
                                    const updated = new URLSearchParams(prev);
                                    updated.set('hash', linkHash);
                                    return updated;
                                  });
                                  setIsLinkPillPopoverOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30]'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <LinkIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate font-mono text-xs font-medium">/{linkHash}</span>
                                    <span className="truncate text-xs text-gray-400 dark:text-gray-500">{u.longUrl}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono ml-2 shrink-0">
                                  {u.accessed_times ?? 0} clicks
                                </span>
                              </button>
                            );
                          })}
                          {availableUrls.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">{isUrlsLoading ? 'Loading links...' : 'No links found'}</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {(folderSlug || folderIdParam) && (
                <div className="relative inline-flex items-center" ref={folderPillPopoverRef}>
                  <div className="inline-flex items-center h-7 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs shadow-sm overflow-hidden divide-x divide-gray-200 dark:divide-slate-700">
                    <div className="flex items-center gap-1.5 px-2.5 h-full font-medium text-gray-700 dark:text-gray-300">
                      <FolderIcon className="w-3.5 h-3.5" />
                      Folder
                    </div>
                    <div className="flex items-center px-2 h-full bg-gray-50 dark:bg-slate-800 text-gray-400 font-medium">
                      is
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsFolderPillPopoverOpen(prev => !prev)}
                      className="flex items-center gap-1 px-2.5 h-full font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {currentFolder?.name || folderSlug || folderIdParam}
                    </button>
                    <button 
                      type="button"
                      className="flex items-center justify-center px-2 h-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete('folderId');
                        const query = next.toString();
                        if (folderSlug) {
                          if (hashParam) {
                            navigate(`/analytics/${hashParam}${query ? `?${query}` : ''}`);
                          } else {
                            navigate(`/analytics${query ? `?${query}` : ''}`);
                          }
                        } else {
                          setSearchParams(next);
                        }
                        setIsFolderPillPopoverOpen(false);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Folder Popover Dropdown */}
                  <AnimatePresence>
                    {isFolderPillPopoverOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-2 w-64 rounded-lg shadow-xl bg-white dark:bg-[#1E1E21] ring-1 ring-black/5 dark:ring-white/10 border border-gray-200 dark:border-[#2B2B30] divide-y divide-gray-100 dark:divide-slate-800 focus:outline-none z-[70] overflow-hidden"
                      >
                        <div className="p-1 border-b border-gray-100 dark:border-slate-800">
                          <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-gray-400 ml-2" />
                            <input 
                              type="text"
                              autoFocus={true}
                              value={folderPillSearch}
                              onChange={e => setFolderPillSearch(e.target.value)}
                              placeholder="Search folders..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-56 overflow-y-auto">
                          {availableFolders.filter(f => f.name.toLowerCase().includes(folderPillSearch.toLowerCase())).map(folder => {
                            const isDefault = folder.name.toLowerCase() === 'links';
                            const slug = folder.slug || encodeURIComponent(folder.name.toLowerCase().replace(/\s+/g, '-'));
                            const isSelected = folderSlug === slug || folderIdParam === String(folder.id);
                            return (
                              <button
                                key={folder.id}
                                onClick={() => {
                                  const query = searchParams.toString();
                                  navigate(`/analytics/f/${slug}${query ? `?${query}` : ''}`);
                                  setIsFolderPillPopoverOpen(false);
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
                          {availableFolders.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No folders found</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {activeTagIds.length > 0 && (
                <div className="relative inline-flex items-center" ref={tagPillPopoverRef}>
                  <div className="inline-flex items-center h-7 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs shadow-sm overflow-hidden divide-x divide-gray-200 dark:divide-slate-700">
                    <div className="flex items-center gap-1.5 px-2.5 h-full font-medium text-gray-700 dark:text-gray-300">
                      <Tag className="w-3.5 h-3.5" />
                      Tag
                    </div>
                    <div className="flex items-center px-2 h-full bg-gray-50 dark:bg-slate-800 text-gray-400 font-medium">
                      is
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsTagPillPopoverOpen(prev => !prev)}
                      className="flex items-center gap-1 px-2.5 h-full font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {(() => {
                        const tagIds = activeTagIds;
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
                      className="flex items-center justify-center px-2 h-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      onClick={() => {
                        setSearchParams(prev => {
                          const next = new URLSearchParams(prev);
                          next.delete('tagId');
                          return next;
                        });
                        setIsTagPillPopoverOpen(false);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

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
                        <div className="p-1 border-b border-gray-100 dark:border-slate-800">
                          <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-gray-400 ml-2" />
                            <input 
                              type="text"
                              autoFocus={true}
                              value={tagPillSearch}
                              onChange={e => setTagPillSearch(e.target.value)}
                              placeholder="Tag..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-48 overflow-y-auto">
                          {availableTags.filter(t => t.name.toLowerCase().includes(tagPillSearch.toLowerCase())).map(t => {
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
                                      
                                      setSearchParams(prev => {
                                        const next = new URLSearchParams(prev);
                                        if (updatedTagIds.length > 0) {
                                          next.set('tagId', updatedTagIds.join(','));
                                        } else {
                                          next.delete('tagId');
                                        }
                                        return next;
                                      });
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
                          {availableTags.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No tags found</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Unified Master Card */}
        <div className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-xl shadow-sm overflow-hidden flex flex-col w-full">
          {/* Integrated Metric Header Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-[#2B2B30] border-b border-gray-200 dark:border-[#2B2B30]">
            {/* Column 1: Clicks */}
            <div className="p-4 sm:p-5 bg-gray-50/50 dark:bg-slate-800/30">
              <div className="text-xs font-medium text-gray-500 dark:text-[#A1A1AA] flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5" /> Clicks
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#EDEDED] mt-1">
                {totalClicks.toLocaleString()}
              </div>
            </div>

            {/* Column 2: Top Source */}
            <div className="p-4 sm:p-5">
              <div className="text-xs font-medium text-gray-500 dark:text-[#A1A1AA] flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Top Source
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#EDEDED] mt-1 truncate">
                {clicksByBrowser.length > 0 ? clicksByBrowser[0].browser : 'N/A'}
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="p-6 relative">
            <div className="relative w-full h-[300px]">
              {clicksByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={clicksByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 11 }} 
                      tickFormatter={formatXAxisTick}
                      minTickGap={40}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} labelFormatter={formatTooltipLabel} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#2563eb" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorClicks)" 
                      activeDot={{ r: 5, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 border border-dashed border-gray-200 dark:border-[#2B2B30] rounded-lg">
                  No data available for the selected period
                </div>
              )}
            </div>
          </div>
        </div>

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
