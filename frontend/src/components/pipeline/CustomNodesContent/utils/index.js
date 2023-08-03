export function getColor(msg) {
    switch (msg) {
        case 'Success':
            return '#72B842'; // success.main
        case 'Run':
            return '#0073C6'; // cyan.main
        case 'Fail':
            return '#F80000'; // error.main
        case 'Queue':
            return '#7B61FF'; // purple.main
        default:
            return '#c4c4c4';
    }
}
