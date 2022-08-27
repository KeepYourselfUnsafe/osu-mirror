const fs = require('fs');
module.exports = {
    download : async function(file, path, ready){
        const fileStream = fs.createWriteStream(path);

        file.body.pipe(fileStream);

        fileStream.on("finish", async () => {
            fileStream.close()
            await ready()
        });
    },
    getRootDir : async function(){
        const { dirname } = require('path');
        const { constants, promises: { access } } = require('fs');
        
        for (let path of module.paths) {
          try {
            await access(path, constants.F_OK);
            return dirname(path);
          } catch (e) {
            // Just move on to next path
          }
        }
    }
}