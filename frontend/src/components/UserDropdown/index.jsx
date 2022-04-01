import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import './styles.css';
import { useHistory } from 'react-router-dom';

const UserDropdown = ({ me }) => {
    const history = useHistory();

    const [anchorEl, setAnchorEl] = React.useState(null);
    const dropdownWidth = React.useRef(null);

    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        dropdownWidth.current = event.currentTarget.offsetWidth;
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Grid container flexWrap="nowrap" onClick={handleClick} className={`drop-container`} sx={{ border: 1, borderColor: 'divider' }}>
                <Box
                    display="flex"
                    backgroundColor="secondary.main"
                    alignItems="center"
                    padding={2}
                    borderRadius="0.625rem"
                    justifyContent="center"
                    color="white"
                    width="2.25rem"
                    height="2.25rem"
                    fontSize="1.5rem"
                    fontWeight={700}>
                    {me.first_name ? me.first_name[0].toUpperCase() : ''}
                </Box>
                <Box ml="1rem" mr="1rem">
                    <Typography fontSize={16} fontWeight={700} color="text.primary">
                        {me?.first_name + ' ' + me?.last_name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.primary" marginTop={-0.7}>
                        {me?.job_title}
                    </Typography>
                </Box>
                <Box component={FontAwesomeIcon} icon={faCaretDown} fontSize="1.5rem" color="divider" />
            </Grid>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                <MenuItem onClick={() => history.push(`/myaccount/${me.user_id}`)} sx={{ width: dropdownWidth.current }}>
                    My account
                </MenuItem>
                <MenuItem style={{ margin: 'auto' }} onClick={() => history.push(`/logout`)} sx={{ width: dropdownWidth.current }}>
                    Logout
                </MenuItem>
            </Menu>
        </>
    );
};

export default UserDropdown;
