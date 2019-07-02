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
  trend:number;
  link: string;
}

type IReocrds = {
  [key: string]: {
    stars: {
      date: Date;
      trend: number;
    }[];
    list: IData[];
  };
};
