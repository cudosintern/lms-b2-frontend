import React, { useState, useEffect } from 'react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import UIButton from '../../../../components/FormBuilder/fields/Button';
import { timetableApi } from '../timetableApi';
import { toast } from 'react-toastify';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Calendar,
  Clock,
  Users,
  FileText,
  TrendingUp
} from 'lucide-react';

interface VerificationResult {
  operation: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

interface OperationVerifierProps {
  isOpen: boolean;
  onClose: () => void;
  operation: 'copy-day' | 'delete-timetable' | 'reset-dates' | 'schedule-class';
  operationData?: any;
  onVerificationComplete?: (result: VerificationResult) => void;
}

const OperationVerifier: React.FC<OperationVerifierProps> = ({
  isOpen,
  onClose,
  operation,
  operationData,
  onVerificationComplete
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [beforeData, setBeforeData] = useState<any>(null);
  const [afterData, setAfterData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      performVerification();
    }
  }, [isOpen, operation, operationData]);

  const performVerification = async () => {
    setIsVerifying(true);
    setVerificationResults([]);
    
    try {
      // Capture before state
      const beforeSnapshot = await captureDataSnapshot();
      setBeforeData(beforeSnapshot);

      // Wait a moment for operation to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Capture after state
      const afterSnapshot = await captureDataSnapshot();
      setAfterData(afterSnapshot);

      // Perform verification based on operation type
      const results = await verifyOperation(beforeSnapshot, afterSnapshot);
      setVerificationResults(results);

      // Determine overall status
      const hasErrors = results.some(r => r.status === 'error');
      const overallResult: VerificationResult = {
        operation,
        status: hasErrors ? 'error' : 'success',
        message: hasErrors ? 'Verification completed with errors' : 'Verification completed successfully',
        details: results,
        timestamp: new Date().toISOString()
      };

      onVerificationComplete?.(overallResult);
    } catch (error) {
      const errorResult: VerificationResult = {
        operation,
        status: 'error',
        message: 'Verification failed: ' + (error as Error).message,
        timestamp: new Date().toISOString()
      };
      setVerificationResults([errorResult]);
      onVerificationComplete?.(errorResult);
    } finally {
      setIsVerifying(false);
    }
  };

  const captureDataSnapshot = async () => {
    try {
      // Get current scheduled classes
      const classesResponse = await timetableApi.getScheduledClasses();
      const scheduledClasses = classesResponse.success ? classesResponse.data : [];

      // Get timetables if applicable
      const timetablesResponse = await timetableApi.getTimetables();
      const timetables = timetablesResponse.success ? timetablesResponse.data : [];

      return {
        scheduledClasses,
        timetables,
        timestamp: new Date().toISOString(),
        totalClasses: Array.isArray(scheduledClasses) ? scheduledClasses.length : 0,
        totalTimetables: Array.isArray(timetables) ? timetables.length : 0
      };
    } catch (error) {
      console.error('Failed to capture data snapshot:', error);
      return {
        scheduledClasses: [],
        timetables: [],
        timestamp: new Date().toISOString(),
        totalClasses: 0,
        totalTimetables: 0
      };
    }
  };

  const verifyOperation = async (before: any, after: any): Promise<VerificationResult[]> => {
    const results: VerificationResult[] = [];

    switch (operation) {
      case 'copy-day':
        results.push(...verifyCopyDayOperation(before, after, operationData));
        break;
      case 'delete-timetable':
        results.push(...verifyDeleteTimetableOperation(before, after, operationData));
        break;
      case 'reset-dates':
        results.push(...verifyResetDatesOperation(before, after, operationData));
        break;
      case 'schedule-class':
        results.push(...verifyScheduleClassOperation(before, after, operationData));
        break;
    }

    return results;
  };

  const verifyCopyDayOperation = (before: any, after: any, data: any): VerificationResult[] => {
    const results: VerificationResult[] = [];
    
    if (!data?.targetDate || !data?.sourceDate) {
      results.push({
        operation: 'copy-day',
        status: 'error',
        message: 'Copy day operation missing required date information',
        timestamp: new Date().toISOString()
      });
      return results;
    }

    const targetDate = data.targetDate;
    const classesOnTargetDate = after.scheduledClasses?.filter((cls: any) => 
      cls.date && cls.date.includes(targetDate)
    ) || [];

    if (classesOnTargetDate.length === 0) {
      results.push({
        operation: 'copy-day',
        status: 'warning',
        message: `No classes found on target date ${targetDate}`,
        timestamp: new Date().toISOString()
      });
    } else {
      results.push({
        operation: 'copy-day',
        status: 'success',
        message: `Successfully copied ${classesOnTargetDate.length} classes to ${targetDate}`,
        details: { copiedClasses: classesOnTargetDate.length, targetDate },
        timestamp: new Date().toISOString()
      });
    }

    // Verify no duplicate classes were created
    const sourceDate = data.sourceDate;
    const classesOnSourceDate = before.scheduledClasses?.filter((cls: any) => 
      cls.date && cls.date.includes(sourceDate)
    ) || [];

    if (classesOnTargetDate.length > classesOnSourceDate.length * 1.1) { // Allow 10% tolerance
      results.push({
        operation: 'copy-day',
        status: 'warning',
        message: 'More classes were created than expected. Possible duplicates detected.',
        details: { 
          sourceCount: classesOnSourceDate.length, 
          targetCount: classesOnTargetDate.length 
        },
        timestamp: new Date().toISOString()
      });
    }

    return results;
  };

  const verifyDeleteTimetableOperation = (before: any, after: any, data: any): VerificationResult[] => {
    const results: VerificationResult[] = [];
    
    const timetableId = data?.semTimeTableId;
    if (!timetableId) {
      results.push({
        operation: 'delete-timetable',
        status: 'error',
        message: 'Delete timetable operation missing timetable ID',
        timestamp: new Date().toISOString()
      });
      return results;
    }

    const timetableCountDiff = before.totalTimetables - after.totalTimetables;
    
    if (timetableCountDiff === 0) {
      results.push({
        operation: 'delete-timetable',
        status: 'warning',
        message: 'No timetables were deleted',
        timestamp: new Date().toISOString()
      });
    } else if (timetableCountDiff > 0) {
      results.push({
        operation: 'delete-timetable',
        status: 'success',
        message: `Successfully deleted ${timetableCountDiff} timetable(s)`,
        details: { deletedCount: timetableCountDiff },
        timestamp: new Date().toISOString()
      });
    }

    // Verify related classes were also deleted
    const classesCountDiff = before.totalClasses - after.totalClasses;
    if (data.deleteOption === 'all' && classesCountDiff === 0) {
      results.push({
        operation: 'delete-timetable',
        status: 'warning',
        message: 'Timetable deleted but no classes were removed',
        timestamp: new Date().toISOString()
      });
    }

    return results;
  };

  const verifyResetDatesOperation = (before: any, after: any, data: any): VerificationResult[] => {
    const results: VerificationResult[] = [];
    
    const timetableId = data?.semTimeTableId;
    if (!timetableId) {
      results.push({
        operation: 'reset-dates',
        status: 'error',
        message: 'Reset dates operation missing timetable ID',
        timestamp: new Date().toISOString()
      });
      return results;
    }

    // Compare class dates before and after
    const beforeClasses = before.scheduledClasses || [];
    const afterClasses = after.scheduledClasses || [];
    
    // Check if dates were actually reset
    let dateChanges = 0;
    beforeClasses.forEach((beforeClass: any) => {
      const afterClass = afterClasses.find((ac: any) => ac.id === beforeClass.id);
      if (afterClass && afterClass.date !== beforeClass.date) {
        dateChanges++;
      }
    });

    if (dateChanges === 0) {
      results.push({
        operation: 'reset-dates',
        status: 'warning',
        message: 'No date changes detected after reset operation',
        timestamp: new Date().toISOString()
      });
    } else {
      results.push({
        operation: 'reset-dates',
        status: 'success',
        message: `Successfully reset dates for ${dateChanges} classes`,
        details: { updatedClasses: dateChanges },
        timestamp: new Date().toISOString()
      });
    }

    return results;
  };

  const verifyScheduleClassOperation = (before: any, after: any, data: any): VerificationResult[] => {
    const results: VerificationResult[] = [];
    
    if (!data?.courseId || !data?.classDate) {
      results.push({
        operation: 'schedule-class',
        status: 'error',
        message: 'Schedule class operation missing required information',
        timestamp: new Date().toISOString()
      });
      return results;
    }

    const classCountDiff = after.totalClasses - before.totalClasses;
    
    if (classCountDiff === 0) {
      results.push({
        operation: 'schedule-class',
        status: 'error',
        message: 'No new class was created',
        timestamp: new Date().toISOString()
      });
    } else if (classCountDiff === 1) {
      results.push({
        operation: 'schedule-class',
        status: 'success',
        message: 'Class scheduled successfully',
        details: { classData: data },
        timestamp: new Date().toISOString()
      });
    } else if (classCountDiff > 1) {
      results.push({
        operation: 'schedule-class',
        status: 'warning',
        message: `Multiple classes created (${classCountDiff}). Expected only 1.`,
        timestamp: new Date().toISOString()
      });
    }

    // Check for scheduling conflicts
    const newClass = after.scheduledClasses?.find((cls: any) => 
      !before.scheduledClasses?.some((bc: any) => bc.id === cls.id)
    );

    if (newClass) {
      const conflicts = after.scheduledClasses?.filter((cls: any) => 
        cls.id !== newClass.id &&
        cls.date === newClass.date &&
        cls.startTime === newClass.startTime
      ) || [];

      if (conflicts.length > 0) {
        results.push({
          operation: 'schedule-class',
          status: 'warning',
          message: 'Scheduling conflict detected',
          details: { conflicts: conflicts.length },
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  };

  const getStatusIcon = (status: VerificationResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: VerificationResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getOperationTitle = () => {
    switch (operation) {
      case 'copy-day':
        return 'Copy Day Verification';
      case 'delete-timetable':
        return 'Delete Timetable Verification';
      case 'reset-dates':
        return 'Reset Dates Verification';
      case 'schedule-class':
        return 'Schedule Class Verification';
      default:
        return 'Operation Verification';
    }
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title={getOperationTitle()} size="lg">
      <div className="space-y-6">
        {/* Verification Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isVerifying ? (
              <>
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mr-2" />
                <span className="text-sm font-medium text-gray-700">Verifying operation...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Verification complete</span>
              </>
            )}
          </div>
          
          <UIButton
            onClick={performVerification}
            disabled={isVerifying}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Re-verify
          </UIButton>
        </div>

        {/* Data Comparison */}
        {beforeData && afterData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Before Operation
              </h4>
              <div className="space-y-1 text-sm">
                <p>Total Classes: {beforeData.totalClasses}</p>
                <p>Total Timetables: {beforeData.totalTimetables}</p>
                <p className="text-xs text-gray-600">
                  {new Date(beforeData.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                After Operation
              </h4>
              <div className="space-y-1 text-sm">
                <p>Total Classes: {afterData.totalClasses}</p>
                <p>Total Timetables: {afterData.totalTimetables}</p>
                <p className="text-xs text-gray-600">
                  {new Date(afterData.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Results */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Verification Results</h4>
          
          {verificationResults.length === 0 && !isVerifying ? (
            <div className="text-center py-4 text-gray-600">
              No verification results available
            </div>
          ) : (
            <div className="space-y-2">
              {verificationResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer underline">
                            View details
                          </summary>
                          <pre className="text-xs mt-2 bg-white p-2 rounded border">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {verificationResults.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {verificationResults.filter(r => r.status === 'success').length} successful, 
                {verificationResults.filter(r => r.status === 'warning').length} warnings, 
                {verificationResults.filter(r => r.status === 'error').length} errors
              </div>
              
              <div className="flex space-x-3">
                <UIButton
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Close
                </UIButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalContainer>
  );
};

export default OperationVerifier;
