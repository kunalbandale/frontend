import React, { useState, useEffect } from 'react';
import type { Department, FileInfo } from '../types';
import { messageAPI } from '../services/api';
import { getCurrentDateTime } from '../utils/dateTime';
import { Upload, Send, Calendar, Clock, FileText } from 'lucide-react';
// import TimeClock from './TimeClock';

interface SingleMessageFormProps {
  departments: Department[];
  selectedDepartment: string;
  selectedPDF: FileInfo | null;
  onDepartmentChange: (department: string) => void;
  onPDFSelect: (pdfFile: FileInfo | null) => void;
  onRefresh?: () => void;
}

const SingleMessageForm: React.FC<SingleMessageFormProps> = ({
  departments,
  selectedDepartment,
  selectedPDF,
  onDepartmentChange,
  onPDFSelect,
  onRefresh
}) => {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    pdfFile: null as File | null,
    selectedPDF: null as FileInfo | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // const [processingStartTime, setProcessingStartTime] = useState<Date | null>(null);

  const { date, time } = getCurrentDateTime();

  // Sync selectedPDF prop with form state WITHOUT fetching from server
  // We only need the PDF id to send; show metadata immediately without any API call
  useEffect(() => {
    if (selectedPDF) {
      const rawDigitsFromName = (selectedPDF.name.match(/\d+/g) || []).join('');
      let prefillMobile = '';
      if (rawDigitsFromName.startsWith('91') && rawDigitsFromName.length >= 12) {
        prefillMobile = rawDigitsFromName.substring(0, 12);
      } else if (rawDigitsFromName.length >= 10) {
        prefillMobile = '91' + rawDigitsFromName.slice(-10);
      }

      setFormData(prev => ({
        ...prev,
        selectedPDF: selectedPDF,
        pdfFile: null,
        // Prefer the number inferred from the newly selected PDF; fall back to existing value
        mobileNumber: prefillMobile || prev.mobileNumber
      }));
    }
  }, [selectedPDF]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.mobileNumber || !selectedPDF) {
      setError('Please fill in all required fields and select a PDF');
      setLoading(false);
      return;
    }

    // setProcessingStartTime(new Date());

    try {
      // Format mobile number for WhatsApp (remove any non-digits and ensure it starts with country code)
      let formattedNumber = formData.mobileNumber.replace(/\D/g, ''); // Remove all non-digits
      if (formattedNumber.startsWith('91')) {
        // Already has country code
      } else if (formattedNumber.startsWith('0')) {
        // Remove leading 0 and add country code
        formattedNumber = '91' + formattedNumber.substring(1);
      } else {
        // Add country code for India
        formattedNumber = '91' + formattedNumber;
      }

      console.log('Sending database PDF to:', formattedNumber);

      // Prefer compiled backend route that supports sending by PDF ID via form-data
      const formPayload = new FormData();
      formPayload.append('mobileNumber', formattedNumber);
      formPayload.append('department', selectedDepartment);
      formPayload.append('pdfId', (selectedPDF as any).id);

      const response = await fetch('http://localhost:4000/send/clerk-send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formPayload
      });

      const text = await response.text();
      let result: any = {};
      try {
        result = JSON.parse(text);
      } catch {
        // Non-JSON error (e.g., HTML like "Cannot POST ...")
        if (!response.ok) {
          throw new Error(text || 'Failed to send PDF');
        }
      }

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to send PDF');
      }

      // Show success message after a brief delay
      setTimeout(() => {
        setSuccess('Message sent to WhatsApp servers! Delivery status will be updated when confirmed.');
        
        // Clear all form fields
        setFormData({
          mobileNumber: '',
          pdfFile: null,
          selectedPDF: null
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
      }, 1000);
      
    } catch (err: any) {
      console.error('Single document error:', err);
      let errorMessage = 'Failed to send message';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Clear form fields on failure
      setFormData({
        mobileNumber: '',
        pdfFile: null,
        selectedPDF: null
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const rawDigitsFromName = (file.name.match(/\d+/g) || []).join('');
      let prefillMobile = '';
      if (rawDigitsFromName.startsWith('91') && rawDigitsFromName.length >= 12) {
        prefillMobile = rawDigitsFromName.substring(0, 12);
      } else if (rawDigitsFromName.length >= 10) {
        prefillMobile = '91' + rawDigitsFromName.slice(-10);
      }
      setFormData(prev => ({
        ...prev,
        pdfFile: file,
        selectedPDF: {
          name: file.name,
          path: '',
          size: file.size,
          type: file.type
        },
        // Prefer the number inferred from the uploaded file; fall back to existing value
        mobileNumber: prefillMobile || prev.mobileNumber
      }));
    }
  };

  // const handlePDFSelect = (pdfFile: FileInfo) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     selectedPDF: pdfFile,
  //     pdfFile: null // Clear file input
  //   }));
  //   onPDFSelect(pdfFile);
  // };

  return (
    <div className="p-6">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Single WhatsApp Message</h2>
        <p className="text-gray-600">Send PDF document to individual recipient via WhatsApp</p>
      </div>

      {/* Time Clock - Show when processing */}
      {/* {processingStartTime && (
        <div className="mb-6">
          <TimeClock
            startTime={processingStartTime}
            totalItems={1}
            processedItems={1}
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

        {/* Mobile Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number (with country code) *
          </label>
          <input
            type="tel"
            value={formData.mobileNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
            placeholder="+91-XXXXXXXXXX"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
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

        {/* PDF Attachment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDF Attachment *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {formData.selectedPDF ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900">{formData.selectedPDF.name}</p>
                <p className="text-xs text-gray-500">
                  {(formData.selectedPDF.size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, selectedPDF: null }))}
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
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p>or drag and drop</p>
                </div>
              </div>
            )}
          </div>
        </div>

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
              <span className="text-xl mr-3">🎉</span>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.mobileNumber || !selectedPDF}
          className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
          ) : (
            <Send className="h-6 w-6 mr-3" />
          )}
          Send WhatsApp Message
        </button>
      </form>

      {/* Information Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              The PDF document will be sent via WhatsApp to the specified mobile number on the scheduled date and time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleMessageForm;
