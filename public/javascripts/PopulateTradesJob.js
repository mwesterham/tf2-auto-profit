class PopulateTradesJob {
  constructor(table, all_items, options = {}) {
    this.abortController = new AbortController();;

    this.tradesTable = table;
    this.all_items = all_items;

    this.key_prices = options.key_prices || 1;
    this.min = options.min_metal || 0;
    this.max = options.max_metal || 0;
    this.ignored = options.ignored || [];

    this.SCRAP_UNIQUE_DISCOUNT = options.SCRAP_UNIQUE_DISCOUNT;
    this.SCRAP_UNIQUE_BUY_RATIO = options.SCRAP_UNIQUE_BUY_RATIO;
    this.SCRAP_STRANGE_DISCOUNT = options.SCRAP_STRANGE_DISCOUNT;
    this.SCRAP_STRANGE_BUY_RATIO = options.SCRAP_STRANGE_BUY_RATIO;
  }

  cancelJob() {
    this.abortController.abort();
    const abortAlert = $('<div id="listing_alert_abort" class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Search has been stopped.</strong><button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>');
    $("#alerts").append(abortAlert.clone().delay(10000).slideUp(2000, function () {
      $(this).alert('close');
    }));
  }

  async run() {
    this.tradesTable.page( 0 ).draw( false ); // Go to first page
    this.tradesTable.search(""); // Clear search
    this.tradesTable.clear();
  
    // Construct the item objects
    var all_item_infos = await this.getAllItemInfo();
  
    for (const listing_promise of this.tradesGenerator(all_item_infos, this.min, this.max)) {
      const listings = await listing_promise;
      const info = listings.metainfo;
  
      await this.delay(1100);

      if (this.abortController.signal.aborted){
        return Promise.reject(new DOMException("Aborted", "AbortError"));
      }
  
      if (listings["listings"] && listings["listings"][0]["intent"] == "sell") {
        // Calculate price manually since bptf prices for keys are not always up to snuff
        var barterPrice = listings["listings"][0]["currencies"];
        var price = undefined;
        if (barterPrice["keys"] || barterPrice["metal"])
          price = 0;
        if (barterPrice["keys"])
          price += barterPrice["keys"] * this.key_prices.key_value_in_metal_scrap_upper;
        if (barterPrice["metal"])
          price += barterPrice["metal"]
  
        var profit_threshold = 0; // This is the pricing scheme of scrap.tf
        if (price) {
          var scraptf_price = info.bp_price;
          switch (info.quality_idx) {
            case STRANGE_INDEX:
              scraptf_price = this.SCRAP_STRANGE_DISCOUNT(scraptf_price);
              profit_threshold = this.SCRAP_STRANGE_BUY_RATIO(scraptf_price);
              break;
            case UNIQUE_INDEX:
              scraptf_price = this.SCRAP_UNIQUE_DISCOUNT(scraptf_price);
              profit_threshold = this.SCRAP_UNIQUE_BUY_RATIO(scraptf_price);
              break;
          }
          var potentialProfit = profit_threshold - price;
  
          var sku_links = [];
          for (let i = 0; i < info.skus.length; i++) {
            sku_links.push(`<div><a href="${"https://prices.tf/items/" + info.skus[i]}" target="_blank">${info.skus[i]} </a></div>`);
          }
          table.row.add([
            null,
            `<a href="${this.buildBptfLink(info)}" target="_blank">${info.quality} ${info.item} </a>`,
            sku_links.join("\n"),
            this.roundToNearestScrap(info.bp_price), // Backpack.tf price
            this.roundToNearestScrap(scraptf_price), // Scrap.tf price
            this.roundToNearestScrap(profit_threshold), // Maximum allowed
            this.roundToNearestScrap(price), // Lowest listing
            this.roundToNearestScrap(potentialProfit), //Potential profit
          ]).draw(false);
        }
      }
    }
  }

  // Query the listings of each object
  * tradesGenerator(all_item_infos, min, max) {
    for (let i in all_item_infos) {
      const info = all_item_infos[i];

      // check if the the item has some of the ignored terms
      const isIgnored = this.ignored.some(term => info.item.includes(term))

      if (!isIgnored && info.quality && info.bp_price && min <= info.bp_price && info.bp_price <= max) {
        var query_name = info.item;
        if (info.quality != "Unique")
          query_name = info.quality + " " + query_name;
        yield this.getListings(info, query_name);
      }
    }
  }

  async getAllItemInfo() {
    var all_item_infos = [];
    for (var item in this.all_items) {
      const prices = this.all_items[item]["prices"];
  
      for (var index in prices) {
        var info = await this.parseInfo(item, index);
        all_item_infos.push(info);
      }
    }
    return all_item_infos;
  }

  async parseInfo(item, index) {
    try {
      const prices = this.all_items[item]["prices"];
      var quality, price;
  
      index = parseInt(index);
      let item_price = prices[index]["Tradable"]["Craftable"][0]
      price = parseFloat(item_price["value"]);
  
  
      switch (index) {
        case STRANGE_INDEX:
          quality = "Strange";
          break;
        case UNIQUE_INDEX:
          quality = "Unique";
          break;
        // case GENUINE_INDEX:
        //   quality = "Genuine";
        //   break;
      }
  
      if (item_price["currency"] == "keys")
        price = price * this.key_prices.key_value_in_metal_bptf_lower;
      else if (item_price["currency"] != "metal")
        price = undefined
    }
    catch (e) {
      console.log("[Error for " + item + " with quality " + quality + "] " + e)
    }
  
    const defindices = [];
    for (let i = 0; i < this.all_items[item]["defindex"].length; i++) {
      defindices.push(`${this.all_items[item]["defindex"][i]};${index}`);
    }
    return {
      item: item,
      skus: defindices,
      quality_idx: index,
      quality: quality,
      bp_price: price,
    }
  }

  async getListings(info, item) {
    const json_result = await ServerAPI.getBptfListings(item);;
    json_result.metainfo = info;
    return json_result;
  }

  roundToNearestScrap(ref_val) {
    truncateDecimals = function (number, digits) {
      var multiplier = Math.pow(10, digits),
        adjustedNum = number * multiplier,
        truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);
  
      return truncatedNum / multiplier;
    };
  
    ref_val = parseFloat(ref_val);
    const val = Math.round(ref_val * 9) / 9;
    return truncateDecimals(val, 2);
  }

  delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  buildBptfLink(info) {
    return `https://backpack.tf/stats/${info.quality}/${info.item}/Tradable/Craftable`;
  }
}