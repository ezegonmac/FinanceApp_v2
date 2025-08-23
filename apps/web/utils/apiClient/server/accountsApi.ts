import BaseSheetApi from './baseEntityApi';

export default class AccountsApi extends BaseSheetApi {
  constructor(sheetId: string) {
    super(sheetId, 'Accounts');
  }

  async create(data: { name: string }): Promise<void> {
    const allAccounts = await this.getAll();
    const maxId = allAccounts.reduce((max, row) => {
        const id = parseInt(row[0], 10);
        return id > max ? id : max;
    }, 0);

    const newAccount = {
      id: maxId + 1,
      name: data.name,
      addDate: new Date().toISOString(),
      active: true,
    };
    await super.create(newAccount);
  }
}
