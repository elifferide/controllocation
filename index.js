require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");

const { Passport } = require("passport");
const PDFDocument = require('pdfkit');
const fs = require('fs')
const path=require("path");
const S3 = require('aws-sdk/clients/s3');
const AWS = require('aws-sdk');
const wasabiEndpoint = new AWS.Endpoint('s3.us-west-1.wasabisys.com');
const multerS3 = require('multer-s3');

const accessKeyId = '0EKB6R9SEI09NPINC71V'
const secretAccessKey = 'j8oqmC5TghOMBOofBAWYKegBIDgIVOqvrD7NefUb';

const s3 = new S3({
  endpoint: wasabiEndpoint,
  region: 'us-west-1',
  accessKeyId,
  secretAccessKey
});

const multer = require('multer');
const storage = multerS3({
  s3: s3,
  bucket: 'createlocation/images',
  key: function(req, file, cb) {
      console.log(file);
      cb(null,  file.originalname +
        new Date().getMilliseconds());
  }
})



/*var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + "/public/resimler");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname +
        "-" +
        file.originalname +
        new Date().getMilliseconds() +
        ".jpg"
    );
  },
});*/
var upload = multer({ storage: storage });

var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + "/public/resimler/user");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname +
        "-" +
        file.originalname +
        new Date().getMilliseconds() +
        ".jpg"
    );
  },
});
var upload2 = multer({ storage: storage2 });


app.use(
  cors({
    origin: "http://localhost:19006",
    methods: "GET, PUT, PATCH, POST, DELETE",
    credentials: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const Schema = mongoose.Schema;

mongoose
  .connect(process.env.BAGLANTI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));

app.use(
  session({
    secret: "Softlinn-ProjectApp",
    resave: true,
    saveUninitialized: true,
    name: "kullanici_bilgileri",
    proxy: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", function (req, res) {
  res.send("Başarılı..");
});

//Task Schema
const taskshema = {
  user_id:String,
  adress: String,
  lat: Number,
  long: Number,
  passedTime:String,
  desc:String,
  taskDate:String,
  photoUrl:String,

};
const Task = mongoose.model("Task", taskshema);

//User Schema
const kullaniciSema = new mongoose.Schema({
  isim: String,
  soyisim: String,
  email: String,
  username: String,
  sifre: String,
  telefon: String,
  approval:Boolean,
  photo_url:String,
});

kullaniciSema.plugin(passportLocalMongoose, {
  usernameField: "username",
  passwordField: "sifre",
});

const Kullanici = mongoose.model("Kullanici", kullaniciSema);

passport.use(Kullanici.createStrategy()); // Kullanıcı Şeması ile passport arasında bağlantı kurduk.

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  Kullanici.findById(id, function (err, user) {
    done(err, user);
  });
});

app.post("/api/kullanici/olusturma", function (req, res) {
  Kullanici.register(
    //Kullanıcı modeline register işlemi gerçekleştir.
    {
      ///Kayıt için gerekli bilgiler
      isim: req.body.isim,
      soyisim: req.body.soyisim,
      username: req.body.username,
      telefon: req.body.telefon,
      email: req.body.email,
      approval:false,
      photo_url:"",
    },
    //Kayıt için gerekli şifre
    req.body.sifre,

    // fonksiyon
    function (err, gelenVeri) {
      if (err) {
        //UserExistError
        if (err.name === "UserExistsError") {
          res.send({ sonuc: "username" });
        } else {
          res.send({ sonuc: "hata" });
          console.log(err);
        }
      } else {
        passport.authenticate("local")(req, res, function () {
          res.send({ sonuc: "başarılı" }); //giriş işlemi gerçekleşsin
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const kullanici = new Kullanici({
    username: req.body.username,
    sifre: req.body.password,
  });
  req.login(kullanici, function (err) {
    if (err) {
      res.send({ sonuc: false });
    } else{
      passport.authenticate("local")(req, res, function () {
        Kullanici.find({username:kullanici.username}, function (err, gelenVeri) {
          if (!err) {
            res.send({user:gelenVeri,sonuc:true});
          } else {
            res.send(
              {
                sonuc: "hata",
              }
            );
          }
        });
      });
    

    } 
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.send({ sonuc: "başarılı" });
});



app.post("/taskcreate", function (req, res) {
  var hour=new Date().getHours();
  var date=new Date().getDate();
  if (hour>=18 && hour<24){
    date=date+1;
  } else {
    date=date
  }
    var month = new Date().getMonth() + 1;
    var year = new Date().getFullYear();
    var taskDate=date + "-" + month + "-" + year;
    
  
  var task = new Task({
    user_id:req.body.userId,
    adress: req.body.adress,
    lat: req.body.lat,
    long: req.body.long,
    passedTime:"",
    desc:"",
    taskDate:taskDate,
    photoUrl:"",
  });

  task.save(function (err) {
    if (!err) {
      res.send([
        {
          sonuc: "başarılı",
        },
      ]);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

app.post("/gettask", function (req, res) {
  var id=req.body.userId;
  var hour=new Date().getHours();
  var date = new Date().getDate();
  var month = new Date().getMonth() + 1;
  var year = new Date().getFullYear();
  var today;
  if (hour>=18 && hour<24){
    today= (date+1) + "-" + month + "-" + year;
  } else {
    today= date + "-" + month + "-" + year;
  }

 /* console.log(today);*/
  Task.find({user_id:id,taskDate:today }, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);

    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});


app.post("/deletetask/:id", function (req, res) {
  Task.deleteOne({ _id: req.params.id }, function (err) {
    if (!err) {
      res.send([
        {
          sonuc: "başarılı",
        },
      ]);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

app.post("/updatetask/:id", function (req, res) {

  Task.updateOne(
    { _id: req.params.id ,passedTime:""},
    {     
        passedTime: req.body.passedTime
      },
    function (err) {
      if (err) {
        res.send({ sonuc: false });
      } else {
        res.send({ sonuc: true });
      }
    }
  );
});

app.post("/updatedesc/:id", function (req, res) {
  Task.updateOne(
    { _id: req.params.id },
    {        
        desc: req.body.desc,
    },
    function (err) {
      if (err) {
        res.send({ sonuc: false });
      } else {
        res.send({ sonuc: true });
      }
    }
  );
});

app.post('/uploadphoto/:id', upload.single('photo'), (req, res, next) => {
  var resimlinki = "";
 
  if(req.file){
    resimlinki = req.file.location;
    }
  console.log(resimlinki);
  Task.updateOne(
    { _id: req.params.id },
    {        
        photoUrl:resimlinki,
    },
    function (err) {
      if (err) {
        res.send({ sonuc: false });
      } else {
        res.send({ sonuc: true });
      }
    }
  );
})


app.post('/uploadUserPhoto/:id', upload2.single('photo'), (req, res, next) => {
  var userresimlinki = "";


  if(req.file){
    userresimlinki = '/public/resimler/user/' + req.file.filename;
  }
  Kullanici.updateOne(
    { _id: req.params.id },
    {        
        photo_url:userresimlinki,
    },
    function (err) {
      if (err) {
        res.send({ sonuc: false });
      } else {
        res.send({ sonuc: true });
      }
    }
  );
})

//Create Pdf Report
var nodemailer = require('nodemailer');
var mail = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  service: 'gmail',
  secure: true,
  auth: {
    user: 'elff931@gmail.com',
    pass: 'efb40978'
  },
  tls:{
    rejectUnauthorized:false,
  }
});
let cron = require('node-cron');

/*
cron.schedule('2 21 * * *', () => {
  console.log("cron çalıştı");
  Kullanici.find({},function(err,users){
    if(err){
      console.log(err);
    }else{
      var date = new Date().getDate();
      var month = new Date().getMonth() + 1;
      var year = new Date().getFullYear();
      var today= date + "-" + month + "-" + year;
     
      for(let i=0; i<users.length; i++){
        var id=users[i]._id;
        var planned;

         Task.find({user_id:id,taskDate:today},function (err, gelen) {
          if (!err) {
            if (gelen){
             planned=gelen.length;    
          } 
        } else {
              res.send([
                {
                  sonuc: "length hata",
                },
              ]);
            }
        }) ;  

        Task.find({user_id:id,taskDate:today,desc:{$ne:""},passedTime:{$ne:""},photoUrl:{$ne:""}}, function (err, gelenVeri) {
            if (!err) {      
              createPdf(gelenVeri,users[i],i,planned,today);
            } else {
                res.send([
                  {
                    sonuc: "hata",
                  },
                ]);
              }
          })
           
      }
      sendMail(users.length,today);
      }
    
  });


 function  createPdf(gelenVeri,user,index,planned,today){

 const doc = new PDFDocument();
 if(gelenVeri.length===0){
   console.log("pdf yok");
   let writeStream = fs.createWriteStream(`output${index}.pdf`);
   doc.pipe(writeStream);
    doc
    .fontSize(35)
    .text(`${user.isim} ${user.soyisim}'s Report (${today})`,{align: "center"})
    .fontSize(25)
    .text(`Planned: ${planned}  Visited: 0`,{align: "center"})
   
  
    // Finalize PDF file
    doc.end();    
  } else {
//    doc.pipe(fs.createWriteStream(`output${index}.pdf`));
    doc
    .fontSize(35)
    .text(`${user.isim} ${user.soyisim}'s Report (${today})`,{align: "center"})
    .fontSize(25)
    .text(`Planned: ${planned}  Visited: ${gelenVeri.length}`,{align: "center"})
   
    generateTable(doc, gelenVeri);
    // Finalize PDF file
    doc.end();    
    
console.log("pdf"+index+ " oluştu")  ;

writeStream.on('finish', function () {
  var appDir = path.dirname(require.main.filename);
  const fileContent = fs.readFileSync(appDir + '/output.pdf');
  var params = {
      Key : 'fileName',
      Body : fileContent,
      Bucket : 'createlocation/report',
      ContentType : 'application/pdf',
      ACL: "public-read",
    } ;

    s3.upload(params, function(err, response) {
        console.log("pdf"+index+"gönderildi.");
    });
  })

 

}

}



function generateTable(doc, gelenVeri) {
  let invoiceTableTop = 150;
  generateHr(doc,invoiceTableTop+ 40);

  for (let i = 0; i < gelenVeri.length; i++) {
   let j=i;
    if(i%4===0 && i!==0){
      j=0;
      doc
      .addPage(); 
    } if(i%4===1){j=1} if(i%4===2){j=2} if(i%4===3){j=3}  
    if(i===0){j=i}
    const item = gelenVeri[i];
    const position = invoiceTableTop + (j+1) *120;

    generateTableRow(
      doc,
      position,
      item.adress,
      item.passedTime,
      item.desc,
      __dirname+item.photoUrl
    );
    generateHr(doc, position+ 50);
  }
}
function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}
function generateTableRow(doc, y, c1, c2, c3,c4) {
  doc
    .fontSize(10)
    .font('Times-Bold')
    .text("Adress:",50,(y-45))
    .font('Times-Roman')
    .text(c1,120,(y-45),{ width: 280})
    .font('Times-Bold')
    .text("Passed Time:", 50, (y-20))
    .font('Times-Roman')
    .text(c2, 120, (y-20),{ width: 280})
    .font('Times-Bold')
    .text("Description:", 50, (y))
    .font('Times-Roman')
    .text(c3,120, (y),{ width: 280})
    .image(c4, 450, (y-60), {align: "right", width: 80,height:100 })
    .moveDown()
}



 
  function sendMail(length,today){
    console.log(length+"/"+today)

    
    
    var attach=[];

    for(let i=0;i<length;i++){

      attach.push(
          {filename: `output${i}.pdf`,
          //path:__dirname +'/output.pdf',
          content: fs.createReadStream(__dirname +`/output${i}.pdf`),
          //contentType: 'application/pdf'
      })
    }

    var mailOptions = {
      from: 'elff931@gmail.com',
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

});
*/


app.post('/createPdfReport', (req, res, next) => {

  Kullanici.find({},function(err,users){
    if(err){
      console.log(err);
    }else{
      var date = new Date().getDate();
      var month = new Date().getMonth() + 1;
      var year = new Date().getFullYear();
      var today= date + "-" + month + "-" + year;
     
      for(let i=0; i<users.length; i++){
        var id=users[i]._id;
        var planned;

        Task.find({user_id:id,taskDate:today},function (err, gelen) {
          if (!err) {
            if (gelen){
             planned=gelen.length;    
          } 
        } else {
              res.send([
                {
                  sonuc: "length hata",
                },
              ]);
            }
        }) ;  

        Task.find({user_id:id,taskDate:today,desc:{$ne:""},passedTime:{$ne:""},photoUrl:{$ne:""}}, function (err, gelenVeri) {
            if (!err) {      
              createPdf(gelenVeri,users[i],i,planned,today);
            } else {
                res.send([
                  {
                    sonuc: "hata",
                  },
                ]);
              }
          })
           
      }
      sendMail(users.length,today);
      }
    
  });


 function  createPdf(gelenVeri,user,index,planned,today){
 console.log(gelenVeri);
 const doc = new PDFDocument();
 if(gelenVeri.length===0){
   console.log("pdf yok");
   let writeStream = fs.createWriteStream(`output${index}.pdf`);
   doc.pipe(writeStream);
  // doc.pipe(fs.createWriteStream(`output${index}.pdf`));
    doc
    .fontSize(35)
    .text(`${user.isim} ${user.soyisim}'s Report (${today})`,{align: "center"})
    .fontSize(25)
    .text(`Planned: ${planned}  Visited: 0`,{align: "center"})
   
  
    // Finalize PDF file
    doc.end();    
  } else {
    let writeStream = fs.createWriteStream(`output${index}.pdf`);
   doc.pipe(writeStream);
    //doc.pipe(fs.createWriteStream(`output${index}.pdf`));
    doc
    .fontSize(35)
    .text(`${user.isim} ${user.soyisim}'s Report (${today})`,{align: "center"})
    .fontSize(25)
    .text(`Planned: ${planned}  Visited: ${gelenVeri.length}`,{align: "center"})
   
    generateTable(doc, gelenVeri);
    // Finalize PDF file
    doc.end();    

console.log("pdf"+index+ " oluştu")  ;

writeStream.on('finish', function () {
  var appDir = path.dirname(require.main.filename);
  console.log("appDir=" +appDir);
  const fileContent = fs.readFileSync(appDir + `/output${index}.pdf`);
  var params = {
      Key : `output${index}.pdf`,
      Body : fileContent,
      Bucket : 'createlocation/report',
      ContentType : 'application/pdf',
      ACL: "public-read",
    } ;

    s3.upload(params, function(err, response) {
      console.log(response);
        console.log("pdf"+index+"gönderildi.");
    });
  })

  }
function generateTable(doc, gelenVeri) {
  let invoiceTableTop = 150;
  generateHr(doc,invoiceTableTop+ 40);

  for (let i = 0; i < gelenVeri.length; i++) {
   let j=i;
    if(i%4===0 && i!==0){
      j=0;
      doc
      .addPage(); 
    } if(i%4===1){j=1} if(i%4===2){j=2} if(i%4===3){j=3}  
    if(i===0){j=i}
    const item = gelenVeri[i];
    const position = invoiceTableTop + (j+1) *120;

    generateTableRow(
      doc,
      position,
      item.adress,
      item.passedTime,
      item.desc,
     
    );
    generateHr(doc, position+ 50);
  }
}
function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}
function generateTableRow(doc, y, c1, c2, c3) {
  doc
    .fontSize(10)
    .font('Times-Bold')
    .text("Adress:",50,(y-45))
    .font('Times-Roman')
    .text(c1,120,(y-45),{ width: 280})
    .font('Times-Bold')
    .text("Passed Time:", 50, (y-20))
    .font('Times-Roman')
    .text(c2, 120, (y-20),{ width: 280})
    .font('Times-Bold')
    .text("Description:", 50, (y))
    .font('Times-Roman')
    .text(c3,120, (y),{ width: 280})

    .moveDown()
}


}
 
  function sendMail(length,today){
    console.log(length+"/"+today)
    var attach=[];

    for(let i=0;i<length;i++){

      attach.push(
          {filename: `output${i}.pdf`,
          //path:__dirname +'/output.pdf',
          content: appDir,
          //contentType: 'application/pdf'
      })
    }
    console.log("send mail");
    console.log(attach);
    var mailOptions = {
      from: 'elff931@gmail.com',
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
 
});


app.post("/updateemail/:id", function (req, res) {
 Kullanici.updateOne(
    { _id: req.params.id,},
    {        
        email: req.body.email,
    },
    function (err) {
      if (err) {
        res.send({ sonuc: false });
      } else {
        res.send({ sonuc: true });
      }
    }
  );
});

app.post("/updatetel/:id", function (req, res) {
  Kullanici.updateOne(
     { _id: req.params.id },
     {        
         telefon: req.body.telefon,
     },
     function (err) {
       if (err) {
         res.send({ sonuc: false });
       } else {
         res.send({ sonuc: true });
       }
     }
   );
 });

 app.post("/getuser/:id", function (req, res) {
   var id=req.params.id;
  Kullanici.find({_id:id }, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);

    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});







const port=process.env.PORT || 5000;
app.listen(port, ()=>{
console.log(`Sunucu ${port} portunda başlatıldı.`)
});
