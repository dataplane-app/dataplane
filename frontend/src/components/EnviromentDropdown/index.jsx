import "./styles.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useGetEnvironments } from '../../graphql/getEnvironments';
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

const EnviromentDropdown = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedEnviroment, setSelectedEnviroment] = React.useState();
  const [environments, setEnvironments] = React.useState([]);

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Retrieve environments on load
  
  
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
          {environments && selectedEnviroment ? environments.filter(
            (env) => env.id === selectedEnviroment
          )[0].name[0].toUpperCase() : ""}
          {environments ? console.log(environments): null}
        </Box>
        <Box ml="1rem" mr="1rem">
          <Typography fontSize={16} fontWeight={700} color="text.primary">
            {
              environments && selectedEnviroment ? environments.filter((env) => env.id === selectedEnviroment)[0]
                .name : null
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
        {environments ? environments.filter(
          (filterId) => filterId.id !== selectedEnviroment
        ).map((env) => (
          <MenuItem key={env.id} onClick={() => setSelectedEnviroment(env.id)}>
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
              <Typography fontSize={16} fontWeight={700} color="text.primary">
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
        )) : null}
      </Menu>
    </>
  );
};


export default EnviromentDropdown;
