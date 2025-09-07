import BaseSheetApi from './baseEntityApi';
import MonthsApi from './monthsApi';

export default class MonthlyIncomeSplitApi extends BaseSheetApi {
  constructor(sheetId: string) {
    super(sheetId, 'Monthly_Income_Split');
  }

  async create(
    data: { 
      monthId: number | null,
      month: number | null,
      year: number | null,
      fromAccountId: number, 
      toAccountId: number,
      amount: number 
    }): Promise<Object> {

    const allMonthlySplits = await this.getAll();
    const maxId = allMonthlySplits.reduce((max, row) => {
        const id = parseInt(row[0], 10);
        return id > max ? id : max;
    }, 0);

    // Check the DB to create the object or get the existing one
    if (!data.monthId) {
      const monthApi = new MonthsApi(this.sheetId);
      try {
        const newMonth = await monthApi.create({month: data.month, year: data.year});
        data.monthId = newMonth["id"];
      
      } catch(e) {
        const errStr = `${e}`;
        if (!errStr.includes("The provided month already exists")) {
          throw new Error("Couldn't create the monthly income split", e);
        }

        const existingId = errStr.split("id: ")[1];
        data.monthId = parseInt(existingId, 10);
      }
    }

    const newIncomeSplit = {
      id: maxId + 1,
      monthId: data.monthId,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      amount: data.amount,
    }
    const createdIncomeSplit = await super.create(newIncomeSplit);

    return createdIncomeSplit;
  }

}
