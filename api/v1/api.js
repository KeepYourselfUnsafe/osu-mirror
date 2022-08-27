const nodeCache = require('node-cache')
const search = require('./search')
const beatmap = require('./beatmap')

const mapCache = new nodeCache()
const setCache = new nodeCache()
const directCache = new nodeCache()
const rawCache = new nodeCache()

module.exports = async function(fastify, opts){
    fastify.get('/', async (req, res) => {
        return require('./online')()
    })

    fastify.get('/search', async (req, res) => {
        const raw = req.query.raw || 0

        const sets = await search.searchHandler(req)

        if(raw) return search.searchRaw(sets, rawCache)
        return search.search(sets, directCache)
    })

    fastify.get('/search/set/:id', async (req, res) => {
        return beatmap.set(req, setCache, true)
    })

    fastify.get('/b/:id', async (req, res) => {
        return beatmap.map(req, mapCache)
    })

    fastify.get('/s/:id', async (req, res) => {
        return beatmap.set(req, setCache)
    })

    fastify.get('/meta/:id', async (req, res) => {
        return beatmap.pp(req)
    })
}