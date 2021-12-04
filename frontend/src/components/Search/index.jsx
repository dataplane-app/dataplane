import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'

const Search = ({ onChange, value , placeholder, classes }) => {
    return (
        <div className={`${classes} border border-gray rounded-lg pl-3 ml-3 flex items-center flex-2`}>
            <FontAwesomeIcon icon={faSearch} className="text-halfBlack text-xs" />
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="py-3 pl-3 pr-4 outline-none text-xs flex-1"/>
        </div>
    )
}

export default Search;