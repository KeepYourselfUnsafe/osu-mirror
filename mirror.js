async function main(){
    const fs = require('fs')
    const logger = require('./helper/logger')
    const { connect } = require('./helper/database')
    logger.info('Starting osu-mirror - a JavaScript osu! Beatmap Mirror. Version: ' + fs.readFileSync('./VERSION', 'utf8'))

    await connect()
    await require('./modules/once')()
    await require('./modules/crawler')()
    await require('./modules/api')()
}

main();