import BaseSheetApi from './baseEntityApi';

export default class monthlyIncomeSplitApi extends BaseSheetApi {
  constructor(sheetId: string) {
    super(sheetId, 'Monthly_Income_Split');
  }

  async create(
    data: { 
      monthId: number,
      fromAccountId: number, 
      toAccountId: number,
      amount: number 
    }): Promise<void> {
    
    const allMonthlySplits = await this.getAll();
    const maxId = allMonthlySplits.reduce((max, row) => {
        const id = parseInt(row[0], 10);
        return id > max ? id : max;
    }, 0);

    const newIncomeSplit = {
      id: maxId + 1,
      monthId: data.monthId,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      amount: data.amount,
    };
    await super.create(newIncomeSplit);
  }
}
