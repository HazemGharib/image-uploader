const path = require('path');
const decompress = require('decompress');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));

/**
 * Adds a new entry to the server.log file in that form:
 * *Wed Jan 1 2020 00:00:00 GMT+0800 (Malaysia Time): [POST] /url*
 * @param {any} req Request object
 * @param {any} res Response object
 * @param {any} next A reference to the next middleware
 */
const addLogEntry = (req, res, next) => {
    var now = new Date().toString();
    var log = `\r\n${now}: [${req.method}] ${req.url}`;
    
    fs.appendFile(`server.log`, log, { encoding: `utf-8` }, (err) => {
        if(err != null || err != undefined)
            console.log(err);
    });
    next();
}

/**
 * Checks if the `file` object exists in the request body or not 
 * @param {any} req Request object
 * @param {any} res Response object
 */
const checkIfFileExists = (req, res) => {
    // Check if req.files object exists
    if(req.files == null || req.files == undefined)
    {
        res.statusCode = 400;
        res.send('No files found');
        return;
    }
    
    // Check if req.files.file object exists
    if(req.files.file == null || req.files.file == undefined){
        res.statusCode = 404;
        res.send('File object not found, make sure that request parameter name is named "file"');
        return
    }
}

/**
 * Extracts the `file` object from the request body 
 * @param {any} req Request object
 */
const getFileObject = (req) => {
    // Check if there are more than one file object and pick only one file
    return req.files.file.length > 1 ? req.files.file[0] : req.files.file;
}

/**
 * Checks the `mimetype` object of the uploaded file, if matches, it will
 * continue, else it will return an `Invalid format found` message 
 * @param {any} req Request object
 * @param {any} res Response object
 * @param {any} uploadedFile File object to be checked
 * @param {any} mimeType A string (or substring) of the mimetype to be checked
 */
const checkMimeType = (req, res, uploadedFile, mimeType) => {
    let imageMimeType = uploadedFile.mimetype;
     // Check for image mime type
     if(! imageMimeType.includes(mimeType))
     {
         console.log(req.files.file);
         res.statusCode = 400;
         res.send('Invalid format found');
         return;
     }
}

/**
 * Generates a unique file path for a specific file
 * @param {any} uploadedFile File object
 */
const generateUniquePath = (uploadedFile) => {
    let extension = path.extname(uploadedFile.name);

    // Create storage directory if not existed
    createDirIfNotExist(config.uploadLocation);

    // Generate unique path and store file
    return config.uploadLocation + guid() + extension;
}

/**
 * Stores a file into a unique location and can do a decompression for a file if it is a compressed file
 * @param {any} res Response object
 * @param {any} uploadedFile File object
 * @param {any} uniquePath A unique path for the file to be stored in
 * @param {any} doDecompress A flag that represents weather to do a decompression or not
 */
const storeFile = (res, uploadedFile, uniquePath, doDecompress) => {
    uploadedFile.mv(uniquePath).then((file) => {
        if(doDecompress) {
            // Decompress file
            decompressFile(uniquePath, (uniqueImagePaths) => {
                // Return unique image locations
                res.send({imagePaths: uniqueImagePaths});
            });
        }
    }).catch((err) => {
        if (err) {
            console.log(err);
            res.statusCode = 500;
            return res.send(err);
        }
    });
}

exports.addLogEntry = addLogEntry;
exports.checkIfFileExists = checkIfFileExists;
exports.getFileObject = getFileObject;
exports.checkMimeType = checkMimeType;
exports.generateUniquePath = generateUniquePath;
exports.storeFile = storeFile;

//* Private Methods *//
const guid = () => {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

const decompressFile = (uniquePath, callback) => {
    let uniqueImageLocations = [];

    decompress(uniquePath, config.zippedImagesLocation, {
        map: file => {
            let filePath = guid() + path.extname(file.path);
            file.path = filePath;
            uniqueImageLocations.push(path.join(config.zippedImagesLocation,filePath));
            return file;
        }    
    })
    .then(files => {
        callback(uniqueImageLocations);
    }).catch((err) => {
        console.log(err);
        callback(uniqueImageLocations);
    });
}

const createDirIfNotExist = (path) => {
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
}