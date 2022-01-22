const drawerWidth = 720;

const customDrawerStyles = (theme) => {
    return {
        width: drawerWidth,
        flexShrink: 0,
        zIndex: 9998,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
    };
};

export default customDrawerStyles;
