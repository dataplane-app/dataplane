import { MenuItem } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useGlobalFlowState } from '../../Flow';
import { useGlobalDeploymentState } from './GlobalDeploymentState';

const DeploymentViewPageItem = (props) => {
    // Global state
    const FlowState = useGlobalFlowState();
    const DeploymentState = useGlobalDeploymentState();

    // URI parameter
    const { version } = useParams();

    const handleAnalytics = () => {
        props.handleCloseMenu();
        props.setIsOpenAnalytics(true);
    };

    const handleRun = () => {
        DeploymentState.isRunning.set(true);
        DeploymentState.runTrigger.set((t) => t + 1);
        props.handleCloseMenu();
    };

    return (
        <>
            {props.version === version ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={handleRun}>
                    Run
                </MenuItem>
            ) : null}
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleAnalytics}>
                Analytics
            </MenuItem>
        </>
    );
};

export default DeploymentViewPageItem;
