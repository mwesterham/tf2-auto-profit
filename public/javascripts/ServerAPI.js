class ServerAPI {
  static async getIgnoredItems() {
    const ignored_response = await axios({
      url: '/get_ignore',
      method: 'GET',
    });
    return ignored_response.data;
  }

  static async getBptfKeyPrices() {
    const result_bptf = await axios({
      url: "/get_bptf_currency",
      method: 'GET',
    });
    return result_bptf;
  }

  static async getBptfItems() {
    const result = await axios({
      url: '/get_bptf_prices',
      method: 'GET',
    });
    const json_result = result.data;
    return json_result["response"]["items"];
  }

  static async getBptfProfileInfo(ids) {
    const result = await axios({
      url: '/get_profile',
      method: 'GET',
      params: {
        steamids: ids,
      }
    });
    return result.data;
  }

  // Gets the listing information of the given item sku from Bptf
  static async getBptfListings(item) {
    const result = await axios({
      url: '/get_listing',
      method: 'GET',
      params: {
        sku: item,
      }
    });
    return result.data;
  }

  static async getPtfPrice(sku, token = undefined) {
    if(!token)
      token = await this.getPtfToken();

    // Call once to get the max num of items
    const result = await axios({
      url: '/get_ptf_prices',
      method: 'GET',
      params: {
        token: token,
        sku: sku,
      }
    });
    const response = result.data;
    const price_half_scrap = response["buyHalfScrap"] + response["buyKeys"] * response["buyKeyHalfScrap"]
    const price_ref = (price_half_scrap / 18).toFixed(2);
    return price_ref;
  }

  static async getPtfKeyPrices(token = undefined) {
    if(!token)
      token = await this.getPtfToken();
      
    const result = await axios({
      url: "/get_ptf_currency",
      method: 'GET',
      params: {
        token: token,
      }
    });
    return result.data;
  }

  static async getPtfToken() {
    // Get prices tf token
    const token_result = await axios({
      url: '/get_price_token',
      method: 'GET',
    });
    return token_result.data;
  }
}