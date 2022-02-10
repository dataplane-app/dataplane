import { MenuItem } from '@mui/material';
import { useGlobalFlowState } from '../../../pages/Flow';

const PlayTriggerNodeItem = (props) => {
    const FlowState = useGlobalFlowState();

    const handleRemove = () => {
        props.handleCloseMenu();
        console.log(FlowState.elements.get());
    };

    return (
        <>
            <MenuItem sx={{ color: 'error.main' }} onClick={handleRemove}>
                Remove
            </MenuItem>
        </>
    );
};

export default PlayTriggerNodeItem;
