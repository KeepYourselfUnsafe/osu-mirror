module.exports = {
    searchHandler : async function(req){
        if(req.query.query == '' || req.query.query){
            if(req.query.q == '' || req.query.q) return { error: error.INVALID_ARGUMENTS }
            req.query.q = req.query.query
        }

        if(req.query.mode == '' || req.query.mode){
            if(req.query.m == '' || req.query.m) return { error: error.INVALID_ARGUMENTS }
            req.query.m = req.query.mode
        }

        if(req.query.offset == '' || req.query.offset){
            if(req.query.p == '' || req.query.p) return { error: error.INVALID_ARGUMENTS }
            req.query.p = req.query.offset
        }

        
        let query = req.query.query || req.query.q || 'Newest'
        let limit = req.query.limit || req.query.amount || 101
        let offset = req.query.offset || req.query.p || 0
        let ranked = req.query.status || req.query.ranked || "-3"
        let mode = req.query.mode || req.query.m || -1

        const newest = query == "Newest"
        const top = query == "Top Rated"
        const most = query == "Most Played"

        const searchQuery = (newest || top || most) ? '' : query
        let searchFilter = '';
        let searchOptions = {
            limit: parseInt(limit),
            offset: parseInt(offset) * parseInt(limit)
        }

        let convert = [];
        let rankedFilter = [];


        if(req.query.r){
            if (typeof(req.query.r) != 'object') convert.push(req.query.r);
            else convert = req.query.r;

            convert.forEach(rank => {
                if(rank == 0 || rank == 7) rankedFilter.push("1", "2")
                if(rank == 2) rankedFilter.push("0")
                if(rank == 3) rankedFilter.push("3")
                if(rank == 4) rankedFilter.push("-3")
                if(rank == 5) rankedFilter.push("-2")
                if(rank == 8) rankedFilter.push("4")
            })
        } else {
            if(typeof(ranked) != 'object'){
                if(ranked == 1) rankedFilter.push("1", "2")
                else rankedFilter.push(ranked)
            } else {
                rankedFilter = ranked;
            }
        }

        
        if(rankedFilter.indexOf("-3") == -1){
            searchFilter += `(`
            for (var i = 0; i < rankedFilter.length; i++) {
                searchFilter += `ranked = ${rankedFilter[i]}${i != (rankedFilter.length - 1) ? " OR " : ")"}`
            }
        }

        if (mode != -1) searchFilter += `${rankedFilter.indexOf("-3") != -1 ? "" : " AND "} modes = ${mode}`

        searchOptions.sort = top ? ["favourite_count:desc", "rating:desc"] : ["id:desc"]
        searchOptions.filter = searchFilter

        const search = await client.index('beatmapsets').search(searchQuery, searchOptions)

        if(typeof(search) == 'undefined') return 0;

        return search.hits
    },
    search : async function(sets, cache){
        const result = [];

        if(sets.length < 1) return result

        for(var i = 0; i < sets.length; i++) {
            const set = sets[i]
            const c = cache.get(set.id)

            if(c){
                result.push(c)
                continue;
            }

            let children = []

            for(var j = 0; j < set.beatmaps.length; j++){
                const map = set.beatmaps[j]
                children.push({
                    "BeatmapID": map.id,
                    "ParentSetID": map.beatmapset_id,
                    "DiffName": map.version,
                    "FileMD5": map.checksum,
                    "Mode": map.mode_int,
                    "BPM": map.bpm,
                    "AR": map.ar,
                    "OD": map.accuracy,
                    "CS": map.cs,
                    "HP": map.drain,
                    "TotalLength": map.total_length,
                    "HitLength": map.hit_length,
                    "Playcount": map.playcount,
                    "Passcount": map.passcount,
                    "MaxCombo": map.max_combo,
                    "DifficultyRating": map.difficulty_rating,
                })
            }

            const tree = {
                SetID : set.id,
                RankedStatus : set.ranked,
                ChildrenBeatmaps : children,
                LastUpdate : new Date(set.last_updated * 1000).toISOString().slice(0, 19).replace('T', ' '),
                LastChecked : new Date(set.last_checked * 1000).toISOString().slice(0, 19).replace('T', ' '),
                Artist : set.artist,
                Title : set.title,
                Creator : set.creator,
                Source : set.source,
                Tags : set.tags,
                HasVideo : + set.video,
                Genre : set.genre.id,
                Language : set.language.id,
                Favourites : set.favourites,
                StarRating : parseFloat(set.rating.toFixed(2))
            }

            result.push(tree)
            cache.set(set.id, tree)
        }

        return result
    },
    searchRaw : async function(sets, cache){
        if(sets.length < 1) return '0';

        const result = [sets.length];

        for(var i = 0; i < sets.length; i++) {
            const set = sets[i]
            const c = await cache.get(set.id)

            if(c){
                result.push(c)
                continue;
            }

            const children = [];

            for(var j = 0; j < set.beatmaps.length; j++) {
                children.push(`${set.beatmaps[j].version}★${set.beatmaps[j].difficulty_rating}@${set.beatmaps[j].mode_int}`)
            }

            let text = `${set.id}.osz|${set.artist}|${set.title}|${set.creator}|${set.ranked}|${set.rating.toFixed(2)}|${new Date(set.last_updated * 1000).toISOString()}|${set.id}|0|${+set.video}|0|0|0|${children}`

            cache.set(set.id, text)
            result.push(text)
        }

        return result.join('\n')
    }
}
