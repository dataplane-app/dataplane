import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import { useGlobalEnvironmentsState } from '../../../../components/EnviromentDropdown';

export default function Environments({ environmentId, workerEnvironment, setWorkerEnvironment }) {
    // Environments global state
    const globalEnvironments = useGlobalEnvironmentsState();

    return globalEnvironments.get().length > 0 && environmentId ? (
        <Box mb={5}>
            <Typography component="h3" variant="h3" color="text.primary">
                Environments
            </Typography>

            <Box style={{ marginTop: '16px', display: 'flex', alignItems: 'center' }}>
                <Autocomplete
                    disablePortal
                    id="available_environments_autocomplete"
                    sx={{ minWidth: '280px' }}
                    options={globalEnvironments.get()}
                    disableClearable
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={workerEnvironment}
                    onChange={(_, value) => setWorkerEnvironment(value)}
                    renderInput={(params) => (
                        <TextField
                            {...params} //
                            label="Environments"
                            id="environment"
                            size="small"
                            sx={{ fontSize: '.75rem', display: 'flex' }}
                        />
                    )}
                />
            </Box>
        </Box>
    ) : null;
}
