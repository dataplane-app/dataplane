import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { deepPurple, amber } from "@mui/material/colors";

const orange = "#FF5722";
const orangeLight = "rgba(255, 87, 34, 0.16)"
const blue = "#0073C6";
const green = "#2E6707";
const greenLight = "rgba(114, 184, 66, 0.24)"
const red = "#2E6707";
const redLight = "rgba(248, 0, 0, 0.09)";

let customTheme = createTheme({
    type: "light",
    pallete: {
        primary: {
            main: deepPurple,
            light: orangeLight,
        },
        secondary: {
            main: blue,
        },
        danger: {
            main: red,
            light: redLight
        },
        success: {
            main: green,
            light: greenLight
        },  
        background: {
            paper: "#fff",
            default: "#fff"
        },
        divider: "rgba(199, 195, 195, 1)",
    },
    typography: {
        h1: {
            fontWeight: 700,
            fontSize: '1.75rem'
        },
        h2: {
            fontWeight: 700,
            fontSize: '1.375rem'
        },
        h3: {
            fontWeight: 900,
            fontSize: '1.0625rem'
        },
        subtitle1: {
            fontSize: '.75rem'
        },
        subtitle2: {
            fontSize: '.8125rem'
        }
    }
})

customTheme = responsiveFontSizes(customTheme);

export default customTheme;