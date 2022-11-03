
function displayProfile() {
  fetch('/get_profile')
    .then(res => res.json())
    .then(json_result => {
      $("#result").html(JSON.stringify(json_result));
    })
    .catch(function(err) {
      console.log(`Error: ${err}` )
    });
}

function displayProfitables() {
  fetch('/get_price_history')
    .then(res => res.json())
    .then(json_result => {
      $("#result2").html(JSON.stringify(json_result));
    })
    .catch(function(err) {
      console.log(`Error: ${err}` )
    });
}

function getListings() {
  fetch('/get_listing')
    .then(res => res.json())
    .then(json_result => {
      $("#result2_2").html(JSON.stringify(json_result));
    })
    .catch(function(err) {
      console.log(`Error: ${err}` )
    });
}