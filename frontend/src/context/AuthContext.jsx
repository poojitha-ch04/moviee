import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('moviee_token');
    const userData = localStorage.getItem('moviee_user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const { access_token } = response.data;
    localStorage.setItem('moviee_token', access_token);
    // Fetch user profile
    const userRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    localStorage.setItem('moviee_user', JSON.stringify(userRes.data));
    setUser(userRes.data);
    return userRes.data;
  };

  const signup = async (email, username, password) => {
    const response = await api.post('/auth/signup', { email, username, password });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('moviee_token');
    localStorage.removeItem('moviee_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
