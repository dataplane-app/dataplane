import { TextField, InputAdornment } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

const Search = ({ onChange, value, placeholder, classes }) => {
    return (
        <TextField
            label={placeholder}
            type="search"
            id="outlined-start-adornment"
            size="small"
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <FontAwesomeIcon
                            icon={faSearch}
                        />
                    </InputAdornment>
                ),
            }}
        />
    );
};

export default Search;
