import React, { useState, useEffect } from 'react';
import { FileText, Send, Upload } from 'lucide-react';

interface SectionPDF {
  id: string;
  name: string;
  originalName: string;
  size: number;
  department: string;
  uploadedAt: string;
  recipient: string;
}

interface SectionPDFSelectorProps {
  departments: Array<{ code: string; name: string }>;
  onSendPDF: (pdfName: string, department: string, mobileNumber: string) => void;
}

const SectionPDFSelector: React.FC<SectionPDFSelectorProps> = ({
  departments,
  onSendPDF
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [sectionPDFs, setSectionPDFs] = useState<SectionPDF[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<SectionPDF | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (selectedDepartment) {
      loadSectionPDFs();
    }
  }, [selectedDepartment]);

  const loadSectionPDFs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`http://localhost:4000/admin/sections/${selectedDepartment}/pdfs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const pdfs = await response.json();
        setSectionPDFs(pdfs);
      } else {
        setError('Failed to load section PDFs');
      }
    } catch (err) {
      setError('Failed to load section PDFs');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPDF = async () => {
    if (!selectedPDF || !mobileNumber) {
      setError('Please select a PDF and enter mobile number');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('mobileNumber', mobileNumber);
      formData.append('department', selectedDepartment);
      formData.append('pdfId', selectedPDF.id); // Send SectionPDF ID instead of filename

      const response = await fetch('http://localhost:4000/send/clerk-send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setSuccess('PDF sent successfully via WhatsApp!');
        setMobileNumber('');
        setSelectedPDF(null);
        // Reload PDFs to update the list
        loadSectionPDFs();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send PDF');
      }
    } catch (err) {
      setError('Failed to send PDF');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send PDF from Section</h2>
        <p className="text-gray-600">Select a section and PDF to send via WhatsApp</p>
      </div>

      {/* Department Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Section
        </label>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a section</option>
          {departments.map((dept) => (
            <option key={dept.code} value={dept.code}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recipient Mobile Number
        </label>
        <input
          type="tel"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder="+91-XXXXXXXXXX"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* PDF Selection */}
      {selectedDepartment && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available PDFs in {departments.find(d => d.code === selectedDepartment)?.name}
          </label>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading PDFs...</p>
            </div>
          ) : sectionPDFs.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No PDFs available in this section</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionPDFs.map((pdf) => (
                <div
                  key={pdf.id}
                  onClick={() => setSelectedPDF(pdf)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPDF?.id === pdf.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-red-500 mr-3" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pdf.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(pdf.size)} • {pdf.recipient}
                      </p>
                      <p className="text-xs text-gray-400">
                        Uploaded: {new Date(pdf.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Send Button */}
      {selectedPDF && mobileNumber && (
        <div className="flex justify-end">
          <button
            onClick={handleSendPDF}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : 'Send via WhatsApp'}
          </button>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
          {success}
        </div>
      )}
    </div>
  );
};

export default SectionPDFSelector;
