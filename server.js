// Imports
var fs = require('fs');
var https = require('https');
var axios = require('axios');
var jsyaml = require('js-yaml');
var logger = require("log4js").getLogger();
logger.level = "debug";

// Get SSL certification
var privateKey  = fs.readFileSync('sslcert/server-localhost-key.pem', 'utf8');
var certificate = fs.readFileSync('sslcert/server-localhost.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};

// Get config
var _backpackURLs = fs.readFileSync('config/backpacktf_constants.yml', 'utf8');
var backpackURLs = jsyaml.load(_backpackURLs);

// App initialization
var express = require('express');
var app = express();

// Load static files
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/axios', express.static(__dirname + '/node_modules/axios/dist/'));
app.use(express.static('public'));

app.get('/', function (req, res) {
   res.redirect('/index.htm')
})

// Set routes
app.get('/index.htm', function (req, res) {
   res.sendFile( __dirname + "/" + "index.htm" );
})

app.get('/info', function (req, res) {
   // Prepare output in JSON format
   response = {
      item:req.query.item
   };
   res.end(JSON.stringify(response));
})

// External API calls callable via javascript
app.get('/get_profile', async function (req, res) {
   var ids = req.query.steamids;
   try {
      const result = await axios({
         url: backpackURLs["base"] + backpackURLs["operations"]["user_info"],
         method: 'GET',
         params: {
            key: process.env.BPTF_API_KEY,
            steamids: ids,
         }
      });
      res.send(result.data);
   }
   catch(error) {
      logger.debug(error);
   }
})
app.get('/get_currency', async function (req, res) {
   try {
      const result = await axios({
         url: backpackURLs["base"] + backpackURLs["operations"]["get_currency"],
         method: 'GET',
         params: {
            key: process.env.BPTF_API_KEY,
         }
      });
      res.send(result.data);
   }
   catch(error) {
      logger.debug(error);
   }
})
app.get('/get_prices', async function (req, res) {
   var sku = req.query.sku;
   var quality = req.query.quality;
   try {
      const result = await axios({
         url: backpackURLs["base"] + backpackURLs["operations"]["price_schema"],
         method: 'GET',
         params: {
            key: process.env.BPTF_API_KEY,
            "item": sku,
            "quality": quality,
            "priceindex": "0",
            "tradable": "Tradable",
            "craftable": "Craftable",
         }
      });
      res.send(result.data);
   }
   catch(error) {
      logger.debug(error);
   }
})
app.get('/get_listing', async function (req, res) {
   try {
      const result = await axios({
         url: backpackURLs["base"] + backpackURLs["operations"]["get_listing"],
         method: 'GET',
         params: {
            token: process.env.BPTF_API_TOKEN,
            "sku": "Flavorful Baggies",
            "appid": "440",
         }
      });
      res.send(result.data);
   }
   catch(error) {
      logger.debug(error);
   }
})

// Build server
var httpsServer = https.createServer(credentials, app);
var server = httpsServer.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port
   
   logger.debug("Example app listening at http://%s:%s", host, port)
})


//  axios({
//    url: backpackURLs["base"] + backpackURLs["operations"]["get_listing"],
//    method: 'GET',
//    params: {
//       token: process.env.BPTF_API_TOKEN,
//    },
//    data: {
//       key: process.env.BPTF_API_KEY,
//       sku: "Strange Killstreak Rocket Launcher",
//       appid: 440
//    },
//    header: {
//       "User-Agent": "myBot"
//    }
// })
//  .then(res => res.json())
//  .then(json_result => {
//    $("#result2").html(JSON.stringify(json_result));
//  })
//  .catch(function(err) {
//    console.log(`Error: ${err}` )
//  });