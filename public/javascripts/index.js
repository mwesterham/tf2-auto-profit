var key_value_in_metal_prices, key_value_in_metal_prices_upper;
var key_value_in_metal_bptf, key_value_in_metal_bptf_upper;
var key_value_in_metal_scrap, key_value_in_metal_scrap_upper;

var scrap_unique_discount = 0.982, scrap_unique_buy_ratio = 0.8;
var scrap_strange_discount = 0.942, scrap_strange_buy_ratio = 0.89;

var table;
var runningTradesJob = null;

const COLLECTORS_INDEX = 5;
const STRANGE_INDEX = 11;
const UNIQUE_INDEX = 6;
const GENUINE_INDEX = 1;

const SCRAP_STRANGE_DISCOUNT = function (ref_val) {
  return ref_val * scrap_strange_discount;
};
const SCRAP_STRANGE_BUY_RATIO = function (ref_val) {
  return ref_val * scrap_strange_buy_ratio;
};
const SCRAP_UNIQUE_DISCOUNT = function (ref_val) {
  return ref_val * scrap_unique_discount;
};
const SCRAP_UNIQUE_BUY_RATIO = function (ref_val) {
  return ref_val * scrap_unique_buy_ratio;
};
const SCRAP_KEY_MARKUP = function (ref_val) {
  return ref_val + .44;
};

const warnAlert = $('<div id="listing_alert_warn" class="alert alert-warning alert-dismissible fade show" role="alert"><strong>Beginning...</strong> Calling apis and populating information.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>');

const successAlert = $('<div id="listing_alert_finish" class="alert alert-success alert-dismissible fade show" role="alert"><strong>Finished!</strong> All found listings have been loaded.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>');

// On document ready
$(async function () {
  table = $('#item_table').DataTable({
    lengthChange: false,
    pageLength: 5,
    columns: [
      {
        className: 'dt-control',
        orderable: false,
        data: null,
        defaultContent: '',
      },
      {},
      {},
      {},
      {},
      {},
      {},
      {},
    ],
    order: [[7, 'desc']],
  });
  // Add event listener for opening and closing details
  $('#item_table tbody').on('click', 'td.dt-control', function () {
    var tr = $(this).closest('tr');
    var row = table.row(tr);

    if (row.child.isShown()) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass('shown');
    } else {
      // Open this row
      row.child(formatDT(row.data())).show();
      tr.addClass('shown');
    }
  });

  populateScrapPricings();
  await refreshKeyProfiles();
  displayProfitables();
});

async function manualSetKeyVal() {
  key_value_in_metal_scrap = roundToNearestScrap(parseFloat($("#key_val_min").val()));
  key_value_in_metal_scrap_upper = $("#key_val_max").val() ?
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

function populateScrapPricings() {
  $('#scrap_unique_discount').val(scrap_unique_discount);
  $('#scrap_unique_buy_ratio').val(scrap_unique_buy_ratio);
  $('#scrap_strange_discount').val(scrap_strange_discount);
  $('#scrap_strange_buy_ratio').val(scrap_strange_buy_ratio);
}

function setUniqueDiscount() {
  scrap_unique_discount = $('#scrap_unique_discount').val();
}
function setUniqueBuyRatio() {
  scrap_unique_buy_ratio = $('#scrap_unique_buy_ratio').val();
}
function setStrangeDiscount() {
  scrap_strange_discount = $('#scrap_strange_discount').val();
}
function setStrangeBuyRatio() {
  scrap_strange_buy_ratio = $('#scrap_strange_buy_ratio').val();
}

async function displayCurrencies() {
  const result_bptf = await ServerAPI.getBptfKeyPrices();
  const key_vals_bptf = result_bptf.data["response"]["currencies"]["keys"]["price"];
  key_value_in_metal_bptf = roundToNearestScrap(key_vals_bptf["value"]);
  key_value_in_metal_bptf_upper = roundToNearestScrap(key_vals_bptf["value_high"]);
  $('#currency_prices').append($(`<div>Backpack.tf Keys: ${key_value_in_metal_bptf}/${key_value_in_metal_bptf_upper} ${key_vals_bptf["currency"]}</div>`));

  const key_vals = await ServerAPI.getPtfKeyPrices();
  const key_price_buy = (key_vals["buyHalfScrap"] / 18).toFixed(2);
  const key_price_sell = (key_vals["sellHalfScrap"] / 18).toFixed(2);
  key_value_in_metal_prices = roundToNearestScrap(key_price_buy);
  key_value_in_metal_prices_upper = roundToNearestScrap(key_price_sell);
  $('#currency_prices').append($(`<div>Prices.tf Keys: ${key_value_in_metal_prices}/${key_value_in_metal_prices_upper} metal</div>`));

  // Calculated from prices.tf input at first (can be set manually later)
  key_value_in_metal_scrap = roundToNearestScrap(parseFloat(key_price_buy));
  key_value_in_metal_scrap_upper = roundToNearestScrap(SCRAP_KEY_MARKUP(key_value_in_metal_scrap));
  $('#currency_used_price').append($(`<div>Used Key Price: ${key_value_in_metal_scrap}/${key_value_in_metal_scrap_upper} metal</div>`));
  $('#key_val_min').val(key_value_in_metal_scrap);
  $('#key_val_max').val(key_value_in_metal_scrap_upper);
}

async function displayProfiles() {
  const json_result = await ServerAPI.getBptfProfileInfo("76561198080592800,76561199092421012");

  var row_parent = $("<div>", {
    class: "row formatted-row",
  });
  for (let id in json_result["users"]) {
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
  var name_div = $(`<div><a href="${"https://backpack.tf/profiles/" + id}" target="_blank">${user["name"]}</a></div>`);
  var value_div = $(`<div> Total value: ${roundToNearestScrap(tf2_inventory["value"])}</div>`);
  var keys_div = $('<div> Keys: ' + tf2_inventory["keys"].toFixed(2) + "</div>");
  var metal_div = $('<div> Metal: ' + roundToNearestScrap(tf2_inventory["metal"]) + "</div>");
  var item_val_metal = tf2_inventory["value"] - tf2_inventory["keys"] * key_value_in_metal_bptf - tf2_inventory["metal"];
  var item_value_div = $('<div> Items value: ' + roundToNearestScrap(item_val_metal) + "</div>");
  var slots = $('<div> Slots: ' + tf2_inventory["slots"]["used"] + "/" + tf2_inventory["slots"]["total"] + "</div>");

  col1.append(image);
  col2.append(name_div, value_div, item_value_div, keys_div, metal_div, slots);

  row_parent.append(col1, col2);
  return row_parent;
}

async function displayProfitables() {
  $("#alerts").append(warnAlert.clone().delay(10000).slideUp(2000, function () {
    $(this).alert('close');
  }));
  if(runningTradesJob)
    runningTradesJob.cancelJob();

  // Price definitions and min and max
  var min = $("#min_metal").val();
  var max = $("#max_metal").val();
  const all_items = await ServerAPI.getBptfItems();

  // Get all ignored items from the Server API
  const ignored = await ServerAPI.getIgnoredItems();

  runningTradesJob = new PopulateTradesJob(table, all_items, {
    min_metal: min,
    max_metal: max,
    ignored: ignored,
    SCRAP_UNIQUE_DISCOUNT: SCRAP_UNIQUE_DISCOUNT,
    SCRAP_UNIQUE_BUY_RATIO: SCRAP_UNIQUE_BUY_RATIO,
    SCRAP_STRANGE_DISCOUNT: SCRAP_STRANGE_DISCOUNT,
    SCRAP_STRANGE_BUY_RATIO: SCRAP_STRANGE_BUY_RATIO
  })
  await runningTradesJob.run();
  $("#alerts").append(successAlert.clone());
}

/* Formatting function for row details - modify as you need */
function formatDT(d) {
  // `d` is the original data object for the row
  console.log(d)
  var table = $('<table>').addClass('table');
  var body = $('<tbody>');
  table.append(body);

  const rowNames = ['null', 'Item Name', 'Item SKU', 'Backpack.tf Price', 'Scrap.tf Price', 'Profit Threshold', 'Lowest Listing', 'Potential Profit'];
  for (i = 3; i < 8; i++) {
    var row = $('<tr>');
    row.append($('<td>').text(rowNames[i]));
    row.append($('<td>').text(d[i]));
    row.append($('<td>').text(toKeyMetalDenomination(d[i])));
    body.append(row);
  }

  return table;
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

function toKeyMetalDenomination(ref_val) {
  var negMult = 1;
  if (ref_val < 0)
    negMult = -1;

  ref_val *= negMult;

  const keys = Math.floor(ref_val / key_value_in_metal_scrap);
  const remainder_metal = roundToNearestScrap(ref_val % key_value_in_metal_scrap);
  var val_str = "";
  if (keys != 0)
    val_str += `${keys * negMult} Keys + ${remainder_metal * negMult} refined`;
  return val_str;
}