var key_value_in_metal_prices, key_value_in_metal_prices_upper;
var key_value_in_metal_bptf, key_value_in_metal_bptf_upper;
var key_value_in_metal_scrap, key_value_in_metal_scrap_upper;
var table;
var running_index = 0;

const COLLECTORS_INDEX = 5;
const STRANGE_INDEX = 11;
const UNIQUE_INDEX = 6;
const GENUINE_INDEX = 1;

const SCRAP_STRANGE_DISCOUNT = function(ref_val) {
  return ref_val * 0.942;
};
const SCRAP_UNIQUE_DISCOUNT = function(ref_val) {
  return ref_val * 0.982;
};
const SCRAP_KEY_MARKUP = function(ref_val) {
  return ref_val + .44;
};

const warnAlert = $('<div id="listing_alert_warn" class="alert alert-warning alert-dismissible fade show" role="alert"><strong>Beginning...</strong> Calling apis and populating information.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>');

const successAlert = $('<div id="listing_alert_finish" class="alert alert-success alert-dismissible fade show" role="alert"><strong>Finished!</strong> All found listings have been loaded.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>');

// On document ready
$(async function() {
  table = $('#item_table').DataTable({
    lengthChange: false,
    pageLength: 5,
    order: [[6, 'desc']],
  });
  await refreshKeyProfiles();
  displayProfitables();
});

async function manualSetKeyVal() {
  key_value_in_metal_scrap = roundToNearestScrap(parseFloat($("#key_val_min").val()));
  key_value_in_metal_scrap_upper = $("#key_val_max").val()? 
    roundToNearestScrap(parseFloat($("#key_val_max").val())) :
    roundToNearestScrap(SCRAP_KEY_MARKUP(key_value_in_metal_scrap));
  $('#currency_used_price').empty();
  $('#currency_used_price').append($(`<div>Used Key Price: ${key_value_in_metal_scrap}/${key_value_in_metal_scrap_upper} metal</div>`));
}

async function refreshKeyProfiles() {
  $('#profiles').empty();
  $('#currency_prices').empty();
  await delay(500); // Helps visually show the refresh
  await displayCurrencies();
  await displayProfiles();
}

async function displayCurrencies() {
  // Get prices tf token
  const token_result = await axios({
    url: '/get_price_token',
    method: 'GET',
  });
  const token = token_result.data;

  const result_bptf = await axios({
    url: "/get_bptf_currency",
    method: 'GET',
  });

  const key_vals_bptf = result_bptf.data["response"]["currencies"]["keys"]["price"];
  key_value_in_metal_bptf = roundToNearestScrap(key_vals_bptf["value"]);
  key_value_in_metal_bptf_upper = roundToNearestScrap(key_vals_bptf["value_high"]);
  $('#currency_prices').append($(`<div>Backpack.tf Keys: ${key_value_in_metal_bptf}/${key_value_in_metal_bptf_upper} ${key_vals_bptf["currency"]}</div>`));

  const result = await axios({
    url: "/get_ptf_currency",
    method: 'GET',
    params: {
      token: token,
    }
  });
  const key_vals = result.data;
  const key_price_buy = (key_vals["buyHalfScrap"] / 18).toFixed(2);
  const key_price_sell = (key_vals["sellHalfScrap"] / 18).toFixed(2);
  key_value_in_metal_prices = roundToNearestScrap(key_price_buy);
  key_value_in_metal_prices_upper = roundToNearestScrap(key_price_sell);
  $('#currency_prices').append($(`<div>Prices.tf Keys: ${key_value_in_metal_prices}/${key_value_in_metal_prices_upper} metal</div>`));

  // Calculated from prices.tf input at first (can be set manually later)
  key_value_in_metal_scrap = roundToNearestScrap(parseFloat(key_price_buy));
  key_value_in_metal_scrap_upper = roundToNearestScrap(SCRAP_KEY_MARKUP(key_value_in_metal_scrap));
  $('#currency_used_price').append($(`<div>Used Key Price: ${key_value_in_metal_scrap}/${key_value_in_metal_scrap_upper} metal</div>`));
}

async function displayProfiles() {
  const result = await axios({
    url: '/get_profile',
    method: 'GET',
    params: {
      steamids: "76561198080592800,76561199092421012",
    }
  });
  const json_result = result.data;

  var row_parent = $("<div>", {
    class: "row formatted-row",
  });
  for(let id in json_result["users"]) {
    var user = json_result["users"][id];
    var profile_div = buildProfileDiv(row_parent, id, user);
  }
  $('#profiles').prepend(profile_div);
}

function buildProfileDiv(row_parent, id, user) {
  
  var col1 = $("<div>", {
    class: "col-auto",
  });
  var col2 = $("<div>", {
    class: "col-auto",
  });

  var image = $('<img>', {
    id: id + '_image',
    src: user["avatar"],
    alt: user["name"],
    class: "img-thumbnail",
  });

  const tf2_inventory = user["inventory"][440];
  var name_div = $(`<div><a href="${"https://backpack.tf/profiles/"+id}" target="_blank">${user["name"]}</a></div>`);
  var value_div = $(`<div> Total value: ${roundToNearestScrap(tf2_inventory["value"])}</div>`);
  var keys_div = $('<div> Keys: '+tf2_inventory["keys"].toFixed(2)+"</div>");
  var metal_div = $('<div> Metal: '+roundToNearestScrap(tf2_inventory["metal"])+"</div>");
  var item_val_metal = tf2_inventory["value"] - tf2_inventory["keys"]*key_value_in_metal_bptf - tf2_inventory["metal"];
  var item_value_div = $('<div> Items value: '+roundToNearestScrap(item_val_metal)+"</div>");
  var slots = $('<div> Slots: '+tf2_inventory["slots"]["used"]+"/"+tf2_inventory["slots"]["total"]+"</div>");

  col1.append(image);
  col2.append(name_div, value_div, item_value_div, keys_div, metal_div, slots);

  row_parent.append(col1, col2);
  return row_parent;
}

async function displayProfitables() {
  // mechanism to kill any process that is already running
  running_index = running_index + 1;
  const this_index = running_index;

  $("#alerts").append(warnAlert.clone().delay(10000).slideUp(2000, function() {
    $(this).alert('close');
  }));
  table.clear();

  // Price definitions and min and max
  var min = $("#min_metal").val();
  var max = $("#max_metal").val();
  const result = await axios({
    url: '/get_bptf_prices',
    method: 'GET',
  });
  const json_result = result.data;
  const all_items = json_result["response"]["items"];

  const ignored_response = await axios({
    url: '/get_ignore',
    method: 'GET',
  });
  const ignored = ignored_response.data;

  // Construct the item objects
  var all_item_infos = [];
  for(var item in all_items) {
    const prices = all_items[item]["prices"];

    for(var index in prices) {
      var info = await parseInfo(all_items, item, index);
      all_item_infos.push(info);
    }
  }

  // Query the listings of each object
  function* listingsGenerator(all_item_infos, min, max) {
    for(let i in all_item_infos) {
      const info = all_item_infos[i];

      // check if the the item has some of the ignored terms
      const isIgnored = ignored.some(term => info.item.includes(term))

      if(!isIgnored && info.quality && info.bp_price && min <= info.bp_price && info.bp_price <= max) {
        var query_name = info.item;
        if(info.quality != "Unique")
          query_name = info.quality + " " + query_name;
        yield getListings(info, query_name);
      }
    }
  }

  for (const listing_promise of listingsGenerator(all_item_infos, min, max)) {
    const listings = await listing_promise;
    const info = listings.metainfo;

    await delay(1100);

    // kill if this process is not the running index
    if(this_index != running_index)
      return;

    if(listings["listings"] && listings["listings"][0]["intent"] == "sell") {
      // Calculate price manually since bptf prices for keys are not always up to snuff
      var barterPrice = listings["listings"][0]["currencies"];
      var price = undefined;
      if(barterPrice["keys"] || barterPrice["metal"])
        price = 0;
      if(barterPrice["keys"])
        price += barterPrice["keys"] * key_value_in_metal_scrap_upper; // use the upper scrap metal because this is how much it costs me
      if(barterPrice["metal"])
        price += barterPrice["metal"]
      
      if(price) {
        var scraptf_price = info.bp_price;
        switch(info.quality_idx) {
          case STRANGE_INDEX:
            scraptf_price = SCRAP_STRANGE_DISCOUNT(scraptf_price);
            break;
          case UNIQUE_INDEX:
            scraptf_price = SCRAP_UNIQUE_DISCOUNT(scraptf_price);
            break;
        }

        var profit_threshold = scraptf_price * 0.8; // This is the pricing scheme of scrap.tf
        var potentialProfit = profit_threshold - price;

        var sku_links = [];
        for(let i = 0; i < info.skus.length; i++) {
          sku_links.push(`<div><a href="${"https://prices.tf/items/" + info.skus[i]}" target="_blank">${info.skus[i]} </a></div>`);
        }
        table.row.add( [
          `<a href="${buildBptfLink(info)}" target="_blank">${info.quality} ${info.item} </a>`,
          sku_links.join("\n"),
          roundToNearestScrap(info.bp_price), // Backpack.tf price
          roundToNearestScrap(scraptf_price), // Scrap.tf price
          roundToNearestScrap(profit_threshold), // Maximum allowed
          roundToNearestScrap(price), // Lowest listing
          roundToNearestScrap(potentialProfit), //Potential profit
        ] ).draw( false );
      }
    }
  }
  $("#alerts").append(successAlert.clone());
}

async function parseInfo(all_items, item, index) {
  try {
    const prices = all_items[item]["prices"];
    var quality, price;

    index = parseInt(index);
    let item_price = prices[index]["Tradable"]["Craftable"][0]
    price = parseFloat(item_price["value"]);

  
    switch(index) {
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

    if(item_price["currency"] == "keys")
      price = price * key_value_in_metal_bptf;
    else if (item_price["currency"] != "metal")
      price = undefined
  }
  catch(e) {
    console.log("[Error for " + item + " with quality " + quality + "] " + e)
  }
  
  const defindices = [];
  for(let i = 0; i < all_items[item]["defindex"].length; i++) {
    defindices.push(`${all_items[item]["defindex"][i]};${index}`);
  }
  return {
    item: item,
    skus: defindices,
    quality_idx: index,
    quality: quality, 
    bp_price: price,
  }
}

async function getListings(info, item) {
  const result = await axios({
    url: '/get_listing',
    method: 'GET',
    params: {
      sku: item,
    }
  });
  const json_result = result.data;
  json_result.metainfo = info;
  return json_result;
}

async function getPtfPrice(sku) {
  // Get prices tf token
  const token_result = await axios({
    url: '/get_price_token',
    method: 'GET',
  });
  const token = token_result.data;

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

function buildBptfLink(info) {
  return `https://backpack.tf/stats/${info.quality}/${info.item}/Tradable/Craftable`;
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function roundToNearestScrap(ref_val) {
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