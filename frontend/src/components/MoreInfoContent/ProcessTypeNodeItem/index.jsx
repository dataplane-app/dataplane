import { MenuItem } from '@mui/material';
import { useGlobalFlowState } from '../../../pages/Flow';

const ProcessTypeNodeItem = (props) => {
    // Flow global state
    const FlowState = useGlobalFlowState();

    const handleOpenLog = () => {
        props.handleCloseMenu();
        FlowState.isOpenLogDrawer.set(true);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Code
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Run
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Workers
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenLog}>
                Logs
            </MenuItem>
        </>
    );
};

export default ProcessTypeNodeItem;
