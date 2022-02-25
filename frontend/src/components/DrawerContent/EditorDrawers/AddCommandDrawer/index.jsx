import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalFlowState } from '../../../../pages/Flow';

const AddCommandDrawer = ({ handleClose, setElements, refreshData }) => {
    // Local state
    const [commandInputs, setCommandInputs] = useState(1);

    // Flow state
    const FlowState = useGlobalFlowState();

    // React hook form
    const { register, handleSubmit, reset } = useForm();

    // Fill the form with selected element information
    useEffect(() => {
        const commands = FlowState.selectedElement?.data?.commands.get();
        const command_1 = commands.filter((a) => a.command_1).map((a) => a.command_1)[0];
        reset({ command_1 });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement?.data?.command_1.get()]);

    async function onSubmit(data) {
        setElements((els) =>
            els.map((el) => {
                if (el.id === FlowState.selectedElement.id.get()) {
                    el.data = {
                        ...el.data,
                        commands: [{ command_1: data.command_1 }],
                    };
                }
                return el;
            })
        );
        handleClose();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box position="relative" width="100%">
                <Box sx={{ p: '4.125rem 3.81rem' }}>
                    <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Box mt={3}>
                        <Typography component="h2" variant="h2">
                            Commands
                        </Typography>

                        {Array.from(Array(commandInputs)).map((ipts, idx) => (
                            <TextField
                                label={`Command ${idx + 1}`}
                                id={`Command ${idx + 1}`}
                                size="small"
                                required
                                sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                                {...register(`command_${idx + 1}`, { required: true })}
                            />
                        ))}

                        <Grid mt={4} display="flex" alignItems="center" justifyContent="space-between">
                            <Button variant="outlined" onClick={() => setCommandInputs(commandInputs + 1)} sx={{ backgroundColor: 'background.main', width: 103 }}>
                                Add
                            </Button>

                            <Button type="submit" variant="contained" color="primary" sx={{ width: 103 }}>
                                Save
                            </Button>
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default AddCommandDrawer;
