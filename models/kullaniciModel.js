const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const userSchema = new mongoose.Schema({
  photoUrl: String,
});

const User = mongoose.model("User", userSchema);
module.exports = User;

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
module.exports = Kullanici;