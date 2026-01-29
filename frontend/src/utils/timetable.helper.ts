export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const periodTimes = [
  "08:30-09:20", "09:20-10:10", "10:10-10:30",
  "10:30-11:20", "11:20-12:10", "12:10-13:30",
  "13:30-14:20", "14:20-15:10", "15:10-15:20",
  "15:20-16:10", "16:10-17:00"
];

export const isReservedPeriod = (periodIdx: number) => periodIdx === 2 || periodIdx === 5 || periodIdx === 8;

export const getReservedLabel = (periodIdx: number) => {
  if (periodIdx === 2 || periodIdx === 8) return 'Break';
  if (periodIdx === 5) return 'Lunch';
  return '';
};

export const buildDraftTimetable = (classId: string) => ({
  found: true,
  details: {
    is_active: false,
    class_id: classId
  },
  actions: Array.from({ length: days.length }, () => Array.from({ length: periodTimes.length }, () => ({})))
});

export const generateTimetableCSV = (
  timetableData: any,
  className: string,
  term: string,
  year: string
) => {
  const headers = ['Period', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  let csv = `Timetable Export\n`;
  csv += `Class: ${className}\n`;
  csv += `Term: ${term}\n`;
  csv += `Academic Year: ${year}\n`;
  csv += `Status: ${timetableData.details.is_active ? 'Active' : 'Inactive'}\n`;
  csv += `Export Date: ${new Date().toLocaleDateString()}\n\n`;
  csv += headers.join(',') + '\n';

  periodTimes.forEach((period, periodIdx) => {
    const row = [period];
    days.forEach((_, dayIdx) => {
      const dayPeriods = timetableData.actions[dayIdx] || [];
      const subjectData = dayPeriods[periodIdx];
      if (subjectData && subjectData.subject) {
        row.push(`"${subjectData.subject}${subjectData.teacher ? ` (${subjectData.teacher})` : ''}"`);
      } else {
        row.push('Free Period');
      }
    });
    csv += row.join(',') + '\n';
  });

  return csv;
};

export const isValidAcademicYear = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{4})$/);
  if (!match) return false;
  const start = Number(match[1]);
  const end = Number(match[2]);
  return end === start + 1;
};
