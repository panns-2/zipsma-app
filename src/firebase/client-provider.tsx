
'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { initializeFirebase, FirebaseServices } from '@/firebase';
import { getFirebaseConfig } from './config';
import FirebaseConfigError from '@/components/firebase-config-error';
import { Loader2 } from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';

const FirebaseContext = createContext<FirebaseServices | null>(null);

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export const useAuth = () => {
    const firebaseServices = useFirebase();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (firebaseServices) {
            const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
                setUser(user);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [firebaseServices]);

    return { user, loading };
};

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [configError, setConfigError] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      console.log("[FirebaseClientProvider] Starting initialization...");
      const config = getFirebaseConfig();
      console.log("[FirebaseClientProvider] Config loaded:", !!config);
      
      if (config) {
          const firebaseServices = initializeFirebase(config);
          console.log("[FirebaseClientProvider] Services initialized:", !!firebaseServices);
          setServices(firebaseServices);
      } else {
          console.error("Firebase configuration could not be loaded. Ensure all necessary NEXT_PUBLIC_FIREBASE_* variables are set in .env.local");
          setConfigError(true);
      }
    } catch (error) {
      console.error("Error during Firebase initialization:", error);
      setConfigError(true);
    }
    
    console.log("[FirebaseClientProvider] Setting isInitializing to false");
    setIsInitializing(false);

  }, []);

  if (isInitializing) {
    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );
  }

  if (configError) {
    return <FirebaseConfigError />;
  }

  if (!services) {
     return (
        <div className="w-screen h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="ml-2">Initializing services...</p>
        </div>
    );
  }

  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
}
