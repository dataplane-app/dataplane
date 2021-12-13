const ConsoleLogHelper = (...data) => {
    if (process.env.REACT_APP_auth_debug === false) return;
    console.log(...data);
  }

export default ConsoleLogHelper;
