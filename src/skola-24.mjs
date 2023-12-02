import { eachWeekOfInterval, getWeek, getYear } from 'date-fns';

const BaseUrl = 'https://web.skola24.se/api/';

const f = async (url, body) => {
  const response = await fetch(`${BaseUrl}${url}`, {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-requested-with': 'XMLHttpRequest',
      'x-scope': '8a22163c-8662-4535-9050-bc5e1923df48',
    },
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  return data;
};

export const fetchClasses = async (hostName, unitGuid) => {
  const response = await f('get/timetable/selection', {
    hostName,
    unitGuid,
    filters: {
      class: true,
      course: false,
      group: false,
      period: false,
      room: false,
      student: false,
      subject: false,
      teacher: false,
    },
  });

  return response.data.classes;
};

export const fetchSchools = async (hostName) => {
  const response = await f('services/skola24/get/timetable/viewer/units', {
    getTimetableViewerUnitsRequest: { hostName },
  });

  return response.data.getTimetableViewerUnitsResponse.units;
};

const fetchActiveSchoolYear = async (hostName) => {
  const response = await f('get/active/school/years', {
    hostName,
    checkSchoolYearsFeatures: false,
  });

  return response.data.activeSchoolYears[0];
};

const fetchRenderKey = async () => {
  const response = await f('get/timetable/render/key', null, true);
  return response.data.key;
};

const fetchWeekSchema = async ({
  week,
  year,
  unitGuid,
  host,
  schoolYear,
  selection,
  selectionType,
}) => {
  const sendDataWithoutRenderKey = {
    host,
    unitGuid,
    schoolYear,
    startDate: null,
    endDate: null,
    blackAndWhite: false,
    width: 297,
    height: 835,
    selectionType,
    selection,
    showHeader: false,
    periodText: '',
    week,
    year,
    privateFreeTextMode: null,
    privateSelectionMode: true,
    customerKey: '',
  };

  const key = await fetchRenderKey();

  const sendData = {
    ...sendDataWithoutRenderKey,
    renderKey: key,
  };

  const response = await f('render/timetable', sendData);

  return response?.data?.lessonInfo ?? null;
};

export const fetchSchoolYearSchema = async (host, schoolGuid, classGuid) => {
  const schoolYear = await fetchActiveSchoolYear(host);
  const fromDate = new Date(schoolYear.from);
  const toDate = new Date(schoolYear.to);

  const weekDates = eachWeekOfInterval(
    { start: fromDate, end: toDate },
    { weekStartsOn: 1 },
  );

  const schemas = await Promise.all(
    weekDates.map(async (weekDate) => {
      const week = getWeek(weekDate);
      const year = getYear(weekDate);

      const lessons = await fetchWeekSchema({
        unitGuid: schoolGuid,
        host: host,
        schoolYear: schoolYear.guid,
        selection: classGuid,
        selectionType: 0,
        year,
        week,
      });

      return {
        lessons: lessons ?? [],
        week,
        year,
      };
    }),
  );

  return schemas;
};
