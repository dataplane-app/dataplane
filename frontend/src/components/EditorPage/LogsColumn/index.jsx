import { faExpandArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box } from '@mui/material';
import { forwardRef } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';

const url = 'https://gist.githubusercontent.com/shadow-fox/5356157/raw/1b63df47e885d415705d175b7f6b87989f9d4214/mongolog';

const LogsColumn = forwardRef(({ children, ...rest }, ref) => {
    return (
        <div {...rest}>
            <Box
                sx={{
                    backgroundColor: 'background.main',
                    border: '1px solid  #D3D3D3',
                    borderRadius: '7px',
                    height: '100%',
                    ml: 0.8,
                }}>
                <ScrollFollow startFollowing={true} render={({ follow, onScroll }) => <LazyLog url={url} stream follow={follow} onScroll={onScroll} />} />
            </Box>
            {children}
            <Box sx={{ position: 'absolute', bottom: 2, left: 15, cursor: 'pointer' }}>
                <Box component={FontAwesomeIcon} icon={faExpandArrowsAlt} className="drag-handle" sx={{ color: '#fff' }} />
            </Box>
        </div>
    );
});

export default LogsColumn;
