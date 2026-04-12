import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Trash2, Link as LinkIcon, Folder as FolderIcon, Pen, BarChart2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import type { DashboardLayoutContext } from '../layouts/DashboardLayout';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const FoldersPage: React.FC = () => {
  const { folders, setFolders, setActiveFolderId, setFolderToEdit, setIsFolderModalOpen, isFoldersLoading, navStats } = useOutletContext<DashboardLayoutContext>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<any | null>(null);
  const [searchParams] = useSearchParams();

  const handleFolderClick = (folder: any) => {
    setActiveFolderId(folder.id);
    const slug = folder.slug || encodeURIComponent(folder.name.toLowerCase().replace(/\s+/g, '-'));
    navigate(`/dashboard/f/${slug}`);
  };

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsFolderModalOpen(true);
    }
  }, [searchParams]);

  const handleDeleteFolder = async (id: number) => {
    try {
      await axiosInstance.delete(`/folders/${id}`);
      setFolders(folders.filter(f => f.id !== id));
      setFolderToDelete(null);
    } catch (err) {
      console.error("Failed to delete folder", err);
    }
  };

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 py-8 w-full">
      <div className="space-y-6">
        
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search folders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-[#2B2B30] rounded-md text-sm focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-slate-800 transition-colors dark:bg-[#1E1E21] dark:text-[#EDEDED]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {isFoldersLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-4 h-32 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton width={36} height={36} borderRadius={8} />
                    <Skeleton width={120} height={20} />
                  </div>
                  <Skeleton width={28} height={28} borderRadius={6} />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Skeleton width={80} height={28} borderRadius={6} />
                </div>
              </div>
            ))
          ) : (
            filteredFolders.map(folder => {
              const isDefault = folder.name.toLowerCase() === 'links';
              const slug = folder.slug || encodeURIComponent(folder.name.toLowerCase().replace(/\s+/g, '-'));
              return (
                <motion.div 
                  layout 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ duration: 0.2 }} 
                  key={folder.id} 
                  onClick={() => handleFolderClick(folder)} 
                  className="bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-lg shadow-sm p-4 hover:shadow-md transition-colors group relative cursor-pointer hover:border-gray-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDefault ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                        <FolderIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-[#EDEDED] line-clamp-1">{folder.name}</h3>
                          {isDefault && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === folder.id ? null : folder.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded-md transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      <AnimatePresence>
                      {openMenuId === folder.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-md shadow-lg z-[60] overflow-hidden"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              setActiveFolderId(folder.id);
                              navigate(`/analytics/f/${slug}`);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] flex items-center gap-2"
                          >
                            <BarChart2 className="w-4 h-4 text-blue-500" />
                            Analytics
                          </button>
                          {!isDefault && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  setFolderToEdit(folder);
                                  setIsFolderModalOpen(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#2B2B30] flex items-center gap-2"
                              >
                                <Pen className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  setFolderToDelete(folder);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </>
                          )}
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-[#A1A1AA] bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#2B2B30] rounded-md hover:bg-gray-100 dark:hover:bg-[#2B2B30] transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      {folder.linkCount || 0} {(folder.linkCount || 0) === 1 ? 'link' : 'links'}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          
          {!isFoldersLoading && filteredFolders.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 dark:text-[#A1A1AA]">
              No folders found.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
      {folderToDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E21] max-w-sm w-full rounded-xl p-6 shadow-xl border border-gray-200 dark:border-[#2B2B30]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#EDEDED] mb-2">Delete Folder</h3>
            <p className="text-sm text-gray-500 dark:text-[#A1A1AA] mb-6">
              Are you sure you want to delete the "{folderToDelete.name}" folder? {folderToDelete.linkCount > 0 ? `This folder currently contains ${folderToDelete.linkCount} links. The folder will be deleted and the links will be moved out of it, but the links themselves will not be deleted.` : ''}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-100 dark:hover:bg-[#2B2B30] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteFolder(folderToDelete.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Delete Folder
              </button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FoldersPage;
