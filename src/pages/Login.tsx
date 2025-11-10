import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { LoginRequest, Department } from '../types';
import { departmentAPI } from '../services/api';
import { ArrowLeft, Shield, FileText, Users } from 'lucide-react';
import logoImage from '../assets/logo.jpg';
import Captcha from '../components/Captcha';

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedRole = searchParams.get('role') as 'ADMIN' | 'CLERK' | 'SECTION' | null;
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    role: selectedRole || 'ADMIN',
    department: ''
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDepartments();
    if (selectedRole) {
      setFormData(prev => ({ ...prev, role: selectedRole }));
    }
  }, [selectedRole]);

  const loadDepartments = async () => {
    try {
      const depts = await departmentAPI.getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaValid) {
      setError('Please complete the CAPTCHA verification');
      return;
    }
    
    setLoading(true);
    setError('');

    // Validate that SECTION role users must select a department
    if (formData.role === 'SECTION' && !formData.department) {
      setError('Please select a section');
      setLoading(false);
      return;
    }

    try {
      await login(formData);
      if (formData.role === 'ADMIN') {
        navigate('/admin');
      } else if (formData.role === 'CLERK') {
        navigate('/outward');
      } else if (formData.role === 'SECTION') {
        navigate('/upload');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getRoleInfo = () => {
    switch (formData.role) {
      case 'ADMIN':
        return {
          title: 'Administrator Login',
          description: 'System administration and user management',
          icon: <Shield className="h-8 w-8 text-blue-600" />,
          color: 'blue'
        };
      case 'CLERK':
        return {
          title: 'Outward Clerk Login',
          description: 'Send documents via WhatsApp messaging',
          icon: <Users className="h-8 w-8 text-blue-600" />,
          color: 'blue'
        };
      case 'SECTION':
        return {
          title: 'Section Clerk Login',
          description: 'Upload documents from section offices',
          icon: <FileText className="h-8 w-8 text-blue-600" />,
          color: 'blue'
        };
      default:
        return {
          title: 'Login',
          description: 'Access your account',
          icon: <Shield className="h-8 w-8 text-blue-600" />,
          color: 'blue'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Role Selection
            </button>
          </div>

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 mb-3">
              <img 
                src={logoImage} 
                alt="The Speed Tapalwala Logo" 
                className="h-full w-full object-contain rounded-lg"
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900">The Speed Tapalwala</h1>
            <p className="text-xs text-gray-600">e-Tapalwala</p>
          </div>

          {/* Role Info */}
          <div className="text-center mb-6 p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-center mb-2">
              {roleInfo.icon}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{roleInfo.title}</h2>
            <p className="text-xs text-gray-600">{roleInfo.description}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>


            {formData.role === 'SECTION' && (
              <div>
                <label htmlFor="department" className="block text-xs font-medium text-gray-700 mb-1">
                  Section
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select your section</option>
                  {departments.map((dept) => (
                    <option key={dept.code} value={dept.code}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CAPTCHA */}
            <Captcha 
              onVerify={setCaptchaValid}
              disabled={loading}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">The Speed Tapalwala - e-Tapalwala</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
