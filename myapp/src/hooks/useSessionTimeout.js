import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to automatically log out a user after a period of inactivity.
 * Banking standard is typically 10-15 minutes.
 * @param {number} timeoutMinutes - Minutes until auto-logout
 * @param {string} redirectPath - Where to send the user on logout
 * @param {function} onTimeout - Optional callback to clear storage
 */
export function useSessionTimeout(timeoutMinutes = 15, redirectPath = '/auth', onTimeout) {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  
  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      // Auto-logout triggered
      if (onTimeout) onTimeout();
      navigate(redirectPath);
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    // Events that denote "activity"
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Start initial timer
    resetTimer();
    
    // Attach listeners
    events.forEach(event => document.addEventListener(event, resetTimer));
    
    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [timeoutMinutes, redirectPath, navigate, onTimeout]);
}
