const database = require("../../helper/database")
const { server } = require("../../config.json")
const fs = require("fs")
const version = fs.readFileSync('./VERSION', 'utf8')

module.exports = async function(){
    const m = 1734266
    const c = await database.findLastID()
    const p = 16.67

    const eta = ((m - c) / p) / 60

    function toTimer(minutes){
        var sign = minutes < 0 ? "-" : "";
        var days = Math.floor(Math.abs(minutes) / 60 / 24);
        var hours = Math.floor(Math.abs(minutes) / 60) % 24;
        var min = Math.floor(Math.abs(minutes)) % 60;
        var sec = Math.floor((Math.abs(minutes) * 60) % 60);
    
        if(days > 0 || days <= -1) return sign + days + (days > 1 ? " Days + " : " Day + ") + (hours < 10 ? "0" : "") + hours + ":" + (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec
        if(hours > 0 || hours <= -1) return sign + (hours < 10 ? "0" : "") + hours + ":" + (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec
        return sign + (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
    }

    return { 
        online: 1, 
        status: `Online (${server})`, 
        version: version,
        eta: `ETA for Completion: ${toTimer(eta)}`,
    }
}