import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!localStorage.getItem('authToken');

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await refreshUser();
        } catch (err) {
          console.error('Failed to initialize auth:', err);
          localStorage.removeItem('authToken');
        }
      } else {
        // For development, set a default user if no token
        setUser({
          username: 'Player One',
          role: 'player',
          profile: {
            firstName: 'Player',
            lastName: 'One'
          },
          gameStats: {
            totalGames: 0,
            totalBet: 0,
            totalWin: 0,
            totalProfit: 0
          },
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          balance: 1250.50,
          fullName: 'Player One'
        });
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.login(username, password);
      
      if (response.success && response.data) {
        const userData = response.data.user;
        const transformedUser: User = {
          ...userData,
          email: userData.username, // For compatibility
          balance: userData.gameStats?.totalWin - userData.gameStats?.totalBet || 0,
          fullName: userData.profile?.firstName && userData.profile?.lastName 
            ? `${userData.profile.firstName} ${userData.profile.lastName}`.trim()
            : userData.username
        };
        
        setUser(transformedUser);
        return true;
      } else {
        setError(response.message || 'Login failed');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    apiService.logout().catch(console.error);
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiService.getProfile();
      
      if (response.success && response.data) {
        const userData = response.data;
        const transformedUser: User = {
          ...userData,
          email: userData.username, // For compatibility
          balance: userData.gameStats?.totalWin - userData.gameStats?.totalBet || 0,
          fullName: userData.profile?.firstName && userData.profile?.lastName 
            ? `${userData.profile.firstName} ${userData.profile.lastName}`.trim()
            : userData.username
        };
        
        setUser(transformedUser);
      } else {
        throw new Error(response.message || 'Failed to fetch user profile');
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
