import { Box, Grid, Typography } from '@mui/material';
import { useGlobalEnvironmentsState, useGlobalEnvironmentState } from '../../../../components/EnviromentDropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useRemoveRemoteWorkerFromProcessGroup } from '../../../../graphql/remoteworkers/removeRemoteWorkerFromProcessGroup.js';
import { useSnackbar } from 'notistack';
import { useParams, useHistory } from 'react-router-dom';

export default function Environments({ workersProcessGroups, getRemoteWorkersProcessGroups }) {
    // Environments global state
    const globalEnvironments = useGlobalEnvironmentsState();

    const history = useHistory();

    // Graphql Hooks
    const removeRemoteWorkerFromProcessGroup = useRemoveRemoteWorkerFromProcessGroupHook(getRemoteWorkersProcessGroups);

    return (
        <Box mb={5}>
            <Typography variant="h3">Process groups</Typography>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Process groups attached to environments
            </Typography>
            {workersProcessGroups
                // Filters by unique environment id so each environment header is displayed once
                .filter((item, index, arr) => arr.indexOf(arr.find((a) => a.environmentID === item.environmentID)) === index)
                .map((env, idx) => (
                    <div key={env.environmentID}>
                        <Typography variant="h3" fontSize=".8125rem" mt={idx === 1 && 3}>
                            Environment: {globalEnvironments.get().find((e) => e.id === env.environmentID).name}
                        </Typography>
                        {workersProcessGroups
                            .filter((group) => group.environmentID === env.environmentID)
                            .map((row) => (
                                <Grid display="flex" alignItems="flex-start" key={row.name} mt={1.5} mb={1.5}>
                                    <Box
                                        onClick={() => {
                                            removeRemoteWorkerFromProcessGroup(row);
                                        }}
                                        component={FontAwesomeIcon}
                                        sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                        icon={faTrashAlt}
                                    />
                                    <Box>
                                        <Typography
                                            onClick={() => history.push(`/remote/processgroups/${row.remoteProcessGroupID}`)}
                                            variant="subtitle2"
                                            lineHeight="15.23px"
                                            color="primary"
                                            fontWeight="900"
                                            sx={{ cursor: 'pointer' }}>
                                            {row.name}
                                        </Typography>
                                        <Typography variant="subtitle2" mt={1} lineHeight={1.1}>
                                            {row.description}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                    </div>
                ))}

            <Box style={{ marginTop: '16px', display: 'flex', alignItems: 'center' }}></Box>
        </Box>
    );
}

// ** Custom Hooks
const useRemoveRemoteWorkerFromProcessGroupHook = (getRemoteWorkersProcessGroups) => {
    // GraphQL hook
    const removeRemoteWorkerFromProcessGroup = useRemoveRemoteWorkerFromProcessGroup();

    const Environment = useGlobalEnvironmentState();

    const { enqueueSnackbar } = useSnackbar();

    const { workerId } = useParams();

    // Delete a remote environment
    return async (data) => {
        const remoteProcessGroupID = data.remoteProcessGroupID;
        const environmentID = Environment.id.get();
        const processGroupsEnvironmentID = data.environmentID;
        const response = await removeRemoteWorkerFromProcessGroup({ environmentID, processGroupsEnvironmentID, remoteProcessGroupID, workerID: workerId });

        if (response.r || response.error) {
            enqueueSnackbar("Can't delete remote environment: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getRemoteWorkersProcessGroups();
        }
    };
};
