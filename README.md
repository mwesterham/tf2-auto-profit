# Team Fortress 2 Auto Profit

## Background

Team Fortress 2 (TF2) is a team-based first person shooter video game. Within TF2, there are cosmetic items that players can obtain through lootboxes (which are only unlockable through paying real money). Furthermore, players are able to trade items they obtain to one another in exchange for other items or virtual currency known as "Keys" and "Refined Metal". 

This virtual currency can be obtained from crafting and trading but is also directly tied to real markets since Keys cost exactly $2.49 and can be purchased from the in-game shop. Refined Metal can only be obtained through crafting or trading.

So in general, if a player wanted to obtain cosmetic items, they would either trade for those items or attempt to get them from lootboxes. Since lootboxes are randomized, it is much more time and cost effective to trade for the items using virtual currency. Trading in TF2 is very similar to real stock trading in that we can purchase different items from real players and re-sell them to others as we please.

## Description

This project aims to find profitable trades. If we are able to purchase an item for a price and then re-sell that item for higher we can profit. 

To do this, we run a Node.js server with Express and poll the prices of a subset of items to search with various APIs (Prices.tf and Backpack.tf). From these APIs, we determine the current selling price and buy price of any given item and calculate the potential profit of buying and re-selling that item.

Currently these trades must be excuted manually, but it is theoretically possible to automate this process with our own trading bot.
