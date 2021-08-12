const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


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
module.exports = Task;