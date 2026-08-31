import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useOutletContext } from 'react-router-dom';
import type { DashboardLayoutContext } from '../layouts/DashboardLayout';
import { 
  ArrowLeft, MousePointerClick, Globe, Monitor, 
  Link as LinkIcon, Activity,
  Share2, Folder as FolderIcon,
  Tag, X, Search, Filter, ChevronDown, ChevronLeft, Check
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

const COLORS = ['#0099ff', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'];

const extractHash = (shortUrl: string): string =>
  shortUrl.split('/').pop() ?? shortUrl;

const AnalyticsPage: React.FC = () => {
  const { hash, folderSlug } = useParams<{ hash?: string; folderSlug?: string }>();
  const navigate = useNavigate();
  const { folders = [], tags = [], activeFolderId } = useOutletContext<DashboardLayoutContext>() || {};
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
  const [isFetching, setIsFetching] = useState(false);
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

  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent && !data) {
      setLoading(true);
    } else if (!isSilent) {
      setIsFetching(true);
    }
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
      if (!isSilent) {
        setError(err.response?.status === 404 ? 'Analytics not found or unauthorized.' : 'Failed to load analytics.');
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [hashParam, folderSlug, folderIdParam, tagIdParam, dateRange, data]);

  useEffect(() => {
    fetchAnalytics(false);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics(true);
      }
    }, 3_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAnalytics]);

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


  if (loading && !data) {
    return (
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton width={250} height={28} />
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-background border border-border rounded-xl p-6 flex flex-col gap-1">
              <Skeleton width={120} height={16} />
              <div className="mt-2"><Skeleton width={80} height={36} /></div>
              <Skeleton width={60} height={12} className="mt-1" />
            </div>
          ))}
        </section>

        <section className="bg-background border border-border rounded-xl p-6 flex flex-col gap-6">
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
            <div key={i} className="bg-background border border-border rounded-xl p-0 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
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

  if (error && !data) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-popover rounded-xl shadow-xl border border-border p-8 text-center max-w-md w-full">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Error Loading Analytics</h2>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-solid w-full flex items-center justify-center gap-2"
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
        <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-xs min-w-[140px]">
          <div className="text-muted-foreground pb-1.5 mb-1.5 border-b border-border font-medium">
            {formattedLabel}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary shrink-0" />
              <span>Clicks</span>
            </div>
            <span className="font-semibold text-foreground font-mono">
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
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all ${
                  activeFilterCount > 0 
                    ? 'border-neutral-200/80 dark:border-[#27272A] bg-neutral-100 dark:bg-[#18181B] text-foreground shadow-sm hover:bg-neutral-200/60 dark:hover:bg-[#202024]' 
                    : 'bg-background border-input text-foreground hover:bg-secondary'
                }`}
              >
                <Filter className={`w-3.5 h-3.5 ${activeFilterCount > 0 ? 'text-[#0099ff]' : 'text-muted-foreground'}`} />
                Filter
                {activeFilterCount > 0 && <span className="bg-[#0099ff] text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none font-semibold shadow-sm">{activeFilterCount}</span>}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    className="absolute left-0 top-full mt-1 w-72 rounded-xl shadow-lg bg-popover border border-border divide-y divide-border focus:outline-none z-[60] overflow-hidden"
                  >
                    {activeFilter === 'none' ? (
                      <div className="py-1 p-1">
                        <button 
                          onClick={() => { setActiveFilter('link'); setFilterSearch(''); }}
                          className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-foreground hover:bg-neutral-100/70 dark:hover:bg-[#111114] rounded-lg transition-colors group"
                        >
                          <div className="flex items-center">
                            <LinkIcon className="mr-2.5 h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                            Link
                          </div>
                        </button>
                        <button 
                          onClick={() => { setActiveFilter('tag'); setFilterSearch(''); }}
                          className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-foreground hover:bg-neutral-100/70 dark:hover:bg-[#111114] rounded-lg transition-colors group"
                        >
                          <div className="flex items-center">
                            <Tag className="mr-2.5 h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                            Tag
                          </div>
                        </button>
                        <button 
                          onClick={() => { setActiveFilter('folder'); setFilterSearch(''); }}
                          className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-foreground hover:bg-neutral-100/70 dark:hover:bg-[#111114] rounded-lg transition-colors group"
                        >
                          <div className="flex items-center">
                            <FolderIcon className="mr-2.5 h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                            Folder
                          </div>
                        </button>
                      </div>
                    ) : activeFilter === 'link' ? (
                      <>
                        <div className="p-1.5 border-b border-border/80 bg-background/80 flex items-center gap-1">
                          <button 
                            onClick={() => { setActiveFilter('none'); setFilterSearch(''); }} 
                            className="p-1 hover:bg-neutral-100/70 dark:hover:bg-[#18181B] rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <div className="relative flex-1 flex items-center bg-secondary/40 rounded-md px-2 py-0.5 border border-border/40 focus-within:border-primary/50 transition-all">
                            <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                            <input 
                              type="text" 
                              autoFocus={true}
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Search links..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-1 px-2 text-foreground placeholder:text-muted-foreground"
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
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-neutral-100/70 dark:hover:bg-[#111114]'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate font-mono text-xs font-medium">/{linkHash}</span>
                                    <span className="truncate text-[10px] text-muted-foreground">{u.longUrl}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0 px-1.5 py-0.5 rounded-full bg-secondary/50">
                                  {u.accessed_times ?? 0} clicks
                                </span>
                              </button>
                            );
                          })}
                          {availableUrls.length === 0 && <div className="px-2.5 py-2 text-xs text-muted-foreground">{isUrlsLoading ? 'Loading links...' : 'No links found'}</div>}
                        </div>
                      </>
                    ) : activeFilter === 'tag' ? (
                      <>
                        <div className="p-1.5 border-b border-border/80 bg-background/80 flex items-center gap-1">
                          <button 
                            onClick={() => { setActiveFilter('none'); setFilterSearch(''); }} 
                            className="p-1 hover:bg-neutral-100/70 dark:hover:bg-[#18181B] rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <div className="relative flex-1 flex items-center bg-secondary/40 rounded-md px-2 py-0.5 border border-border/40 focus-within:border-primary/50 transition-all">
                            <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                            <input 
                              type="text" 
                              autoFocus={true}
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Tag..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-1 px-2 text-foreground placeholder:text-muted-foreground"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-48 overflow-y-auto">
                          {availableTags.filter(t => t.name.toLowerCase().includes(filterSearch.toLowerCase())).map(t => {
                            const activeIds = (tagIdParam || '').split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
                            const isChecked = activeIds.includes(t.id);
                            return (
                              <label key={t.id} className="flex items-center justify-between px-2.5 py-1.5 text-xs text-foreground hover:bg-neutral-100/70 dark:hover:bg-[#111114] rounded-lg cursor-pointer group transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative flex items-center justify-center">
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
                                      className="sr-only"
                                    />
                                    <div 
                                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                        isChecked 
                                          ? 'bg-[#0099ff] border-[#0099ff] text-white shadow-sm' 
                                          : 'border-border/80 bg-background/60 group-hover:border-muted-foreground'
                                      }`}
                                    >
                                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                  </div>
                                  <span 
                                    className="w-2 h-2 rounded-full shrink-0 shadow-sm" 
                                    style={{ backgroundColor: t.color || '#374151' }}
                                  />
                                  <span className="truncate font-medium">{t.name}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0 px-1.5 py-0.5 rounded-full bg-secondary/50 group-hover:bg-secondary transition-colors">
                                  {t.linkCount ?? 0}
                                </span>
                              </label>
                            );
                          })}
                          {availableTags.length === 0 && <div className="px-2.5 py-2 text-xs text-muted-foreground">No tags found</div>}
                        </div>
                      </>
                    ) : activeFilter === 'folder' ? (
                      <>
                        <div className="p-1.5 border-b border-border/80 bg-background/80 flex items-center gap-1">
                          <button 
                            onClick={() => { setActiveFilter('none'); setFilterSearch(''); }} 
                            className="p-1 hover:bg-neutral-100/70 dark:hover:bg-[#18181B] rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <div className="relative flex-1 flex items-center bg-secondary/40 rounded-md px-2 py-0.5 border border-border/40 focus-within:border-primary/50 transition-all">
                            <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                            <input 
                              type="text" 
                              autoFocus={true}
                              value={filterSearch}
                              onChange={e => setFilterSearch(e.target.value)}
                              placeholder="Search folders..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-1 px-2 text-foreground placeholder:text-muted-foreground"
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
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-neutral-100/70 dark:hover:bg-[#111114]'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FolderIcon className={`w-3.5 h-3.5 ${isDefault ? 'text-primary' : 'text-emerald-500'} shrink-0`} />
                                  <span className="truncate">{folder.name}</span>
                                </div>
                                {folder.linkCount !== undefined && (
                                  <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0 px-1.5 py-0.5 rounded-full bg-secondary/50">
                                    {folder.linkCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {availableFolders.length === 0 && <div className="px-2.5 py-2 text-xs text-muted-foreground">No folders found</div>}
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
                  <div className="inline-flex items-center h-7 rounded-md border border-border bg-secondary text-xs overflow-hidden divide-x divide-border">
                    <div className="flex items-center gap-1.5 px-2.5 h-full font-medium text-foreground">
                      <LinkIcon className="w-3 h-3" />
                      Link
                    </div>
                    <div className="flex items-center px-2 h-full bg-background text-muted-foreground font-medium">
                      is
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsLinkPillPopoverOpen(prev => !prev)}
                      className="flex items-center gap-1 px-2.5 h-full font-medium text-foreground cursor-pointer hover:bg-background transition-colors"
                    >
                      /{hashParam}
                    </button>
                    <button 
                      type="button"
                      className="flex items-center justify-center px-2 h-full text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer transition-colors"
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
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-1 w-72 rounded-xl shadow-lg bg-popover border border-border divide-y divide-border focus:outline-none z-[70] overflow-hidden"
                      >
                        <div className="p-1 border-b border-border">
                          <div className="relative flex items-center">
                            <Search className="w-3 h-3 text-muted-foreground ml-2" />
                            <input 
                              type="text" 
                              autoFocus={true}
                              value={linkPillSearch}
                              onChange={e => setLinkPillSearch(e.target.value)}
                              placeholder="Search links..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-1.5 px-2.5 text-foreground placeholder:text-muted-foreground"
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
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate font-mono text-xs font-medium">/{linkHash}</span>
                                    <span className="truncate text-[10px] text-muted-foreground">{u.longUrl}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0">
                                  {u.accessed_times ?? 0} clicks
                                </span>
                              </button>
                            );
                          })}
                          {availableUrls.length === 0 && <div className="px-2.5 py-2 text-xs text-muted-foreground">{isUrlsLoading ? 'Loading links...' : 'No links found'}</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {(folderSlug || folderIdParam) && (
                <div className="relative inline-flex items-center" ref={folderPillPopoverRef}>
                  <div className="inline-flex items-center h-7 rounded-md border border-border bg-secondary text-xs overflow-hidden divide-x divide-border">
                    <div className="flex items-center gap-1.5 px-2.5 h-full font-medium text-foreground">
                      <FolderIcon className="w-3 h-3" />
                      Folder
                    </div>
                    <div className="flex items-center px-2 h-full bg-background text-muted-foreground font-medium">
                      is
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsFolderPillPopoverOpen(prev => !prev)}
                      className="flex items-center gap-1 px-2.5 h-full font-medium text-foreground cursor-pointer hover:bg-background transition-colors"
                    >
                      {currentFolder?.name || folderSlug || folderIdParam}
                    </button>
                    <button 
                      type="button"
                      className="flex items-center justify-center px-2 h-full text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer transition-colors"
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
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-1 w-64 rounded-xl shadow-lg bg-popover border border-border divide-y divide-border focus:outline-none z-[70] overflow-hidden"
                      >
                        <div className="p-1 border-b border-border">
                          <div className="relative flex items-center">
                            <Search className="w-3 h-3 text-muted-foreground ml-2" />
                            <input 
                              type="text" 
                              autoFocus={true}
                              value={folderPillSearch}
                              onChange={e => setFolderPillSearch(e.target.value)}
                              placeholder="Search folders..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-1.5 px-2.5 text-foreground placeholder:text-muted-foreground"
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
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FolderIcon className={`w-3.5 h-3.5 ${isDefault ? 'text-primary' : 'text-emerald-500'} shrink-0`} />
                                  <span className="truncate">{folder.name}</span>
                                </div>
                                {folder.linkCount !== undefined && (
                                  <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0">
                                    {folder.linkCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {availableFolders.length === 0 && <div className="px-2.5 py-2 text-xs text-muted-foreground">No folders found</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {activeTagIds.length > 0 && (
                <div className="relative inline-flex items-center" ref={tagPillPopoverRef}>
                  <div className="inline-flex items-center h-7 rounded-md border border-border bg-secondary text-xs overflow-hidden divide-x divide-border">
                    <div className="flex items-center gap-1.5 px-2.5 h-full font-medium text-foreground">
                      <Tag className="w-3 h-3" />
                      Tag
                    </div>
                    <div className="flex items-center px-2 h-full bg-background text-muted-foreground font-medium">
                      is
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsTagPillPopoverOpen(prev => !prev)}
                      className="flex items-center gap-1 px-2.5 h-full font-medium text-foreground cursor-pointer hover:bg-background transition-colors"
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
                                    className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-background" 
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
                      className="flex items-center justify-center px-2 h-full text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer transition-colors"
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
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-1 w-64 rounded-xl shadow-lg bg-popover border border-border divide-y divide-border focus:outline-none z-[70] overflow-hidden"
                      >
                        <div className="p-1.5 border-b border-border/80 bg-background/80 flex items-center">
                          <div className="relative flex-1 flex items-center bg-secondary/40 rounded-md px-2 py-0.5 border border-border/40 focus-within:border-primary/50 transition-all">
                            <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                            <input 
                              type="text" 
                              autoFocus={true}
                              value={tagPillSearch}
                              onChange={e => setTagPillSearch(e.target.value)}
                              placeholder="Tag..." 
                              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-xs py-1 px-2 text-foreground placeholder:text-muted-foreground"
                            />
                          </div>
                        </div>
                        <div className="py-1 p-1 max-h-48 overflow-y-auto">
                          {availableTags.filter(t => t.name.toLowerCase().includes(tagPillSearch.toLowerCase())).map(t => {
                            const activeIds = (tagIdParam || '').split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
                            const isChecked = activeIds.includes(t.id);
                            return (
                              <label key={t.id} className="flex items-center justify-between px-2.5 py-1.5 text-xs text-foreground hover:bg-neutral-100/70 dark:hover:bg-[#111114] rounded-lg cursor-pointer group transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative flex items-center justify-center">
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
                                      className="sr-only"
                                    />
                                    <div 
                                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                        isChecked 
                                          ? 'bg-[#0099ff] border-[#0099ff] text-white shadow-sm' 
                                          : 'border-border/80 bg-background/60 group-hover:border-muted-foreground'
                                      }`}
                                    >
                                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                  </div>
                                  <span 
                                    className="w-2 h-2 rounded-full shrink-0 shadow-sm" 
                                    style={{ backgroundColor: t.color || '#374151' }}
                                  />
                                  <span className="truncate font-medium">{t.name}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0 px-1.5 py-0.5 rounded-full bg-secondary/50 group-hover:bg-secondary transition-colors">
                                  {t.linkCount ?? 0}
                                </span>
                              </label>
                            );
                          })}
                          {availableTags.length === 0 && <div className="px-2.5 py-2 text-xs text-muted-foreground">No tags found</div>}
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
        <div className={`bg-background border border-border rounded-xl overflow-hidden flex flex-col w-full transition-opacity duration-200 ${isFetching ? 'opacity-75' : 'opacity-100'}`}>
          {/* Integrated Metric Header Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border">
            {/* Column 1: Clicks */}
            <div className="p-4 sm:p-5 bg-background">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-primary" /> Clicks
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                {totalClicks.toLocaleString()}
              </div>
            </div>

            {/* Column 2: Top Source */}
            <div className="p-4 sm:p-5 bg-background">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-primary" /> Top Source
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mt-1 truncate">
                {clicksByBrowser.length > 0 ? clicksByBrowser[0].browser : 'N/A'}
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="p-6 relative">
            <div className="relative w-full h-[300px] overflow-hidden">
              {clicksByDate.length > 0 ? (
                <motion.div 
                  key={`${JSON.stringify(dateRange)}-${hashParam || 'all'}`}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: 'bottom center' }}
                  className="w-full h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={clicksByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0099ff" stopOpacity={0.45}/>
                          <stop offset="65%" stopColor="#0099ff" stopOpacity={0.12}/>
                          <stop offset="100%" stopColor="#0099ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717A', fontSize: 11 }} 
                        tickFormatter={formatXAxisTick}
                        minTickGap={40}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} labelFormatter={formatTooltipLabel} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#0099ff" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorClicks)" 
                        isAnimationActive={false}
                        activeDot={{ r: 5, fill: '#ffffff', stroke: '#0099ff', strokeWidth: 2 }} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl text-xs">
                  No data available for the selected period
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown Grids */}
        <section className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${isFetching ? 'opacity-75' : 'opacity-100'}`}>
          
          {/* Countries */}
          <div className="bg-background border border-border rounded-xl p-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-xs text-foreground">Top Countries</h3>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto max-h-[300px]">
              {clicksByCountry.length > 0 ? (
                clicksByCountry.slice(0, 5).map((country) => {
                  const pct = totalClicks > 0 ? (country.count / totalClicks) * 100 : 0;
                  return (
                    <div key={country.country} className="group flex items-center justify-between p-3 border-b border-border/50 last:border-0 hover:bg-neutral-100/70 dark:hover:bg-[#111114] transition-all relative">
                      <div className="absolute left-0 top-0 bottom-0 bg-primary/10 z-0 rounded-r-sm transition-all" style={{ width: `${pct}%` }}></div>
                      <div className="flex items-center gap-3 z-10">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground truncate">{country.country}</span>
                      </div>
                      <span className="text-xs text-muted-foreground z-10 font-mono">{country.count}</span>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">No data</div>
              )}
            </div>
          </div>

          {/* Devices */}
          <div className="bg-background border border-border rounded-xl p-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-xs text-foreground">Devices</h3>
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
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {clicksByDevice.map((device, i) => {
                      const pct = totalClicks > 0 ? Math.round((device.count / totalClicks) * 100) : 0;
                      return (
                        <div key={device.device} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                          <span className="text-xs text-muted-foreground">{device.device} ({pct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">No data</div>
              )}
            </div>
          </div>

          {/* Referrers */}
          <div className="bg-background border border-border rounded-xl p-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-xs text-foreground">Referrers</h3>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto max-h-[300px]">
              {clicksByBrowser.length > 0 ? (
                clicksByBrowser.slice(0, 5).map((browser) => {
                  const pct = totalClicks > 0 ? (browser.count / totalClicks) * 100 : 0;
                  return (
                    <div key={browser.browser} className="group flex items-center justify-between p-3 border-b border-border/50 last:border-0 hover:bg-neutral-100/70 dark:hover:bg-[#111114] transition-all relative">
                      <div className="absolute left-0 top-0 bottom-0 bg-primary/10 z-0 rounded-r-sm transition-all" style={{ width: `${pct}%` }}></div>
                      <div className="flex items-center gap-3 z-10">
                        <div className="w-5 h-5 bg-secondary border border-border rounded flex items-center justify-center text-[10px] font-bold text-foreground uppercase">
                          {browser.browser.substring(0, 1)}
                        </div>
                        <span className="text-xs font-medium text-foreground truncate">{browser.browser}</span>
                      </div>
                      <span className="text-xs text-muted-foreground z-10 font-mono">{browser.count}</span>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">No data</div>
              )}
            </div>
          </div>

        </section>
      </motion.main>
  );
};

export default AnalyticsPage;
