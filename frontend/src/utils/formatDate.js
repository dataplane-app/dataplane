import { DateTime } from 'luxon';

/**
 * Formats date
 * @param {string} dateString 2022-01-20T13:27:08Z
 * @return {string} 20 Jan 2022 13:27 GMT
 */
export function formatDate(dateString, zone) {
    if (dateString) {
        return DateTime.fromISO(dateString, { zone }).toFormat('d LLL yyyy HH:mm ZZZZ');
    }
}
