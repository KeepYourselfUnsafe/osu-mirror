const errors = require('../helper/errors')
const nodeCache = require('node-cache')
const fs = require('fs')
const download = require('../helper/download')
const setCache = new nodeCache()
const osuCache = new nodeCache()
const errorCache = new nodeCache()
const errCache = new nodeCache()
module.exports = {
    set : async function(req, reply){
        if(!req.params.id) return { error: errors.MISSING_PARAMETERS }
    
        const initid = String(req.params.id)
        const novideo = initid.endsWith("n")
        if (isNaN(initid) && !initid.endsWith("n")) return error("Invalid ID: " + initid)
    
        const id = novideo ? initid.slice(0, -1) : initid

        var set = setCache.get(id)
        if(set) return ready()

        const err = errorCache.get(id)
        if(err) return error(err)

        var set = ((await client.index('beatmapsets').search(
            '', {
                filter: [`id = ${id}`],
            }
        )).hits)[0]
    
        if(!set){
            require('./updater').update(initid)
            return error(errors.SET_NOT_FOUND)
        }
        
        if(fs.existsSync(novideo ? `./.data/maps/${id}n.osz` : `./.data/maps/${id}.osz`)) return ready()

        return await download.map(id, novideo, ready, error)

        async function ready() {
            setCache.set(id, set)
            const file = fs.createReadStream(novideo ? `./.data/maps/${id}n.osz` : `./.data/maps/${id}.osz`)
            const buff = fs.readFileSync(novideo ? `./.data/maps/${id}n.osz` : `./.data/maps/${id}.osz`);

            reply.header('Content-Length', buff.length);
            reply.header('Content-Disposition', `attachment; filename="${id} ${set.artist} - ${set.title}${novideo ? " [no video]" : ""}.osz"`);
            return reply.send(file)
        }
    
        async function error(error) {
            if(!err) errorCache.set(id, error)
            return { error }
        }
    },

    osu: async function(req, reply) {
        if (!req.params.id) return { error: errors.MISSING_PARAMETERS }
        const id = req.params.id
        if (isNaN(id)) return { error: `Invalid ID: ${id}` }

        const err = errCache.get(id)
        if(err) return error(err)

        var map = osuCache.get(id)
        if(map) return ready()

        var map = ((await client.index('beatmaps').search(
            '', {
                filter: [`id = ${id}`],
            }
        )).hits)[0]

        if (!map) return error(errors.MAP_NOT_FOUND)

        var set = setCache.get(map.beatmapset_id)
        if(set) return ready()

        var set = ((await client.index('beatmapsets').search(
            '', {
                filter: [`id = ${map.beatmapset_id}`],
            }
        )).hits)[0]

        if (!set){
            require('./updater').update(map.beatmapset_id)
            return error(errors.SET_NOT_FOUND)
        }

        if(fs.existsSync(`./.data/osu/${id}.osu`)) return ready()

        return await download.osu(id, ready, error)

        async function ready() {
            osuCache.set(id, set)
            setCache.set(map.beatmapset_id, set)
            const file = fs.createReadStream(`./.data/osu/${id}.osu`)
            reply.header('Content-Disposition', `attachment; filename="${id} ${set.artist} - ${set.title} [${map.version}].osu"`);
            return reply.send(file)
        }

        async function error(error) {
            if(!err) errCache.set(id, error)
            return { error }
        }
    }
}