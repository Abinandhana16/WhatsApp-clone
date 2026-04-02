import React from 'react';
import { X, Trash2 } from 'lucide-react';

const DeleteModal = ({ isOpen, onClose, onDeleteMe, onDeleteEveryone, canDeleteForEveryone, count }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in text-gray-800">
      <div className="bg-white dark:bg-[#202c33] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up border dark:border-white/5">
        <div className="p-6">
          <h2 className="text-xl font-medium mb-4 dark:text-wa-text-primary-dark">
            {count > 1 ? `Delete ${count} messages?` : 'Delete message?'}
          </h2>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-5 h-5 rounded border border-wa-green bg-wa-green flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 dark:text-wa-text-secondary-dark font-medium">Delete file from your phone</span>
          </div>

          <div className="flex flex-col gap-2 items-end">
            {canDeleteForEveryone && (
              <button 
                onClick={onDeleteEveryone}
                className="px-6 py-2 rounded-full text-wa-green hover:bg-wa-teal/5 transition-all font-medium text-sm border border-transparent hover:border-wa-teal/10"
              >
                Delete for everyone
              </button>
            )}
            <button 
              onClick={onDeleteMe}
              className="px-6 py-2 rounded-full text-wa-green hover:bg-wa-teal/5 transition-all font-medium text-sm border border-transparent hover:border-wa-teal/10"
            >
              Delete for me
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-full text-wa-green hover:bg-wa-teal/5 transition-all font-medium text-sm border border-transparent hover:border-wa-teal/10"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
