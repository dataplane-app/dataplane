import { Box, Grid, Typography, Chip, Avatar, TextField, InputAdornment, MenuItem } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV, faChartBar } from '@fortawesome/free-solid-svg-icons'
import Search from '../components/Search';

const Pipelines = () => {
    return (
        <Box className="pipeline">
            <Grid container alignItems="center" justifyContent="space-between">
                <Typography component="h2" variant="h2" color="text.primary">
                    Pipelines
                </Typography>
                <FontAwesomeIcon icon={faEllipsisV} />
            </Grid>

            <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start" width="75%">
                <Grid item display="flex" alignItems="center" sx={{ alignSelf: "center" }}>
                    <Chip color="primary" avatar={<Avatar>2</Avatar>} label="Pipelines" sx={{ mr: 1 }} />
                    <Chip color="success" avatar={<Avatar>2</Avatar>} label="Succeeded" sx={{ mr: 1 }} />
                    <Chip color="error" avatar={<Avatar>2</Avatar>} label="Failed" sx={{ mr: 1 }} />
                    <Chip color="secondary" avatar={<Avatar>2</Avatar>} label="Workers online" sx={{ mr: 2 }}/>
                </Grid>

                <Grid item display="flex" alignItems="center" sx={{ alignSelf: "center", flex: 1 }}>
                    <Search placeholder="Find a pipeline" />
                    <TextField 
                        select
                        label="Last 48 hours"
                        value={null}
                        size="small"
                        sx={{ ml: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FontAwesomeIcon
                                        icon={faChartBar}
                                    />
                                </InputAdornment>
                            ),
                        }}
                    >
                        <MenuItem value="24">
                            Last 24 hours
                        </MenuItem>
                    </TextField>
                </Grid>
            </Grid>
        </Box>
    )
}

export default Pipelines;