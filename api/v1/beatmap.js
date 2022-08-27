const errors = require('../../helper/errors')
const updater = require('../../modules/updater')
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

        const file = {
            "FileMD5": map.checksum,
            "TotalLength": map.total_length,
            "Playcount": map.playcount,
            "Mode": map.mode_int,
            "HP": map.drain,
            "MaxCombo": map.max_combo,
            "ParentSetID": map.beatmapset_id,
            "CS": map.cs,
            "AR": map.ar,
            "OD": map.accuracy,
            "BeatmapID": map.id,
            "HitLength": map.hit_length,
            "DifficultyRating": map.difficulty_rating,
            "Passcount": map.passcount,
            "DiffName": map.version,
            "BPM": map.bpm
        }

        cache.set(req.params.id, file)
        updater.queue(map.beatmapset_id)

        return file
    },
    set: async function(req, cache, direct) {
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
        const children = [];

        for (let j = 0; j < set.beatmaps.length; j++) {
            const map = set.beatmaps[j]
            children.push({
                "FileMD5": map.checksum,
                "TotalLength": map.total_length,
                "Playcount": map.playcount,
                "Mode": map.mode_int,
                "HP": map.drain,
                "MaxCombo": map.max_combo,
                "ParentSetID": map.beatmapset_id,
                "CS": map.cs,
                "AR": map.ar,
                "OD": map.accuracy,
                "BeatmapID": map.id,
                "HitLength": map.hit_length,
                "DifficultyRating": map.difficulty_rating,
                "Passcount": map.passcount,
                "DiffName": map.version,
                "BPM": map.bpm
            })
        }
        
        const file = {
            "Artist": set.artist,
            "ApprovedDate": new Date(set.ranked_date * 1000).toISOString(),
            "LastUpdate": new Date(set.last_updated * 1000).toISOString(),
            "ChildrenBeatmaps": children,
            "LastChecked": new Date(set.last_checked * 1000).toISOString(),
            "Title": set.title,
            "Favourites": set.favourite_count,
            "StarRating": set.rating,
            "Creator": set.creator,
            "RankedStatus": set.ranked,
            "Source": set.source,
            "Language": set.language.id,
            "HasVideo": set.video,
            "Genre": set.genre.id,
            "SetID": set.id,
            "Tags": set.tags
        }

        cache.set(req.params.id, file)
        updater.queue(req.params.id)

        if(direct) return `${set.id}.osz|${set.artist}|${set.title}|${set.creator}|${set.ranked}|${set.rating}|${new Date(set.last_updated * 1000).toISOString()}|${set.id}|0|${+set.video}|0|0|`
        
        return file
    },
    pp : async function(req){
        const rosu = require('rosu-pp')
        const fs = require('fs')
        const downloader = require('../../helper/download')

        if (!req.params.id) return { error: errors.MISSING_PARAMETERS }
        if (isNaN(req.params.id)) return { error: errors.INVALID_ARGUMENTS }

        const beatmaps = client.index('beatmaps')
        const check = (await beatmaps.search(
            '', {
                filter: [`id = ${req.params.id}`],
            }
        )).hits

        if (check.length == 0) return { error: errors.MAP_NOT_FOUND }

        if (!fs.existsSync(`./.data/osu/${req.params.id}.osu`)) await downloader.osu(req.params.id, ready, error)

        return ready()

        async function ready(){
            let amount = [];
            const calculate = [];
        
            if (typeof(req.query.acc) == 'object') amount = req.query.acc
            else if (typeof(req.query.acc) != 'undefined') amount.push(req.query.acc)
            else amount = [100]
        
            for (var i = 0; i < amount.length; i++) {
                let params = {}
                if (req.query.mods) params.mods = req.query.mods & 128 ? req.query.mods - 128 : req.query.mods & 8192 ? req.query.mods - 8192 : parseInt(req.query.mods)
                if (req.query.acc) params.acc = parseFloat(amount[i])
                if (req.query.combo) params.combo = parseInt(req.query.combo)
                if (req.query.misses) params.nMisses = parseInt(req.query.misses)
                calculate.push(params)
            }
        
            const meta = rosu.calculate({
                path: `./.data/osu/${req.params.id}.osu`,
                params: calculate
            })
        
            let pp = {}
        
            for (var i = 0; i < amount.length; i++) {
                const m = meta[i]
        
                if (!pp[amount[i]]) pp[amount[i]] = {}
        
                pp[amount[i]].pp = m.pp
                pp[amount[i]].ppAcc = m.ppAcc
                pp[amount[i]].ppAim = m.ppAim
                pp[amount[i]].ppFlashlight = m.ppFlashlight
                pp[amount[i]].ppSpeed = m.ppSpeed
            }
        
            let data = {
                mode: meta[0].mode,
                stars: meta[0].stars,
                pp: pp,
                aimStrain: meta[0].aimStrain,
                speedStrain: meta[0].speedStrain,
                flashlightRating: meta[0].flashlightRating,
                sliderFactor: meta[0].sliderFactor,
                ar: meta[0].ar,
                cs: meta[0].cs,
                hp: meta[0].hp,
                od: meta[0].od,
                bpm: meta[0].bpm,
                clockRate: meta[0].clockRate,
                nCircles: meta[0].nCircles,
                nSliders: meta[0].nSliders,
                nSpinners: meta[0].nSpinners,
                maxcombo: meta[0].maxcombo
            }
            return { data }
        }

        async function error(){
            return { error: errors.MAP_NOT_FOUND }
        }
    }
}