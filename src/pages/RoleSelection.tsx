import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Users } from 'lucide-react';
import logoImage from '../assets/logo.jpg';

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'ADMIN' | 'CLERK' | 'SECTION') => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img src={logoImage} alt="E-Tapalwala Logo" className="h-20 w-20 rounded-lg shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-2">E-Tapalwala</h1>
          <p className="text-lg text-blue-700 mb-2">District Collector Office - Document Management System</p>
          <p className="text-sm text-blue-600">Government of India - District Collector Office</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Administrator Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <Shield className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-blue-900 mb-4">Administrator</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              System administration and user management
            </p>
            <button
              onClick={() => handleRoleSelect('ADMIN')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Login as Admin
            </button>
          </div>

          {/* Section Clerk Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <FileText className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-blue-900 mb-4">Section Clerk</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Upload documents from section offices
            </p>
            <button
              onClick={() => handleRoleSelect('SECTION')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Login as Section Clerk
            </button>
          </div>

          {/* Outward Clerk Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-blue-900 mb-4">Outward Clerk</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Send documents via WhatsApp messaging
            </p>
            <button
              onClick={() => handleRoleSelect('CLERK')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Login as Outward Clerk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
