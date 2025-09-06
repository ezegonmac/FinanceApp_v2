import BaseSheetApi from './baseEntityApi';

export default class MonthsApi extends BaseSheetApi {
  constructor(sheetId: string) {
    super(sheetId, 'Month');
  }

  async create(data: { month: number, year: number }): Promise<void> {
    const allMonths = await this.getAll();
    const maxId = allMonths.reduce((max, row) => {
        const id = parseInt(row[0], 10);
        return id > max ? id : max;
    }, 0);

    const newMonth = {
      id: maxId + 1,
      month: data.month,
      year: data.year,
    };
    await super.create(newMonth);
  }
}
