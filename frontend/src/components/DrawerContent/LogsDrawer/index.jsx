import { Box } from '@mui/material';
import React from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';

const LogsDrawer = ({ url = 'https://gist.githubusercontent.com/shadow-fox/5356157/raw/1b63df47e885d415705d175b7f6b87989f9d4214/mongolog' }) => {
    return (
        <Box height="100%" width="100%" bgcolor="#000">
            <ScrollFollow startFollowing={true} render={({ follow, onScroll }) => <LazyLog url={url} stream follow={follow} onScroll={onScroll} />} />
        </Box>
    );
};

export default LogsDrawer;
