import { useState, useRef } from 'react';
import './styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown } from '@fortawesome/free-solid-svg-icons'
import useClickOutside from '../../hooks/useClickOutside'

const HeaderDropdown = ({ user, title, subtitle, children }) => {
    const dropDownRef = useRef();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useClickOutside(dropDownRef, () => {
        if (isDropdownOpen) {
            setIsDropdownOpen(false);
        }
    });

    return(
        <div
            onClick={() => children && setIsDropdownOpen(!isDropdownOpen)}
            className={`relative z-10 border ${isDropdownOpen ? 'rounded-t-2xl' : 'rounded-2xl'} border-gray py-3 px-4 flex items-center mr-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}>
            <div className={`h-9 w-9 rounded-lg p-2 ${user ? 'bg-orange' : 'bg-blue'} flex items-center justify-center font-bold text-white text-2xl`}>{user ? user[0].toUpperCase() : 'P'}</div>
            <div className="mx-4">
                {title && <h4 className="font-bold text-base dark:text-white">{title}</h4>}
                {subtitle && <h5 className="text-xs -mt-1 dark:text-white">{subtitle}</h5>}
            </div>
            <FontAwesomeIcon icon={faCaretDown} className="text-grayish text-2xl"/>

            {
                children && 
                <div
                    ref={dropDownRef}
                    className={`dropdown-children ${isDropdownOpen ? 'block' : 'hidden'}`}>
                    {children}
                </div>
            }
        </div>
    )
}

export default HeaderDropdown;