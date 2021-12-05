import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'

const Search = ({ onChange, value , placeholder, classes }) => {
    return (
        <div className={`${classes} border border-gray dark:border-darkGray rounded-lg pl-3 ml-3 flex items-center flex-2`}>
            <FontAwesomeIcon icon={faSearch} className="text-halfBlack dark:text-white text-xs" />
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="py-3 pl-3 pr-4 outline-none text-xs flex-1 bg-transparent dark:text-white"/>
        </div>
    )
}

export default Search;