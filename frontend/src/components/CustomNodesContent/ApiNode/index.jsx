import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Handle } from 'react-flow-renderer';
import customNodeStyle from '../../../utils/customNodeStyle';

const ApiNode = () => {
    return (
        <Box sx={{ ...customNodeStyle }}>
            <Handle type="source" position="right" id="schedule" style={{ backgroundColor: 'red', right: -0.7 }} />

            <Grid container alignItems="flex-start" wrap="nowrap">
                <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faGlobe} />
                <Grid item ml={1.5} textAlign="left">
                    <Typography fontSize={11} fontWeight={900}>
                        API trigger
                    </Typography>

                    <Typography fontSize={10} mt={1}>
                        Receive webhooks and API calls.
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ApiNode;
