// Calculate time for a given timezone
function timeInTimezone(timezone) {
    let options = {
        timeZone: timezone.trim(),
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    };
    const formatter = new Intl.DateTimeFormat([], options);
    return formatter.format(new Date());
}

export default timeInTimezone;
