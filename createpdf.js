const fs = require('fs');
const fetch = require('node-fetch')
const PDFDocument = require('pdfkit');
const path=require("path");


const S3=require("aws-sdk/clients/s3");
const aws= require('aws-sdk');



const s3 = new aws.S3({
    region: process.env.AWS_BUCKET_REGION,
    accessKeyId:process.env.S3_ACCESS_KEY,
    secretAccessKey:process.env.S3_SECRET_ACCESS_KEY
});

const fetchImage = async (src) => {
    const response = await fetch(src);
    const image = await response.buffer();
    return image;
};  


(async function start() {

    const doc = new PDFDocument;
    let writeStream = fs.createWriteStream(`outputdeneme.pdf`);
    doc.pipe(writeStream);

    const img = await fetchImage("https://control-location.s3.amazonaws.com/images/placesimage799.jpeg");

    doc.image(img, 0, 200);
    doc.end();

    writeStream.on('finish', function () {
        var appDir = path.dirname(require.main.filename);
        console.log("appDir=" +appDir);
        const fileContent = fs.readFileSync(appDir + `/outputdeneme.pdf`);
        var params = {
          Key : `outputdeneme.pdf`,
          Body : fileContent,
          Bucket : 'control-location/reports',
          ContentType : 'application/pdf',
          ACL: "public-read",
        } ;
  
        s3.upload(params, function(err, response) {
          console.log("pdf"+index+"gönderildi.");
        });
    })
})() 