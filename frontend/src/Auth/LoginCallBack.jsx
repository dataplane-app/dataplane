import React, { useEffect } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import qs from 'qs'
import ConsoleLogHelper from '../Helper/logger'
import Login from '../pages/Login'

/*
This handles redirection when the user logs in. The access token is returned from the authentication provider.
*/

export const LoginCallback = ({Authstate}) => {
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {

    // what happens if not authorised on callback?
      const queryString = qs.parse(location.search, {
        ignoreQueryPrefix: true
      })
      var access = queryString.accesstoken
      var refresh = queryString.refreshtoken

      ConsoleLogHelper("Setting auth token: ", access)

      Authstate.authToken.set(access)


    // Redirection url is set in local storage before oauth redirect
    const redirectLocation = localStorage.getItem('redirectLocation') || ''

    ConsoleLogHelper("Callback redirection", redirectLocation)

    if (!redirectLocation) {
      ConsoleLogHelper("Callback redirection", `No redirect Location. Redirecting to${window.location.origin}`)
      //window.location.href = window.location.origin;
      return
    }
    ConsoleLogHelper("Callback redirection", `Redirecting to ${redirectLocation}`)
    
    // remove redirection in local storage and then redirect
    localStorage.setItem('redirectLocation', '')
    // window.location.href = redirectLocation

    history.push(redirectLocation)
  }, [])

  return <Login />
}
