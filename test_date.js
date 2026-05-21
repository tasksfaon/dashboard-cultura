const getBRLDate = (val) => {
  if (!val) return new Date();
  if (val instanceof Date) {
    if (val._isBRL) return val;
    const shifted = new Date(val.getTime() - 3 * 3600 * 1000);
    shifted._isBRL = true;
    return shifted;
  }
  const d = new Date(val); // parseSupabaseDate basically does this
  const shifted = new Date(d.getTime() - 3 * 3600 * 1000);
  shifted._isBRL = true;
  return shifted;
};

const nowUTC = new Date();
const now = new Date(nowUTC.getTime() - 3 * 3600 * 1000);
now._isBRL = true;

console.log("now:", now);

let startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); 
startDate.setUTCHours(0,0,0,0); 
let endDate = new Date(now.getTime());
endDate.setUTCHours(23,59,59,999);

console.log("startDate:", startDate);
console.log("endDate:", endDate);

// test checkouts:
const chDateStr_yesterday = '2026-05-20T16:00:26+00:00'; 
const chDateObj_yesterday = getBRLDate(chDateStr_yesterday);

const chDateStr_today = '2026-05-21T12:00:13+00:00'; 
const chDateObj_today = getBRLDate(chDateStr_today);

console.log("chDateObj (yesterday):", chDateObj_yesterday, "In range?", chDateObj_yesterday >= startDate && chDateObj_yesterday <= endDate);
console.log("chDateObj (today):", chDateObj_today, "In range?", chDateObj_today >= startDate && chDateObj_today <= endDate);

// test metacosts:
let dateObj_meta;
const dateStr = "2026-05-21";
const cleanDateStr = dateStr.split('T')[0].split(' ')[0];
const [y, m, d] = cleanDateStr.split('-');
dateObj_meta = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0));

console.log("dateObj_meta:", dateObj_meta, "In range?", dateObj_meta >= startDate && dateObj_meta <= endDate);

