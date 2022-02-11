import { MenuItem } from '@mui/material';
import { useGlobalFlowState } from '../../../pages/Flow';

const ClearLogsEditorModeItem = (props) => {
    // Flow global state
    const FlowState = useGlobalFlowState();

    const handleOpenConfigure = () => {
        props.handleCloseMenu();
        FlowState.isOpenConfigureDrawer.set(true);
    };

    const handleOpenCommand = () => {
        props.handleCloseMenu();
        FlowState.isOpenCommandDrawer.set(true);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenConfigure}>
                Configure
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenCommand}>
                Command
            </MenuItem>
        </>
    );
};

export default ClearLogsEditorModeItem;
