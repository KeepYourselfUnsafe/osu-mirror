const auth = require('../helper/auth')
const logger = require('../helper/logger')
const nodeCache = require('node-cache')
const { updater } = require('../config.json')
const update = new nodeCache()
module.exports = {
    start: async function(ready){
        const sets = update.keys()

        for(let i = 0; i < sets.length; i++){
            const set = update.get(sets[i])
            update.del(sets[i])
            await this.update(set)
        }

        ready()
    },
    queue : async function(id){
        const search = await client.index('beatmapsets').search('', {
            filter: [`id = ${id}`],
        })

        const set = search.hits[0]

        let time;

        if(set.ranked == 1 || set.ranked == 2 || set.ranked == 4){ //Ranked, Approved, Loved
            time = 1000 * 60 * 60 * 24 * 31 //1 month
        } else if(set.ranked == -2){ //Graveyard
            time = 1000 * 60 * 60 * 24 * 7 //1 week
        } else if(set.ranked == -1 || set.ranked == 0 || set.ranked == 3){ //Pending, WIP, Qualified
            time = 1000 * 60 * 5 //5 minutes
        }

        if(!Date.now() - set.last_checked > time) return 0;

        if(!update.get(id)) update.set(id, id)
        return 1
    },
    update : async function(id){
        const key = await auth.login()
    
        let beatmaps = [];
    
        const request = await fetch(`https://osu.ppy.sh/api/v2/beatmapsets/${id}`, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${key}`
            }
        })
    
        let response = await request.json()
    
        if(response.error === null){
            logger.error(`Skipped Update: ${id}`)
            id++
            return 0;
        }
    
        let set = {
                id: response.id,
                artist: response.artist,
                artist_unicode: response.artist_unicode,
                covers: response.covers,
                creator: response.creator,
                favourite_count: response.favourite_count,
                hype: response.hype,
                nsfw: response.nsfw,
                offset: response.offset,
                play_count: response.play_count,
                preview_url: response.preview_url,
                source: response.source,
                spotlight: response.spotlight,
                status: response.status,
                title: response.title,
                title_unicode: response.title_unicode,
                track_id: response.track_id,
                user_id: response.user_id,
                video: response.video,
                availability: response.availability,
                bpm: response.bpm,
                can_be_hyped: response.can_be_hyped,
                discussion_enabled: response.discussion_enabled,
                discussion_locked: response.discussion_locked,
                is_scoreable: response.is_scoreable,
                last_updated: new Date(response.last_updated).getTime() / 1000,
                legacy_thread_url: response.legacy_thread_url,
                nominations_summary: response.nominations_summary,
                ranked: response.ranked,
                ranked_date: new Date(response.ranked_date).getTime() / 1000,
                storyboard: response.storyboard,
                submitted_date: new Date(response.submitted_date).getTime() / 1000,
                tags: response.tags,
                has_favourited: response.has_favourited,
                beatmaps: response.beatmaps,
                converts: response.converts,
                description: response.description,
                genre: response.genre,
                language: response.language,
                ratings: response.ratings,
                recent_favourites: response.recent_favourites,
                user: response.user
        }
        
        let ratings = 0;
        let ratingCount = 0;
    
        for(var i = 0; i < response.ratings.length; i++) {
            ratingCount += response.ratings[i]
            ratings += response.ratings[i] * i
        }
    
        let rating = ratings / ratingCount
    
        if(isNaN(rating)) rating = 0
    
        const modes = [];
    
        for(var i = 0; i < response.beatmaps.length; i++){
            const beatmap = response.beatmaps[i]
    
            modes.push(beatmap.mode_int)
    
            let map = {
                    id: beatmap.id,
                    beatmapset_id: beatmap.beatmapset_id,
                    difficulty_rating: beatmap.difficulty_rating,
                    mode: beatmap.mode,
                    status: beatmap.status,
                    total_length: beatmap.total_length,
                    user_id: beatmap.user_id,
                    version: beatmap.version,
                    accuracy: beatmap.accuracy,
                    ar: beatmap.ar,
                    bpm: beatmap.bpm,
                    convert: beatmap.convert,
                    count_circles: beatmap.count_circles,
                    count_sliders: beatmap.count_sliders,
                    count_spinners: beatmap.count_spinners,
                    cs: beatmap.cs,
                    deleted_at: beatmap.deleted_at,
                    drain: beatmap.drain,
                    hit_length: beatmap.hit_length,
                    is_scoreable: beatmap.is_scoreable,
                    last_updated: new Date(beatmap.last_updated).getTime() / 1000,
                    mode_int: beatmap.mode_int,
                    passcount: beatmap.passcount,
                    playcount: beatmap.playcount,
                    ranked: beatmap.ranked,
                    url: beatmap.url,
                    checksum: beatmap.checksum,
                    failtimes: beatmap.failtimes,
                    max_combo: beatmap.max_combo
            }
            beatmaps.push(map)
        }
    
        const unique = modes.filter((v, i, a) => a.indexOf(v) === i);
    
        set.modes = unique
        set.rating = rating
        set.last_checked = new Date().getTime() / 1000
    
        client.index('beatmapsets').addDocuments([set])
    
        logger.success(`Updated Beatmapset: ${id}`)
        return 1;
    },
    background : async function(){
        let id = updater.id
        let error = 0;

        setInterval(async () =>{
            await crawl()
        }, 1000)

        let beatmapsets = [];
        let beatmaps = [];

        async function crawl(){
            if(error >= 1000){
                logger.info('Maximum ID reached.')
            }

            if(id % 100 == 0){
                client.index('beatmapsets').addDocuments(beatmapsets)
                logger.success(`Added ${beatmapsets.length} Beatmaps (Latest: ${id})`)
                beatmapsets = [];
                logger.success(`Added ${beatmaps.length} (Beatmaps)`)
                client.index('beatmaps').addDocuments(beatmaps)
                beatmaps = [];
            }

            const key = await auth.login()

            if(key == 0) return setTimeout(async () =>{
                await crawl()
            }, 60000)

            const request = await fetch(`https://osu.ppy.sh/api/v2/beatmapsets/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${key}`
                }
            })
            let response = await request.json()

            if(response.error === null){
                logger.error(`Skipped Beatmapset: ${id}`)
                error++
                id++
                return
            }

            let set = {
                    id: response.id,
                    artist: response.artist,
                    artist_unicode: response.artist_unicode,
                    covers: response.covers,
                    creator: response.creator,
                    favourite_count: response.favourite_count,
                    hype: response.hype,
                    nsfw: response.nsfw,
                    offset: response.offset,
                    play_count: response.play_count,
                    preview_url: response.preview_url,
                    source: response.source,
                    spotlight: response.spotlight,
                    status: response.status,
                    title: response.title,
                    title_unicode: response.title_unicode,
                    track_id: response.track_id,
                    user_id: response.user_id,
                    video: response.video,
                    availability: response.availability,
                    bpm: response.bpm,
                    can_be_hyped: response.can_be_hyped,
                    discussion_enabled: response.discussion_enabled,
                    discussion_locked: response.discussion_locked,
                    is_scoreable: response.is_scoreable,
                    last_updated: new Date(response.last_updated).getTime() / 1000,
                    legacy_thread_url: response.legacy_thread_url,
                    nominations_summary: response.nominations_summary,
                    ranked: response.ranked,
                    ranked_date: new Date(response.ranked_date).getTime() / 1000,
                    storyboard: response.storyboard,
                    submitted_date: new Date(response.submitted_date).getTime() / 1000,
                    tags: response.tags,
                    has_favourited: response.has_favourited,
                    beatmaps: response.beatmaps,
                    converts: response.converts,
                    description: response.description,
                    genre: response.genre,
                    language: response.language,
                    ratings: response.ratings,
                    recent_favourites: response.recent_favourites,
                    user: response.user
            }
            
            let ratings = 0;
            let ratingCount = 0;

            for(var i = 0; i < response.ratings.length; i++) {
                ratingCount += response.ratings[i]
                ratings += response.ratings[i] * i
            }

            let rating = ratings / ratingCount

            if(isNaN(rating)) rating = 0

            const modes = [];

            for(var i = 0; i < response.beatmaps.length; i++){
                const beatmap = response.beatmaps[i]

                modes.push(beatmap.mode_int)

                let map = {
                        id: beatmap.id,
                        beatmapset_id: beatmap.beatmapset_id,
                        difficulty_rating: beatmap.difficulty_rating,
                        mode: beatmap.mode,
                        status: beatmap.status,
                        total_length: beatmap.total_length,
                        user_id: beatmap.user_id,
                        version: beatmap.version,
                        accuracy: beatmap.accuracy,
                        ar: beatmap.ar,
                        bpm: beatmap.bpm,
                        convert: beatmap.convert,
                        count_circles: beatmap.count_circles,
                        count_sliders: beatmap.count_sliders,
                        count_spinners: beatmap.count_spinners,
                        cs: beatmap.cs,
                        deleted_at: beatmap.deleted_at,
                        drain: beatmap.drain,
                        hit_length: beatmap.hit_length,
                        is_scoreable: beatmap.is_scoreable,
                        last_updated: new Date(beatmap.last_updated).getTime() / 1000,
                        mode_int: beatmap.mode_int,
                        passcount: beatmap.passcount,
                        playcount: beatmap.playcount,
                        ranked: beatmap.ranked,
                        url: beatmap.url,
                        checksum: beatmap.checksum,
                        failtimes: beatmap.failtimes,
                        max_combo: beatmap.max_combo
                }
                beatmaps.push(map)
            }

            const unique = modes.filter((v, i, a) => a.indexOf(v) === i);

            set.modes = unique
            set.rating = rating
            set.last_checked = new Date().getTime() / 1000

            beatmapsets.push(set)

            logger.success(`(Updater) Queued Beatmapset: ${id}`)
            error = 0;
            id++
            return 1
        }
    }
}
