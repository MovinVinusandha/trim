import React, { useState, useEffect } from 'react';
import { X, Infinity as InfinityIcon } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import type { Tag } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTag: Tag) => void;
  tagToEdit?: any | null;
}

const TAG_COLORS = [
  { name: 'red', classes: 'bg-red-100 text-red-700 border-red-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30', ringClass: 'peer-checked:ring-rose-500 dark:peer-checked:ring-rose-400' },
  { name: 'blue', classes: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30', ringClass: 'peer-checked:ring-blue-500 dark:peer-checked:ring-blue-400' },
  { name: 'green', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30', ringClass: 'peer-checked:ring-emerald-500 dark:peer-checked:ring-emerald-400' },
  { name: 'purple', classes: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30', ringClass: 'peer-checked:ring-violet-500 dark:peer-checked:ring-violet-400' },
  { name: 'orange', classes: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30', ringClass: 'peer-checked:ring-amber-500 dark:peer-checked:ring-amber-400' },
  { name: 'brown', classes: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30', ringClass: 'peer-checked:ring-yellow-500 dark:peer-checked:ring-yellow-400' },
  { name: 'gray', classes: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-500/15 dark:text-zinc-300 dark:border-zinc-500/30', ringClass: 'peer-checked:ring-zinc-400 dark:peer-checked:ring-zinc-400' }
];

const CreateTagModal: React.FC<CreateTagModalProps> = ({ isOpen, onClose, onSuccess, tagToEdit }) => {
  const [name, setName] = useState(tagToEdit ? tagToEdit.name : '');
  const [color, setColor] = useState(tagToEdit ? tagToEdit.color : 'purple');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(tagToEdit ? tagToEdit.name : '');
      setColor(tagToEdit ? tagToEdit.color : 'purple');
      setError('');
    }
  }, [isOpen, tagToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    try {
      let response;
      if (tagToEdit) {
        response = await axiosInstance.put('/tags/' + tagToEdit.id, { name: name.trim(), color });
      } else {
        response = await axiosInstance.post('/tags', { name: name.trim(), color });
      }
      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('A tag with this name already exists.');
      } else {
        setError(err.response?.data?.message || 'Failed to create tag. Please try again.');
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
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-border"
          >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-secondary z-10">
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 border border-primary/20">
                <InfinityIcon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1">{tagToEdit ? 'Edit tag' : 'Create tag'}</h2>
              <p className="text-sm text-muted-foreground">
                Use tags to organize your links.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Tag Name</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors text-foreground placeholder:text-muted-foreground" 
                  placeholder="e.g. Marketing" 
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Color</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map(c => (
                    <label key={c.name} className="cursor-pointer">
                      <input 
                        type="radio" 
                        name="tag-color" 
                        value={c.name} 
                        checked={color === c.name} 
                        onChange={() => setColor(c.name)} 
                        className="sr-only peer" 
                      />
                      <div className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-offset-background ${c.ringClass} ${c.classes}`}>
                        {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                      </div>
                    </label>
                  ))}
                </div>
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
                  {loading ? (tagToEdit ? 'Saving...' : 'Creating...') : (tagToEdit ? 'Save changes' : 'Create tag')}
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

export default CreateTagModal;
