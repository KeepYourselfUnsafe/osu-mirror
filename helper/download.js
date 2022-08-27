const { download } = require('./files')
const errors = require('./errors')

module.exports = {
    map: async function(id, novideo, ready, error){
        const auth = require('./auth')
        const key = await auth.login()

        if(!key) return { error: errors.SERVER_RATELIMIT }

        var headers = {
            "content-type": "application/x-osu-beatmap-archive",
            "accept": "application/x-osu-beatmap-archive",
            "authorization": "Bearer " + key,
            "scope": "*",
            "user-agent": "osu-lazer"
        };

        const res = await fetch(`https://osu.ppy.sh/api/v2/beatmapsets/${id}/download${novideo ? "?noVideo=1" : "" }`, {
            method: "GET",
            headers: headers
        })

        if(res.status != 200) {
            if (res.status == 429) return { error: errors.SERVER_RATELIMIT }
            if(res.status == 401) return { error: errors.UNAUTHORIZED }
            return error(errors.UNKNOWN)
        }

        const data = await fetch(res.url)

        if(data.status != 200) {
            if (data.status == 401) return {error: errors.UNAUTHORIZED }
            return error(errors.UNKNOWN)
        }

        return await download(data, novideo ? `./.data/maps/${id}n.osz` : `./.data/maps/${id}.osz`, ready)
    },

    osu : async function(id, ready, error){
        const beatmap = await fetch(`https://osu.ppy.sh/osu/${id}`)
        if (beatmap.status != 200) return error(errors.UNKNOWN)
        if (beatmap.length == 0) return error(errors.MAP_NOT_FOUND)
        return await download(beatmap, `.data/osu/${id}.osu`, ready)
    }
}