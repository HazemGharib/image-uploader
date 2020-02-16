// Dependencies
const express = require('express');
const fileUpload = require('express-fileupload');
// Custom Utils
const utils = require('./utils');

// Framework Configuration
var app = express();
app.set('view engine', 'hbs');
const port = process.env.PORT || 3000;

// Middlewares
app.use((req, res, next) => utils.addLogEntry(req, res, next));
app.use(express.static(__dirname + '/config'));
app.use(fileUpload());

// Routes
app.post('/uploadImage', (req, res) => {

    utils.checkIfFileExists(req, res);

    // Get image file object from request
    let imageFile = utils.getFileObject(req);

    // Check for image mime type
    utils.checkMimeType(req, res, imageFile, 'image');

    // Generate unique path
    let uniquePath = utils.generateUniquePath(imageFile);

    // Store image file
    utils.storeFile(res, imageFile, uniquePath, false);
    
    // Return unique path
    res.send({imagePath: uniquePath});
});

app.post('/uploadBulk', (req, res) => {

    utils.checkIfFileExists(req, res);

    // Get zip file object from request
    let zipFile = utils.getFileObject(req);
    
    // Check for zip mime type
    utils.checkMimeType(req, res, zipFile, 'zip');

    // Generate unique path
    let uniquePath = utils.generateUniquePath(zipFile);

    // Store zip file and decompress it
    utils.storeFile(res, zipFile, uniquePath, true);
});

app.get('*', (req, res) => {
    res.render('home.hbs', {
        pageTitle: 'Home Page',
        welcomeMessage: 'Welcome in my brand new website'
    });
});

// Server Listener
app.listen(port, () => {
    console.log(`Server has started at port ${port} !`);
});