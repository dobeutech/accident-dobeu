import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { useTheme } from './lib/theme';
import { useI18n, detectBrowserLanguage } from './lib/i18n';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Initialize theme and language on first load
function AppWrapper() {
  const { resolvedTheme } = useTheme();
  const { language, setLanguage } = useI18n();

  // Set initial language from browser if not already set
  useEffect(() => {
    const storedLang = localStorage.getItem('fleetguard-language');
    if (!storedLang) {
      const browserLang = detectBrowserLanguage();
      setLanguage(browserLang);
    }
    // Set document language
    document.documentElement.lang = language;
  }, [language, setLanguage]);

  return (
    <>
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
            color: resolvedTheme === 'dark' ? '#f8fafc' : '#111827',
            border: resolvedTheme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
            },
          },
        }}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppWrapper />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
