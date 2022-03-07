import { MenuItem } from '@mui/material';
import { useHistory } from 'react-router-dom';
import { useGlobalFlowState } from '../../../pages/Flow';

const ViewPageItem = (props) => {
    const history = useHistory();

    // Global state
    const FlowState = useGlobalFlowState();

    // Handle edit button
    const handleGoToEditorPage = () => {
        FlowState.isEditorPage.set(true);
        history.push({ pathname: `/pipelines/flow/${props.pipeline.pipelineID}`, state: props.pipeline });
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Run
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleGoToEditorPage}>
                Edit
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Deploy
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Turn off
            </MenuItem>
        </>
    );
};

export default ViewPageItem;
