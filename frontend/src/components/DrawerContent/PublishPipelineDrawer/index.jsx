import { styled } from '@mui/system';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, Switch, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';

const PublishPipelineDrawer = ({ handleClose, refreshData }) => {
    const { register, handleSubmit } = useForm();

    async function onSubmit(data) {
        console.log(data);
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
                            Version control
                        </Typography>

                        <Grid container alignItems="center" flexWrap="nowrap" justifyContent="space-between" mt={3.2}>
                            <Grid item display="flex" alignItems="center" direction="column">
                                <Typography variant="subtitle1" fontWeight={500} mb={0.6}>
                                    Major
                                </Typography>

                                <PatchInput
                                    placeholder="0"
                                    defaultValue={0}
                                    id="major"
                                    size="small"
                                    required
                                    inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                    sx={{ fontSize: '.93rem', fontWeight: 700, display: 'flex', background: 'background.main' }}
                                    {...register('major', { required: true })}
                                />
                            </Grid>
                            <Grid item display="flex" alignItems="center" direction="column" ml={2} mr={2}>
                                <Typography variant="subtitle1" fontWeight={500} mb={0.6}>
                                    Minor
                                </Typography>

                                <PatchInput
                                    type="number"
                                    placeholder="0"
                                    defaultValue={0}
                                    id="major"
                                    size="small"
                                    required
                                    inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                    sx={{ fontSize: '.93rem', fontWeight: 700, display: 'flex', background: 'background.main' }}
                                    {...register('minor', { required: true })}
                                />
                            </Grid>
                            <Grid item display="flex" alignItems="center" direction="column">
                                <Typography variant="subtitle1" fontWeight={500} mb={0.6}>
                                    Patch
                                </Typography>

                                <PatchInput
                                    placeholder="0"
                                    defaultValue={0}
                                    id="major"
                                    size="small"
                                    required
                                    inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                    sx={{ fontSize: '.93rem', fontWeight: 700, display: 'flex', background: 'background.main' }}
                                    {...register('patch', { required: true })}
                                />
                            </Grid>
                        </Grid>

                        <Grid container alignItems="center" mt={4}>
                            <IOSSwitch defaultChecked {...register('live', { required: true })} />
                            <Typography sx={{ ml: 2, fontSize: 16, color: 'status.pipelineOnlineText' }}>Live on publish</Typography>
                        </Grid>

                        <Grid mt={4} display="flex" alignItems="center">
                            <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                Publish
                            </Button>
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

const PatchInput = styled(TextField)(() => ({
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
        display: 'none',
    },
    '& input[type=number]': {
        MozAppearance: 'textfield',
    },
}));

const IOSSwitch = styled((props) => <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />)(({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: 2,
        transitionDuration: '300ms',
        '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#65C466',
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
        '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: '#33cf4d',
            border: '6px solid #fff',
        },
        '&.Mui-disabled .MuiSwitch-thumb': {
            color: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[600],
        },
        '&.Mui-disabled + .MuiSwitch-track': {
            opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
        },
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        width: 22,
        height: 22,
    },
    '& .MuiSwitch-track': {
        borderRadius: 26 / 2,
        backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
    },
}));

export default PublishPipelineDrawer;
