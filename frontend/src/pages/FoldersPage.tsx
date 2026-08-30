import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Trash2, Link as LinkIcon, Folder as FolderIcon, Pen, BarChart2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import type { DashboardLayoutContext } from '../layouts/DashboardLayout';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const FoldersPage: React.FC = () => {
  const { folders, setFolders, setActiveFolderId, setFolderToEdit, setIsFolderModalOpen, isFoldersLoading } = useOutletContext<DashboardLayoutContext>();
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 py-4 w-full">
      <div className="space-y-6">
        
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search folders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {isFoldersLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-background border border-border rounded-xl p-4 h-32 flex flex-col justify-between">
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
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ duration: 0.15 }} 
                  key={folder.id} 
                  onClick={() => handleFolderClick(folder)} 
                  className="bg-background border border-border rounded-xl p-4 transition-all group relative cursor-pointer hover:border-border/90 hover:bg-neutral-100/70 dark:hover:bg-[#111114]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDefault ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        <FolderIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground text-sm line-clamp-1">{folder.name}</h3>
                          {isDefault && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-primary/10 text-primary rounded">
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
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      <AnimatePresence>
                      {openMenuId === folder.id && (
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
                                  setActiveFolderId(folder.id);
                                  navigate(`/analytics/f/${slug}`);
                                }}
                                className="w-full flex items-center px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <BarChart2 className="w-4 h-4 text-muted-foreground" />
                                  <span>Analytics</span>
                                </div>
                              </button>
                              {!isDefault && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setFolderToEdit(folder);
                                    setIsFolderModalOpen(true);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Pen className="w-4 h-4 text-muted-foreground" />
                                    <span>Edit</span>
                                  </div>
                                </button>
                              )}
                            </div>
                            {!isDefault && (
                              <div className="pt-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setFolderToDelete(folder);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                    <span>Delete</span>
                                  </div>
                                </button>
                              </div>
                            )}
                          </motion.div>
                        </>
                      )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground bg-secondary/50 border border-border rounded-md hover:bg-secondary transition-colors"
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
            <div className="col-span-full py-12 text-center text-muted-foreground text-sm">
              No folders found.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
      {folderToDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Folder</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete the "{folderToDelete.name}" folder? {folderToDelete.linkCount > 0 ? `This folder currently contains ${folderToDelete.linkCount} links. The folder will be deleted and the links will be moved out of it, but the links themselves will not be deleted.` : ''}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteFolder(folderToDelete.id)}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm focus:outline-none"
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
