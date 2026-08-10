import React, { useState } from 'react';
import ModalContainer from "../../../../components/Modal/ModalContainer";
import UIButton from '../../../../components/FormBuilder/fields/Button';
import { timetableApi } from "../../timetableCalendar/timetableApi";

interface DeleteTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  semTimeTableId?: number;
  onDeleteComplete?: (success: boolean, message?: string) => void;
}

const DeleteTimetableModal: React.FC<DeleteTimetableModalProps> = ({
  isOpen,
  onClose,
  semTimeTableId,
  onDeleteComplete
}) => {
  const [deleteOption, setDeleteOption] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (deleteOption === 'range') {
      if (!startDate) {
        newErrors.startDate = 'Start date is required';
      }
      if (!endDate) {
        newErrors.endDate = 'End date is required';
      }
      if (startDate && endDate && startDate > endDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    if (!confirmText || confirmText !== 'DELETE') {
      newErrors.confirmText = 'Please type DELETE to confirm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        let response;
        
        if (deleteOption === 'all') {
          if (!semTimeTableId) {
            setErrors({ general: 'Timetable ID is required for delete operation' });
            return;
          }
          response = await timetableApi.deleteTimetable(semTimeTableId);
        } else if (deleteOption === 'range') {
          if (!semTimeTableId) {
            setErrors({ general: 'Timetable ID is required for date range deletion' });
            return;
          }
          // For date range deletion, we need to delete scheduled classes in the range
          // First get all scheduled classes, then delete those in the range
          const classesResponse = await timetableApi.getScheduledClasses({
            startDate,
            endDate,
          });
          
          if (classesResponse.success && Array.isArray(classesResponse.data)) {
            // Delete each class in the range
            const deletePromises = classesResponse.data
              .filter((classItem: any) => classItem.id)
              .map((classItem: any) => timetableApi.deleteScheduledClass(classItem.id));
            
            await Promise.all(deletePromises);
            response = { success: true, message: `Deleted ${deletePromises.length} classes in the specified date range` };
          } else {
            response = { success: false, message: 'Failed to fetch scheduled classes for deletion' };
          }
        }
        
        if (response?.success) {
          handleClose();
          onDeleteComplete?.(true, response.message);
        } else {
          onDeleteComplete?.(false, response?.message || 'Delete operation failed');
        }
      } catch (error) {
        onDeleteComplete?.(false, 'An unexpected error occurred during deletion');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setDeleteOption('all');
    setStartDate('');
    setEndDate('');
    setConfirmText('');
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={handleClose} title="Delete Timetable" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delete Option
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="all"
                checked={deleteOption === 'all'}
                onChange={(e) => setDeleteOption(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Delete all timetable data</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="range"
                checked={deleteOption === 'range'}
                onChange={(e) => setDeleteOption(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Delete data for specific date range</span>
            </label>
          </div>
        </div>

        {deleteOption === 'range' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            ⚠️ Danger Zone!
          </h4>
          <p className="text-sm text-red-700 mb-3">
            This action will permanently delete all scheduled classes and cannot be undone.
            {deleteOption === 'range' ? ' All classes in the selected date range will be removed.' : ' All timetable data will be removed.'}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono bg-gray-100 px-1">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmText ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.confirmText && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmText}</p>
            )}
          </div>
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
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Timetable'}
          </UIButton>
        </div>
      </form>
    </ModalContainer>
  );
};

export default DeleteTimetableModal;
