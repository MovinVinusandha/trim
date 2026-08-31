import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Trash2, Link as LinkIcon, Tag as TagIcon, Pen, Plus } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import type { DashboardLayoutContext } from '../layouts/DashboardLayout';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="flex items-center justify-between gap-4">
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
      </div>

      <div className="bg-background border border-border rounded-xl overflow-visible flex flex-col gap-0 divide-y divide-border">
        {isTagsLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 h-[72px]">
              <div className="flex items-center gap-3">
                <Skeleton width={16} height={16} borderRadius={999} />
                <Skeleton width={120} height={20} />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton width={70} height={32} borderRadius={6} />
                <Skeleton width={32} height={32} borderRadius={6} />
              </div>
            </div>
          ))
        ) : filteredTags.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-secondary/60 border border-border/80 flex items-center justify-center mb-3.5 text-muted-foreground shadow-sm">
              <TagIcon className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No tags found.</h3>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              {search ? 'No tags match your search query.' : 'Create tags to organize and filter your shortened links.'}
            </p>
            {!search && (
              <button
                onClick={() => {
                  setTagToEdit(null);
                  setIsCreateTagModalOpen(true);
                }}
                className="btn-solid text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create Tag
              </button>
            )}
          </div>
        ) : (
          filteredTags.map((tag) => (
            <motion.div 
              layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
              key={tag.id} 
              onClick={() => navigate(`/dashboard?tag=${encodeURIComponent(tag.name)}`)}
              className="group relative flex items-center justify-between p-4 hover:bg-neutral-100/70 dark:hover:bg-[#111114] transition-all cursor-pointer first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border border-border/80 bg-secondary/40 text-foreground group-hover:border-border transition-colors">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: tag.color || '#3b82f6' }}
                  />
                  <span className="font-medium text-foreground">{tag.name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground bg-secondary/50 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{tag.linkCount || 0} {(tag.linkCount || 0) === 1 ? 'link' : 'links'}</span>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === tag.id ? null : tag.id);
                    }}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  <AnimatePresence>
                  {openMenuId === tag.id && (
                    <>
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
                        className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-xl shadow-xl z-50 p-1.5 divide-y divide-border"
                      >
                        <div className="py-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              setTagToEdit(tag);
                              setIsCreateTagModalOpen(true);
                            }}
                            className="w-full flex items-center px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Pen className="w-3.5 h-3.5 text-muted-foreground" />
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
                            className="w-full flex items-center px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="bg-background max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-border"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">Delete Tag</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Are you sure you want to delete the "{tagToDelete.name}" tag? {tagToDelete.linkCount > 0 ? `This tag is currently used in ${tagToDelete.linkCount} links. It will be removed from all links, but the links will not be deleted.` : 'This action cannot be undone.'}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button 
                onClick={() => setTagToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border border-transparent"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteTag(tagToDelete.id)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-all shadow-sm focus:outline-none active:scale-95"
              >
                Delete Tag
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TagsPage;
