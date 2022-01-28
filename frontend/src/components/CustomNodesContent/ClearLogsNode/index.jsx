import { faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { Handle } from 'react-flow-renderer';
import ClearLogsNodeItem from '../../MoreInfoContent/ClearLogsNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';

const ClearLogsNode = () => {
    return (
        <Box sx={{ padding: '10px 15px', width: 160, borderRadius: '10px', border: `3px solid #0073C6` }}>
            <Handle type="source" position="left" id="clear" style={{ backgroundColor: 'red', left: -0.7 }} />
            <Grid container alignItems="flex-start" wrap="nowrap" pb={2}>
                <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faRunning} />
                <Grid item ml={1.5} textAlign="left">
                    <Typography fontSize={11} fontWeight={900}>
                        Clear the logs
                    </Typography>

                    <Typography fontSize={9} mt={0.4}>
                        This process cleans down the logs
                    </Typography>
                </Grid>
            </Grid>

            <Grid position="absolute" bottom={2} left={9} right={9} container wrap="nowrap" width="auto" alignItems="center" justifyContent="space-between">
                <Grid item>
                    <Typography fontSize={8}>Python</Typography>
                </Grid>

                <Box mt={0}>
                    <MoreInfoMenu iconHorizontal iconColor="#0073C6" iconColorDark="#0073C6" iconSize={19} noPadding>
                        <ClearLogsNodeItem />
                    </MoreInfoMenu>
                </Box>
            </Grid>
        </Box>
    );
};

export default ClearLogsNode;
