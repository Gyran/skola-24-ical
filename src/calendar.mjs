import { addDays, parse, set, setWeek, startOfWeek } from 'date-fns';
import ical from 'ical-generator';

export const createCalendar = (weeklySchemas, name) => {
  const allEvents = weeklySchemas.flatMap(({ lessons, week, year }) => {
    const firstDayOfWeekDate = startOfWeek(
      setWeek(
        parse(`${year}-01-01 00:00:00`, 'yyyy-MM-dd HH:mm:ss', new Date()),
        week,
      ),
      { weekStartsOn: 1 },
    );

    const setTime = (date, timeStr) => {
      const [hours, minutes, seconds] = timeStr.split(':');

      return set(date, { hours, minutes, seconds });
    };

    const weekEvents = lessons.map((lesson) => {
      const dayDate = addDays(firstDayOfWeekDate, lesson.dayOfWeekNumber - 1);

      const startDate = setTime(dayDate, lesson.timeStart);
      const endDate = setTime(dayDate, lesson.timeEnd);

      return {
        id: `${year}-${week}-${lesson.dayOfWeekNumber}-${lesson.guidId}@skola24.gyran.se`,
        start: startDate,
        end: endDate,
        summary: lesson.texts?.[0] ?? '',
        description: `${year}-${week}-${lesson.dayOfWeekNumber}`,
        firstDayOfWeekDate,
        dayDate,
      };
    });

    return weekEvents;
  });

  const calendar = ical({
    name: name,
    timezone: 'Europe/Stockholm',
    events: allEvents,
  });

  return calendar;
};
