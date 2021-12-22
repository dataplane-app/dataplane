import * as React from "react";
import "./styles.css";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Grid, Menu, MenuItem, Typography, Tooltip } from "@mui/material";
import { useGetEnvironments } from '../../graphql/getEnvironments';
import { useUpdatePreferences } from '../../graphql/updatePreferences';
import { useGetOnePreference } from '../../graphql/getOnePreference';

const EnviromentDropdown = () => {
  const getEnvironments = useGetEnvironments()
  const updatePreferences = useUpdatePreferences()
  const getOnePreference = useGetOnePreference()
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedEnviroment, setSelectedEnviroment] = React.useState("");
  const [environments, setEnvironments] = React.useState([]);

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Retrieve environments on load
  React.useEffect(() => {
    let active = true;

    (async () => {
      const getEnvironmentsResponse = await getEnvironments();
      const getOnePreferenceResponse = await getOnePreference({preference: "environment"})

      if(active && getEnvironmentsResponse){
        setEnvironments(getEnvironmentsResponse)

        // Environment is set if user has a preference in DB
        if (getOnePreferenceResponse.value) {
          setSelectedEnviroment(getOnePreferenceResponse.value)
        } else {
          // Else, defaults to first environment in DB
          setSelectedEnviroment(getEnvironmentsResponse[0].id)
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [])

  // Set environment on select
  async function onSelectEnvironment(env){
    const input = {input:{preference: "environment", value: env.id} }
    const updateEnvironmentsResponse = await updatePreferences(input);
    if (!updateEnvironmentsResponse.errors){
      setSelectedEnviroment(env.id)
    } else {
      console.log('Unable to update environment')
    }
  }
    
  return (
    <>
      <Grid
        container
        flexWrap="nowrap"
        onClick={handleClick}
        className={`drop-container`}
        sx={{ border: 1, borderColor: "divider", "&:hover": { background: "background.hoverSecondary" }, }}
      >
        <Box
          display="flex"
          backgroundColor="primary.main"
          alignItems="center"
          padding={2}
          borderRadius=".5rem"
          justifyContent="center"
          color="white"
          width="2.25rem"
          height="2.25rem"
          fontSize="1.5rem"
          fontWeight={700}
        >
          {environments && environments.length > 0 && selectedEnviroment ? environments.filter(
            (env) => env.id === selectedEnviroment
          )[0].name[0].toUpperCase() : "-"}
        </Box>
        <Box ml="1rem" mr="1rem">
          <Typography fontSize={16} fontWeight={700} color="text.primary" noWrap maxWidth={194}>
            {
              environments && environments.length > 0 && selectedEnviroment ? environments.filter((env) => env.id === selectedEnviroment)[0].name : "-"
            }
          </Typography>
          <Typography variant="subtitle1" color="text.primary" marginTop={-0.7}>
            Enviroment
          </Typography>
        </Box>
        <Box
          component={FontAwesomeIcon}
          icon={faCaretDown}
          fontSize="1.5rem"
          color="divider"
        />
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
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.secondary",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {environments && environments.length > 0 ? environments.filter(
          (filterId) => filterId.id !== selectedEnviroment
        ).map((env) => (
          <Tooltip title={env.name} key={env.id} placement="left">
              <MenuItem onClick={() => onSelectEnvironment(env)}>
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
                fontWeight={700}
              >
                {env.name[0].toUpperCase()}
              </Box>{" "}
              <Box ml="1rem" mr="1rem">
                <Typography fontSize={16} fontWeight={700} color="text.primary" noWrap maxWidth={150}>
                  {env.name}
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.primary"
                  marginTop={-0.7}
                >
                  Enviroment
                </Typography>
              </Box>
            </MenuItem>
          </Tooltip>
        )) : null}
      </Menu>
    </>
  );
};


export default EnviromentDropdown;
