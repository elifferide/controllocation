const fs = require('fs');
const fetch = require('node-fetch')
const PDFDocument = require('pdfkit');


const fetchImage = async (src) => {
    const response = await fetch(src);
    const image = await response.buffer();
    return image;
};  


(async function start() {

    const doc = new PDFDocument;
    doc.pipe(fs.createWriteStream('./file.pdf'));

    const img = await fetchImage("https://control-location.s3.amazonaws.com/images/placesimage799.jpeg");

    doc.image(img, 0, 200);
    doc.end();

})() 