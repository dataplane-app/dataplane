import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalFlowState } from '../../../pages/Flow';
import { Downgraded } from '@hookstate/core';

const ProcessTypeDrawer = ({ handleClose, setElements }) => {
    const [selectedElement, setSelectedElement] = useState('-');
    const { register, handleSubmit, reset } = useForm();

    const FlowState = useGlobalFlowState();

    useEffect(() => {
        setSelectedElement(FlowState.selectedElement.attach(Downgraded).get());
        reset({
            name: FlowState.selectedElement.data?.name.get(),
            description: FlowState.selectedElement.data?.description.get(),
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement?.data?.name.get()]);

    async function onSubmit(data) {
        setElements((els) =>
            els.map((el) => {
                if (el.id === selectedElement.id) {
                    el.data = {
                        ...el.data,
                        name: data.name,
                        description: data.description,
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

                    <Box mt={3} width="212px">
                        <Typography component="h2" variant="h2">
                            Processor - {selectedElement?.data?.name}
                        </Typography>

                        <TextField
                            label="Title"
                            id="title"
                            size="small"
                            required
                            sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { required: true })}
                        />
                        <TextField label="Description" id="description" size="small" sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('description')} />

                        <Grid mt={4} display="flex" alignItems="center">
                            <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                Save
                            </Button>
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default ProcessTypeDrawer;
