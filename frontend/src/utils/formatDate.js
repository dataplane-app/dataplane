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

/**
 * Formats date, no timezone
 * @param {string} dateString 2022-01-20T13:27:08Z
 * @return {string} 20 Jan 2022 13:27:00
 */
export function formatDateNoZone(dateString, zone) {
    if (dateString) {
        return DateTime.fromISO(dateString, { zone }).toFormat('d LLL yyyy HH:mm:ss');
    }
}

/**
 * Formats date for logs
 * @param {string} dateString 2022-12-20T13:27:08Z
 * @return {string} 2022/12/20 13:27:08
 */
export function formatDateLog(dateString, zone) {
    if (dateString) {
        return DateTime.fromISO(dateString, { zone }).toFormat('yyyy/LL/dd HH:mm:ss');
    }
}

export function displayTimerMs(end, start) {
    if (!end || !start) return null;

    var ticks = (new Date(start) - new Date(end)) / 1000;
    var hh = Math.floor(ticks / 3600);
    var mm = Math.floor((ticks % 3600) / 60);
    var ss = (ticks % 60).toFixed(3);

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(Math.floor(ss), 2) + '.' + ss.split('.')[1];
}

// Utility function
export function displayTimer(startDate, endDate = new Date()) {
    if (typeof endDate === 'string') {
        endDate = new Date(endDate);
    }
    if (!startDate) return '';
    var ticks = Math.floor((endDate - new Date(startDate)) / 1000);
    var hh = Math.floor(ticks / 3600);
    var mm = Math.floor((ticks % 3600) / 60);
    var ss = ticks % 60;

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(ss, 2);
}

export function displayRunTime(end, start) {
    if (!end || !start) return null;
    var ticks = Math.floor((new Date(end) - new Date(start)) / 1000);
    var hh = Math.floor(ticks / 3600);
    var mm = Math.floor((ticks % 3600) / 60);
    var ss = ticks % 60;
    var ms = (new Date(end) - new Date(start)) % 1000;

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(ss, 2) + '.' + pad(ms, 3);
}

function pad(n, width) {
    const num = n + '';
    return num.length >= width ? num : new Array(width - num.length + 1).join('0') + n;
}
