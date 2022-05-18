import * as React from 'react';
import './styles.css';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Grid, Menu, MenuItem, Typography } from '@mui/material';
import { useGetEnvironments } from '../../graphql/getEnvironments';
import { useUpdatePreferences } from '../../graphql/updatePreferences';
import { useGetOnePreference } from '../../graphql/getOnePreference';
import { EnvironmentContext } from '../../App';
import { createState, useState as useHookState } from '@hookstate/core';

export const globalEnvironmentState = createState({ id: '', name: '' });
export const globalEnvironmentsState = createState([]);

// this is a convience hook for the golableEnvironmentState, call this hook where environment is needed
export const useGlobalEnvironmentState = () => useHookState(globalEnvironmentState);
export const useGlobalEnvironmentsState = () => useHookState(globalEnvironmentsState);

const EnviromentDropdown = () => {
    // Context
    const [, setEnvironmentId] = React.useContext(EnvironmentContext);
    // Global Environment state
    const GlobalEnvironmentID = useHookState(globalEnvironmentState);

    const getEnvironments = useGetEnvironments();
    const updatePreferences = useUpdatePreferences();
    const getOnePreference = useGetOnePreference();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [selectedEnviroment, setSelectedEnviroment] = React.useState('');
    const [environments, setEnvironments] = React.useState([]);
    const GlobalEnvironments = useGlobalEnvironmentsState();
    // const dropdownWidth = React.useRef(null);

    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        if (environments.length < 2) return;
        setAnchorEl(event.currentTarget);
        // dropdownWidth.current = event.currentTarget.offsetWidth;
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    // Set selected environment in dropdown when global environment changes
    React.useEffect(() => {
        setSelectedEnviroment(GlobalEnvironmentID.id.get());

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [GlobalEnvironmentID.id.get()]);

    // Retrieve environments on load
    React.useEffect(() => {
        let active = true;

        (async () => {
            const getEnvironmentsResponse = await getEnvironments();
            const getOnePreferenceResponse = await getOnePreference({ preference: 'environment' });

            if (active && getEnvironmentsResponse) {
                setEnvironments(getEnvironmentsResponse);
                GlobalEnvironments.set(getEnvironmentsResponse);

                // Environment is set if user has a preference in DB
                if (getOnePreferenceResponse.value) {
                    setSelectedEnviroment(getOnePreferenceResponse.value);
                    const environmentName = getEnvironmentsResponse.filter((a) => a.id === getOnePreferenceResponse.value)[0].name;
                    setEnvironmentId({ name: environmentName, id: getOnePreferenceResponse.value });
                    GlobalEnvironmentID.set({ name: environmentName, id: getOnePreferenceResponse.value });
                } else {
                    // Else, defaults to first environment in DB
                    setSelectedEnviroment(getEnvironmentsResponse[0].id);
                    setEnvironmentId({ name: getEnvironmentsResponse[0].name, id: getEnvironmentsResponse[0].id });
                    GlobalEnvironmentID.set({ name: getEnvironmentsResponse[0].name, id: getEnvironmentsResponse[0].id });
                }
            }
        })();

        return () => {
            active = false;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Retrieve environments on change
    React.useEffect(() => {
        let active = true;

        if (active && GlobalEnvironments.get().length !== environments.length) {
            (async () => {
                const getEnvironmentsResponse = await getEnvironments();

                if (active && getEnvironmentsResponse) {
                    setEnvironments(getEnvironmentsResponse);
                    GlobalEnvironments.set(getEnvironmentsResponse);
                }
            })();
        }

        return () => {
            active = false;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [GlobalEnvironments.get().length]);

    // Set environment on select
    async function onSelectEnvironment(env) {
        const input = { input: { preference: 'environment', value: env.id } };
        const updateEnvironmentsResponse = await updatePreferences(input);
        setEnvironmentId({ name: env.name, id: env.id });
        if (!updateEnvironmentsResponse.errors) {
            setSelectedEnviroment(env.id);
            GlobalEnvironmentID.set({ name: env.name, id: env.id });
        } else {
            console.log('Unable to update environment');
        }
    }

    return (
        <>
            <Grid
                container
                flexWrap="nowrap"
                onClick={handleClick}
                className={`drop-container`}
                sx={{ border: 1, borderColor: 'divider', '&:hover': { background: 'background.hoverSecondary' } }}>
                <Box
                    display="flex"
                    backgroundColor="primary.main"
                    alignItems="center"
                    padding={2}
                    borderRadius="0.625rem"
                    justifyContent="center"
                    color="white"
                    width="2.25rem"
                    height="2.25rem"
                    fontSize="1.5rem"
                    fontWeight={700}>
                    {environments && environments.length > 0 && selectedEnviroment ? environments.filter((env) => env.id === selectedEnviroment)[0].name[0].toUpperCase() : '-'}
                </Box>
                <Box ml="1rem" mr="1rem">
                    <Typography fontSize={16} fontWeight={700} color="text.primary" noWrap maxWidth={194}>
                        {environments && environments.length > 0 && selectedEnviroment ? environments.filter((env) => env.id === selectedEnviroment)[0].name : '-'}
                    </Typography>
                    <Typography variant="subtitle1" color="text.primary" marginTop={-0.7}>
                        Enviroment
                    </Typography>
                </Box>
                {environments.length > 1 ? <Box component={FontAwesomeIcon} icon={faCaretDown} id="ssssss" fontSize="1.5rem" color="divider" /> : null}
            </Grid>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                disableAutoFocusItem
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                {environments && environments.length > 0
                    ? environments
                          .filter((filterId) => filterId.id !== selectedEnviroment)
                          .map((env) => (
                              <MenuItem id="hello" onClick={() => onSelectEnvironment(env)} key={env.id} sx={{ width: 'auto' }}>
                                  <Box
                                      display="flex"
                                      backgroundColor="primary.main"
                                      alignItems="center"
                                      padding={2}
                                      mr={1}
                                      borderRadius=".5rem"
                                      justifyContent="center"
                                      color="white"
                                      width="2.25rem"
                                      height="2.25rem"
                                      fontSize="1.5rem"
                                      fontWeight={700}>
                                      {env.name[0].toUpperCase()}
                                  </Box>{' '}
                                  <Box ml="1rem" mr="1rem">
                                      <Typography fontSize={16} fontWeight={700} color="text.primary" noWrap maxWidth={150} textOverflow="unset">
                                          {env.name}
                                      </Typography>
                                      <Typography variant="subtitle1" color="text.primary" marginTop={-0.7}>
                                          Enviroment
                                      </Typography>
                                  </Box>
                              </MenuItem>
                          ))
                    : null}
            </Menu>
        </>
    );
};

export default EnviromentDropdown;
