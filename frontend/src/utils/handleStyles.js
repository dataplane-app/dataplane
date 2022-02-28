export const customSourceHandle = (theme = 'light') => {
    return {
        backgroundColor: 'transparent',
        borderRadius: 3,
        height: 0,
        width: 0,
        borderRight: 0,
        borderTop: '11px solid transparent',
        borderBottom: '11px solid transparent',
        borderLeft: `11px solid ${theme === 'light' ? 'black' : '#fff'}`,
        right: '-10px',
        cursor: 'grab',
    };
};

export const customSourceHandleDragging = {
    height: 5,
    width: 5,
};

export const customSourceConnected = (theme = 'light') => {
    return {
        background: theme === 'light' ? '#000' : '#fff',
        height: 13,
        width: 13,
    };
};

export const customTargetHandle = (theme = 'light') => {
    return {
        background: theme === 'light' ? '#000' : '#fff',
        height: 13,
        width: 13,
    };
};
