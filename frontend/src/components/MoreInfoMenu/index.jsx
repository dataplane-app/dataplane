import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { Box } from '@mui/material';
import { useTheme } from '@emotion/react';

const ITEM_HEIGHT = 48;

const MoreInfoMenu = ({ children, iconSize = 22, iconHorizontal = false, iconColor = '#0000008a', iconColorDark = '#fff', noPadding = false, ...props }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const theme = useTheme();

    return (
        <div>
            <IconButton
                aria-label="more"
                sx={noPadding && { padding: 0 }}
                id="long-button"
                aria-controls={open ? 'long-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleClick}>
                <Box
                    component={FontAwesomeIcon}
                    fontSize={iconSize}
                    color={theme.palette.mode === 'light' ? iconColor : iconColorDark}
                    icon={iconHorizontal ? faEllipsisH : faEllipsisV}
                />
            </IconButton>
            <Menu
                {...props}
                id="long-menu"
                MenuListProps={{
                    'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorEl}
                open={open}
                sx={{}}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        border: theme.palette.mode === 'dark' ? '' : '1px solid #C4C4C4',
                        maxHeight: ITEM_HEIGHT * 5.7,
                        width: '20ch',
                    },
                }}>
                {React.Children.map(children, (child) => {
                    return React.cloneElement(child, { handleCloseMenu: handleClose });
                })}
            </Menu>
        </div>
    );
};

export default MoreInfoMenu;
