import BaseSheetApi from './baseEntityApi';

export default class AccountsApi extends BaseSheetApi {
  constructor(sheetId: string) {
    super(sheetId, 'Accounts');
  }
}
