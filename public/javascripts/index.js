var key_value_in_metal;
var table;
var running_index = 0;
const COLLECTORS_INDEX = 5;
const STRANGE_INDEX = 11;
const UNIQUE_INDEX = 6;

// On document ready
$(async function() {
  table = $('#item_table').DataTable({
    pageLength: 5,
    order: [[4, 'desc']],
  });
  await displayCurrencies();
  await displayProfiles();
  displayProfitables();
});

async function displayCurrencies() {
  const result = await axios({
    url: "/get_currency",
    method: 'GET',
  });
  const key_vals = result.data["response"]["currencies"]["keys"]["price"];
  $('#currency_prices').append($("<div>Keys: "+key_vals["value"]+"/"+key_vals["value_high"]+" "+key_vals["currency"]+"</div>"));
  key_value_in_metal = key_vals["value"];
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
  var name_div = $('<div><b>'+user["name"]+"</b></div>");
  var value_div = $('<div> Total value: '+tf2_inventory["value"].toFixed(2)+"</div>");
  var keys_div = $('<div> Keys: '+tf2_inventory["keys"].toFixed(2)+"</div>");
  var metal_div = $('<div> Metal: '+tf2_inventory["metal"].toFixed(2)+"</div>");
  var item_val_metal = tf2_inventory["value"] - tf2_inventory["keys"]*key_value_in_metal - tf2_inventory["metal"];
  var item_value_div = $('<div> Items value: '+item_val_metal.toFixed(2)+"</div>");
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

  table.clear();

  // Price definitions and min and max
  var min = $("#min_metal").val();
  var max = $("#max_metal").val();
  const result = await axios({
    url: '/get_prices',
    method: 'GET',
  });
  const json_result = result.data;
  const all_items = json_result["response"]["items"];

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
      if(info.quality && info.price && min <= info.price && info.price <= max) {
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

    if(listings["listings"] && listings["listings"][0]["intent"] == "sell") {
      var price = listings["listings"][0]["price"];
      var profit_threshold = info.price * 0.8;
      var potentialProfit = profit_threshold - parseFloat(price);
      table.row.add( [
        info.quality + " " + info.item,
        info.price.toFixed(2),
        profit_threshold.toFixed(2),
        price.toFixed(2),
        potentialProfit.toFixed(2),
      ] ).draw( false );
    }

    // kill if this process is not the running index
    if(this_index != running_index)
      return;
  }
}

async function parseInfo(all_items, item, index) {
  try {
    const prices = all_items[item]["prices"];
    var quality, price;

    let item_price = prices[index]["Tradable"]["Craftable"][0]
    price = parseFloat(item_price["value"]);

  
    switch(parseInt(index)) {
      case STRANGE_INDEX:
        quality = "Strange";
        break;
      case UNIQUE_INDEX:
        quality = "Unique";
        break;
    }

    if(item_price["currency"] == "keys")
      price = price * key_value_in_metal;
    else if (item_price["currency"] != "metal")
      price = undefined
  }
  catch(e) {
    console.log("[Error for " + item + "with quality " + quality + "] " + e)
  }
  
  return {
    item: item,
    quality: quality, 
    price: price,
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

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
