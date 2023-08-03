import { MenuItem } from '@mui/material';
import { useGlobalFlowState } from '../../../../pages/PipelineEdit';

const ProcessTypeEditorModeItem = (props) => {
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

    const handleDeleteElement = () => {
        FlowState.triggerDelete.set(FlowState.triggerDelete.get() + 1);
        props.handleCloseMenu();
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenConfigure}>
                Configure
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenCommand}>
                Command
            </MenuItem>
            <MenuItem sx={{ color: 'error.main' }} onClick={handleDeleteElement}>
                Delete
            </MenuItem>
        </>
    );
};

export default ProcessTypeEditorModeItem;
