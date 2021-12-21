import { TextField, InputAdornment } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

const Search = ({ onChange, value, placeholder, classes, width = "auto", setGlobalFilter }) => {
    return (
        <TextField
            label={placeholder}
            type="search"
            id="outlined-start-adornment"
            size="small"
            sx={{ width: width }}
            onChange={e=> setGlobalFilter(e.target.value)}
        />
    );
};

export default Search;

