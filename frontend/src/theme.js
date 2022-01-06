const createCustomTheme = (mode) => ({
    palette: {
        mode,
        primary: {
            main: '#0073C6',
        },
        purple: {
            main: '#7B61FF',
            contrastText: '#7B61FF',
        },
        ...(mode === 'light'
            ? {
                  success: {
                      main: '#497B27',
                      light: '#72B8423D',
                  },
                  secondary: {
                      main: '#FF5722',
                      light: 'rgba(255, 87, 34, 0.16)',
                  },
                  purpleLight: {
                      main: 'rgba(123, 97, 255, 0.12)',
                  },
                  redLight: {
                      main: 'rgba(248, 0, 0, 0.09)',
                  },
                  divider: 'rgba(199, 195, 195, 1)',
                  background: {
                      main: '#fff',
                      secondary: '#fff',
                      hoverMain: 'rgba(244, 244, 244, 1)',
                      hoverSecondary: 'rgba(9, 30, 58, .40)',
                  },
                  sidebar: {
                      main: '#F7FBFD',
                  },
                  text: {
                      primary: '#000',
                      secondary: '#222',
                  },
                  cyan: {
                      main: '#0073C6',
                  },
              }
            : {
                  success: {
                      main: '#497B27',
                      light: 'rgba(73, 123, 39, 0.31)',
                  },
                  secondary: {
                      main: '#FF5722',
                      light: 'rgba(255, 87, 34, 0.2)',
                  },
                  purpleLight: {
                      main: 'rgba(123, 97, 255, 0.31)',
                  },
                  redLight: {
                      main: 'rgba(248, 0, 0, 0.25)',
                  },
                  divider: 'rgba(38, 67, 105, 1)',
                  background: {
                      main: 'rgba(14, 25, 40, 1)',
                      secondary: 'rgba(9, 30, 58, 1)',
                      hoverMain: 'rgba(14, 25, 40, .30)',
                      hoverSecondary: 'rgba(9, 30, 58, .40)',
                  },
                  sidebar: {
                      main: '#292929',
                  },
                  text: {
                      primary: '#fff',
                      secondary: '#222',
                  },
                  cyan: {
                      main: 'rgba(101, 190, 255, 1)',
                  },
              }),
    },
    breakpoints: {
        values: {
            xxs: 0, // small phone
            xs: 300, // phone
            sm: 600, // tablets
            md: 900, // small laptop
            lg: 1100, // desktop
            xl: 1300, // large screens
        },
    },
    typography: {
        button: {
            textTransform: 'none',
        },
        fontFamily: ['Roboto'],
        h1: {
            fontWeight: 700,
            fontSize: '1.75rem',
        },
        h2: {
            fontWeight: 700,
            fontSize: '1.375rem',
        },
        h3: {
            fontWeight: 900,
            fontSize: '1.0625rem',
        },
        subtitle1: {
            fontSize: '.75rem',
        },
        subtitle2: {
            fontSize: '.8125rem',
        },
    },
    components: {
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    fontSize: 13,
                    color: mode === 'light' ? 'rgba(0, 0, 0, 0.42)' : '#fff',
                    top: 3,
                },
                asterisk: {
                    color: '#db3131',
                    '&$error': {
                        color: '#db3131',
                    },
                },
            },
        },
    },
    zIndex: {
        snackbar: 9999,
    },
});

export default createCustomTheme;
