import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Trash2, Link as LinkIcon, Tag as TagIcon, Pen } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import type { DashboardLayoutContext } from '../layouts/DashboardLayout';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const TAG_COLORS = [
  { name: 'red', classes: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' },
  { name: 'blue', classes: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50' },
  { name: 'green', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' },
  { name: 'purple', classes: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50' },
  { name: 'orange', classes: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50' }
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 py-8 flex flex-col gap-4 w-full">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search tags..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-[#2B2B30] rounded-md text-sm focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-slate-800 transition-colors dark:bg-[#1E1E21] dark:text-[#EDEDED]"
          />
        </div>

        <div className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-xl overflow-visible shadow-sm flex flex-col gap-0 divide-y divide-gray-100 dark:divide-slate-800">
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
            <div className="p-12 text-center text-gray-500">No tags found.</div>
          ) : (
            filteredTags.map((tag) => (
              <motion.div 
                layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                key={tag.id} 
                onClick={() => navigate(`/dashboard?tag=${encodeURIComponent(tag.name)}`)}
                className="group relative flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#2B2B30]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center border ${getTagColor(tag.color).classes}`}>
                    <TagIcon className={`w-3.5 h-3.5 ${getTagColor(tag.color).classes.split(' ').find(c => c.startsWith('text-') && !c.includes('dark:'))}`} />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-[#EDEDED]">{tag.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-[#A1A1AA] bg-white dark:bg-[#222222] border border-gray-200 dark:border-[#2B2B30] rounded-md hover:bg-gray-50 dark:hover:bg-[#2B2B30] transition-colors"
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
                      className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#2B2B30] rounded-md transition-colors"
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
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-xl shadow-xl z-50 p-1 divide-y divide-gray-100 dark:divide-slate-800"
                        >
                          <div className="py-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setTagToEdit(tag);
                                setIsCreateTagModalOpen(true);
                              }}
                              className="w-full flex items-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-[#EDEDED] hover:bg-gray-50 dark:hover:bg-[#2B2B30] rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <Pen className="w-4 h-4 text-gray-400" />
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
                              className="w-full flex items-center px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E21] max-w-sm w-full rounded-xl p-6 shadow-xl border border-gray-200 dark:border-[#2B2B30]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#EDEDED] mb-2">Delete Tag</h3>
            <p className="text-sm text-gray-500 dark:text-[#A1A1AA] mb-6">
              Are you sure you want to delete the "{tagToDelete.name}" tag? {tagToDelete.linkCount > 0 ? `This tag is currently used in ${tagToDelete.linkCount} links. It will be removed from all links, but the links will not be deleted.` : ''}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setTagToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteTag(tagToDelete.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
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
