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
var _pricesURLs = fs.readFileSync('config/pricestf_constants.yml', 'utf8');
var pricesURLs = jsyaml.load(_pricesURLs);
var _backpackURLs = fs.readFileSync('config/backpacktf_constants.yml', 'utf8');
var backpackURLs = jsyaml.load(_backpackURLs);
var ignoredItems = fs.readFileSync('config/ignore.json', 'utf8');

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
      res.send("An error occured.");
   }
})
app.get('/get_currency', async function (req, res) {
   let auth_token;
   try {
      // Get access token first
      const response = await axios({
         url: pricesURLs["base"] + pricesURLs["operations"]["auth_access"],
         method: 'POST',
      });
      auth_token = response.data.accessToken;
   }
   catch(error) {
      logger.debug(error);
      res.send("An error occured getting auth token from prices tf.");
   }

   try {
      // Get key prices
      const result = await axios({
         url: pricesURLs["base"] + pricesURLs["operations"]["prices"] + "/" + encodeURIComponent("5021;6"),
         method: 'GET',
         headers: {
            accept: 'application/json',
            authorization: 'Bearer ' + auth_token,
         }
      });
      res.send(result.data);
   }
   catch(error) {
      logger.debug(error);
      res.send("An error occured getting key price from prices tf.");
   }
})
app.get('/get_prices', async function (req, res) {
   try {
      const result = await axios({
         url: backpackURLs["base"] + backpackURLs["operations"]["price_schema"],
         method: 'GET',
         params: {
            key: process.env.BPTF_API_KEY,
         }
      });
      res.send(result.data);
   }
   catch(error) {
      logger.debug(error);
      res.send("An error occured.");
   }
})
app.get('/get_listing', async function (req, res) {
   const sku = req.query.sku;
   const quality = req.query.quality || undefined;
   const priceindex = req.query.priceindex || 0;
   const craftable = req.query.craftable || undefined;
   const tradable = req.query.tradable || undefined;
   try {
      const result = await axios({
         url: backpackURLs["base"] + backpackURLs["operations"]["get_listing"],
         method: 'GET',
         params: {
            token: process.env.BPTF_API_TOKEN,
            sku: sku,
            appid: "440",
            quality: quality,
            priceindex: priceindex,
            tradable: tradable,
            craftable: craftable,
         }
      });
      res.send(result.data);
   }
   catch(error) {
      logger.debug(error);
      res.send("An error occured.");
   }
})
app.get('/get_ignore', async function (req, res) {
   res.send(ignoredItems);
});

// Build server
var httpsServer = https.createServer(credentials, app);
var server = httpsServer.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port
   
   logger.debug("Example app listening at http://%s:%s", host, port)
})
