import * as NodeMail from 'nodemailer';
import * as fs from 'fs';
function genHtml(list) {
  let tds = '';
  for (let item of list) {
    tds += `
    <tr>
      <td style="color:red;">${item.id}</td>
      <td>${item.name}</td>
      <td>${item.sincrease_rt}</td>
      <td>${item.increase_rt}</td>
      <td>${item.trend === 1 ? '↑' : item.trend === 0 ? '-' : '↓'}</td>
    </tr>
  `;
  }
  const BaseHtml = `
    <table border="1px" cellspacing="0" cellpadding="0" style="font-size:14px;text-align:center" width="100%">
      <tr>
        <th>id</th>
        <th>名称</th>
        <th>正股涨跌</th>
        <th>债涨值</th>
        <th>股趋势</th>
      </tr>
      ${tds}
    </table>
  `;
  return BaseHtml;
}
export async function sendEmail(list, title = '重点提醒') {
  let config = JSON.parse(
    fs.readFileSync('./config.json', { encoding: 'utf-8' })
  );
  const transporter = NodeMail.createTransport({
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: {
      user: config.email.user, // generated ethereal user
      pass: config.email.pass // generated ethereal password
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"🕷️阿鲁巴🕷️" <lspidermail@163.com>', // sender address
    to: config.users.join(','), // list of receivers
    subject: title, // Subject line
    text: `data`,
    html: genHtml(list) // html body
  });
}

// sendEmail([
//   {
//     id: 1,
//     name: 'aaa',
//     sincrease_rt: 'aaa',
//     increase_rt: 'bbb',
//     link:`https://www.jisilu.cn/data/cbnew/#${113020}`
//   }
// ]);
