import { Box, Button, FormControl, InputLabel, List, ListItem, MenuItem, Select, Typography, useTheme } from '@mui/material';
import { useEffect, useReducer } from 'react';
import { IOSSwitch } from '../../../Pipelines/Components/Drawers/SchedulerDrawer/IOSSwitch.jsx';
import { customAlphabet } from 'nanoid';
import { DateTime } from 'luxon';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import AlertDialog from './AlertDialog.jsx';
import { useAddDeploymentApiKey } from '../../../../graphql/deployments/addDeploymentApiKey.js';
import { useGetDeploymentApiKeys } from '../../../../graphql/deployments/getDeploymentApiKeys.js';
import { useDeleteDeploymentApiKey } from '../../../../graphql/deployments/deleteDeploymentApiKey.js';

const initialState = {
    storedKeys: [],
    expiration: 0,
    openDialog: false,
    keyToBeDeleted: null,
};

function reducer(state, action) {
    switch (action.type) {
        case 'set':
            return { ...state, [action.key]: action.value };
        case 'addKey':
            return { ...state, storedKeys: [action.value, ...state.storedKeys] };
        case 'deleteKey':
            return { ...state, storedKeys: state.storedKeys.filter((a) => a.apiKey !== action.value) };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

export default function ApiKey({ apiKeyActive, generateDeploymentTrigger, environmentID, triggerID }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const addDeploymentApiKey = useAddDeploymentApiKeyHook(environmentID, triggerID, dispatch);
    const getDeploymentApiKeys = useGetDeploymentApiKeysHook(environmentID, dispatch);
    const deleteDeploymentApiKey = useDeleteDevelopmentApiKeyHook(environmentID, dispatch);

    useEffect(() => {
        getDeploymentApiKeys();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentID]);

    function onGenerateKey() {
        const expiresAt = state.expiration === 0 ? null : DateTime.now().plus({ months: state.expiration }).toISO();
        addDeploymentApiKey(expiresAt);
    }

    const theme = useTheme();

    return (
        <Box>
            <Typography variant="body1" fontSize="1.0625rem" lineHeight={2}>
                API Key (optional)
            </Typography>
            <Typography maxWidth={1000} fontSize="0.75rem">
                Enable an API key for additional security. The key will only be shown once. New keys can be created or rotated using the generate key button. A new key will not
                replace an old key, this allows you to rotate your keys without disruption to service. You can allow keys to expire or remove old keys. Once a key expires, it will
                deny access on that key.
            </Typography>

            <Box display="flex" alignItems="center" mt={3}>
                <IOSSwitch
                    sx={{
                        '.MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: 'primary.main',
                        },
                        '.MuiSwitch-track': {
                            backgroundColor: '#8a8a8a',
                            color: '#8a8a8a',
                            opacity: 0.5,
                            border: 0,
                        },
                    }}
                    onClick={() => generateDeploymentTrigger({ apiKeyActive: !apiKeyActive })}
                    checked={apiKeyActive}
                    inputProps={{ 'aria-label': 'controlled' }}
                />
                <Typography fontSize={13} ml={1.5} color={apiKeyActive ? 'cyan.main' : 'text.primary'}>
                    {apiKeyActive ? 'Use an API key' : 'No key'}
                </Typography>
            </Box>
            {(apiKeyActive === true || state.storedKeys.length) > 0 && (
                <Box display="flex" alignItems="center" mt={3}>
                    <Typography fontSize="1.0625rem">Create key</Typography>

                    <FormControl sx={{ marginLeft: '40px', width: '220px' }}>
                        <InputLabel id="demo-simple-select-label">Expires in</InputLabel>
                        <Select
                            size="small"
                            labelId="select-expiration-label"
                            value={state.expiration}
                            label="Expires in"
                            onChange={(e) => dispatch({ type: 'set', key: 'expiration', value: e.target.value })}>
                            <MenuItem value={0}>never</MenuItem>
                            <MenuItem value={3}>3 months</MenuItem>
                            <MenuItem value={6}>6 months</MenuItem>
                            <MenuItem value={9}>9 months</MenuItem>
                            <MenuItem value={12}>12 months</MenuItem>
                            <MenuItem value={24}>24 months</MenuItem>
                        </Select>
                    </FormControl>
                    <Button onClick={onGenerateKey} type="submit" variant="contained" color="primary" style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: '20px' }}>
                        Generate key
                    </Button>
                </Box>
            )}

            <List sx={{ width: '800px', marginTop: '8px' }}>
                {state.storedKeys.map((apiKey, idx) => (
                    <ListItem
                        key={apiKey.apiKey}
                        sx={{
                            borderTop: '1px solid #BABABA',
                            paddingLeft: 0,
                            borderBottom: idx === state.storedKeys.length - 1 ? '1px solid #BABABA' : null,
                        }}>
                        <Typography sx={{ background: apiKey.apiKeyTail ? 'null' : theme.palette.apiKey.background, borderRadius: '6px', padding: '5px 15px' }}>
                            {formatAPIKey(apiKey)}
                        </Typography>
                        <Typography ml={0} position="absolute" left="245px">
                            {formatDate(apiKey.expiresAt)}
                        </Typography>
                        {apiKey.apiKeyTail ? (
                            <Box
                                onClick={() => {
                                    dispatch({ type: 'set', key: 'openDialog', value: true });
                                    dispatch({ type: 'set', key: 'keyToBeDeleted', value: { key: apiKey.apiKey, tail: apiKey.apiKeyTail } });
                                }}
                                component={FontAwesomeIcon}
                                ml="auto"
                                sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                icon={faTrashAlt}
                            />
                        ) : (
                            <Button
                                onClick={() => navigator.clipboard.writeText(apiKey.apiKey)}
                                type="submit"
                                variant="contained"
                                color="primary"
                                sx={{ background: '#8a8a8a' }}
                                style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: 'auto' }}>
                                Copy key
                            </Button>
                        )}
                    </ListItem>
                ))}
            </List>
            {state.keyToBeDeleted ? (
                <AlertDialog
                    openDialog={state.openDialog}
                    handleClose={() => dispatch({ type: 'set', key: 'openDialog', value: false })}
                    deleteKey={deleteDeploymentApiKey}
                    keyToBeDeleted={state.keyToBeDeleted}
                />
            ) : null}
        </Box>
    );
}

// Graphql hooks
const useAddDeploymentApiKeyHook = (environmentID, triggerID, dispatch) => {
    // GraphQL hook
    const addDeploymentApiKey = useAddDeploymentApiKey();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get access groups
    return async (expiresAt) => {
        const newKey = {
            deploymentID: 'd-' + pipelineId,
            environmentID,
            triggerID,
            apiKey: generateKey(),
            expiresAt,
        };
        const response = await addDeploymentApiKey(newKey);

        if (response.r || response.error) {
            enqueueSnackbar("Can't add api key: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            dispatch({ type: 'addKey', value: newKey });
        }
    };
};

const useDeleteDevelopmentApiKeyHook = (environmentID, dispatch) => {
    // GraphQL hook
    const deleteDeploymentKey = useDeleteDeploymentApiKey();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get access groups
    return async (apiKey) => {
        const newKey = {
            deploymentID: 'd-' + pipelineId,
            environmentID,
            apiKey,
        };
        const response = await deleteDeploymentKey(newKey);

        if (response.r || response.error) {
            enqueueSnackbar("Can't delete api key: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            dispatch({ type: 'deleteKey', value: apiKey });
        }
    };
};

const useGetDeploymentApiKeysHook = (environmentID, dispatch) => {
    // GraphQL hook
    const getDeploymentApiKeys = useGetDeploymentApiKeys();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get access groups
    return async () => {
        const response = await getDeploymentApiKeys({ deploymentID: 'd-' + pipelineId, environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get api keys: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            dispatch({ type: 'set', key: 'storedKeys', value: response });
        }
    };
};

// Helper functions
/**
 * returns an id like pTBXM-mo3xz-1evAl-O30Pd
 */
function generateKey() {
    const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 5);
    return `${nanoid()}-${nanoid()}-${nanoid()}-${nanoid()}`;
}

function formatAPIKey(apiKey) {
    if (apiKey.apiKeyTail) {
        return `*****-*****-*****-${apiKey.apiKeyTail}`;
    }
    return apiKey.apiKey;
}

function formatDate(date) {
    if (!date) return 'Never expires';

    const expiresAt = DateTime.fromISO(date);
    const diff = expiresAt.diff(DateTime.now(), ['months', 'days', 'hours']);
    const monthString = diff.months === 0 ? '' : diff.months === 1 ? `${diff.months} month` : `${diff.months} months`;
    const dayString = diff.days === 0 ? '' : diff.days === 1 ? ` ${diff.days} day` : ` ${diff.days} days`;
    const diffString = `(${monthString + dayString})`;

    return `Expires on the ${DateTime.fromISO(date).toFormat('dd LLLL yyyy')} ${diffString}`;
}
