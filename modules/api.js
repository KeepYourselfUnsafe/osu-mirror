const fastify = require('fastify')()
const logger = require('../helper/logger')

module.exports = async function(){
    const { port, ratelimit } = require('../config.json');

    if(ratelimit.enabled){
        fastify.register(require('@fastify/rate-limit'), {
            max: ratelimit.limit,
            timeWindow: '1 minute'
        })
    }

    fastify.register(require('../api/v1/api'), { prefix: '/api'  })
    fastify.register(require('../api/v2/api'), { prefix: '/api/v2'  })

    fastify.get('/d/:id', async (req, reply) => {
        return require('./download').set(req, reply)
    })

    fastify.get('/osu/:id', async (req, reply) => {
        return require('./download').osu(req, reply)
    })

    fastify.get('/preview/audio/:id', async (req, reply) => {
        return require('./preview').audio(req, reply)
    })
    
    await fastify.listen(port)
    logger.info(`API listening at 127.0.0.1:${port}`)
}