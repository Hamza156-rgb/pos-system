import { createTheme } from '@mui/material/styles';

export const buildTheme = (dir) =>
  createTheme({
    direction: dir,
    palette: {
      primary: { main: '#1565c0' },
      secondary: { main: '#00897b' },
      background: { default: '#f4f6f8' },
    },
    typography: {
      fontFamily: dir === 'rtl'
        ? '"Noto Nastaliq Urdu", "Segoe UI", Roboto, sans-serif'
        : 'Roboto, "Segoe UI", sans-serif',
    },
    shape: { borderRadius: 10 },
  });
