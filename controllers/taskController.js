require("dotenv").config();

const S3=require("aws-sdk/clients/s3");
const aws= require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new aws.S3({
    region: process.env.AWS_BUCKET_REGION,
    accessKeyId:process.env.S3_ACCESS_KEY,
    secretAccessKey:process.env.S3_SECRET_ACCESS_KEY
});

const storage = multerS3({
  s3: s3,
  bucket: 'control-location/images',
  metadata: function(req, file, cb) {
    cb(null, {fieldName:file.fieldname} );
},
  key: function(req, file, cb) {
      console.log(file);
      cb(null,  "placesimage" +
        new Date().getMilliseconds() +".jpeg");
  }
})
var upload = multer({ storage: storage });

const Task= require("../models/taskModel");

exports.createTask=function (req, res) {
    var hour=new Date().getHours();
    var date=new Date().getDate();
    console.log(date);
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
}

exports.getAllTasks=function (req, res) {
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
}

exports.deleteTask= function (req, res) {
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
}

exports.updatePassedTime=function (req, res) {

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
}

exports.updateDesc=function (req, res) {
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
}

exports.updatePhoto=(req, res, next) => {
    const uploadPhoto=upload.single('photo');
    uploadPhoto(req,res,async(err)=>{
        var resimlinki = "";
        console.log("URL=" +req.file.location);
        if(err){
            console.log(err)
        }else{
        }
        resimlinki = req.file.location;
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
    
}