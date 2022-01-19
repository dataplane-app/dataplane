const checkActivePage = (currentURL, menuItemToCheck) => {
    if (currentURL === '/' && menuItemToCheck === '/') {
        return 'active';
    }

    return menuItemToCheck !== '/' && currentURL.includes(menuItemToCheck) ? 'active' : 'non-active';
    return currentURL === menuItemToCheck ? 'active' : 'non-active';
};

export default checkActivePage;
