import React, { createContext, useContext, useState, useEffect } from 'react';
import firebaseService from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await firebaseService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    fetchUser();
  }, []);

  const signUp = async (email, password, name) => {
    const result = await firebaseService.signUp(email, password, name);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const signIn = async (email, password) => {
    const result = await firebaseService.signIn(email, password);
    if (result.success) {
      setUser(result.user);
      // Sync localStorage cart/wishlist with Firebase
      await firebaseService.syncCartAndWishlist();
    }
    return result;
  };

  const signOut = async () => {
    const result = await firebaseService.signOut();
    if (result.success) {
      setUser(null);
    }
    return result;
  };

  const sendPasswordReset = async (email) => {
    return await firebaseService.sendPasswordReset(email);
  };

  const verifyEmail = async (code) => {
    if (!user) {
      return { success: false, error: 'No user found' };
    }
    return await firebaseService.verifyEmail(user.uid, code);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    verifyEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 