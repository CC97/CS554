const express = require('express');
const router = express.Router();
const data = require('../data');

//Check string and empty
function isString(str, varName) {
    if (!str) throw `${varName} must be provided`;
    if (typeof str != 'string') throw `Type is not String ${varName} is a ${typeof str}`;
    if (str.length == 0 || str.trim().length == 0) throw '${varName} is empty';
}

router.get('/page/:pagenum', async (req, res) => {
    const pageNum = req.params.pagenum;
    isString(pageNum, 'pageNum');
    try {
        if (!pageNum) throw 'Please input a page number';
    } catch (error) {
        res.status(404).json({ error: error });
    }
    try {
        const pokemonList = await data.getPokemonList(parseInt(pageNum));
        res.status(200).json(pokemonList);
    } catch (e) {
        res.status(404).json({ error: e });
    }
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    isString(id, 'ID');
    try {
        if (!id) throw 'Please input a id or name';
    } catch (error) {
        res.status(404).json({ error: error });
    }
    try {
        const pokemonInfo = await data.getPokemonById(id);
        res.status(200).json(pokemonInfo);
    } catch (e) {
        res.status(404).json({ error: e });
    }
});

module.exports = router;
