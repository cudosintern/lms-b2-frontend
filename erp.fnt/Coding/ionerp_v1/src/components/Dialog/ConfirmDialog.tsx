import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@headlessui/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1000] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
              />
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-2xl z-[1010]"
              >
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-sm font-bold text-white bg-[#d9534f] rounded-md hover:bg-[#c9302c] shadow-md transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="px-6 py-2 text-sm font-bold text-white bg-[#437880] rounded-md hover:bg-[#386269] shadow-md transition-all active:scale-95"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;