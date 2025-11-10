import React, { useState, useEffect } from 'react';
import type { User, Department } from '../../types';
import { adminAPI, departmentAPI } from '../../services/api';
import { Plus, Edit, Trash2, X, Shield, Users, FileText } from 'lucide-react';
import ConfirmationModal from '../ConfirmationModal';

const ClerkManagement: React.FC = () => {
  const [clerks, setClerks] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [editingClerk, setEditingClerk] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSection, setSelectedSection] = useState<Department | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'update';
    user?: User;
    section?: Department;
    callback: () => void;
  } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'CLERK' as 'ADMIN' | 'CLERK' | 'SECTION',
    department: '',
    fullName: '',
    username: ''
  });
  const [sectionFormData, setSectionFormData] = useState({
    name: ''
  });

  useEffect(() => {
    loadClerks();
    loadDepartments();
    loadSections();
  }, []);

  const loadDepartments = async () => {
    try {
      const depts = await departmentAPI.getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadSections = async () => {
    try {
      const sections = await adminAPI.getSections();
      setSections(sections);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  const loadClerks = async (page: number = pagination.page) => {
    try {
      setLoading(true);
      const users = await adminAPI.getUsers();
      setClerks(users);
      
      // Calculate pagination info
      const total = users.length;
      const pages = Math.ceil(total / pagination.limit);
      setPagination(prev => ({
        ...prev,
        page,
        total,
        pages
      }));
    } catch (error) {
      console.error('Failed to load clerks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadClerks(newPage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClerk) {
        // Show confirmation modal for updates
        setConfirmAction({
          type: 'update',
          user: editingClerk,
          callback: async () => {
            try {
              interface UpdateUserData {
                email: string;
                password?: string;
                role: 'ADMIN' | 'CLERK' | 'SECTION';
                department: string;
                fullName: string;
                username: string;
              }
              // If editing, only include password if it's not empty
              const updateData: UpdateUserData = {
                ...formData,
                password: formData.password.trim() || undefined
              };
              await adminAPI.updateUser(editingClerk._id, updateData);
              await loadClerks();
              setShowAddModal(false);
              setEditingClerk(null);
              setFormData({ email: '', password: '', role: 'CLERK' as 'ADMIN' | 'CLERK' | 'SECTION', department: '', fullName: '', username: '' });
              setShowConfirmModal(false);
              setConfirmAction(null);
              setSuccessMessage('User updated successfully!');
              setTimeout(() => setSuccessMessage(''), 3000);
            } catch (error) {
              console.error('Failed to update user:', error);
            }
          }
        });
        setShowConfirmModal(true);
      } else {
        await adminAPI.createUser(formData);
        await loadClerks();
        setShowAddModal(false);
        setFormData({ email: '', password: '', role: 'CLERK' as 'ADMIN' | 'CLERK' | 'SECTION', department: '', fullName: '', username: '' });
        setSuccessMessage('User created successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate a simple code from the name (first 3 letters + random number)
      const code = sectionFormData.name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);
      await adminAPI.createSection({ 
        name: sectionFormData.name, 
        code: code,
        description: sectionFormData.name + ' Section'
      });
      await loadSections();
      setShowAddSectionModal(false);
      setSectionFormData({ name: '' });
      setSuccessMessage('Section added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const user = clerks.find(c => c._id === id);
    if (user) {
      setConfirmAction({
        type: 'delete',
        user,
        callback: async () => {
          try {
            await adminAPI.deleteUser(id);
            await loadClerks();
            setShowConfirmModal(false);
            setConfirmAction(null);
            setSuccessMessage('User deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
          } catch (error) {
            console.error('Failed to delete clerk:', error);
          }
        }
      });
      setShowConfirmModal(true);
    }
  };

  const confirmDeleteSection = async () => {
    if (selectedSection) {
      setConfirmAction({
        type: 'delete',
        section: selectedSection,
        callback: async () => {
          try {
            await adminAPI.deleteSection(selectedSection._id);
            await loadSections();
            setShowDeleteSectionModal(false);
            setSelectedSection(null);
            setShowConfirmModal(false);
            setConfirmAction(null);
            setSuccessMessage('Section deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
          } catch (error) {
            console.error('Failed to delete section:', error);
          }
        }
      });
      setShowConfirmModal(true);
    }
  };

  const handleEdit = (clerk: User) => {
    setEditingClerk(clerk);
    setFormData({
      email: clerk.email,
      password: '', // Start with empty password field
      role: clerk.role,
      department: clerk.department || '',
      fullName: clerk.fullName || '',
      username: clerk.username || ''
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingClerk(null);
    setFormData({ email: '', password: '', role: 'CLERK' as 'ADMIN' | 'CLERK' | 'SECTION', department: '', fullName: '', username: '' });
  };

  const handleCloseSectionModal = () => {
    setShowAddSectionModal(false);
    setSectionFormData({ name: '' });
  };

  const handleCloseDeleteSectionModal = () => {
    setShowDeleteSectionModal(false);
    setSelectedSection(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4" />;
      case 'CLERK':
        return <Users className="h-4 w-4" />;
      case 'SECTION':
        return <FileText className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'CLERK':
        return 'bg-blue-100 text-blue-800';
      case 'SECTION':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
          <p className="text-gray-600">Create, modify, and delete user accounts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddSectionModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Section
          </button>
          <button
            onClick={() => setShowDeleteSectionModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Delete Section
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Clerks Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : clerks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                clerks.map((clerk) => (
                  <tr key={clerk._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {clerk.fullName || clerk.email.split('@')[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {clerk.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {clerk.username || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(clerk.role)}`}>
                        {getRoleIcon(clerk.role)}
                        <span className="ml-1">{clerk.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {clerk.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(clerk.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {clerk.lastLogin ? new Date(clerk.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(clerk)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(clerk._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="mt-6 bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Next
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingClerk ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@gov.in"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                    {editingClerk && (
                      <span className="text-xs text-green-600 ml-2">✓ Current password is set</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editingClerk ? "Enter new password (or leave blank to keep current)" : "Enter password"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required={!editingClerk}
                  />
                  {editingClerk && (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave this field empty to keep the current password unchanged
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'CLERK' | 'SECTION', department: e.target.value === 'SECTION' ? prev.department : '' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ADMIN">Admin (Full Access)</option>
                    <option value="CLERK">Outward Clerk</option>
                    <option value="SECTION">Section Clerk</option>
                  </select>
                </div>
                {formData.role === 'SECTION' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Section</option>
                      {sections.map((section) => (
                        <option key={section.code} value={section.code}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editingClerk ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add New Section
                </h3>
                <button
                  onClick={handleCloseSectionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Add a new section to the system</p>
              <form onSubmit={handleSectionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Name
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.name}
                    onChange={(e) => setSectionFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter section name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCloseSectionModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Section
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Section Modal */}
      {showDeleteSectionModal && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Section
                </h3>
                <button
                  onClick={handleCloseDeleteSectionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Select a section to delete from the system</p>
              <form onSubmit={(e) => { e.preventDefault(); confirmDeleteSection(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Section
                  </label>
                  <select
                    value={selectedSection?._id || ''}
                    onChange={(e) => {
                      const section = sections.find(s => s._id === e.target.value);
                      setSelectedSection(section || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a section to delete</option>
                    {sections.map((section) => (
                      <option key={section._id} value={section._id}>
                        {section.name} ({section.code})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSection && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">
                      <strong>Warning:</strong> You are about to delete "{selectedSection.name}". This action cannot be undone.
                    </p>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCloseDeleteSectionModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedSection}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Section
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
          onConfirm={confirmAction.callback}
          title={confirmAction.type === 'delete' ? 'Confirm Delete' : 'Confirm Update'}
          message={
            confirmAction.type === 'delete'
              ? confirmAction.user
                ? `Are you sure you want to delete user "${confirmAction.user.email}"? This action cannot be undone.`
                : confirmAction.section
                ? `Are you sure you want to delete section "${confirmAction.section.name}"? This action cannot be undone.`
                : 'Are you sure you want to delete this item?'
              : confirmAction.user
              ? `Are you sure you want to update user "${confirmAction.user.email}"?`
              : 'Are you sure you want to update this item?'
          }
          confirmText={confirmAction.type === 'delete' ? 'Delete' : 'Update'}
          type={confirmAction.type}
        />
      )}
    </div>
  );
};

export default ClerkManagement;

