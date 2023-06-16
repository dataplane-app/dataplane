import * as React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Button, TextField, Typography } from '@mui/material';
import { useTheme } from '@emotion/react';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';
import { useGlobalEnvironmentState } from '../../../../components/EnviromentDropdown';
import { useUpdateRemoteProcessGroup } from '../../../../graphql/updateRemoteProcessGroup';

export default function Packages({ remoteProcessGroup, getSingleRemoteProcessGroup }) {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [pkgText, setPkgText] = React.useState(remoteProcessGroup?.packages);

    const inputRef = React.useRef(null);

    const Environment = useGlobalEnvironmentState();

    // Custom Hook
    const updateRemoteProcessGroup = useUpdateRemoteProcessGroupHook(Environment.id.get(), remoteProcessGroup, getSingleRemoteProcessGroup);

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
                                updateRemoteProcessGroup(pkgText);
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
            <TextField
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

// -------------------- Custom Hook --------------------------
export const useUpdateRemoteProcessGroupHook = (environmentID, remoteProcessGroup, getSingleRemoteProcessGroup) => {
    // GraphQL hook
    const updateRemoteProcessGroup = useUpdateRemoteProcessGroup();

    const { enqueueSnackbar } = useSnackbar();

    const { groupId } = useParams();

    // Update process group
    return async (pkgText) => {
        const dataFinal = {
            environmentID,
            remoteProcessGroupID: groupId,
            name: remoteProcessGroup.name,
            description: remoteProcessGroup.description,
            active: remoteProcessGroup.active,
            packages: pkgText,
            language: remoteProcessGroup.language,
        };

        const response = await updateRemoteProcessGroup(dataFinal);

        if (response.r || response.error) {
            enqueueSnackbar("Can't update remote process group: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getSingleRemoteProcessGroup();
        }
    };
};
