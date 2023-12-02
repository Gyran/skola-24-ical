import http from 'node:http';
import {
  fetchSchoolYearSchema,
  fetchClasses,
  fetchSchools,
} from './skola-24.mjs';
import { createCalendar } from './calendar.mjs';

const findSchoolName = async (hostName, unitGuid) => {
  const units = await fetchSchools(hostName);

  const unit = units.find((u) => u.unitGuid === unitGuid);

  return unit?.unitId ?? 'Not found';
};
const findClassName = async (hostName, schoolGuid, classGuid) => {
  const classes = await fetchClasses(hostName, schoolGuid);
  const classObj = classes.find((c) => c.groupGuid === classGuid);

  return classObj?.groupName ?? 'Not found';
};

const doit = async (hostName, schoolGuid, unitGuid) => {
  const schoolYearEvents = await fetchSchoolYearSchema(
    hostName,
    schoolGuid,
    unitGuid,
  );

  const [schoolName, className] = await Promise.all([
    findSchoolName(hostName, schoolGuid),
    findClassName(hostName, schoolGuid, unitGuid),
  ]);

  const icalStr = createCalendar(
    schoolYearEvents,
    `${schoolName} - ${className}`,
  ).toString();

  return icalStr;
};

const server = http.createServer(async (request, response) => {
  const [_, feature, host, schoolGuid, classGuid] = request.url.split('/');

  if (feature === 'ical') {
    if (!host || !schoolGuid || !classGuid) {
      response.statusCode = 400;
      response.end('Missing host, schoolGuid or classGuid');
      return;
    }

    const icalStr = await doit(host, schoolGuid, classGuid);

    response.writeHead(200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      // Tell clients to cache this for 1 day
      'Cache-Control': 'public, max-age=86400',
    });

    response.end(icalStr);
    return;
  } else {
    response.statusCode = 404;
    response.end();
    return;
  }
});

const PORT = process.env.PORT ?? 3000;

server.listen(PORT);
