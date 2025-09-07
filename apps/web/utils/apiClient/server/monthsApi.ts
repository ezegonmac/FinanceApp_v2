import BaseSheetApi from './baseEntityApi';

export default class MonthsApi extends BaseSheetApi {
  constructor(sheetId: string) {
    super(sheetId, 'Month');
  }

  async create(data: { month: number, year: number }): Promise<string[]> {
    const allMonths = await this.getAllObjects();

    allMonths.forEach((row) => {
      const alreadyExists = row["month"] == data.month && row["year"] == data.year;
      if (alreadyExists) throw new Error(`The provided month already exists. id: ${row["id"]}`);
    })

    const maxIdObj = allMonths.reduce((max, row) => {
      const id = parseInt(row["id"], 10);
      const maxId = id > max["id"] ? id : max["id"];
      return {id: maxId};
    }, {id: 0});

    const newMonth = {
      id: maxIdObj["id"] + 1,
      month: data.month,
      year: data.year,
    };

    const createdMonth = await super.create(newMonth);
    return createdMonth;
  }
}
