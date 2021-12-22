import './styles.css';
import { faAlignCenter, faBullhorn, faCodeBranch, faCog, faConciergeBell, faGraduationCap, faKey, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box } from '@mui/material';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useHistory, useLocation } from "react-router-dom";
import checkActivePage from "../../utils/checkActivePage";
import CustomSwitch from '../CustomSwitch';

const Sidebar = () => {
    const location = useLocation();
    const history = useHistory();

    return(
        <>
            <List sx={{ mt: 4, mb: 2, mr: 2, p: 0 }}>
                {MENU_ITEMS_TOP.map((menu) => (
                    <ListItem button key={menu.id} mt={1} mb={1} sx={{ "&:hover": { backgroundColor: "transparent" }, "& .MuiTouchRipple-root": { borderRadius: "42px" } }} position="relative" onClick={() => history.push(`/${menu.url}`)} className={`${checkActivePage(location.pathname, `/${menu.url}`)}`}>
                        <ListItemIcon sx={{ minWidth: "43px" }}>
                        {menu.icon}
                        </ListItemIcon>
                        <ListItemText primary={menu.name} />
                    </ListItem>
                ))}
          </List>
          <Divider sx={{ mb: 3, mt: 3 }} />
          <List sx={{ mt: 4, mb: 2, mr: 2, p: 0 }}>
                {MENU_ITEMS_BOTTOM.map((menu) => (
                    <ListItem button key={menu.id} mt={1} mb={1} sx={{ "&:hover": { backgroundColor: "transparent" }, "& .MuiTouchRipple-root": { borderRadius: "42px" }  }}  position="relative" onClick={() => history.push(`/${menu.url}`)} className={`${checkActivePage(location.pathname, `/${menu.url}`)}`}>
                        <ListItemIcon sx={{ minWidth: "43px" }}>
                        {menu.icon}
                        </ListItemIcon>
                        <ListItemText primary={menu.name} />
                    </ListItem>
                ))}
          </List>

          <Box display="flex" alignItems="center" justifyContent="center" mt={5}>
            <CustomSwitch />
          </Box>
        </>
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
        name: "Team",
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