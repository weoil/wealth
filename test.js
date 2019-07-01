const moment = require('moment');
const mc = require('memory-cache')
mc.put(1,2,100)
console.log(mc.get(1))
setTimeout(() => {
  console.log(mc.get(1))
}, 120);
console.log(
  moment()
    .utcOffset(0)
    .hour(),
  moment().hour(),
  moment()
    .utcOffset(8)
    .valueOf()
);

//Asia/Shanghai
