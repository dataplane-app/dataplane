const ConsoleLogHelper = (...data) => {
    if (process.env.REACT_APP_DATAPLANE_DEBUG === false) return;
    console.log(...data);
};

export default ConsoleLogHelper;
