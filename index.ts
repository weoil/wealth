import SpiderNode from 'spider-node';
import * as Log from 'log4js';
import { sendEmail } from './email';
import * as moment from 'moment';
import { Cache } from 'memory-cache';
const hc = new Cache();
const lc = new Cache();
Log.configure({
  appenders: {
    file: {
      type: 'file',
      filename: './spider.log'
    },
    console: {
      type: 'console'
    }
  },
  categories: {
    default: {
      appenders: ['file', 'console'],
      level: 'info'
    }
  }
});
const log = Log.getLogger('tip');
interface IData {
  id: string;
  cell: {
    increase_rt: string; //涨幅度
    sincrease_rt: string; // 正股涨跌
    stock_nm: string; // 正股名称
    [key: string]: any;
  };
}
interface IHigh {
  increase_rt: string; //涨幅度
  sincrease_rt: string; // 正股涨跌
  name: string; // 正股名称
  id: string;
  link: string;
}
// let cache = new Set<IHigh>();
// let lowcache = new Set<IHigh>();
const spider = new SpiderNode({
  name: '转债',
  log: false,
  rules: [
    {
      test: /https:\/\/www\.jisilu\.cn\/data\/cbnew\/cb_list/,
      parse(url, data, $, config) {
        const list: IData[] = data.rows;
        let highs: Set<IHigh> = new Set<IHigh>();
        let lows: Set<IHigh> = new Set<IHigh>();
        list.forEach(item => {
          const increase_rt = Number(item.cell.increase_rt.replace('%', ''));
          const sincrease_rt = Number(item.cell.sincrease_rt.replace('%', ''));
          if (sincrease_rt >= 6 && increase_rt <= 3) {
            highs.add({
              id: item.id,
              increase_rt: item.cell.increase_rt,
              sincrease_rt: item.cell.sincrease_rt,
              name: item.cell.stock_nm,
              link: `https://www.jisilu.cn/data/cbnew/#${item.id}`
            });
          } else if (sincrease_rt >= 2 && increase_rt <= 2) {
            lows.add({
              id: item.id,
              increase_rt: item.cell.increase_rt,
              sincrease_rt: item.cell.sincrease_rt,
              name: item.cell.stock_nm,
              link: `https://www.jisilu.cn/data/cbnew/#${item.id}`
            });
          }
        });
        highs.forEach(item => {
          if (hc.get(item.id)) {
            highs.delete(item);
          } else {
            hc.put(item.id, item, 300000);
          }
        });
        lows.forEach(item => {
          if (lc.get(item.id)) {
            lows.delete(item);
          } else {
            lc.put(item.id, item, 300000);
          }
        });
        if (highs.size) {
          console.log(moment().utcOffset(8));
          const tArray = Array.from(highs);
          log.error(
            tArray
              .map(h => {
                return h.id;
              })
              .toString()
          );
          sendEmail(tArray);
        }
        if (lows.size) {
          const tArray = Array.from(lows);
          log.info(
            tArray
              .map(h => {
                return h.id;
              })
              .toString()
          );
          sendEmail(tArray, '价值提醒');
        }
      }
    }
  ]
});
function checkTimeSlot() {
  const currentDate = moment().utcOffset(8);
  const h = currentDate.hour();
  const m = currentDate.minute();
  let week = currentDate.day();
  const err = new Error();
  if (week === 0) {
    week = 7;
  }
  if (week > 5) {
    throw err;
  }
  if (h <= 9 && m < 20) {
    throw err;
  }
  if (h >= 15 && m >= 0) {
    throw err;
  }
  if (h < 13) {
    if (h >= 12 && m >= 0) {
      throw err;
    }
  }
}
spider.plan(
  '*/10 * * * * *',
  () => {
    try {
      checkTimeSlot();
    } catch (e) {
      hc.clear();
      lc.clear();
      spider.status = 1;
      return;
    }
    spider.push(
      `https://www.jisilu.cn/data/cbnew/cb_list/?___jsl=LST___t=${moment()
        .utcOffset(8)
        .valueOf()}`,
      {
        method: 'POST',
        formData: {
          fprice: '',
          tprice: '',
          volume: '',
          svolume: '',
          premium_rt: '',
          ytm_rt: '',
          rating_cd: '',
          is_search: 'N',
          btype: '',
          listed: 'Y',
          industry: '',
          bond_ids: '',
          rp: 50,
          page: 1
        }
      }
    );
    return [];
  },
  false
);
