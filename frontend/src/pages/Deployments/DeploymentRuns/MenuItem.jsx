import { MenuItem } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useGlobalRunState } from '../../PipelineRuns/GlobalRunState';

const DeploymentViewPageItem = (props) => {
    // Global state
    const RunState = useGlobalRunState();

    // URI parameter
    const { version } = useParams();

    const handleAnalytics = () => {
        props.handleCloseMenu();
        props.setIsOpenAnalytics(true);
    };

    const handleRun = () => {
        RunState.isRunning.set(true);
        props.handleCloseMenu();

        const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: false });
        const runButton = document.getElementById('deployment-run-button');
        runButton.dispatchEvent(clickEvent);
    };
    return (
        <>
            {props.version === version ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={handleRun}>
                    Run
                </MenuItem>
            ) : null}
            {RunState.selectedRunID.get() ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={handleAnalytics}>
                    Analytics
                </MenuItem>
            ) : null}
        </>
    );
};

export default DeploymentViewPageItem;
