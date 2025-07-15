import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Mail, Calendar, Settings, Home, Bell, Search } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.header
        className="bg-white shadow-sm border-b border-gray-200"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </motion.div>

            <div className="flex items-center space-x-4">
              <motion.button
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Bell className="w-6 h-6" />
              </motion.button>
              <motion.button
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Search className="w-6 h-6" />
              </motion.button>
              <motion.button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Sidebar */}
          <motion.div
            className="lg:col-span-1"
            variants={itemVariants}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-lg p-6"
              variants={cardVariants}
            >
              <div className="text-center mb-6">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <User className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentUser?.displayName || 'User'}
                </h2>
                <p className="text-gray-500 text-sm">{currentUser?.email}</p>
              </div>

              <div className="space-y-4">
                <motion.button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Home className="w-5 h-5" />
                  <span>Overview</span>
                </motion.button>

                <motion.button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </motion.button>

                <motion.button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-3"
            variants={itemVariants}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-lg p-8"
              variants={cardVariants}
            >
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back!</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total Projects</p>
                          <p className="text-3xl font-bold">12</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <Home className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Active Tasks</p>
                          <p className="text-3xl font-bold">8</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <Bell className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Completed</p>
                          <p className="text-3xl font-bold">24</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-gray-600">Project "Dashboard UI" was updated</p>
                        <span className="text-sm text-gray-400">2 hours ago</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-gray-600">Task "Authentication Setup" completed</p>
                        <span className="text-sm text-gray-400">1 day ago</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <p className="text-gray-600">New team member joined</p>
                        <span className="text-sm text-gray-400">3 days ago</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900">{currentUser?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Display Name</p>
                        <p className="text-gray-900">{currentUser?.displayName || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="text-gray-900">
                          {currentUser?.metadata?.creationTime 
                            ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Settings Coming Soon</h3>
                      <p className="text-yellow-700">
                        Account settings and preferences will be available in the next update.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 