require("dotenv").config();
const path=require("path");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var mail = nodemailer.createTransport(smtpTransport({
  service: 'gmail',
  host:'smtp.gmail.com',
  secure: true,
  auth: {
    user: process.env.USER_MAIL,
    pass: process.env.USER_MAIL_PASSWORD
  },
  tls:{
    rejectUnauthorized:false,
  }
}));


const Kullanici = require("./models/kullaniciModel");

function sendMail(){
    var length;
    Kullanici.find({},function(err,users){
        if(err){
          console.log(err);
        }else{
        
        length=users.length;
        }
    });

    var date = new Date().getDate();
    var month = new Date().getMonth() + 1;
    var year = new Date().getFullYear();
    var today= date + "-" + month + "-" + year;

    console.log(length+"/"+today)
    var attach=[];

    for(let i=0;i<length;i++){

      attach.push(
          {filename: `output${i}-${today}.pdf`,
          path:'https://control-location.s3.amazonaws.com/reports/' +`output${i}-${today}.pdf`,
          //content: fs.createReadStream(__dirname +`/output${i}.pdf`),
          //contentType: 'application/pdf'
       
      })
    }
    console.log("Attachments=" +attach);
    
    var mailOptions = {
      from: 'softlinnsolutions@gmail.com',
      to: 'esali.softlinn@gmail.com',
      subject: "Reports( " +today+" )",
      html: '<b>Hello world attachment test HTML</b>',
      attachments: attach,
    }
    mail.sendMail(mailOptions, function(error, info){ 
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
}
sendMail()