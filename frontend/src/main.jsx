import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { I18nProvider, useI18n } from './context/I18nContext.jsx';
import { buildTheme } from './theme.js';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function ThemedApp() {
  const { dir } = useI18n();
  React.useEffect(() => { document.dir = dir; }, [dir]);
  return (
    <ThemeProvider theme={buildTheme(dir)}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <ThemedApp />
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
