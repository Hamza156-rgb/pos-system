import { createTheme } from '@mui/material/styles';

const SANS = '"Inter", "Segoe UI", Roboto, system-ui, -apple-system, sans-serif';

// Shared sidebar tokens so Layout and theme stay in sync.
export const sidebar = {
  width: 264,
  bg: '#0f172a',
  bgAccent: '#111c33',
  text: 'rgba(226,232,240,0.72)',
  textActive: '#ffffff',
  activeBg: 'rgba(59,130,246,0.16)',
  hoverBg: 'rgba(148,163,184,0.10)',
  border: 'rgba(148,163,184,0.12)',
};

export const buildTheme = (dir) =>
  createTheme({
    direction: dir,
    palette: {
      mode: 'light',
      primary: { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8', contrastText: '#ffffff' },
      secondary: { main: '#0d9488', light: '#2dd4bf', dark: '#0f766e', contrastText: '#ffffff' },
      success: { main: '#16a34a', light: '#4ade80', dark: '#15803d' },
      warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
      error: { main: '#dc2626', light: '#f87171', dark: '#b91c1c' },
      info: { main: '#0ea5e9', light: '#38bdf8', dark: '#0284c7' },
      background: { default: '#f1f5f9', paper: '#ffffff' },
      text: { primary: '#0f172a', secondary: '#64748b' },
      divider: '#e2e8f0',
    },
    typography: {
      fontFamily: dir === 'rtl' ? `"Noto Nastaliq Urdu", ${SANS}` : SANS,
      h4: { fontWeight: 800, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.015em' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body2: { color: '#475569' },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
      caption: { letterSpacing: 0 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: '#f1f5f9' },
          '*::-webkit-scrollbar': { width: 9, height: 9 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 8 },
          '*::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: 16 },
          outlined: { borderColor: '#e2e8f0' },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.05)',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, paddingInline: 18, paddingBlock: 8 },
          sizeLarge: { paddingBlock: 11, fontSize: '0.95rem' },
          containedPrimary: { boxShadow: '0 1px 2px rgba(37,99,235,0.35)' },
        },
      },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: '#fff',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            color: '#0f172a',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: 'none',
          },
        },
      },
      MuiDrawer: { styleOverrides: { paper: { border: 'none' } } },
      MuiTable: {
        styleOverrides: {
          root: {
            // zebra striping + branded hover on body rows only
            '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)': { backgroundColor: '#fafbfd' },
            '& .MuiTableBody-root .MuiTableRow-root': { transition: 'background-color .12s ease' },
            '& .MuiTableBody-root .MuiTableRow-root:hover': { backgroundColor: 'rgba(37,99,235,0.06)' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            fontSize: '0.74rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            whiteSpace: 'nowrap',
          },
          root: { borderBottom: '1px solid #eef2f7', fontSize: '0.875rem' },
          // size="small" is used everywhere — give rows real breathing room
          sizeSmall: { padding: '13px 18px' },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { '&:last-child td': { borderBottom: 0 } },
          head: { '& th': { paddingTop: 14, paddingBottom: 14 } },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 8 },
          sizeSmall: { height: 22 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: 12, backgroundColor: '#0f172a' },
          arrow: { color: '#0f172a' },
        },
      },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 18 } } },
    },
  });
