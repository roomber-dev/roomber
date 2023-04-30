const mongoose = require('mongoose')
const glob = require('glob')
const path = require('path')
mongoose.set('strictQuery', false);

module.exports = (sclog, url) => {
    mongoose.connect(url)

    const db = glob.sync('./schemas/**/*.js', { cwd: __dirname })
        .map(filename => {
            return {
                schema: require(filename),
                name: path
                    .basename(filename)
                    .replace(path.extname(filename), ''),
            }
        })
        .map(({ name, schema }) => mongoose.model(name, schema))
        .reduce((db, model) => {
            return {
                ...db,
                [model.modelName]: model,
            }
        }, {})

    mongoose.connection
        .on('error', error => {
            throw error
        })
        .once('open', () => sclog('MongoDB connected', 'start'))

    return db
}
