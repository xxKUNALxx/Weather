import { useState, useEffect } from 'react';
import { UserCircle, Shield, LogOut, Edit, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Determine role based on isAdmin and policyMaker fields
  const getUserRole = (user) => {
    if (user.isAdmin) return 'admin';
    if (user.policyMaker) return 'Policymaker'; // Using Policymaker for policyMaker
    return 'public';
  };

  // Roles configuration
  const [userRole, setUserRole] = useState('public'); // Default role
  const availableRoles = [
    { id: 'public', name: 'Public User', description: 'Basic access to the platform' },
    { id: 'premium', name: 'Premium User', description: 'Extended features and priority support' },
    { id: 'Policymaker', name: 'Policymaker', description: 'Can create and share weather forecasts' },
    { id: 'admin', name: 'Administrator', description: 'Full access to all platform features' }
  ];
  
  // Role request system
  const [requestedRole, setRequestedRole] = useState(null);
  const [roleStatus, setRoleStatus] = useState('none'); // none, pending, approved, rejected

  useEffect(() => {
    // Check if user is logged in by looking for stored credentials
    const storedUser = localStorage.getItem('weatherSphereUser');
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserInfo(userData);
      setEditedName(userData.fullName);
      
      // Set role based on isAdmin and policyMaker flags
      setUserRole(getUserRole(userData));
      
      if (userData.roleStatus) {
        setRoleStatus(userData.roleStatus);
      }
      
      if (userData.requestedRole) {
        setRequestedRole(userData.requestedRole);
      }
    } else {
      // Redirect to login if no user data is found
      navigate('/');
    }
    
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('weatherSphereUser');
    navigate('/');
  };

  const saveProfile = () => {
    if (!userInfo) return;
    
    const updatedUser = {
      ...userInfo,
      fullName: editedName
    };
    
    // Save to localStorage (in a real app, would save to backend)
    localStorage.setItem('weatherSphereUser', JSON.stringify(updatedUser));
    setUserInfo(updatedUser);
    setIsEditing(false);
  };

  const requestRoleChange = (roleId) => {
    // In a real app, this would send a request to the backend
    setRequestedRole(roleId);
    setRoleStatus('pending');
    
    // Update user data with pending role request
    const updatedUser = {
      ...userInfo,
      requestedRole: roleId,
      roleStatus: 'pending'
    };
    
    localStorage.setItem('weatherSphereUser', JSON.stringify(updatedUser));
    setUserInfo(updatedUser);
    
    // Simulate admin approval (would be handled by admin in a real app)
    console.log(`Role change request sent: ${roleId}`);
  };

  // This would normally be an admin-only function
  const simulateAdminAction = (action) => {
    if (!requestedRole) return;
    
    let newStatus = action === 'approve' ? 'approved' : 'rejected';
    let newRole = userRole;
    
    if (action === 'approve') {
      newRole = requestedRole;
      
      // Update the admin/policyMaker flags based on the requested role
      const updatedUserInfo = { ...userInfo };
      
      // Reset both flags first
      updatedUserInfo.isAdmin = false;
      updatedUserInfo.policyMaker = false;
      
      // Set the appropriate flag based on the new role
      if (requestedRole === 'admin') {
        updatedUserInfo.isAdmin = true;
      } else if (requestedRole === 'Policymaker') {
        updatedUserInfo.policyMaker = true;
      }
      
      setUserInfo(updatedUserInfo);
    }
    
    setRoleStatus(newStatus);
    setUserRole(newRole);
    
    // Update stored user data
    const updatedUser = {
      ...userInfo,
      roleStatus: newStatus
    };
    
    localStorage.setItem('weatherSphereUser', JSON.stringify(updatedUser));
    
    // Reset requested role after processing
    if (action === 'reject') {
      setRequestedRole(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <p className="text-white text-xl">No user information found.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">WeatherSphere Profile</h1>
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition duration-200"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </button>
        </div>
        
        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-40 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="absolute -bottom-16 left-8">
              {userInfo.avatar ? (
                <img 
                  src={userInfo.avatar} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full border-4 border-slate-900"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-700 flex items-center justify-center border-4 border-slate-900">
                  <UserCircle size={64} className="text-white" />
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-20 pb-8 px-8">
            {/* Profile Info */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div className="mb-6 md:mb-0">
                {isEditing ? (
                  <div className="flex items-center mb-4">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-white/10 text-white text-2xl font-bold px-3 py-1 rounded border border-white/30 mr-2"
                    />
                    <button 
                      onClick={saveProfile}
                      className="p-2 bg-green-500/20 text-green-300 rounded-full hover:bg-green-500/30"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(userInfo.fullName);
                      }}
                      className="p-2 bg-red-500/20 text-red-300 rounded-full hover:bg-red-500/30 ml-1"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center mb-4">
                    <h2 className="text-2xl font-bold text-white mr-2">{userInfo.fullName}</h2>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 bg-blue-500/20 text-blue-300 rounded-full hover:bg-blue-500/30"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                )}
                <p className="text-blue-200">{userInfo.email}</p>
                <p className="text-blue-300/70 text-sm mt-1">Username: {userInfo.username}</p>
                {userInfo._id && (
                  <p className="text-blue-300/70 text-sm mt-1">ID: {userInfo._id}</p>
                )}
              </div>
              
              <div className="flex items-center">
                <Shield size={20} className="text-blue-300 mr-2" />
                <div>
                  <span className="text-blue-200 mr-2">Current Role:</span>
                  <span className="text-white font-medium">{availableRoles.find(r => r.id === userRole)?.name || 'Public User'}</span>
                </div>
              </div>
            </div>
            
            {/* Additional User Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-medium text-white mb-2">Account Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Member Since:</span>
                    <span className="text-white">{new Date(userInfo.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Last Updated:</span>
                    <span className="text-white">{new Date(userInfo.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Admin Status:</span>
                    <span className="text-white">{userInfo.isAdmin ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Policy Maker:</span>
                    <span className="text-white">{userInfo.policyMaker ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              
              {/* <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-medium text-white mb-2">Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="emailNotifications" 
                      className="w-4 h-4 rounded bg-white/10 border-white/30 text-blue-500 focus:ring-blue-400"
                    />
                    <label htmlFor="emailNotifications" className="ml-2 text-blue-200">Email Notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="darkMode" 
                      className="w-4 h-4 rounded bg-white/10 border-white/30 text-blue-500 focus:ring-blue-400"
                      defaultChecked
                    />
                    <label htmlFor="darkMode" className="ml-2 text-blue-200">Dark Mode</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="locationServices" 
                      className="w-4 h-4 rounded bg-white/10 border-white/30 text-blue-500 focus:ring-blue-400"
                    />
                    <label htmlFor="locationServices" className="ml-2 text-blue-200">Location Services</label>
                  </div>
                </div>
              </div> */}
            </div>
            
            {/* Role Management */}
            <div className="mt-8">
              <h3 className="text-xl font-medium text-white mb-4">Role Management</h3>
              
              {/* Role Status */}
              {roleStatus === 'pending' && requestedRole && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-300">
                    <span className="font-medium">Role Request Pending: </span> 
                    Your request for {availableRoles.find(r => r.id === requestedRole)?.name} role is awaiting admin approval.
                  </p>
                  
                  {/* Demo admin controls (would be on admin page in real app) */}
                  <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-blue-200 text-sm mb-2">Demo: Admin Approval Controls</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => simulateAdminAction('approve')}
                        className="px-3 py-1 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 flex items-center"
                      >
                        <Check size={14} className="mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => simulateAdminAction('reject')}
                        className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 flex items-center"
                      >
                        <X size={14} className="mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {roleStatus === 'approved' && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-300">
                    <span className="font-medium">Role Approved: </span>
                    Your request for {availableRoles.find(r => r.id === userRole)?.name} role has been approved.
                  </p>
                </div>
              )}
              
              {roleStatus === 'rejected' && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300">
                    <span className="font-medium">Role Request Rejected: </span>
                    Your request for a role change has been denied by an administrator.
                  </p>
                </div>
              )}
              
              {/* Available Roles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRoles.map((role) => (
                  <div 
                    key={role.id} 
                    className={`p-4 rounded-lg border ${
                      role.id === userRole 
                        ? 'bg-blue-500/20 border-blue-500/50' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    } transition duration-200`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium">{role.name}</h4>
                        <p className="text-blue-200 text-sm mt-1">{role.description}</p>
                      </div>
                      
                      {role.id === userRole ? (
                        <span className="px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded-full">
                          Current
                        </span>
                      ) : roleStatus === 'pending' && requestedRole === role.id ? (
                        <span className="px-2 py-1 bg-yellow-500/30 text-yellow-200 text-xs rounded-full">
                          Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => requestRoleChange(role.id)}
                          disabled={roleStatus === 'pending'}
                          className={`px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20 transition duration-200 ${
                            roleStatus === 'pending' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}