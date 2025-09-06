
import BaseEntityApi from './baseEntityApi';

class MonthlyIncomeSplitApi extends BaseEntityApi {
  protected entityName = 'monthlyIncomeSplit';

  async getAllDetailed(): Promise<any> {
    const json = await this.request<{ data: any[], headers: string[] }>(
      `data/${this.entityName}/getAllDetailed`
    );
    return json;
  }

}

export default MonthlyIncomeSplitApi;
