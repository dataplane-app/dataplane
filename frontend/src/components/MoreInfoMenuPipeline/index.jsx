import * as React from 'react';
import Menu from '@mui/material/Menu';
import { Button } from '@mui/material';
import { useTheme } from '@emotion/react';

const ITEM_HEIGHT = 48;

const MoreInfoMenuPipeline = ({ children, iconSize = 22, iconHorizontal = false, iconColor = '#0000008a', iconColorDark = '#fff', noPadding = false, ...props }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [fontWeight, setFontWeight] = React.useState(400);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        setFontWeight(700);
    };
    const handleClose = () => {
        setAnchorEl(null);
        setFontWeight(400);
    };

    const theme = useTheme();

    return (
        <div>
            <Button
                aria-label="more"
                id="long-button"
                aria-controls={open ? 'long-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                sx={{ fontWeight }}
                onClick={handleClick}>
                Manage
            </Button>
            <Menu
                {...props}
                id="long-menu"
                MenuListProps={{
                    'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorEl}
                open={open}
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

export default MoreInfoMenuPipeline;
