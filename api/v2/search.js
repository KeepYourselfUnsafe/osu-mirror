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

        return (await client.index('beatmapsets').search(searchQuery, searchOptions)).hits
    },
    search : async function(sets, cache){
        return sets
    }
}
