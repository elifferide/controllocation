const { Passport } = require("passport");
const passport = require("passport");
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