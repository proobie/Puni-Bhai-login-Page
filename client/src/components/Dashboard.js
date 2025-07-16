import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Mail, Calendar, Settings, Home, Bell, Search, Upload, File, Download, Copy, Trash2, FolderOpen } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setNotification({
        type: 'error',
        message: 'File size must be less than 50MB'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `uploads/${currentUser.uid}/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Add to files list
      const newFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: downloadURL,
        uploadedAt: new Date().toISOString(),
        storageRef: snapshot.ref
      };

      setFiles(prev => [newFile, ...prev]);
      setUploadProgress(100);
      
      // Show success notification
      setNotification({
        type: 'success',
        message: `File "${file.name}" uploaded successfully!`
      });
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);

    } catch (error) {
      console.error('Upload failed:', error);
      let errorMessage = 'Upload failed: ' + error.message;
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Access denied. Please check your Firebase Storage rules.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Authentication error. Please log in again.';
      }
      
      setNotification({
        type: 'error',
        message: errorMessage
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      setNotification({
        type: 'success',
        message: 'File link copied to clipboard!'
      });
      setTimeout(() => {
        setCopiedLink(null);
        setNotification(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setNotification({
        type: 'error',
        message: 'Failed to copy link to clipboard'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const deleteFile = async (file) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteObject(file.storageRef);
        setFiles(prev => prev.filter(f => f.url !== file.url));
        setNotification({
          type: 'success',
          message: `File "${file.name}" deleted successfully!`
        });
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error('Delete failed:', error);
        setNotification({
          type: 'error',
          message: 'Delete failed: ' + error.message
        });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    return '📁';
  };

  const loadUserFiles = async () => {
    if (!currentUser) {
      console.log('No current user found');
      return;
    }
    
    setLoadingFiles(true);
    try {
      console.log('Loading files for user:', currentUser.uid);
      const userFilesRef = ref(storage, `uploads/${currentUser.uid}`);
      const result = await listAll(userFilesRef);
      
      const filePromises = result.items.map(async (itemRef) => {
        try {
          const url = await getDownloadURL(itemRef);
          const metadata = await itemRef.getMetadata();
          
          return {
            name: metadata.name.replace(/^\d+_/, ''), // Remove timestamp prefix
            size: metadata.size,
            type: metadata.contentType,
            url: url,
            uploadedAt: new Date(metadata.timeCreated).toISOString(),
            storageRef: itemRef
          };
        } catch (error) {
          console.error('Error loading file:', error);
          return null;
        }
      });
      
      const loadedFiles = (await Promise.all(filePromises)).filter(file => file !== null);
      setFiles(loadedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      if (error.code === 'storage/unauthorized') {
        setNotification({
          type: 'error',
          message: 'Access denied. Please check your Firebase Storage rules.'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'files' && files.length === 0) {
      loadUserFiles();
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

      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            <span>{notification.message}</span>
          </div>
        </motion.div>
      )}

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
                  onClick={() => handleTabChange('overview')}
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
                  onClick={() => handleTabChange('profile')}
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
                  onClick={() => handleTabChange('files')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'files'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FolderOpen className="w-5 h-5" />
                  <span>Files</span>
                </motion.button>

                <motion.button
                  onClick={() => handleTabChange('settings')}
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

              {activeTab === 'files' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">File Manager</h2>
                    <motion.label
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Upload className="w-5 h-5" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                        accept="*/*"
                      />
                    </motion.label>
                  </div>

                  {/* Drag & Drop Zone */}
                  <motion.div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-blue-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        const event = { target: { files: [files[0]] } };
                        handleFileUpload(event);
                      }
                    }}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Drag & Drop Files Here</h3>
                    <p className="text-gray-500">or click the upload button above</p>
                  </motion.div>

                  {/* Upload Progress */}
                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="spinner"></div>
                        <div className="flex-1">
                          <p className="text-blue-800 font-medium">Uploading file...</p>
                          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Files List */}
                  <div className="space-y-4">
                    {loadingFiles ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div className="spinner mx-auto mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-500 mb-2">Loading files...</h3>
                        <p className="text-gray-400">Please wait while we fetch your files</p>
                      </motion.div>
                    ) : files.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-500 mb-2">No files uploaded yet</h3>
                        <p className="text-gray-400">Upload your first file to get started</p>
                      </motion.div>
                    ) : (
                      files.map((file, index) => (
                                                 <motion.div
                           key={file.url}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: index * 0.1 }}
                           className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                         >
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-3">
                               {file.type.startsWith('image/') ? (
                                 <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                                   <img 
                                     src={file.url} 
                                     alt={file.name}
                                     className="w-full h-full object-cover"
                                     onError={(e) => {
                                       e.target.style.display = 'none';
                                       e.target.nextSibling.style.display = 'flex';
                                     }}
                                   />
                                   <div className="w-full h-full flex items-center justify-center text-2xl" style={{ display: 'none' }}>
                                     {getFileIcon(file.type)}
                                   </div>
                                 </div>
                               ) : (
                                 <span className="text-2xl">{getFileIcon(file.type)}</span>
                               )}
                               <div>
                                 <h3 className="font-medium text-gray-900">{file.name}</h3>
                                 <p className="text-sm text-gray-500">
                                   {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                                 </p>
                               </div>
                             </div>
                            <div className="flex items-center space-x-2">
                              <motion.button
                                onClick={() => window.open(file.url, '_blank')}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Download"
                              >
                                <Download className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                onClick={() => copyToClipboard(file.url)}
                                className={`p-2 rounded-lg transition-colors ${
                                  copiedLink === file.url
                                    ? 'text-green-600 bg-green-50'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title={copiedLink === file.url ? 'Copied!' : 'Copy link'}
                              >
                                <Copy className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                onClick={() => deleteFile(file)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
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