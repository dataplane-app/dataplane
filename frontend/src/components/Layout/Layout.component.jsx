import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import * as React from 'react';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';

const drawerWidth = 204;

const Layout = ({ children }) => {
    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                elevation={0}
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer, background: (theme) => theme.palette.background.secondary, borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar style={{ padding: 0 }}>
                    <Navbar />
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    zIndex: 1100,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', backgroundColor: 'background.main' },
                }}>
                <Toolbar style={{ padding: 0 }} />
                <Box sx={{ overflow: 'auto', height: '100%' }}>
                    <Sidebar />
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 4 }} background="background.main">
                <Toolbar style={{ padding: 0 }} />
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
