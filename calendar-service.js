(() => {
  function parseDateKey(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }

  function dateKey(date) {
    const source = date instanceof Date ? date : new Date();
    return `${source.getFullYear()}-${String(source.getMonth() + 1).padStart(2, "0")}-${String(source.getDate()).padStart(2, "0")}`;
  }

  function addDays(value, days) {
    const date = parseDateKey(value);
    if (!date) return "";
    date.setDate(date.getDate() + Number(days || 0));
    return dateKey(date);
  }

  function compareDateKeys(left, right) {
    return String(left || "").localeCompare(String(right || ""));
  }

  function isDateInRange(value, start, end) {
    const target = String(value || "");
    return (!start || compareDateKeys(target, start) >= 0) && (!end || compareDateKeys(target, end) <= 0);
  }

  function nthWeekday(year, monthIndex, weekday, occurrence) {
    const first = new Date(year, monthIndex, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return dateKey(new Date(year, monthIndex, 1 + offset + 7 * (occurrence - 1)));
  }

  function vernalEquinoxDay(year) {
    return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  }

  function autumnalEquinoxDay(year) {
    return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  }

  function japaneseHolidays(year) {
    const holidays = new Map([
      [`${year}-01-01`, "元日"],
      [nthWeekday(year, 0, 1, 2), "成人の日"],
      [`${year}-02-11`, "建国記念の日"],
      [`${year}-02-23`, "天皇誕生日"],
      [`${year}-03-${String(vernalEquinoxDay(year)).padStart(2, "0")}`, "春分の日"],
      [`${year}-04-29`, "昭和の日"],
      [`${year}-05-03`, "憲法記念日"],
      [`${year}-05-04`, "みどりの日"],
      [`${year}-05-05`, "こどもの日"],
      [nthWeekday(year, 6, 1, 3), "海の日"],
      [`${year}-08-11`, "山の日"],
      [nthWeekday(year, 8, 1, 3), "敬老の日"],
      [`${year}-09-${String(autumnalEquinoxDay(year)).padStart(2, "0")}`, "秋分の日"],
      [nthWeekday(year, 9, 1, 2), "スポーツの日"],
      [`${year}-11-03`, "文化の日"],
      [`${year}-11-23`, "勤労感謝の日"],
    ]);

    for (let month = 0; month < 12; month += 1) {
      for (let day = 2; day < 32; day += 1) {
        const key = dateKey(new Date(year, month, day));
        if (key.slice(0, 4) !== String(year) || holidays.has(key)) continue;
        if (holidays.has(addDays(key, -1)) && holidays.has(addDays(key, 1))) holidays.set(key, "国民の休日");
      }
    }

    [...holidays.keys()].forEach((key) => {
      if (parseDateKey(key)?.getDay() !== 0) return;
      let substitute = addDays(key, 1);
      while (holidays.has(substitute)) substitute = addDays(substitute, 1);
      holidays.set(substitute, "振替休日");
    });
    return holidays;
  }

  function holidayName(value) {
    const date = parseDateKey(value);
    return date ? japaneseHolidays(date.getFullYear()).get(dateKey(date)) || "" : "";
  }

  function monthGrid(monthDate) {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - startOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { key: dateKey(date), date, inMonth: date.getMonth() === monthDate.getMonth() };
    });
  }

  window.HounyanCalendar = { parseDateKey, dateKey, addDays, compareDateKeys, isDateInRange, holidayName, monthGrid };
})();
