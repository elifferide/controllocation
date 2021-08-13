require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");



const userController=require("./controllers/userController");
const taskController=require("./controllers/taskController");
const scheduledJob=require("./controllers/scheduled-job")


app.use(
  cors({
    origin: "http://localhost:19006",
    methods: "GET, PUT, PATCH, POST, DELETE",
    credentials: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


mongoose
  .connect(process.env.BAGLANTI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));


app.get("/", function (req, res) {
  res.send("Başarılı..");
});

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

app.post("/api/kullanici/olusturma",userController.createUser);
app.post("/login",userController.userLogin );
app.get("/logout",userController.userLogout);
app.post('/uploadUserPhoto/:id',userController.userPhoto);
app.post("/updateemail/:id", userController.updateMail);
app.post("/updatetel/:id",userController.updatePhone);
app.post("/getuser/:id",userController.getUser);




app.post("/taskcreate", taskController.createTask);
app.post("/gettask", taskController.getAllTasks);
app.post("/deletetask/:id",taskController.deleteTask);
app.post("/updatepassedtime/:id",taskController.updatePassedTime );
app.post("/updatedesc/:id",taskController.updateDesc);
app.post('/uploadphoto/:id',taskController.updatePhoto);


app.post('/createPdfReport',scheduledJob.createPdfAndSendEmail)


let cron = require('node-cron');
cron.schedule('45 13 * * *', () => {
  console.log("cron çalıştı");
});


const port=process.env.PORT || 5000;
app.listen(port, ()=>{
console.log(`Sunucu ${port} portunda başlatıldı.`)
});
