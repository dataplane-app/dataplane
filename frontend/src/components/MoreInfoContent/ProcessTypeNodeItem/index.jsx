import { MenuItem } from '@mui/material';
import { useHistory } from 'react-router-dom';
import { useGlobalFlowState } from '../../../pages/Flow';
import { Downgraded } from '@hookstate/core';

const ProcessTypeNodeItem = (props) => {
    const history = useHistory();
    const FlowState = useGlobalFlowState();

    const handleCodeClick = () => {
        history.push({ pathname: `/editor/${FlowState.pipelineInfo.attach(Downgraded).get()?.pipelineID}`, state: FlowState.pipelineInfo.attach(Downgraded).get() });
        props.handleCloseMenu();
    };

    const handleOpenLog = () => {
        props.handleCloseMenu();
        FlowState.isOpenLogDrawer.set(true);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleCodeClick}>
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
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenLog}></MenuItem>
        </>
    );
};

export default ProcessTypeNodeItem;
