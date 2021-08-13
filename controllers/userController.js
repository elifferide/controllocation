require("dotenv").config();

const { Passport } = require("passport");
const passport = require("passport");

const multer = require('multer');
const multerS3 = require('multer-s3');
const aws= require('aws-sdk');
const S3=require("aws-sdk/clients/s3");

const s3 = new aws.S3({
    region: process.env.AWS_BUCKET_REGION,
    accessKeyId:process.env.S3_ACCESS_KEY,
    secretAccessKey:process.env.S3_SECRET_ACCESS_KEY
});

const storage2 = multerS3({
    s3: s3,
    bucket: 'control-location/images',
    metadata: function(req, file, cb) {
      cb(null, {fieldName:file.fieldname} );
    },
    key: function(req, file, cb) {
        console.log(file);
        cb(null,  "user" +
          new Date().getMilliseconds() +".jpeg");
    }
  })
var upload2 = multer({ storage: storage2 });

const Kullanici = require("../models/kullaniciModel");
passport.use(Kullanici.createStrategy()); // Kullanıcı Şeması ile passport arasında bağlantı kurduk.
passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
passport.deserializeUser(function (id, done) {
    Kullanici.findById(id, function (err, user) {
      done(err, user);
    });
  });
  

exports.createUser= function (req, res) {
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
}

exports.userLogin = function (req, res) {
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
}

exports.userLogout= function (req, res) {
    req.logout();
    res.send({ sonuc: "başarılı" });
}

exports.userPhoto= (req, res, next) => {
    const uploadPhoto=upload2.single('photo');
    uploadPhoto(req,res,async(err)=>{
        var userresimlinki = "";
   
        console.log("URL=" +req.file.location);
        if(err){
            console.log(err)
        }else{
        userresimlinki = req.file.location;
        console.log(userresimlinki);
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
                console.log("Saved url")
              }
            }
        );
        }
    })
   
}

exports.updateMail=function (req, res) {
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
}

exports.updatePhone=function (req, res) {
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
}

exports.getUser=function (req, res) {
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
}