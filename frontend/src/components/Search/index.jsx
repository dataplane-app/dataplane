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
            sx={{ width: "100%" }}
        />
    );
};

export default Search;
