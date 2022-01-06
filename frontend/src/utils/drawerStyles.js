const drawerWidth = 507;

const drawerStyles = (theme) => {
    return {
        width: drawerWidth,
        flexShrink: 0,
        zIndex: 9998,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: theme.palette.sidebar.main },
    };
};

export default drawerStyles;
