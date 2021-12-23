import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import EnviromentDropdown from "../EnviromentDropdown";
import Typography from '@mui/material/Typography';
import UserDropdown from '../UserDropdown';
import { useMe } from '../../graphql/me';
import { useEffect, useState } from 'react'

const Navbar = () => {
  const me = useMe()
  const [meData, setMeData] = useState({})
  const [time, setTime] = useState('')

    // Retrieve me on load
    useEffect(() => {
        (async () => {
          const meData = await me();
          if(!me.errors){
            setMeData(meData)
            setTime(getTime(meData.timezone))
          }
        })();
      }, [])

    // Calculate time for user's timezones
    function getTime(timezone) {
        let options = {
            timeZone: timezone.trim(),
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
          }
        const formatter = new Intl.DateTimeFormat([], options);
        return formatter.format(new Date());
    }

    return(
        <Grid container alignItems="center" justifyContent="space-between" flexWrap="nowrap">
            <Typography component="h1" variant="h1" color="secondary" fontWeight={900} style={{ padding: "1.5rem 0 1.5rem .75rem" }}>Dataplane</Typography>
            <Box display="flex" alignItems="center" mr={2}>
                <Box mr={4} sx={{ display: { xxs: "none" , md: "block" } }}>
                    <Typography sx={{ fontSize: 24 }} color="text.primary">{time}</Typography>
                    <Typography variant="h3" fontWeight={400} mt={-1} color="text.primary">{meData.timezone}</Typography>
                </Box>

                <Box display="flex" alignItems="center">
                    <EnviromentDropdown />
                    <UserDropdown me={meData} />
                </Box>
            </Box>
        </Grid>
    )
}

export default Navbar;