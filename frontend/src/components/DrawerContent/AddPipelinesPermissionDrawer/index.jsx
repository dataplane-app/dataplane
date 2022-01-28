import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, MenuItem, Select, Typography } from '@mui/material';
import { useState } from 'react';

const AddPipelinesPermissionDrawer = ({ handleClose, typeToAdd }) => {
    const [selectedTypeToAdd, setSelectedTypeToAdd] = useState(typeToAdd);

    // Options state
    const [isView, setIsView] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isRun, setIsRun] = useState(false);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Box width="212px">
                    <Typography component="h2" variant="h2">
                        Add permissions
                    </Typography>

                    <FormControl fullWidth sx={{ mt: 4 }}>
                        <Select labelId="demo-simple-select-label" id="demo-simple-select" small value={selectedTypeToAdd} onChange={(e) => setSelectedTypeToAdd(e.target.value)}>
                            <MenuItem value="User">User</MenuItem>
                            <MenuItem value="Access group">Access group</MenuItem>
                        </Select>
                    </FormControl>

                    <FormGroup sx={{ mt: 2 }}>
                        <FormControlLabel control={<Checkbox sx={{ color: 'cyan.main' }} checked={isView} onChange={(e) => setIsView(e.target.checked)} />} label="View" />
                        <FormControlLabel control={<Checkbox sx={{ color: 'cyan.main' }} checked={isEdit} onChange={(e) => setIsEdit(e.target.checked)} />} label="Edit" />
                        <FormControlLabel control={<Checkbox sx={{ color: 'cyan.main' }} checked={isRun} onChange={(e) => setIsRun(e.target.checked)} />} label="Run" />
                    </FormGroup>

                    <Button variant="contained" color="primary" style={{ width: '100%' }} sx={{ mt: 2 }}>
                        Add {selectedTypeToAdd.toLowerCase()}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default AddPipelinesPermissionDrawer;
