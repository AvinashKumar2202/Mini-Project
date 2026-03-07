import React from 'react';
import { useMediaQuery, Box, Drawer, GlobalStyles } from '@mui/material';
import Logo from '../shared/logo/Logo';
import SidebarItems from './SidebarItems';

const SIDEBAR_WIDTH = '270px';

const SidebarGlobalStyles = () => (
  <GlobalStyles
    styles={{
      '@keyframes sidebarShift': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
      '.sidebar-paper': {
        background: 'linear-gradient(135deg, #0F0C29, #302B63, #1a0533, #24243E, #4A1B8C, #0F0C29) !important',
        backgroundSize: '400% 400% !important',
        animation: 'sidebarShift 8s ease infinite !important',
        borderRight: 'none !important',
        boxShadow: '4px 0 32px rgba(108,63,255,0.25) !important',
      },
      '.sidebar-paper::before': {
        content: '""',
        display: 'block',
        height: '3px',
        background: 'linear-gradient(90deg, #A78BFA, #6C63FF, #00D4AA, #A78BFA)',
        backgroundSize: '200% 100%',
        animation: 'sidebarShift 4s linear infinite',
      },
    }}
  />
);

const Sidebar = (props) => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const paperProps = {
    className: 'sidebar-paper',
    sx: { width: SIDEBAR_WIDTH, boxSizing: 'border-box' },
  };

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box px={3}>
        <Logo />
      </Box>
      <Box flex={1} overflow="auto">
        <SidebarItems />
      </Box>
    </Box>
  );

  if (lgUp) {
    return (
      <>
        <SidebarGlobalStyles />
        <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}>
          <Drawer
            anchor="left"
            open={props.isSidebarOpen}
            variant="permanent"
            PaperProps={paperProps}
          >
            {sidebarContent}
          </Drawer>
        </Box>
      </>
    );
  }

  return (
    <>
      <SidebarGlobalStyles />
      <Drawer
        anchor="left"
        open={props.isMobileSidebarOpen}
        onClose={props.onSidebarClose}
        variant="temporary"
        PaperProps={{
          ...paperProps,
          sx: { ...paperProps.sx, boxShadow: '0 8px 32px rgba(108,63,255,0.3)' },
        }}
      >
        <Box px={2}>
          <Logo />
        </Box>
        <SidebarItems />
      </Drawer>
    </>
  );
};

export default Sidebar;
