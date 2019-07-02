const moment = require('moment');
function checkTimeSlot() {
  const currentDate = moment().utcOffset(8);
  const h = currentDate.hour();
  const m = currentDate.minute();
  let week = currentDate.day();
  const err = new Error();
  console.log(h);
  if (week === 0) {
    week = 7;
  }
  if (week > 5) {
    throw err;
  }
  if (h < 9 || (h === 9 && m < 20)) {
    throw err;
  }
  if (h >= 15) {
    throw err;
  }
  if (h < 13 && h >= 12) {
    throw err;
  }
}
checkTimeSlot();

console.log([1, 3, 4, 5, 6].sort((a, b) => {
  return b-a;
})
)