import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload,
        isAuthenticated: true,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        dispatch({ type: 'SET_USER', payload: user });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Mock login - replace with actual API call
      const response = await mockLogin(credentials);
      
      if (response.success) {
        const user = response.user;
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        return { success: true };
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Mock register - replace with actual API call
      const response = await mockRegister(userData);
      
      if (response.success) {
        const user = response.user;
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        return { success: true };
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock functions - replace with actual API calls
const mockLogin = async (credentials) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (credentials.username === 'demo' && credentials.password === 'demo') {
        resolve({
          success: true,
          user: {
            id: '1',
            username: credentials.username,
            email: 'demo@example.com',
            avatar: null,
            status: 'online',
          },
        });
      } else {
        resolve({
          success: false,
          error: 'Invalid username or password',
        });
      }
    }, 1000);
  });
};

const mockRegister = async (userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (userData.username && userData.email && userData.password) {
        resolve({
          success: true,
          user: {
            id: Date.now().toString(),
            username: userData.username,
            email: userData.email,
            avatar: null,
            status: 'online',
          },
        });
      } else {
        resolve({
          success: false,
          error: 'All fields are required',
        });
      }
    }, 1000);
  });
};