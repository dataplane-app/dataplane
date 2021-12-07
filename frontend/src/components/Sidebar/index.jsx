import './styles.css'
import { Link, useLocation } from "react-router-dom";
import checkActivePage from "../../utils/checkActivePage";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faCog, faUsers, faGraduationCap, faBullhorn, faAlignCenter, faConciergeBell, faCodeBranch } from '@fortawesome/free-solid-svg-icons'
import ThemeToggle from '../ThemeToggle';
import { Box, Grid, Typography } from '@mui/material';

const Sidebar = () => {
    const location = useLocation();

    return(
        <Box width={190} position="relative" sx={{ borderRight: 1, borderColor: "divider" }}>
            <Box component="ul" mt={2} mb={2} mr={2} p={0} sx={{ listStyle: 'none' }} >
                {
                    MENU_ITEMS_TOP.map(menu => (
                        <Box component="li" key={menu.id} mt={1} mb={1} position="relative" className={`${checkActivePage(location.pathname, `/${menu.url}`)}`}>
                            <Link to={`/${menu.url}`} className="menu-link">
                                <Grid container alignItems="center">
                                    {menu.icon}
                                    <Typography component="h2" variant="h3" color="text.primary" fontWeight={400} ml={2}>{menu.name}</Typography>
                                </Grid>
                            </Link>
                        </Box>
                    ))
                }
            </Box>

            <Box mt={6} mb={6} sx={{ borderTop: 1, borderColor: 'divider'}}></Box>

            <Box component="ul" mt={2} mb={2} mr={2} p={0} sx={{ listStyle: 'none' }}>
                {
                    MENU_ITEMS_BOTTOM.map(menu => (
                        <Box component="li" key={menu.id} mt={1} mb={1} position="relative" className={`${checkActivePage(location.pathname, `/${menu.url}`)}`}>
                            <Link to={`/${menu.url}`} className="menu-link">
                                <Grid container alignItems="center">
                                    {menu.icon}
                                    <Typography component="h2" variant="h3" color="text.primary" fontWeight={400} ml={2}>{menu.name}</Typography>
                                </Grid>
                            </Link>
                        </Box>
                    ))
                }
            </Box>

            <Grid container position="absolute" bottom={100} alignItems="center" justifyContent="space-between" left={0} right={0}>
                <ThemeToggle />
            </Grid>
        </Box>
    )
};

const MENU_ITEMS_TOP = [
    {
        id: 1,
        name: "Pipelines",
        icon: <FontAwesomeIcon className="menu-icons" icon={faCodeBranch} />,
        url: "",
    },
    {
        id: 2,
        name: "Workers",
        icon: <FontAwesomeIcon className="menu-icons" icon={faAlignCenter} />,
        url: "workers",
    },
    {
        id: 3,
        name: "Secrets",
        icon: <FontAwesomeIcon className="menu-icons" icon={faKey} />,
        url: "secrets",
    },
    {
        id: 4,
        name: "Teams",
        icon: <FontAwesomeIcon className="menu-icons" icon={faUsers} />,
        url: "teams",
    },
    {
        id: 5,
        name: "Settings",
        icon: <FontAwesomeIcon className="menu-icons" icon={faCog} />,
        url: "settings",
    },
]

const MENU_ITEMS_BOTTOM = [
    {
        id: 1,
        name: "Support",
        icon: <FontAwesomeIcon className="menu-icons" icon={faConciergeBell} />,
        url: "support",
    },
    {
        id: 2,
        name: "Feedback",
        icon: <FontAwesomeIcon className="menu-icons" icon={faBullhorn} />,
        url: "feedback",
    },
    {
        id: 3,
        name: "Learn",
        icon: <FontAwesomeIcon className="menu-icons" icon={faGraduationCap} />,
        url: "learn",
    },
]

export default Sidebar;