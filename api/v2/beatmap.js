const errors = require('../../helper/errors')
module.exports = {
    map: async function(req, cache) {
        if (!req.params.id) return { error: errors.MISSING_PARAMETERS }
        if (isNaN(req.params.id)) return { error: errors.INVALID_ARGUMENTS }

        //TODO: Add beatmap counter back
        const c = cache.get(req.params.id)
        if (c) return c

        const map = (await client.index('beatmaps').search(
            '', {
                filter: [`id = ${req.params.id}`],
            }
        )).hits[0]

        if (!map) return { error: errors.MAP_NOT_FOUND }

        //? add full route

        cache.set(req.params.id, map)

        return map
    },
    set: async function(req, cache) {
        if (!req.params.id) return { error: errors.MISSING_PARAMETERS }
        if (isNaN(req.params.id)) return { error: errors.INVALID_ARGUMENTS }

        //TODO: Add beatmap counter back || ? what the fuck is this
        const c = cache.get(req.params.id)
        if (c) return c

        const set = (await client.index('beatmapsets').search(
            '', {
                filter: [`id = ${req.params.id}`],
            }
        )).hits[0]

        if (!set){
            require('../../modules/updater')(req.params.id)
            return { error: errors.SET_NOT_FOUND }
        }

        cache.set(req.params.id, set)
        return set
    }
}