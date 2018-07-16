const express = require('express');
const hbs = require('hbs');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');

const decompress = require('decompress');

const port = process.env.PORT || 3000;
const config = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));

var app = express();

hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');

app.use((req, res, next) => {
    var now = new Date().toString();
    var log = `\r\n${now}: [${req.method}] ${req.url}`;
    //console.log(log);
    fs.appendFile(`server.log`, log, { encoding: `utf-8` }, (err) => {
        if(err != null || err != undefined)
            console.log(err);
    });
    next();
});

// app.use((req, res, next) => {
//     res.render('maintainence.hbs',{});
// });

app.use(express.static(__dirname + '/config'));
app.use(express.static(__dirname + '/public'));

app.use(fileUpload());

hbs.registerHelper('getCurrentYear', () => {
    return new Date().getFullYear().toString();
});

hbs.registerHelper('screamIt', (text) => {
    return text.toUpperCase();
});

function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function checkIfFileExists(req, res) {
    // Check if req.files object exists
    if(req.files == null || req.files == undefined)
    {
        res.statusCode = 400;
        res.send('No files found');
        return;
    }
    
    // Check if req.files.file object exists
    if(req.files.file == null || req.files.file == undefined){
        console.log('req.files name(s): ');
        var filesArr = [];
        filesArr.push(req.files);

        filesArr.forEach(file => {
            console.log(Object.keys(file));
        });

        res.statusCode = 404;
        res.send('File object not found, make sure that request parameter name is named "file"');
        return
    }
}

function getFileObject(req) {
    // Check if there are more than one file object and pick only one file
    return req.files.file.length > 1 ? req.files.file[0] : req.files.file;
}

function createDirIfNotExist(path) {
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
}

function checkMimeType(req, res, uploadedFile, mimeType) {
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

function generateUniquePath(uploadedFile) {
    let extension = path.extname(uploadedFile.name);

    // Create storage directory if not existed
    createDirIfNotExist(config.uploadLocation);

    // Generate unique path and store file
    return config.uploadLocation + guid() + extension;
}

function storeFile(res, uploadedFile, uniquePath) {
    uploadedFile.mv(uniquePath, function(err) {
        if (err)
        {
            console.log(err);
            res.statusCode = 500;
            return res.send(err);
        }
    });
}

function decompressFile(uniquePath, callback) {
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

app.get('/', (req, res) => {
    //res.send('<h1>Hello Express!</h1>');
    // res.send({
    //     name: 'Hazem',
    //     likes: [
    //         'Football',
    //         'Travelling'
    //     ]
    // });
    res.render('home.hbs', {
        pageTitle: 'Home Page',
        welcomeMessage: 'Welcome in my brand new website'
    });
});

app.get('/about', (req, res) => {
    res.render('about.hbs', {
        pageTitle: 'About Page',
    });
});

app.get('/projects', (req, res) => {
    res.render('projects.hbs', {
        pageTitle: 'Projects Page',
    });
});

app.get('/bad', (req, res) => {
    res.send({
        errorMessage: "Unable to handle that request"
    });
});

app.post('/uploadImage', (req, res) => {

    checkIfFileExists(req, res);

    // Get image file object from request
    let imageFile = getFileObject(req);

    // Check for image mime type
    checkMimeType(req, res, imageFile, 'image');

    // Generate unique path
    let uniquePath = generateUniquePath(imageFile);

    // Store image file
    storeFile(res, imageFile, uniquePath);
    
    // Return unique path
    res.send(uniquePath);
});

app.post('/uploadBulk', (req, res) => {

    checkIfFileExists(req, res);

    // Get zip file object from request
    let zipFile = getFileObject(req);
    
    // Check for zip mime type
    checkMimeType(req, res, zipFile, 'zip');

    // Generate unique path
    let uniquePath = generateUniquePath(zipFile);

    // Store zip file
    storeFile(res, zipFile, uniquePath);
    
    // Decompress file
    decompressFile(uniquePath, (uniqueImageLocations) => {
        // Return unique image locations
        res.send(uniqueImageLocations);
    });
    
});

app.listen(port, () => {
    console.log(`Server has started at port ${port} !`);
});