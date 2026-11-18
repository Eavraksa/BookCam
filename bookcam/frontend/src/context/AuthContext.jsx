import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { ensureUserProfile } from '../services/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // The role is a signed custom claim set by the backend (never by the client).
          const token = await firebaseUser.getIdTokenResult();
          setRole(token.claims.role === 'admin' ? 'admin' : 'customer');
        } else {
          setRole('customer');
        }
        setUser(firebaseUser);
        setLoading(false);
      }),
    []
  );

  const value = useMemo(
    () => ({
      user,
      role,
      isAdmin: role === 'admin',
      loading,

      async register(displayName, email, password) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        await ensureUserProfile(cred.user, displayName);
        return cred.user;
      },

      async login(email, password) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(cred.user); // creates the profile doc if it is somehow missing
        return cred.user;
      },

      logout: () => signOut(auth),
    }),
    [user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
