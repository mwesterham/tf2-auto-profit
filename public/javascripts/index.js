var key_value_in_metal;
const COLLECTORS_INDEX = 5;
const STRANGE_INDEX = 11;
const UNIQUE_INDEX = 6;

// On document ready
$(async function() {
  await displayCurrencies();
  await displayProfiles();
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
  for(let id in json_result["users"]) {
    var user = json_result["users"][id];
    var profile_div = buildProfileDiv(id, user)
    $('#profiles').prepend(profile_div);
  }
}

function buildProfileDiv(id, user) {
  var row_parent = $("<div>", {
    class: "row formatted-row",
  });
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

  col1.append(image);
  col2.append(name_div, value_div, item_value_div, keys_div, metal_div);

  row_parent.append(col1, col2);
  return row_parent;
}

async function displayProfitables() {
  const result = await axios({
    url: '/get_prices',
    method: 'GET',
    params: {
      sku: "Flavorful Baggies",
      quality: "Unique",
    }
  });
  const json_result = result.data;
  const all_items = json_result["response"]["items"];
  console.log(all_items);

  const item_table = $('#item_table');
  for(var item in all_items) {
    const prices = all_items[item]["prices"];
    for(var index in prices) {
      var row_parent = $("<tr>");
      var name_div = $("<td>"+item+"</td>");

      var quality, price;
      try {
        switch(parseInt(index)) {
          // case COLLECTORS_INDEX:
          //   quality = "Collectors";
          //   const item_price = prices[index]["Tradable"]["Craftable"][0];
          //   price = item_price["value"] + " " + item_price["currency"];
          //   break;
          case STRANGE_INDEX:
            quality = "Strange";
            let item_price_s = prices[index]["Tradable"]["Craftable"][0];
            price = item_price_s["value"] + " " + item_price_s["currency"];
            break;
          case UNIQUE_INDEX:
            quality = "Unique";
            let item_price_u = prices[index]["Tradable"]["Craftable"][0];
            price = item_price_u["value"] + " " + item_price_u["currency"];
            break;
        }
      }
      catch(e) {
        console.log("[Error for " + item + "with quality " + quality + "] " + e)
      }
      var quality_div = $("<td>"+quality+"</td>");
      var price_div = $("<td>"+price+"</td>");

      row_parent.append(name_div, quality_div, price_div);
      item_table.append(row_parent);
    }
  }    
}

async function getListings() {
  const result = await axios({
    url: '/get_listing',
    method: 'GET',
  });
  const json_result = result.data;
  console.log(json_result);
}