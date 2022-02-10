import { MenuItem } from '@mui/material';

const ApiTriggerNodeItem = (props) => {
    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                API
            </MenuItem>
        </>
    );
};

export default ApiTriggerNodeItem;
