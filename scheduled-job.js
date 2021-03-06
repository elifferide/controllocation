require("dotenv").config();

const axios = require("axios");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const fetch = require("node-fetch");

const Kullanici = require("./models/kullaniciModel");
const Task = require("./models/taskModel");

const S3 = require("aws-sdk/clients/s3");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

mongoose
  .connect(process.env.BAGLANTI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));

const s3 = new aws.S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");

var mail = nodemailer.createTransport(
  smtpTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    secure: true,
    auth: {
      user: process.env.USER_MAIL,
      pass: process.env.USER_MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
);

function createPdfAndSendEmail() {
  Kullanici.find({}, function (err, users) {
    if (err) {
      console.log(err);
    } else {
      var date = new Date().getDate();
      var month = new Date().getMonth() + 1;
      var year = new Date().getFullYear();
      var today = date + "-" + month + "-" + year;

      for (let i = 0; i < users.length; i++) {
        var id = users[i]._id;
        var planned;

        Task.find({ user_id: id, taskDate: today }, function (err, gelen) {
          if (!err) {
            if (gelen) {
              planned = gelen.length;
            }
          } else {
            res.send([
              {
                sonuc: "length hata",
              },
            ]);
          }
        });

        Task.find(
          {
            user_id: id,
            taskDate: today,
            desc: { $ne: "" },
            passedTime: { $ne: "" },
            photoUrl: { $ne: "" },
          },
          function (err, gelenVeri) {
            if (!err) {
              createPdf(gelenVeri, users[i], i, planned, today);
            } else {
              res.send([
                {
                  sonuc: "hata",
                },
              ]);
            }
          }
        );
      }
      var timeOut = 1000 * 60;
      setTimeout(function () {
        sendMail(users.length, today);
      }, timeOut);
    }
  });
}

async function createPdf(gelenVeri, user, index, planned, today) {
  console.log("GelenVeri=" + gelenVeri);

  const doc = new PDFDocument();

  if (gelenVeri.length === 0) {
    console.log("pdf bo??"); // User's visited task is zero
    let writeStream = fs.createWriteStream(`output${index}-${today}.pdf`);
    //Pdf creation begins
    doc.pipe(writeStream);
    doc.pipe(fs.createWriteStream(`output${index}.pdf`));
    doc
      .fontSize(35)
      .text(`${user.isim} ${user.soyisim}'s Report (${today})`, {
        align: "center",
      })
      .fontSize(25)
      .text(`Planned: ${planned}  Visited: 0`, { align: "center" });
    doc.end();
    // Finalize PDF file then send S3
    writeStream.on("finish", function () {
      var appDir = path.dirname(require.main.filename);
      console.log("appDir=" + appDir);
      const fileContent = fs.readFileSync(
        appDir + `/output${index}-${today}.pdf`
      );
      var params = {
        Key: `output${index}-${today}.pdf`,
        Body: fileContent,
        Bucket: "control-location1/reports",
        ContentType: "application/pdf",
        ACL: "public-read",
      };

      s3.upload(params, function (err, response) {
        console.log("pdf" + index + "g??nderildi.");
      });
    });
  } else {
    // There are user's visited tasks.
    let writeStream = fs.createWriteStream(`output${index}-${today}.pdf`);
    //Pdf creation begins
    doc.pipe(writeStream);
    //doc.pipe(fs.createWriteStream(`output${index}.pdf`));
    doc
      .fontSize(35)
      .text(`${user.isim} ${user.soyisim}'s Report (${today})`, {
        align: "center",
      })
      .fontSize(25)
      .text(`Planned: ${planned}  Visited: ${gelenVeri.length}`, {
        align: "center",
      });

    let invoiceTableTop = 150;
    generateHr(doc, invoiceTableTop + 40);
    for (let i = 0; i < gelenVeri.length; i++) {
      let j = i;
      if (i % 12 === 0 && i !== 0) {
        j = 0;
        doc.addPage();
      }
      if (i % 12 === 1) {
        j = 1;
      }
      if (i % 12 === 2) {
        j = 2;
      }
      if (i % 12 === 3) {
        j = 3;
      }
      if (i === 0) {
        j = i;
      }

      const item = gelenVeri[i];
      const position = invoiceTableTop + (j + 1) * 120;
      const img = await fetchImage(item.photoUrl);

      generateTableRow(
        doc,
        position,
        item.adress,
        item.passedTime,
        item.desc,
        img
      );
      generateHr(doc, position + 50);
    }

    doc.end();
    console.log("pdf" + index + " olu??tu...");
    // Finalize PDF file then send S3
    writeStream.on("finish", function () {
      var appDir = path.dirname(require.main.filename);
      console.log("appDir=" + appDir);
      const fileContent = fs.readFileSync(
        appDir + `/output${index}-${today}.pdf`
      );
      var params = {
        Key: `output${index}-${today}.pdf`,
        Body: fileContent,
        Bucket: "control-location1/reports",
        ContentType: "application/pdf",
        ACL: "public-read",
      };

      s3.upload(params, function (err, response) {
        if (err) {
          console.log(err);
        } else {
          console.log("pdf" + index + "g??nderildi.");
        }
      });
    });
  }
}

const fetchImage = async (src) => {
  const response = await fetch(src);
  const image = await response.buffer();
  return image;
};

function generateTable(doc, gelenVeri) {
  let invoiceTableTop = 150;
  generateHr(doc, invoiceTableTop + 40);
  for (let i = 0; i < gelenVeri.length; i++) {
    let j = i;
    if (i % 4 === 0 && i !== 0) {
      j = 0;
      doc.addPage();
    }
    if (i % 4 === 1) {
      j = 1;
    }
    if (i % 4 === 2) {
      j = 2;
    }
    if (i % 4 === 3) {
      j = 3;
    }
    if (i === 0) {
      j = i;
    }

    const item = gelenVeri[i];
    const position = invoiceTableTop + (j + 1) * 120;
    const img = fetchImage(
      "https://control-location1.s3.amazonaws.com/images/placesimage779.jpeg"
    );

    generateTableRow(
      doc,
      position,
      item.adress,
      item.passedTime,
      item.desc,
      img
    );
    generateHr(doc, position + 50);
  }
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function generateTableRow(doc, y, c1, c2, c3, c4) {
  doc
    .fontSize(10)
    .font("public/fonts/OpenSans-Bold.ttf")
    .text("Adress:", 50, y - 45)
    .font("public/fonts/OpenSans-Regular.ttf")
    .text(c1, 120, y - 45, { width: 280 })
    .font("public/fonts/OpenSans-Bold.ttf")
    .text("Passed Time:", 50, y - 20)
    .font("public/fonts/OpenSans-Regular.ttf")
    .text(c2, 120, y - 20, { width: 280 })
    .font("public/fonts/OpenSans-Bold.ttf")
    .text("Description:", 50, y)
    .font("public/fonts/OpenSans-Regular.ttf")
    .text(c3, 120, y, { width: 280 })
    .image(c4, 450, y - 60, { align: "right", width: 80, height: 100 })
    .moveDown();
}

function sendMail(length, today) {
  console.log(length + "/" + today);
  var attach = [];

  for (let i = 0; i < length; i++) {
    attach.push({
      filename: `output${i}-${today}.pdf`,
      path:
        "https://control-location1.s3.amazonaws.com/reports/" +
        `output${i}-${today}.pdf`,
      //content: fs.createReadStream(__dirname +`/output${i}.pdf`),
      //contentType: 'application/pdf'
    });
  }
  console.log("Attachments=" + attach[0]);

  var mailOptions = {
    from: "softlinnsolutions@gmail.com",
    to: "esali.softlinn@gmail.com",
    subject: "Reports( " + today + " )",
    html: "<b>Hello world attachment test HTML</b>",
    attachments: attach,
  };
  mail.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

createPdfAndSendEmail();
