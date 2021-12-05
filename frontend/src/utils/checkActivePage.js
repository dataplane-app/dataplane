const checkActivePage = (currentURL, menuItemToCheck) => {
    if(currentURL === '/' && menuItemToCheck === '/'){
        return 'active';
    }

    return currentURL === menuItemToCheck ? 'active' : 'non-active'
}

export default checkActivePage;