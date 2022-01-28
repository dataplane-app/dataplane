import { MenuItem } from '@mui/material';

const ClearLogsNodeItem = (props) => {
    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Code
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Refresh
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Run
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Workers
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Logs
            </MenuItem>
        </>
    );
};

export default ClearLogsNodeItem;
