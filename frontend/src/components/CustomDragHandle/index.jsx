import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Box } from '@mui/material';

const CustomDragHandle = ({ bottom = 8, left = 8, color = 'editorPage.tabTextColorNotActive' }) => {
    return (
        <Grid container alignItems="center" sx={{ position: 'absolute', bottom, left, cursor: 'pointer' }} className="drag-handle">
            <Box component={FontAwesomeIcon} icon={faEllipsisV} sx={{ fontSize: 17, color }} />
            <Box component={FontAwesomeIcon} icon={faEllipsisV} sx={{ fontSize: 17, color }} />
            <Box component={FontAwesomeIcon} icon={faEllipsisV} sx={{ fontSize: 17, color }} />
        </Grid>
    );
};

export default CustomDragHandle;
