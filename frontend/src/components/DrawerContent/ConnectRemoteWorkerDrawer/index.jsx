import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, List, ListItem } from '@mui/material';
import { useEffect, useReducer } from 'react';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTheme } from '@emotion/react';
import { DateTime } from 'luxon';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useGetRemoteWorkerActivationKeys } from '../../../graphql/getRemoteWorkerActivationKeys';
import { useAddRemoteWorkerActivationKey } from '../../../graphql/addRemoteWorkerActivationKey';
import { useDeleteRemoteWorkerActivationKey } from '../../../graphql/deleteRemoteWorkerActivationKey';
import AlertDialog from './AlertDialog';
import { useSnackbar } from 'notistack';
import { customAlphabet } from 'nanoid';

let host = process.env.REACT_APP_DATAPLANE_ENDPOINT;
if (host === '') {
    host = window.location.origin;
}
const ConnectURL = `${host}/app/remoteworker/connect/`;

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
            return { ...state, storedKeys: state.storedKeys.filter((a) => a.activationKey !== action.value) };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

export default function ConnectRemoteWorkerDrawer({ handleClose, worker, environmentID }) {
    const theme = useTheme();

    const [state, dispatch] = useReducer(reducer, initialState);

    // Graphql Hooks
    const addRemoteWorkerActivationKey = useAddRemoteWorkerActivationKeyHook(environmentID, dispatch, worker[0]);
    const getRemoteWorkerActivationKeys = useGetRemoteWorkerActivationKeysHook(environmentID, dispatch, worker[0], addRemoteWorkerActivationKey);
    const deleteRemoteWorkerActivationKey = useDeleteRemoteWorkerActivationKeyHook(environmentID, dispatch);

    function onGenerateKey() {
        const expiresAt = state.expiration === 0 ? null : DateTime.now().plus({ months: state.expiration }).toISO();
        addRemoteWorkerActivationKey(expiresAt);
    }

    useEffect(() => {
        getRemoteWorkerActivationKeys();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentID]);

    return (
        <Box pt={4} pl={4} pr={4}>
            <Box display="flex" alignItems="center" width="820px">
                <Typography variant="h2" fontSize="1.25rem">
                    Connect RPA Worker {'> ' + worker[1]}
                </Typography>

                <Button
                    onClick={handleClose}
                    style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: 'auto' }}
                    variant="text"
                    startIcon={<FontAwesomeIcon icon={faTimes} />}>
                    Close
                </Button>
            </Box>
            <Typography variant="h3" fontSize="1.1875rem" fontWeight={700} mt={6}>
                Steps to connect
            </Typography>
            <Typography fontSize="0.8125rem" mt={3}>
                1. Download and install a RPA worker to your computer -
                <Typography fontSize="0.8125rem" color="primary.main" sx={{ cursor: 'pointer', display: 'inline' }}>
                    {' '}
                    download link
                </Typography>
            </Typography>
            <Typography fontSize="0.8125rem" mt={2}>
                2. To connect, the RPA worker will ask for a Dataplane Connect URL and access key
            </Typography>

            <Typography variant="h4" fontSize="0.9375rem" fontWeight={700} mt={6}>
                Dataplane Connect URL
            </Typography>
            <Box display="flex" alignItems="center">
                <Typography lineHeight={1.875}>{ConnectURL + worker[0]}</Typography>
                <Button
                    onClick={() => navigator.clipboard.writeText(ConnectURL + worker[0])}
                    type="submit"
                    variant="contained"
                    size="small"
                    color="primary"
                    sx={{ background: '#8a8a8a' }}
                    style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: '16px' }}>
                    Copy URL
                </Button>
            </Box>

            <Typography fontSize="0.8125rem" mt={6}>
                3. Create an activation key. On creation, this key is only shown once.
            </Typography>

            <Box display="flex" alignItems="center" mt={6} width="800px">
                <Typography variant="h4" fontSize="0.9375rem" fontWeight={700} alignSelf="end">
                    Activation key
                </Typography>
                <FormControl sx={{ marginLeft: 'auto', width: '220px' }}>
                    <InputLabel id="key-label">Expires in</InputLabel>
                    <Select
                        sx={{ height: '32px' }}
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
                <Button
                    size="small"
                    onClick={onGenerateKey}
                    type="submit"
                    variant="contained"
                    color="primary"
                    style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: '20px' }}>
                    Generate key
                </Button>
            </Box>

            <List sx={{ width: '800px', marginTop: '8px' }}>
                {state.storedKeys.map((activationKey, idx) => (
                    <ListItem
                        key={activationKey.activationKey}
                        sx={{
                            borderTop: '1px solid #BABABA',
                            paddingLeft: 0,
                            borderBottom: idx === state.storedKeys.length - 1 ? '1px solid #BABABA' : null,
                        }}>
                        <Typography sx={{ background: activationKey.activationKeyTail ? 'null' : theme.palette.apiKey.background, borderRadius: '6px', padding: '5px 15px' }}>
                            {formatActivationKey(activationKey)}
                        </Typography>
                        <Typography ml={0} position="absolute" left="245px">
                            {formatDate(activationKey.expiresAt)}
                        </Typography>
                        {activationKey.activationKeyTail ? (
                            <Box
                                onClick={() => {
                                    dispatch({ type: 'set', key: 'openDialog', value: true });
                                    dispatch({ type: 'set', key: 'keyToBeDeleted', value: { key: activationKey.activationKey, tail: activationKey.activationKeyTail } });
                                }}
                                component={FontAwesomeIcon}
                                ml="auto"
                                sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                icon={faTrashAlt}
                            />
                        ) : (
                            <Button
                                onClick={() => navigator.clipboard.writeText(activationKey.activationKey)}
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
                    deleteKey={deleteRemoteWorkerActivationKey}
                    keyToBeDeleted={state.keyToBeDeleted}
                />
            ) : null}
        </Box>
    );
}

function formatActivationKey(activationKey) {
    if (activationKey.activationKeyTail) {
        return `*****-*****-*****-${activationKey.activationKeyTail}`;
    }
    return activationKey.activationKey;
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

// ------ Custom Hooks
const useGetRemoteWorkerActivationKeysHook = (environmentID, dispatch, remoteWorkerID, addRemoteWorkerActivationKey) => {
    // GraphQL hook
    const getRemoteWorkerActivationKeys = useGetRemoteWorkerActivationKeys();

    const { enqueueSnackbar } = useSnackbar();

    // Get access groups
    return async () => {
        const response = await getRemoteWorkerActivationKeys({ remoteWorkerID, environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get activation keys: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            if (response?.length === 0) {
                addRemoteWorkerActivationKey(DateTime.now().plus({ months: 12 }).toISO());
            }
            dispatch({ type: 'set', key: 'storedKeys', value: response });
        }
    };
};

const useAddRemoteWorkerActivationKeyHook = (environmentID, dispatch, workerID) => {
    // GraphQL hook
    const addRemoteWorkerActivationKey = useAddRemoteWorkerActivationKey();

    const { enqueueSnackbar } = useSnackbar();

    // Get access groups
    return async (expiresAt) => {
        const newKey = {
            workerID,
            environmentID,
            activationKey: generateKey(),
            expiresAt,
        };
        const response = await addRemoteWorkerActivationKey(newKey);

        if (response.r || response.error) {
            enqueueSnackbar("Can't add activation key: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            dispatch({ type: 'addKey', value: newKey });
        }
    };
};

const useDeleteRemoteWorkerActivationKeyHook = (environmentID, dispatch) => {
    // GraphQL hook
    const deleteRemoteWorkerActivationKey = useDeleteRemoteWorkerActivationKey();

    const { enqueueSnackbar } = useSnackbar();

    // Get access groups
    return async (activationKey) => {
        const newKey = { environmentID, activationKey };
        const response = await deleteRemoteWorkerActivationKey(newKey);

        if (response.r || response.error) {
            enqueueSnackbar("Can't delete activation key: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            dispatch({ type: 'deleteKey', value: activationKey });
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
