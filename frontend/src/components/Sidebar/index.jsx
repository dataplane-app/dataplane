import './styles.css'
import { Link, useLocation } from "react-router-dom";
import checkActivePage from "../../utils/checkActivePage";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faCog, faUsers, faGraduationCap, faBullhorn, faAlignCenter, faConciergeBell } from '@fortawesome/free-solid-svg-icons'
import { useDarkMode } from '../../hooks/useDarkMode';
import ThemeToggle from '../ThemeToggle';

const Sidebar = () => {
    const location = useLocation();
    const [isDark] = useDarkMode();

    return(
        <div className="w-48 border-r border-divider dark:border-darkDivider relative">
            <ul className="p-0 my-4 ml-0 mr-2">
                {
                    MENU_ITEMS_TOP.map(menu => (
                        <li key={menu.id} className={`my-1 relative ${checkActivePage(location.pathname, `/${menu.url}`)}`}>
                            <Link to={`/${menu.url}`} className="block py-3 mx-5 relative">
                                <div className="flex items-center">
                                    {menu.icon}
                                    <h2 className={`ml-3 dark:text-white text-base`}>{menu.name}</h2>
                                </div>
                            </Link>
                        </li>
                    ))
                }
            </ul>

            <div className="border-b border-divider dark:border-darkDivider my-8"></div>

            <ul className="p-0 my-4 ml-0 mr-2">
                {
                    MENU_ITEMS_BOTTOM.map(menu => (
                        <li key={menu.id} className={`my-1 relative ${isDark && 'activeDark'} ${checkActivePage(location.pathname, `/${menu.url}`)}`}>
                            <Link to={`/${menu.url}`} className="block py-3 mx-5 relative">
                                <div className="flex items-center">
                                    {menu.icon}
                                    <h2 className={`ml-3 dark:text-white text-base`}>{menu.name}</h2>
                                </div>
                            </Link>
                        </li>
                    ))
                }
            </ul>

            <div className="absolute bottom-10 flex items-center justify-center left-0 right-0">
                <ThemeToggle />
            </div>
        </div>
    )
};

const MENU_ITEMS_TOP = [
    {
        id: 1,
        name: "Pipelines",
        icon: <FontAwesomeIcon className="menu-icons" icon={faKey} />,
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