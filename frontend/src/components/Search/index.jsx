import { TextField } from '@mui/material';

const Search = ({ onChange, value, placeholder, classes, width = 'auto' }) => {
    return <TextField label={placeholder} type="search" id="outlined-start-adornment" size="small" sx={{ width: width }} onChange={(e) => onChange(e.target.value)} />;
};

export default Search;
