const removeBaseName = (url) => {
    return url.replace('/webapp', '');
};

export default removeBaseName;
