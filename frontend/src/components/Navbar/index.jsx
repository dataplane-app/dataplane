import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import EnviromentDropdown from "../EnviromentDropdown";
import Typography from '@mui/material/Typography';
import UserDropdown from '../UserDropdown';
import { useMe } from '../../graphql/me';
import { useEffect, useState } from 'react'
import timeInTimezone from '../../utils/timeInTimezone';

const Navbar = () => {
  const meGraphQL = useMe()
  const [me, setMe] = useState({})
  const [time, setTime] = useState('')

    // Retrieve me on load
    useEffect(() => {
        (async () => {
          const me = await meGraphQL();
          if(me?.r !== "error"){
            setMe(me)
          }
        })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

    // Updates time every second
    useEffect(() => {
      let secTimer = setInterval( () => {
          me.timezone && setTime(timeInTimezone(me.timezone))
        },1000)
    
        return () => clearInterval(secTimer);
    }, [me.timezone]);

    return(
        <Grid container alignItems="center" justifyContent="space-between" flexWrap="nowrap">
            <Typography component="h1" variant="h1" color="secondary" fontWeight={900} style={{ padding: "1.5rem 0 1.5rem .75rem" }}>Dataplane</Typography>
            <Box display="flex" alignItems="center" mr={2}>
                <Box mr={4} sx={{ display: { xxs: "none" , md: "block" } }}>
                    <Typography sx={{ fontSize: 24 }} color="text.primary">{time}</Typography>
                    <Typography variant="h3" fontWeight={400} mt={-1} color="text.primary">{me.timezone}</Typography>
                </Box>

                <Box display="flex" alignItems="center">
                    <EnviromentDropdown />
                    <UserDropdown me={me} />
                </Box>
            </Box>
        </Grid>
    )
}

export default Navbar;