import {BASE_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import api from '../services/api';
import {setLogoutHandler} from '../services/authBridge';
import {
  registerForNotifications,
  unregisterNotifications,
  setupForegroundHandler,
} from '../services/notificationService';
import socket from '../utils/socket';
import {Platform} from 'react-native';

if (Platform.OS === 'android') {
  GoogleSignin.configure({
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
}

type AuthContext = {
  signIn: () => void;
  signOut: () => void;
  session?: string | null;
  isLoading?: boolean;
  isAuthenticated: boolean;
  signInWithPassword: (params: {
    email: string;
    password: string;
  }) => Promise<any>;
  signInWithGoogle: (params: {idToken: string}) => Promise<any>;
  signupWithPassword: (params: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<any>;
  user: UserProps;
  setUser: (user: UserProps) => void;
};

type UserProps = {
  name: string;
  photoUrl: string;
  userId: string;
  loggedIn: boolean;
  token: string;
  email: string;
  budget: number;
  income: number;
  phoneNumber: string;
  userLoginProvider: string;
};

interface AuthContextProps {
  googleSignIn: () => void;
  logOut: () => void;
  signInWithPassword: (params: {
    email: string;
    password: string;
  }) => Promise<any>;
  signInWithGoogle: (params: {idToken: string}) => Promise<any>;
  signupWithPassword: (params: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<void>;
  user: UserProps;
  loading: boolean;
  error: string;
  setUser: (user: UserProps) => void;
}

const AuthContext = createContext<AuthContext>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  signInWithPassword: () => Promise.resolve(),
  signupWithPassword: () => Promise.resolve(),
  signInWithGoogle: () => Promise.resolve(),
  user: {
    name: '',
    photoUrl: '',
    userId: '',
    loggedIn: false,
    token: '',
    email: '',
    budget: 0,
    income: 0,
    phoneNumber: '',
    userLoginProvider: '',
  },
  setUser: () => null,
});

export default function AuthProvider({children}: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<UserProps>({
    name: '',
    photoUrl: '',
    userId: '',
    loggedIn: false,
    token: '',
    email: '',
    budget: 0,
    income: 0,
    phoneNumber: '',
    userLoginProvider: '',
  });

  const signupWithPassword = async ({
    email,
    password,
    first_name,
    last_name,
  }: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          firstName: first_name,
          lastName: last_name,
        }),
        headers: {
          'content-type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        await Promise.all([
          AsyncStorage.setItem('userId', result.userId),
          AsyncStorage.setItem('token', result.token),
          AsyncStorage.setItem('refreshToken', result.refreshToken || ''),
        ]);
        setUser({
          userId: result?.userId || '',
          email: result?.email || '',
          name: first_name + ' ' + last_name || '',
          photoUrl: result?.photoUrl || '',
          token: result?.token || '',
          loggedIn: true,
          budget: result?.budget || 0,
          income: result?.income || 0,
          phoneNumber: result?.phoneNumber || '',
          userLoginProvider: result?.userLoginProvider || '',
        });
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.log('🚀 ~ signupWithPassword ~ error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithPassword = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/api/auth/login`;
      console.log('🚀 ~ signInWithPassword ~ url:', url);
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({email, password}),
        headers: {
          'content-type': 'application/json',
        },
      });
      const result = await response.json();
      const {userId, token, name} = result;
      if (result.success && result.token) {
        await Promise.all([
          AsyncStorage.setItem('userId', userId),
          AsyncStorage.setItem('token', token),
          AsyncStorage.setItem('refreshToken', result.refreshToken || ''),
        ]);
        setIsAuthenticated(true);
        setUser({
          userId: userId || '',
          name: name || '',
          photoUrl: result?.photoUrl || '',
          token: token || '',
          loggedIn: true,
          email: email || '',
          budget: result?.budget || 0,
          income: result?.income || 0,
          phoneNumber: result?.phoneNumber || '',
          userLoginProvider: result?.userLoginProvider || '',
        });
        return result;
      } else {
        setError(result.message);
        return result;
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async ({idToken}: {idToken: string}) => {
    setLoading(true);
    try {
      if (!idToken) {
        throw new Error('ID token is required');
      }
      const response = await fetch(`${BASE_URL}/api/auth/signin-with-google`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'id-token': idToken,
        },
      });
      const result = await response.json();
      const {userId, token, name} = result;
      if (result.success && result.token) {
        await Promise.all([
          AsyncStorage.setItem('userId', userId),
          AsyncStorage.setItem('token', token),
          AsyncStorage.setItem('refreshToken', result.refreshToken || ''),
        ]);
        setIsAuthenticated(true);
        setUser({
          userId: userId || '',
          name: name || '',
          photoUrl: result?.photoUrl || '',
          token: token || '',
          loggedIn: true,
          email: result?.email || '',
          budget: result?.budget || 0,
          income: result?.income || 0,
          phoneNumber: result?.phoneNumber || '',
          userLoginProvider: result?.userLoginProvider || '',
        });
        return result;
      } else {
        setError(result.message);
        return result;
      }
    } catch (error) {
      console.log(error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to sign in with Google',
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Restore persisted auth status once on mount.
  useEffect(() => {
    const fetchAuthStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    };
    fetchAuthStatus();
  }, []);

  // Load the user profile whenever auth becomes true.
  useEffect(() => {
    if (isAuthenticated) {
      getUser();
    }
  }, [isAuthenticated]);

  // Connect socket, register user, and set up notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && user.userId) {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('register', user.userId);
      console.log('🔌 Socket connected and registered for user:', user.userId);

      // Register for push notifications
      registerForNotifications(user.userId);

      // Set up foreground notification handler
      const unsubscribeForeground = setupForegroundHandler();

      return () => {
        unsubscribeForeground();
        if (!isAuthenticated && socket.connected) {
          socket.disconnect();
        }
      };
    }

    return () => {
      if (!isAuthenticated && socket.connected) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user.userId]);

  const getUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users/me');
      setUser({
        name: response.data?.user?.name,
        photoUrl: response.data?.user?.profilePicture,
        userId: response.data?.user?.id,
        loggedIn: true,
        token: response.data?.user?.token,
        email: response.data?.user?.email,
        budget: response.data?.user?.budget,
        income: response.data?.user?.income,
        phoneNumber: response.data?.user?.phoneNumber,
        userLoginProvider: response.data?.user?.userLoginProvider,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const signIn = async () => setIsAuthenticated(true);
  const signOut = async () => {
    // Revoke the refresh token server-side (best-effort) before clearing state.
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch(`${BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({refreshToken}),
        });
      }
    } catch (e) {
      // Ignore — proceed with local logout regardless.
    }
    // Unregister notifications before clearing state
    if (user.userId) {
      await unregisterNotifications(user.userId);
    }
    // Disconnect socket before clearing state
    if (socket.connected) {
      socket.disconnect();
    }
    await AsyncStorage.clear();
    if (Platform.OS === 'android' && GoogleSignin) {
      GoogleSignin.signOut();
    }
    setIsAuthenticated(false);
    setUser({
      name: '',
      photoUrl: '',
      userId: '',
      loggedIn: false,
      token: '',
      email: '',
      budget: 0,
      income: 0,
      phoneNumber: '',
      userLoginProvider: '',
    });
  };

  // Let the axios layer end the session when a token refresh ultimately fails.
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;
  useEffect(() => {
    setLogoutHandler(() => {
      signOutRef.current();
    });
    return () => setLogoutHandler(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        user,
        isAuthenticated,
        signInWithPassword,
        signupWithPassword,
        setUser,
        signInWithGoogle,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
