import { Box, Button, FormControl, InputLabel, List, ListItem, MenuItem, Select, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { IOSSwitch } from '../../SchedulerDrawer/IOSSwitch';
import { customAlphabet } from 'nanoid';
import { DateTime } from 'luxon';
import { useAddPipelineApiKey } from '../../../../graphql/addPipelineApiKey';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useGetPipelineApiKeys } from '../../../../graphql/getPipelineApiKeys';
import { useDeletePipelineApiKey } from '../../../../graphql/deletePipelineApiKey';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import AlertDialog from './AlertDialog';

export default function ApiKey({ apiKeyActive, setApiKeyActive, environmentID, triggerID }) {
    const [storedKeys, setStoredKeys] = useState([]);

    const [expiration, setExpiration] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [keyToBeDeleted, setKeyToBeDeleted] = useState(null);

    const addPipelineApiKey = useAddPipelineApiKeyHook(environmentID, triggerID, setStoredKeys);
    const getPipelineApiKeys = useGetPipelineApiKeysHook(environmentID, setStoredKeys);
    const deletePipelineApiKey = useDeletePipelineApiKeyHook(environmentID, setStoredKeys);

    useEffect(() => {
        getPipelineApiKeys();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentID]);

    function onGenerateKey() {
        const expiresAt = expiration === 0 ? null : DateTime.now().plus({ months: expiration }).toISO();
        addPipelineApiKey(expiresAt);
    }

    return (
        <Box>
            <Typography variant="body1" fontSize="1.1875rem" lineHeight={2}>
                API Key (optional)
            </Typography>
            <Typography maxWidth={1000}>
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
                    onClick={() => setApiKeyActive(!apiKeyActive)}
                    checked={apiKeyActive}
                    inputProps={{ 'aria-label': 'controlled' }}
                />
                <Typography fontSize={13} ml={1.5} color={apiKeyActive ? 'cyan.main' : 'text.primary'}>
                    {apiKeyActive ? 'Use an API key' : 'No key'}
                </Typography>
            </Box>
            <Box display="flex" alignItems="center" mt={3}>
                <Typography fontSize="1.1875rem">Create key</Typography>

                <FormControl sx={{ marginLeft: '40px', width: '220px' }}>
                    <InputLabel id="demo-simple-select-label">Expires in</InputLabel>
                    <Select size="small" labelId="select-expiration-label" value={expiration} label="Expires in" onChange={(e) => setExpiration(e.target.value)}>
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
            <List sx={{ width: '800px', marginTop: '8px' }}>
                {storedKeys.map((apiKey, idx) => (
                    <ListItem
                        sx={{
                            borderTop: '1px solid #BABABA',
                            paddingLeft: 0,
                            borderBottom: idx === storedKeys.length - 1 ? '1px solid #BABABA' : null,
                        }}>
                        <Typography sx={{ background: apiKey.apiKeyTail ? 'null' : '#EEE', borderRadius: '6px', padding: '5px 15px' }}>{formatAPIKey(apiKey)}</Typography>
                        <Typography ml={0} position="absolute" left="245px">
                            {formatDate(apiKey.expiresAt)}
                        </Typography>
                        {apiKey.apiKeyTail ? (
                            <Box
                                onClick={() => {
                                    setOpenDialog(true);
                                    setKeyToBeDeleted({ key: apiKey.apiKey, tail: apiKey.apiKeyTail });
                                    // return deletePipelineApiKey(apiKey.apiKey);
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
            {keyToBeDeleted ? (
                <AlertDialog
                    openDialog={openDialog} //
                    handleClose={() => setOpenDialog(false)}
                    deleteKey={deletePipelineApiKey}
                    keyToBeDeleted={keyToBeDeleted}
                />
            ) : null}
        </Box>
    );
}

// Graphql hooks
const useAddPipelineApiKeyHook = (environmentID, triggerID, setStoredKeys) => {
    // GraphQL hook
    const addPipelineApiKey = useAddPipelineApiKey();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get access groups
    return async (expiresAt) => {
        const newKey = {
            pipelineID: pipelineId,
            environmentID,
            triggerID,
            apiKey: generateKey(),
            expiresAt,
        };
        const response = await addPipelineApiKey(newKey);

        if (response.r || response.error) {
            enqueueSnackbar("Can't add api key: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // enqueueSnackbar('Success', { variant: 'success' });
            setStoredKeys((k) => [newKey, ...k]);
        }
    };
};

const useDeletePipelineApiKeyHook = (environmentID, setStoredKeys) => {
    // GraphQL hook
    const deletePipelineKey = useDeletePipelineApiKey();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get access groups
    return async (apiKey) => {
        const newKey = {
            pipelineID: pipelineId,
            environmentID,
            apiKey,
        };
        const response = await deletePipelineKey(newKey);

        if (response.r || response.error) {
            enqueueSnackbar("Can't delete api key: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setStoredKeys((k) => k.filter((a) => a.apiKey !== apiKey));
        }
    };
};

const useGetPipelineApiKeysHook = (environmentID, setStoredKeys) => {
    // GraphQL hook
    const getPipelineApiKeys = useGetPipelineApiKeys();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get access groups
    return async () => {
        const response = await getPipelineApiKeys({ pipelineID: pipelineId, environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get api keys: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setStoredKeys(response);
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
