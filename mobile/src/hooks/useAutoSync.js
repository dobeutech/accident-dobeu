import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useAutoSync = ({ onOnline, onInit, setIsOnline }) => {
  const onOnlineRef = useRef(onOnline);
  const onInitRef = useRef(onInit);
  const setIsOnlineRef = useRef(setIsOnline);

  useEffect(() => {
    onOnlineRef.current = onOnline;
    onInitRef.current = onInit;
    setIsOnlineRef.current = setIsOnline;
  }, [onOnline, onInit, setIsOnline]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected && state.isInternetReachable;
      if (setIsOnlineRef.current) {
        setIsOnlineRef.current(isOnline);
      }

      // Auto-sync when coming back online
      if (isOnline && onOnlineRef.current) {
        onOnlineRef.current();
      }
    });

    // Check initial sync status
    if (onInitRef.current) {
      onInitRef.current();
    }

    return () => unsubscribe();
  }, []);
};
