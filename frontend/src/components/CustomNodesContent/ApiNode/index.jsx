import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect, useState } from 'react';
import { Handle } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../pages/Flow';
import customNodeStyle from '../../../utils/customNodeStyle';
import ApiTriggerNodeItem from '../../MoreInfoContent/APITriggerNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';

const ApiNode = (props) => {
    // Global state
    const FlowState = useGlobalFlowState();

    const [isEditorPage, setIsEditorPage] = useState(false);
    const [, setIsSelected] = useState(false);

    useEffect(() => {
        setIsEditorPage(FlowState.isEditorPage.get());
        setIsSelected(FlowState.selectedElementId.get() === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setIsEditorPage(FlowState.isEditorPage.get());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isEditorPage.get()]);

    useEffect(() => {
        setIsSelected(FlowState.selectedElementId.get() === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElementId.get()]);

    return (
        <Box sx={{ ...customNodeStyle }}>
            <Handle type="source" position="right" id="schedule" style={{ backgroundColor: 'red', height: 10, width: 10 }} />

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

            {isEditorPage && (
                <Grid position="absolute" bottom={2} right={9} container wrap="nowrap" width="auto" alignItems="center" justifyContent="space-between">
                    <Box mt={2}>
                        <MoreInfoMenu iconHorizontal iconColor="#0073C6" iconColorDark="#0073C6" iconSize={19} noPadding>
                            <ApiTriggerNodeItem />
                        </MoreInfoMenu>
                    </Box>
                </Grid>
            )}
        </Box>
    );
};

export default ApiNode;
