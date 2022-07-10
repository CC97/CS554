const redis = require('redis');
const bluebird = require("bluebird");
const client = redis.createClient();
const data = require("../data");
const flat = require("flat");
const unflatten = flat.unflatten;
const express = require("express");
const router = express.Router();

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//Check string and empty
function isString(str, varName) {
    if (!str) throw `${varName} must be provided`;
    if (typeof str != "string") throw `Type is not String ${varName} is a ${typeof str}`;
    if (str.length == 0 || str.trim().length == 0) throw "${varName} is empty";
  }

router.get('/:id(\\d+)/', async (req, res) => {
    var id = req.params.id;

    try {
        isString(id);
        var doesIdExist = await client.existsAsync(id);
    } catch (error) {
        res.status(400).json(error);
    }
    if(doesIdExist == 1) {
        let flatFromRedis = await client.hgetallAsync(id);
        let remadeUser = unflatten(flatFromRedis);
        await client.lpushAsync("Visitors", JSON.stringify(remadeUser));

        res.status(200).json(remadeUser);
    }
    else {
        try {
            let user = await data.getById(id);
            await client.lpushAsync("Visitors", JSON.stringify(user));
            let flatUser = flat(user);
            await client.hmsetAsync(user.id, flatUser);
            res.status(200).json(user);
        } catch (error) {
            res.status(400).json(error);
        }
    }
});

router.get("/history", async (req, res, next) => {
    let items = (await client.lrangeAsync("Visitors", 0, 19)).map(JSON.parse);
    res.json(items);
});

module.exports = router;