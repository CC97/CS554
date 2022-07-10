const pokemonRoute = require('./pokemon');

const constructorMethod = (app) => {
    app.use('/pokemon', pokemonRoute);

    app.use('*', (req, res) => {
        res.sendStatus(404);
    });
};

module.exports = constructorMethod;
