import { Avatar, Chip } from '@mui/material';

const CustomChip = ({ customColor = 'red', amount, margin = 0, ...props }) => {
    const AMOUNT_COLOR_SOLID = {
        orange: 'secondary.main',
        green: 'success.main',
        red: 'error.main',
        purple: 'purple.main',
        blue: 'primary.main',
    };

    const AMOUNT_COLOR_LIGHT = {
        orange: 'secondary.light',
        green: 'success.light',
        red: 'redLight.main',
        purple: 'purpleLight.main',
        blue: 'primary.light',
    };

    return amount ? (
        <Chip
            {...props}
            avatar={<Avatar sx={{ bgcolor: AMOUNT_COLOR_SOLID[customColor], color: 'white!important', fontWeight: 700 }}>{amount}</Avatar>}
            sx={{ mr: margin, bgcolor: AMOUNT_COLOR_LIGHT[customColor], color: AMOUNT_COLOR_SOLID[customColor], fontWeight: 600 }}
        />
    ) : (
        <Chip {...props} sx={{ mr: margin, bgcolor: AMOUNT_COLOR_LIGHT[customColor], color: AMOUNT_COLOR_SOLID[customColor], fontWeight: 600 }} />
    );
};

export default CustomChip;
