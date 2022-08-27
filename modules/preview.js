const unzipper = require('unzipper');
const fs = require('fs');
const errors = require('../helper/errors');
const utf8 = require('utf8');
const download = require('../helper/download');
const path = require('../helper/files').getRootDir();

module.exports = {
    audio : async function(req, reply){
        const mp3 = require('mp3-cutter')
        const p = await path
        
        let set = req.query.set || 0

        if(isNaN(set)) return { error: errors.INVALID_ARGUMENTS }

        const result = await client.index(`${set ? "beatmapsets" : "beatmaps"}`).search('', {
            filter: [`"id" = ${req.params.id}`],
        })

        if(result.hits.length < 1) return { error: errors.MAP_NOT_FOUND }

        const map = set ? result.hits[0].beatmaps[0] : result.hits[0]

        reply.header("Content-Type", "audio/mp3");

        const setid = map.beatmapset_id;

        if(fs.existsSync(`.data/audio/${map.id}.mp3`)) return fs.createReadStream(`${p}/.data/audio/${map.id}.mp3`)
        if(!fs.existsSync(`.data/osu/${map.id}.osu`)) return await download.osu(map.id, checkPass, error)

        return await checkPass()

        async function checkPass(){
            if(!fs.existsSync(`.data/maps/${setid}.osz`)) return await download.map(setid, false, unzip, error)
            return await unzip()
        }

        async function unzip(){
            const zipped = fs.createReadStream(`.data/maps/${setid}.osz`)
            .pipe(unzipper.Parse())
            .on('entry', function (entry) {
                const fileName = utf8.encode(entry.path);
                if(fileName.endsWith(".mp3" || ".png" || ".jpg" || ".jpeg" || ".wav")){
                    if(!fs.existsSync(`.data/temp/${setid}`)) fs.mkdirSync(utf8.encode(`.data/temp/${setid}`));
                    entry.pipe(fs.createWriteStream(`.data/temp/${setid}/${fileName}`))
                } else {
                    entry.autodrain()
                }
            });

            zipped.on('close', async () => {
                await cut()
            })
        }

        async function cut(){
            const osuFile = fs.readFileSync(`.data/osu/${map.id}.osu`, 'utf-8');
            const lines = osuFile.split('\n');
        
            let audio;
            let time = -1;
        
            for(var i = 0; i < lines.length; i++) {
                if(lines[i].startsWith('AudioFilename:')) {
                    audio = utf8.encode(lines[i].split(':')[1].trim());
                }
        
                if(lines[i].startsWith('PreviewTime:')) {
                    time = parseInt(lines[i].split(':')[1].trim());
                    break;
                }
            }

            if(typeof(audio) == 'undefined') return {error: errors.UNKNOWN}
            if(audio.includes(".ogg" || ".wav")) return { error: "Currently not supported" }
        
            if(time == -1) time = map.total_length / 2
            else time = time / 1000
        
            const startTime = map.total_length < 30 ? 0 : time;
            let endTime = map.total_length < 30 ? map.total_length : time + 30;
        
            if(endTime >= map.total_length) endTime = map.total_length - 1;

            mp3.cut({
                src: `${p}/.data/temp/${setid}/${audio}`,
                target: `${p}/.data/audio/${map.id}.mp3`,
                start: startTime,
                end: endTime
            })

            fs.rmSync(`.data/temp/${setid}`, { recursive: true });
            return await ready()
        }

        async function ready(){
            return reply.send(fs.createReadStream(`${p}/.data/audio/${map.id}.mp3`));
        }

        async function error(){
            return { error: errors.UNKNOWN }
        }
    }
}