import { MenuItem } from '@mui/material';

const PipelinePageItem = (props) => {
    const refreshClick = () => {
        props.handleCloseMenu();
        props.handleRefresh();
    };

    return (
        <MenuItem sx={{ color: 'cyan.main' }} onClick={refreshClick}>
            Refresh all
        </MenuItem>
    );
};

export default PipelinePageItem;
