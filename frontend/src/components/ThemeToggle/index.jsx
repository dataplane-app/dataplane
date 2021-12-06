import { useDarkMode } from "../../hooks/useDarkMode";
import './styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faCog } from '@fortawesome/free-solid-svg-icons'

const ThemeToggle = () => {
    const [isDark, setIsDark] = useDarkMode();

    return (
        <div className="flex items-center justify-center">
            <label htmlFor="toggleTheme" className="flex items-center cursor-pointer">
                <div className="relative">
                    <input type="checkbox" id="toggleTheme" checked={!isDark} className="sr-only" onChange={() => setIsDark(!isDark)} />
                    <div className="block border border-divider dark:border-darkDivider w-24 h-8 rounded-full"></div>
                    <p className={`toggleText font-bold text-sm dark:text-white ${isDark && 'textDark'}`}>{isDark ? 'Dark' : 'Light'}</p>
                    <div className="dot absolute left-1 top-1 border border-divider dark:border-darkDivider dark:bg-darkPrimary w-6 h-6 rounded-full transition flex items-center justify-center">
                        <FontAwesomeIcon icon={isDark ? faMoon : faCog} className="text-yellow-400 dark:text-darkIcons"/>
                    </div>
                </div>
            </label>
        </div>
    )
};

export default ThemeToggle;
