import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if there's a stored token
    const token = localStorage.getItem('admin-token');
    const username = localStorage.getItem('admin-username');

    if (token && username) {
      setAdminUser({ username });
    }
    
    setLoading(false);
  }, []);

  // Function to handle admin login
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/admin/login', {
        username,
        password
      });

      if (response.data && response.data.token) {
        // Store the token in local storage
        localStorage.setItem('admin-token', response.data.token);
        localStorage.setItem('admin-username', response.data.user.username);

        setAdminUser({
          username: response.data.user.username
        });

        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Function to handle admin logout
  const logout = () => {
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-username');
    setAdminUser(null);
  };

  // Function to add authorization header to axios requests
  const authAxios = () => {
    const token = localStorage.getItem('admin-token');
    
    const instance = axios.create({
      headers: {
        'x-auth-token': token
      }
    });
    
    return instance;
  };

  const value = {
    adminUser,
    loading,
    error,
    login,
    logout,
    authAxios,
    isAuthenticated: !!adminUser
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext; 