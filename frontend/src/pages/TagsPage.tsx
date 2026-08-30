import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Trash2, Link as LinkIcon, Tag as TagIcon, Pen } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import type { DashboardLayoutContext } from '../layouts/DashboardLayout';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const TAG_COLORS = [
  { name: 'red', classes: 'bg-red-100 text-red-700 border-red-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30' },
  { name: 'blue', classes: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30' },
  { name: 'green', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30' },
  { name: 'purple', classes: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30' },
  { name: 'orange', classes: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30' }
];

const getTagColor = (colorName: string | undefined) => {
  return TAG_COLORS.find(c => c.name === colorName) || TAG_COLORS[1];
};

const TagsPage: React.FC = () => {
  const { tags, setTags, setTagToEdit, setIsCreateTagModalOpen, isTagsLoading } = useOutletContext<DashboardLayoutContext>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [tagToDelete, setTagToDelete] = useState<any | null>(null);

  const handleDeleteTag = async (id: number) => {
    try {
      await axiosInstance.delete(`/tags/${id}`);
      setTags(tags.filter(t => t.id !== id));
      setTagToDelete(null);
    } catch (err) {
      console.error("Failed to delete tag", err);
    }
  };

  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 py-4 flex flex-col gap-4 w-full">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search tags..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="bg-background border border-border rounded-xl overflow-visible flex flex-col gap-0 divide-y divide-border">
          {isTagsLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 h-[72px]">
                <div className="flex items-center gap-3">
                  <Skeleton width={24} height={24} borderRadius={4} />
                  <Skeleton width={100} height={20} />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton width={70} height={32} borderRadius={6} />
                  <Skeleton width={32} height={32} borderRadius={6} />
                </div>
              </div>
            ))
          ) : filteredTags.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No tags found.</div>
          ) : (
            filteredTags.map((tag) => (
              <motion.div 
                layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                key={tag.id} 
                onClick={() => navigate(`/dashboard?tag=${encodeURIComponent(tag.name)}`)}
                className="group relative flex items-center justify-between p-4 hover:bg-neutral-100/70 dark:hover:bg-[#111114] transition-all cursor-pointer first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center border ${getTagColor(tag.color).classes}`}>
                    <TagIcon className={`w-3.5 h-3.5 ${getTagColor(tag.color).classes.split(' ').find(c => c.startsWith('text-') && !c.includes('dark:'))}`} />
                  </div>
                  <span className="font-medium text-foreground text-sm">{tag.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground bg-secondary/50 border border-border rounded-md hover:bg-secondary transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    {tag.linkCount || 0} {(tag.linkCount || 0) === 1 ? 'link' : 'links'}
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === tag.id ? null : tag.id);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                    {openMenuId === tag.id && (
                      <>
                        {/* Invisible click-outside backdrop */}
                        <div 
                          className="fixed inset-0 z-40 bg-transparent cursor-default" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                          }} 
                        />
                        <motion.div 
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.1, ease: "easeOut" }}
                          className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-xl shadow-lg z-50 p-1 divide-y divide-border"
                        >
                          <div className="py-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setTagToEdit(tag);
                                setIsCreateTagModalOpen(true);
                              }}
                              className="w-full flex items-center px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <Pen className="w-4 h-4 text-muted-foreground" />
                                <span>Edit</span>
                              </div>
                            </button>
                          </div>
                          <div className="pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setTagToDelete(tag);
                              }}
                              className="w-full flex items-center px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <Trash2 className="w-4 h-4 text-rose-500" />
                                <span>Delete</span>
                              </div>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

      <AnimatePresence>
      {tagToDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Tag</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete the "{tagToDelete.name}" tag? {tagToDelete.linkCount > 0 ? `This tag is currently used in ${tagToDelete.linkCount} links. It will be removed from all links, but the links will not be deleted.` : ''}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setTagToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteTag(tagToDelete.id)}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm focus:outline-none"
              >
                Delete Tag
              </button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TagsPage;
