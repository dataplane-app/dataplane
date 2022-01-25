/**
 * Formats date
 * @param {string} dateString 2022-01-20T13:27:08Z
 * @return {string} 20 Jan 2022 13:27 GMT
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date);
    let monthYear = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short' }).format(date);
    let time = new Intl.DateTimeFormat('en', { hourCycle: 'h23', hour: '2-digit', minute: 'numeric', timeZoneName: 'short' }).format(date);
    return `${day} ${monthYear} ${time}`;
}
