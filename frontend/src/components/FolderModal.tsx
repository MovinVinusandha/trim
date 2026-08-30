import React, { useState, useEffect } from 'react';
import { X, Folder as FolderIcon } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import type { Folder } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (folder: Folder) => void;
  folderToEdit?: Folder | null;
}

const FolderModal: React.FC<FolderModalProps> = ({ isOpen, onClose, onSuccess, folderToEdit }) => {
  const [name, setName] = useState(folderToEdit ? folderToEdit.name : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(folderToEdit ? folderToEdit.name : '');
      setError('');
    }
  }, [isOpen, folderToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    try {
      let response;
      if (folderToEdit) {
        response = await axiosInstance.put(`/folders/${folderToEdit.id}`, { name: name.trim() });
      } else {
        response = await axiosInstance.post('/folders', { name: name.trim() });
      }
      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('A folder with this name already exists.');
      } else {
        setError(err.response?.data?.message || 'Failed to save folder. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-border"
          >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-secondary z-10">
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 border border-primary/20">
                <FolderIcon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {folderToEdit ? 'Edit folder' : 'Create folder'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Organize your links into folders.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Folder Name</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors text-foreground placeholder:text-muted-foreground" 
                  placeholder="e.g. Marketing Campaigns" 
                />
              </div>

              {error && (
                <div className="text-sm text-rose-500 font-medium text-center">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading || name.trim() === ''}
                  className="btn-solid w-full text-center"
                >
                  {loading ? 'Saving...' : 'Save folder'}
                </button>
              </div>
            </div>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FolderModal;
