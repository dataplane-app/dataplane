const ConsoleLogHelper = (...data) => {
    if (import.meta.env.VITE_DATAPLANE_DEBUG === false) return;
    console.log(...data);
};

export default ConsoleLogHelper;
