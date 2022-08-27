const { MeiliSearch } = require('meilisearch')
const logger = require('./logger')
module.exports = {
    connect : async function(){
        logger.debug('Connecting to database...')
        client = new MeiliSearch({
            host: 'http://127.0.0.1:7700',
            apiKey: 'masterKey',
        })
        logger.success("Connected to Meilisearch")
    },
    findLastID : async function(){

        const ids = await client.index('beatmapsets').search('', {
            sort : ['id:desc'],
            limit: 1
        })

        if(ids.hits.length == 0) return 0

        return ids.hits[0].id
    }
}