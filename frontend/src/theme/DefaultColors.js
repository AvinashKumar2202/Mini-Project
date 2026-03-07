import { createTheme } from "@mui/material/styles";
import typography from "./Typography";
import { shadows } from "./Shadows";

const baselightTheme = createTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#6C63FF',
      light: '#EDE9FF',
      dark: '#4B44CC',
    },
    secondary: {
      main: '#00D4AA',
      light: '#E0FBF4',
      dark: '#009E7E',
    },
    success: {
      main: '#13DEB9',
      light: '#E6FFFA',
      dark: '#02b3a9',
      contrastText: '#ffffff',
    },
    info: {
      main: '#539BFF',
      light: '#EBF3FE',
      dark: '#1682d4',
      contrastText: '#ffffff',
    },
    error: {
      main: '#FF6B6B',
      light: '#FFE8E8',
      dark: '#CC3333',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#FFAE1F',
      light: '#FEF5E5',
      dark: '#ae8e59',
      contrastText: '#ffffff',
    },
    grey: {
      100: '#F8F9FE',
      200: '#EEF0FF',
      300: '#DDE1F5',
      400: '#8891B0',
      500: '#5A6A85',
      600: '#1A1D3B',
    },
    text: {
      primary: '#1A1D3B',
      secondary: '#5A6A85',
    },
    action: {
      disabledBackground: 'rgba(108,99,255,0.08)',
      hoverOpacity: 0.04,
      hover: '#F0EEFF',
    },
    divider: 'rgba(108,99,255,0.12)',
    background: {
      default: '#F8F9FE',
      paper: '#FFFFFF',
    },
  },
  typography,
  shadows,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 2px 20px rgba(108,99,255,0.08)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(108,99,255,0.18)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          fontWeight: 600,
          transition: 'all 0.25s ease',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6C63FF 0%, #4B44CC 100%)',
          boxShadow: '0 4px 14px rgba(108,99,255,0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7D75FF 0%, #5D56DD 100%)',
            boxShadow: '0 6px 20px rgba(108,99,255,0.45)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
        },
      },
    },
  },
});

export { baselightTheme };
