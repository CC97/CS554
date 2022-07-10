const axios = require('axios');

//Check string and empty
function isString(str, varName) {
    if (!str) throw `${varName} must be provided`;
    if (typeof str != 'string') throw `Type is not String ${varName} is a ${typeof str}`;
    if (str.length == 0 || str.trim().length == 0) throw '${varName} is empty';
}

async function getPokemonList(pageNumber) {
    // check
    if (!pageNumber) throw 'Please only input a page number';
    if (typeof pageNumber != 'number') throw 'Page number must be a number';
    if (pageNumber < 1) throw 'Page number must be greater than 0';

    const { data } = await axios.get(
        `https://pokeapi.co/api/v2/pokemon?offset=${(pageNumber - 1) * 20}&limit=20`
    );
    return data;
}

async function getPokemonById(id) {
    // // check
    // if (!id) throw 'Please only input a id';
    // if (typeof id != 'number') throw 'ID must be a number';
    // if (id < 1) throw 'ID must be greater than 0';

    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
    return data;
}

module.exports = {
    getPokemonList,
    getPokemonById,
};
