import cronstrue from 'cronstrue';
import later from '@breejs/later';
import { DateTime } from 'luxon';

/**
 * Converts cron string to human readable string in user's timezone
 * @param {string} cronStatement * /1 * * * * *'
 * @param {string} zone Europe/London
 * @param {string} type cron
 * @return {string} Every second
 * @example * /5 * * * * * ==> Every 5 seconds
 * @example 0 * * * * ==> Every hour
 */
export default function cronZone(cronStatement, zone, type) {
    if (type !== 'cron') {
        if (cronStatement === '*/1 * * * * *') {
            return 'Every second';
        } else {
            return 'Every ' + cronStatement.split(' ')[0].replace('*/', '') + ' seconds';
        }
    }

    let dateString = cronstrue.toString(cronStatement, { throwExceptionOnParseError: false });

    // Return if there is no time
    if (/\d\d:\d\d (AM|PM)/.test(dateString) === false) return dateString;

    const next = later.schedule(later.parse.cron(cronStatement)).next(1);
    const time = DateTime.fromJSDate(next, { zone }).toFormat('HH:mm a');
    dateString = dateString.replace(/\d\d:\d\d (AM|PM)/, time);
    return dateString;
}
