import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Handle } from 'react-flow-renderer';
import customNodeStyle from '../../../utils/customNodeStyle';

const PlayNode = () => {
    return (
        <Box sx={{ ...customNodeStyle }}>
            <Handle type="source" position="right" id="play" style={{ backgroundColor: 'red', right: -0.7 }} />
            <Grid container alignItems="flex-start" wrap="nowrap">
                <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faPlayCircle} />
                <Grid item ml={1.5} textAlign="left">
                    <Typography fontSize={11} fontWeight={900}>
                        Play trigger
                    </Typography>

                    <Typography fontSize={10} mt={1}>
                        Press play to run
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PlayNode;
