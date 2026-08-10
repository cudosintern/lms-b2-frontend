import React, { useState } from 'react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import UIButton from '../../../../components/FormBuilder/fields/Button';
import { timetableApi, CopyDayRequest } from '../timetableApi';

interface CopyClassDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculumId?: number;
  termId?: number;
  sectionId?: number;
  onCopyComplete?: (success: boolean, message?: string) => void;
}

const CopyClassDayModal: React.FC<CopyClassDayModalProps> = ({
  isOpen,
  onClose,
  curriculumId,
  termId,
  sectionId,
  onCopyComplete
}) => {
  const [sourceDate, setSourceDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!sourceDate) {
      newErrors.sourceDate = 'Source date is required';
    }
    if (!targetDate) {
      newErrors.targetDate = 'Target date is required';
    }
    if (sourceDate && targetDate && sourceDate === targetDate) {
      newErrors.targetDate = 'Target date must be different from source date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        const request: CopyDayRequest = {
          sourceDate,
          targetDate,
          curriculumId,
          termId,
          sectionId
        };
        
        const response = await timetableApi.copyDay(request);
        
        if (response.success) {
          handleClose();
          onCopyComplete?.(true, response.message);
        } else {
          onCopyComplete?.(false, response.message);
        }
      } catch (error) {
        onCopyComplete?.(false, 'An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setSourceDate('');
    setTargetDate('');
    setErrors({});
    onClose();
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={handleClose} title="Copy Class Day" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Date
          </label>
          <input
            type="date"
            value={sourceDate}
            onChange={(e) => setSourceDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.sourceDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.sourceDate && (
            <p className="mt-1 text-sm text-red-600">{errors.sourceDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Date
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.targetDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.targetDate && (
            <p className="mt-1 text-sm text-red-600">{errors.targetDate}</p>
          )}
        </div>

        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This will copy all scheduled classes from the source date to the target date.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <UIButton
            type="button"
            onClick={handleClose}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            Cancel
          </UIButton>
          <UIButton
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Copying...' : 'Copy Classes'}
          </UIButton>
        </div>
      </form>
    </ModalContainer>
  );
};

export default CopyClassDayModal;
