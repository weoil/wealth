import SpiderNode from 'spider-node';
import { sendEmail } from './email';
import * as moment from 'moment';
import { Cache } from 'memory-cache';
import createLogger from './log';
import * as fs from 'fs';
let config = JSON.parse(
  fs.readFileSync('./config.json', { encoding: 'utf-8' })
);
const blackList: string[] = config.blacklist;
const hc = new Cache();
const lc = new Cache();
let records: IReocrds = {};
let isNewDay = true;

const log = createLogger('tip');

const spider = new SpiderNode({
  name: '转债',
  log: true,
  rules: [
    {
      test: /https:\/\/www\.jisilu\.cn\/data\/cbnew\/cb_list/,
      error(url, err) {
        console.log(err);
      },
      parse(url, data, $, config) {
        const list: IData[] = data.rows;
        let highs: Set<IHigh> = new Set<IHigh>();
        let lows: Set<IHigh> = new Set<IHigh>();
        list.forEach(item => {
          const trend = comparingTrends(item);
          const increase_rt = precent2number(item.cell.increase_rt);
          const sincrease_rt = precent2number(item.cell.sincrease_rt);
          const premium_rt = precent2number(item.cell.premium_rt);
          if (
            item.cell.full_price >= 100 &&
            premium_rt <= 40 &&
            increase_rt > 0
          ) {
            if (sincrease_rt >= 6 && increase_rt <= 3) {
              highs.add({
                id: item.id,
                increase_rt: item.cell.increase_rt,
                sincrease_rt: item.cell.sincrease_rt,
                trend: trend,
                name: item.cell.stock_nm,
                link: `https://www.jisilu.cn/data/cbnew/#${item.id}`
              });
            } else if (sincrease_rt >= 4 && increase_rt <= 2) {
              lows.add({
                id: item.id,
                increase_rt: item.cell.increase_rt,
                sincrease_rt: item.cell.sincrease_rt,
                trend,
                name: item.cell.stock_nm,
                link: `https://www.jisilu.cn/data/cbnew/#${item.id}`
              });
            }
          }
        });
        highs.forEach(item => {
          if (hc.get(item.id) || blackList.includes(item.id)) {
            highs.delete(item);
          } else {
            hc.put(item.id, item, 10800000);
          }
        });
        lows.forEach(item => {
          if (lc.get(item.id)) {
            lows.delete(item);
          } else {
            lc.put(item.id, item, 10800000);
          }
        });
        function sort(a: IHigh, b: IHigh) {
          return precent2number(b.increase_rt) - precent2number(a.increase_rt);
        }
        if (highs.size) {
          const tArray = Array.from(highs).sort(sort);
          log.error(
            tArray
              .map(h => {
                records[h.id].list.push(h);
                records[h.id].stars.push({
                  date: moment()
                    .utcOffset(8)
                    .toDate(),
                  trend: h.trend
                });
                return h.id;
              })
              .toString()
          );
          sendEmail(tArray);
        }
        if (lows.size) {
          const tArray = Array.from(lows).sort(sort);
          log.info(
            tArray
              .map(h => {
                return h.id;
              })
              .toString()
          );
          sendEmail(tArray, '提醒');
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
  if (h < 9 || (h === 9 && m < 20)) {
    throw err;
  }
  if (h < 13 && h >= 12) {
    throw err;
  }
  if (h >= 15) {
    throw err;
  }
}
function precent2number(precent: string): number {
  return Number(precent.replace('%', ''));
}
function comparingTrends(item: IData) {
  const { id } = item;
  let sincrease_rt = precent2number(item.cell.sincrease_rt);
  let increase_rt = precent2number(item.cell.increase_rt);
  if (!records[id]) {
    records[id] = {
      list: [],
      stars: []
    };
    return 0;
  }
  let list = records[id].list;
  let len = list.length;
  if (!len) {
    return 0;
  }
  const lastR = list[len - 1];
  let oldSincrease = precent2number(lastR.sincrease_rt);
  let oldIncrease = precent2number(lastR.increase_rt);
  if (sincrease_rt - oldSincrease > 0 && increase_rt - oldIncrease > 0) {
    return 1;
  }
  return -1;
}
function createDayReport() {}
spider.plan(
  '*/5 * * * * *',
  () => {
    try {
      checkTimeSlot();
    } catch (e) {
      spider.status = 1;
      // 创建报告 并标记今日结束
      const hour = moment()
        .utcOffset(8)
        .hour();
      if (hour === 15 && isNewDay) {
        createDayReport();
        isNewDay = false;
      } else if (hour === 0 && !isNewDay) {
        // 清理数据
        isNewDay = true;
        hc.clear();
        lc.clear();
        records = {};
      }
      return;
    }
    log.info('spider-go');
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

export interface IData {
  id: string;
  cell: {
    increase_rt: string; //涨幅度
    sincrease_rt: string; // 正股涨跌
    stock_nm: string; // 正股名称
    full_price: number; // 正股价
    premium_rt: string; // 溢价率

    [key: string]: any;
  };
}
interface IHigh {
  increase_rt: string; //涨幅度
  sincrease_rt: string; // 正股涨跌
  name: string; // 正股名称
  id: string;
  trend: number;
  link: string;
}

type IReocrds = {
  [key: string]: {
    stars: {
      date: Date;
      trend: number;
    }[];
    list: IHigh[];
  };
};
