import * as React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Autocomplete, Button, TextField, Typography } from '@mui/material';
import { useTheme } from '@emotion/react';
import { useAddUpdateRemotePackages } from '../../../../graphql/addUpdateRemotePackages';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';
import { useGetRemotePackages } from '../../../../graphql/getRemotePackages';
import { useGlobalEnvironmentsState } from '../../../../components/EnviromentDropdown';

export default function Packages({ remotePackages, setRemotePackages }) {
    const [env, setEnv] = React.useState(null);
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [pkgText, setPkgText] = React.useState('');

    const inputRef = React.useRef(null);

    // Custom GraphQL hooks
    const getRemotePackages = useGetRemotePackagesHook(setRemotePackages);
    const updateRemotePackages = useAddUpdateRemotePackagesHook(getRemotePackages);

    // Set first environment as default on page load and update if gets removed
    React.useEffect(() => {
        if (remotePackages.length > 0) {
            // Change selected package only if the environment is removed
            if (!remotePackages.find((a) => a.EnvironmentID === env?.EnvironmentID)) {
                setEnv(remotePackages[0]);
            }
        }
    }, [env?.EnvironmentID, remotePackages]);

    // Set packages text on page load and environment change
    React.useEffect(() => {
        if (remotePackages.length > 0 && env) {
            // Set the package text of the selected environment
            if (remotePackages.find((a) => a.EnvironmentID === env.EnvironmentID)) {
                setPkgText(remotePackages.find((a) => a.EnvironmentID === env.EnvironmentID).Packages);
            } else {
                // Set the package text of the next environment inline, if an environment gets removed
                setEnv(remotePackages[0]);
            }
        }
    }, [remotePackages, env]);

    // Set focus on text area on edit click
    React.useEffect(() => {
        if (isEditMode) {
            inputRef.current.focus();
        }
    }, [isEditMode]);

    const { palette } = useTheme();
    return (
        <>
            <Box display="flex" gap={1}>
                <FormControl fullWidth size="small">
                    <Select //
                        defaultValue="python"
                        labelId="lang-select-label"
                        id="lang-select"
                        value="python">
                        <MenuItem value={'python'}>Python</MenuItem>
                    </Select>
                </FormControl>
                <Autocomplete
                    disablePortal
                    id="available_environments_autocomplete"
                    fullWidth
                    options={remotePackages}
                    disableClearable
                    disabled={remotePackages.length === 0}
                    getOptionLabel={(option) => option.Name}
                    value={env}
                    onChange={(e, v) => setEnv(v)}
                    renderInput={(params) => (
                        <TextField
                            {...params} //
                            id="environment"
                            size="small"
                            sx={{ fontSize: '.75rem', display: 'flex' }}
                        />
                    )}
                />
            </Box>
            <Box position="relative" mt={1}>
                <Box position="absolute" display="flex" alignItems="center" width="100%" zIndex={1}>
                    <Typography variant="subtitle1" fontWeight={700} ml="14px">
                        Python packages
                    </Typography>
                    {isEditMode ? (
                        <Button
                            variant="text"
                            sx={{ ml: 'auto' }}
                            disableRipple
                            onClick={() => {
                                updateRemotePackages(env, pkgText);
                                setIsEditMode(false);
                            }}>
                            Save
                        </Button>
                    ) : (
                        <Button
                            variant="text"
                            sx={{ ml: 'auto' }}
                            disableRipple
                            onClick={() => {
                                setIsEditMode(true);
                            }}>
                            Edit
                        </Button>
                    )}
                </Box>
            </Box>
            <TextField //
                id="outlined-multiline-flexible"
                multiline
                maxRows={20}
                minRows={20}
                fullWidth
                inputRef={inputRef}
                InputProps={{ sx: { fontSize: '0.75rem', pt: 5 } }}
                sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: palette.text.primary, color: palette.text.primary } }}
                onChange={(e) => setPkgText(e.target.value)}
                disabled={!isEditMode}
                value={pkgText}
            />
        </>
    );
}

// ----------- Custom Hooks --------------------------------
const useGetRemotePackagesHook = (setRemotePackages) => {
    // GraphQL hook
    const getRemotePackages = useGetRemotePackages();

    const globalEnvironmentsWithName = useGlobalEnvironmentsState();

    const { groupId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async (environmentID) => {
        const response = await getRemotePackages({ environmentID, ID: groupId });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get remote packages: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            let namedResponse = response.map((packages) => ({
                ...packages,
                Name: globalEnvironmentsWithName.get().find((env) => env.id === packages.EnvironmentID).name,
            }));
            setRemotePackages(namedResponse);
        }
    };
};

export const useAddUpdateRemotePackagesHook = (getRemotePackages) => {
    // GraphQL hook
    const addUpdateRemotePackages = useAddUpdateRemotePackages();

    const { enqueueSnackbar } = useSnackbar();

    // Add remote package
    return async (data, pkgText) => {
        const dataFinal = {
            environmentID: data.EnvironmentID,
            remoteProcessGroupID: data.RemoteProcessGroupID,
            packages: pkgText,
            language: data.Language,
        };

        const response = await addUpdateRemotePackages(dataFinal);

        if (response.r || response.error) {
            enqueueSnackbar("Can't get remote packages: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getRemotePackages(data.EnvironmentID);
        }
    };
};
