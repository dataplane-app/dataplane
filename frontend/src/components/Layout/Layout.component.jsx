
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import * as React from 'react';
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

const drawerWidth = 190;

const Layout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar elevation={0} position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: (theme) => theme.palette.background.secondary, borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <Navbar />
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', backgroundColor: "background.main" },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <Sidebar />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 4 }} background="background.main">
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;