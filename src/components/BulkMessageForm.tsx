import React, { useState, useEffect } from 'react';
import type { Department, FileInfo } from '../types';
import { messageAPI } from '../services/api';
import { getCurrentDateTime } from '../utils/dateTime';
import { Upload, Send, Calendar, Clock, FileText } from 'lucide-react';
// import TimeClock from './TimeClock';
import { useErrorToast, useSuccessToast } from './Toast';
import { AppError, getErrorMessage } from '../utils/errorHandler';

interface BulkMessageFormProps {
  departments: Department[];
  selectedDepartment: string;
  selectedPDF: FileInfo | null;
  onDepartmentChange: (department: string) => void;
  onPDFSelect?: (pdfFile: FileInfo | null) => void;
  onRefresh?: () => void;
}

const BulkMessageForm: React.FC<BulkMessageFormProps> = ({
  departments,
  selectedDepartment,
  selectedPDF,
  onDepartmentChange,
  onPDFSelect,
  onRefresh
}) => {
  const [formData, setFormData] = useState({
    csvFile: null as File | null,
    pdfFiles: [] as File[],
    selectedPDFs: [] as FileInfo[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // const [processingStartTime, setProcessingStartTime] = useState<Date | null>(null);
  const [processingStats, setProcessingStats] = useState({
    totalItems: 0,
    processedItems: 0,
    successCount: 0,
    failedCount: 0
  });

  // Toast hooks
  const { showError } = useErrorToast();
  const { showSuccess } = useSuccessToast();

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  const { date, time } = getCurrentDateTime();

  // Sync selectedPDF prop with form state WITHOUT fetching from server
  // We'll send by pdfId; show metadata immediately without any API call
  useEffect(() => {
    if (selectedPDF) {
      setFormData(prev => ({
        ...prev,
        selectedPDFs: [selectedPDF],
        pdfFiles: []
      }));
    }
  }, [selectedPDF]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.csvFile || (formData.pdfFiles.length === 0 && formData.selectedPDFs.length === 0)) {
      setError('Please upload both CSV file and PDF files for bulk messaging');
      setLoading(false);
      return;
    }

    // setProcessingStartTime(new Date());
    
    // First, estimate total items from CSV file
    const csvText = await formData.csvFile.text();
    const estimatedTotal = csvText.split('\n').filter(line => line.trim()).length - 1; // Subtract header
    
    setProcessingStats({
      totalItems: estimatedTotal,
      processedItems: 0,
      successCount: 0,
      failedCount: 0
    });

    try {
      console.log('Sending bulk document with data:', {
        department: selectedDepartment,
        csvFile: formData.csvFile.name,
        pdfFiles: formData.pdfFiles.map(f => f.name),
        scheduledDate: date,
        scheduledTime: time
      });

      // Dynamic progress simulation - starts from 0 and goes to 100
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        // Calculate progress increment based on estimated total
        const increment = Math.max(1, Math.floor(estimatedTotal / 20)); // Divide into ~20 steps
        currentProgress += increment;
        
        // Ensure we don't exceed the total
        if (currentProgress > estimatedTotal) currentProgress = estimatedTotal;
        
        setProcessingStats(prev => ({
          ...prev,
          processedItems: currentProgress,
          successCount: Math.floor(currentProgress * 0.9), // Assume 90% success rate
          failedCount: Math.floor(currentProgress * 0.1) // Assume 10% failure rate
        }));
        
        // Stop the interval when we reach the total
        if (currentProgress >= estimatedTotal) {
          clearInterval(progressInterval);
        }
      }, 600); // Update every 600ms for smoother animation

      interface BulkMessageResult {
        message: string;
        stats: {
          totalNumbers: number;
          successCount: number;
          failedCount: number;
        };
      }
      
      let result: BulkMessageResult;
      
      if (formData.pdfFiles.length > 0) {
        // Use uploaded PDF files
        result = await messageAPI.sendBulkDocument({
          department: selectedDepartment,
          csvFile: formData.csvFile,
          pdfFiles: formData.pdfFiles,
          scheduledDate: date,
          scheduledTime: time
        });
      } else if (formData.selectedPDFs.length > 0) {
        // Use database PDF
        result = await messageAPI.sendBulkDatabasePDF({
          department: selectedDepartment,
          csvFile: formData.csvFile,
          pdfId: formData.selectedPDFs[0].id!,
          scheduledDate: date,
          scheduledTime: time
        });
      } else {
        setError('No PDF selected for bulk messaging');
        setLoading(false);
        return;
      }

      clearInterval(progressInterval);

      console.log('Bulk document sent successfully:', result);
      
      // Update final stats with real data
      setProcessingStats({
        totalItems: result.stats?.totalNumbers || estimatedTotal,
        processedItems: result.stats?.totalNumbers || estimatedTotal,
        successCount: result.stats?.successCount || 0,
        failedCount: result.stats?.failedCount || 0
      });

      // Show success message after a brief delay
      setTimeout(() => {
        if (result.message === 'Bulk messaging completed') {
          setSuccess(`🎉 Bulk WhatsApp messaging completed! Sent ${result.stats.successCount} messages successfully. ${result.stats.failedCount} failed.`);
        } else {
          setSuccess('🎉 Bulk WhatsApp messages sent successfully!');
        }
        
        setFormData({
          csvFile: null,
          pdfFiles: [],
          selectedPDFs: []
        });
        
        // Clear the selected PDF from parent component
        if (onPDFSelect) {
          onPDFSelect(null);
        }
        
        // Refresh pending files after successful send
        if (onRefresh) {
          onRefresh();
        }
        
        // setProcessingStartTime(null);
      }, 1500);
      
        } catch (err: any) {
          console.error('Bulk document error:', err);
          
          // Handle different types of errors
          let errorMessage = 'Failed to send bulk messages';
          
          if (err instanceof AppError) {
            errorMessage = getErrorMessage(err);
            showError(errorMessage, 'Bulk Message Failed');
          } else if (err.response?.data?.error) {
            if (typeof err.response.data.error === 'string') {
              errorMessage = err.response.data.error;
            } else if (typeof err.response.data.error === 'object') {
              errorMessage = JSON.stringify(err.response.data.error);
            }
            showError(errorMessage, 'Bulk Message Failed');
          } else if (err.message) {
            errorMessage = err.message;
            showError(errorMessage, 'Bulk Message Failed');
          } else {
            showError('An unexpected error occurred', 'Bulk Message Failed');
          }

          setError(errorMessage);

          // Clear form fields on failure
          setFormData({
            csvFile: null,
            pdfFiles: [],
            selectedPDFs: []
          });
          
          // Clear the selected PDF from parent component
          if (onPDFSelect) {
            onPDFSelect(null);
          }

          // setProcessingStartTime(null);
        } finally {
          setLoading(false);
        }
  };

  const handleCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, csvFile: file }));
    }
  };

  const handlePDFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      pdfFiles: [...prev.pdfFiles, ...files]
    }));
  };

  const removePDF = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pdfFiles: prev.pdfFiles.filter((_, i) => i !== index)
    }));
  };


  return (
    <div className="p-6">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Bulk WhatsApp Messages</h2>
        <p className="text-gray-600">Send PDF document to multiple recipients via WhatsApp</p>
      </div>

      {/* Time Clock - Show when processing */}
      {/* {processingStartTime && (
        <div className="mb-6">
          <TimeClock
            startTime={processingStartTime}
            totalItems={processingStats.totalItems}
            processedItems={processingStats.processedItems}
          />
        </div>
      )} */}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Department Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Section
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
            {departments.find(dept => dept.code === selectedDepartment)?.name} ({selectedDepartment})
          </div>
        </div>

        {/* CSV File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV File with Mobile Numbers *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {formData.csvFile ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900">{formData.csvFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(formData.csvFile.size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, csvFile: null }))}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div className="text-sm text-gray-600">
                  <label className="cursor-pointer">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload CSV file
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVChange}
                      className="hidden"
                    />
                  </label>
                  <p>or drag and drop</p>
                </div>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">CSV file should contain mobile numbers with country code</p>
        </div>

        {/* Scheduled Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={date}
              readOnly
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">Auto-populated with current date</p>
        </div>

        {/* Scheduled Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Time *
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={time}
              readOnly
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">Auto-populated with current time</p>
        </div>

        {/* PDF Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDF Attachment *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {formData.pdfFiles.length > 0 ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900">{formData.pdfFiles[0].name}</p>
                <p className="text-xs text-gray-500">
                  {(formData.pdfFiles[0].size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pdfFiles: [] }))}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : formData.selectedPDFs.length > 0 ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900">{formData.selectedPDFs[0].name}</p>
                <p className="text-xs text-gray-500">
                  {(formData.selectedPDFs[0].size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectedPDFs: [] }));
                    if (onPDFSelect) {
                      onPDFSelect(null);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div className="text-sm text-gray-600">
                  <label className="cursor-pointer">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload PDF file
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePDFChange}
                      className="hidden"
                    />
                  </label>
                  <p>or drag and drop</p>
                </div>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">PDF will be sent to all numbers in the CSV file</p>
        </div>

        {/* Selected PDF Files */}
        {formData.pdfFiles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected PDF Files
            </label>
            <div className="space-y-2">
              {formData.pdfFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm text-gray-900">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePDF(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm font-medium shadow-lg">
            <div className="flex items-center">
              <span className="text-xl mr-3">❌</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-xl text-sm font-medium shadow-lg">
            <div className="flex items-center">
              <span className="text-xl mr-3"></span>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.csvFile || (formData.pdfFiles.length === 0 && formData.selectedPDFs.length === 0)} 
          className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
          ) : (
            <Send className="h-6 w-6 mr-3" />
          )}
          Send Bulk WhatsApp Messages
        </button>
      </form>
    </div>
  );
};

export default BulkMessageForm;


