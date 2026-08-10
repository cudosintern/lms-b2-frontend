import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import FixedAddQuizPage from './FixedAddQuizPage';

interface AddQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  academicBatchId: number;
  semesterId: number;
  courseId: number;
}

const AddQuizModal: React.FC<AddQuizModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  academicBatchId,
  semesterId,
  courseId
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl m-4" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white z-10 border-b flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Quiz</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold p-1 rounded hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>
        <FixedAddQuizPage 
          initialBatchId={academicBatchId}
          initialSemesterId={semesterId}
          initialCourseId={courseId}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </div>
    </div>,
    document.body
  );
};

export default AddQuizModal;