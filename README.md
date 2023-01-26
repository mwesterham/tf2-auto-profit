# Team Fortress 2 Auto Profit

## Background

Team Fortress 2 (TF2) is a team-based first person shooter video game. Within TF2, there are cosmetic items that players can obtain through lootboxes (which are only unlockable through paying real money). Furthermore, players are able to trade items they obtain to one another in exchange for other items or virtual currency known as "Keys" and "Refined Metal". 

This virtual currency can be obtained from crafting and trading but is also directly tied to real markets since Keys cost exactly $2.49 and can be purchased from the in-game shop. Refined Metal can only be obtained through crafting or trading.

So in general, if a player wanted to obtain cosmetic items, they would either trade for those items or attempt to get them from lootboxes. Since lootboxes are randomized, it is much more time and cost effective to trade for the items using virtual currency. Trading in TF2 is very similar to real stock trading in that we can purchase different items from real players and re-sell them to others as we please.

## Description

This project aims to find profitable trades. If we are able to purchase an item for a price and then re-sell that item for higher we can profit. 

To do this, we run a Node.js server with Express and poll the prices of a subset of items to search with various APIs (Prices.tf and Backpack.tf). From these APIs, we determine the current selling price and buy price of any given item and calculate the potential profit of buying that item from backpack.tf and re-selling that item on scrap.tf.

These trades must be excuted manually.

## Setup

1. Installing git

Please install git from https://git-scm.com/. This is to clone the repository and keep updated with the latest changes.

2. Installing node

This server runs on Node.js so please install the LTS version from https://nodejs.org/.

3. Cloning the website

This repository will run the server on your local machine, so we will be downloading the website onto it. Please navigate to a folder of your choosing **in the terminal**. In this example, we will use the Documents folder.

`cd Documents`

`git clone https://github.com/mwesterham/tf2-auto-profit.git --branch main`

4. Now navigate to the directory of your cloned repo and install the modules

`cd tf2-auto-profit`

`npm install`

5. After installing the node modules, it is time to setup your api key/tokens and configuration

## Configuration

In order for the website to run properly, we will need to collect a couple important items. The most important is collecting your api key/tokens from backpack.tf.

1. Sign on to https://backpack.tf/ with your steam account

2. Write down your api key from https://backpack.tf/developer/apikey/view

3. Write down your api token from https://backpack.tf/connections

4. Rename the *config.json.template* file to *config.json* 

5. Then enter in your api key and token

```
{
    "BPTF_API_KEY": "XXXXXXXXXXXXXXXXXXXXX",
    "BPTF_API_TOKEN": "XXXXXXXXXXXXXXXXXXXXX",
    "USE_HTTPS": false,
    "PORT": 3000,
    "APP": {
        "PROFILES_OF_INTEREST": [
            "76561198453530349"
        ]
    }
}
```

6. You can also optionally add your backpack.tf account to the profiles of interest section to track your metal and key supplies on the website. (A popular trade bot's account is given as placeholder)

```
"APP": {
    "PROFILES_OF_INTEREST": [
        "XXXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXXXXXXX"
    ]
}
```

## Running the Website

You are now ready to run the bot after the setup and configuration of the website. Navigate to the root folder and begin the running the website.

`cd Documents/tf2-auto-profit`

`node server.js`

If all is well, you should see something like this:

`[2023-01-25T20:00:41.957] [DEBUG] default - Example app listening at http://localhost:3000`

Navigate to http://localhost:3000 to view your trade website!