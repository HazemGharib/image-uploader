const express = require('express');
const hbs = require('hbs');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');

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
    return req.files.file.length == 1 ? req.files.file : req.files.file[0];
}

function createDirIfNotExist(path) {
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
}

function checkIfImageMimeType(req, res, imageFile) {
    let mimeType = imageFile.mimetype;
     // Check for image mime type
     if(! mimeType.includes('image'))
     {
         console.log(req.files.file);
         res.statusCode = 400;
         res.send('Invalid format found');
         return;
     }
}

function generateUniquePath(imageFile) {
    let extension = path.extname(imageFile.name);

    // Create storage directory if not existed
    createDirIfNotExist(config.uploadLocation);

    // Generate unique path and store file
    return config.uploadLocation + guid() + extension;
}

function storeImage(res, imageFile, uniquePath) {
    imageFile.mv(uniquePath, function(err) {
        if (err)
        return res.status(500).send(err);
    
        res.send(uniquePath);
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
    checkIfImageMimeType(req, res, imageFile);

    // Generate unique path
    let uniquePath = generateUniquePath(imageFile);

    // Store image file
    storeImage(res, imageFile, uniquePath);
});

app.listen(port, () => {
    console.log(`Server has started at port ${port} !`);
});