const{ Console } = require('console');
var express = require('express');
var path = require('path');
var session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var alert = require('alert');
const { Template } = require('ejs');
var allDestinationsArray = ['annapurna','bali','inca','paris','rome','santorini']



var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000);

//To Check Session
app.use(
  session({
    resave:true,
    saveUninitialized:true,
    secret:"secret"
  })
);

function checkSession(req,res,next){
  if(req.session.user) return next();
  else res.redirect('/');
}


//-----------------------------------------------------------------------------------------------------------------------------
// Hiking , Annapurna & Inca methods:
app.get('/hiking',checkSession,function(req,res){
  res.render('hiking');
});
app.get('/annapurna',checkSession,function(req,res){
  res.render('annapurna');
});
app.get('/inca',checkSession,function(req,res){
  res.render('inca');
});
app.post('/annapurna',function(req,res){
  wantToGoInsert(req,res,'annapurna');
  res.redirect('/annapurna');
});
app.post('/inca',function(req,res){
  wantToGoInsert(req,res,'inca');
  res.redirect('/inca');
});


//---------------------------------------------------------------------------------------------------------------------------
// Cities , Paris & Rome methods:
app.get('/cities',checkSession,function(req,res){
  res.render('cities');
});
app.get('/rome',checkSession,function(req,res){
  res.render('rome');
});
app.get('/paris',checkSession,function(req,res){
  res.render('paris');
});
app.post('/paris',function(req,res){
  wantToGoInsert(req,res,'paris');
  res.redirect('/paris');
});
app.post('/rome',function(req,res){
  wantToGoInsert(req,res,'rome');
    res.redirect('/rome');
});

//---------------------------------------------------------------------------------------------------------------------------
// Islands , Bali & Santorini methods :
app.get('/islands',checkSession,function(req,res){
  res.render('islands');
});
app.get('/bali',checkSession,function(req,res){
  res.render('bali');
});
app.get('/santorini',checkSession,function(req,res){
  res.render('santorini');
});
app.post('/bali',function(req,res){
  wantToGoInsert(req,res,'bali');
  res.redirect('/bali');
});
app.post('/santorini',function(req,res){
  wantToGoInsert(req,res,'santorini');
  res.redirect('/santorini');
});


//---------------------------------------------------------------------------------------------------------------------------
//Login :
app.get('/',function(req,res){
  if(req.session.user) delete req.session.user; // when returning to the login page we cannot comeback
  res.render('login');
});
app.post('/',function(req,res){
  var x = req.body.username;
  var y = req.body.password;
  MongoClient.connect('mongodb://127.0.0.1:27017/myDB',function(err,client){
    if (err) throw err;
    var db = client.db('myDB');
    db.collection('myCollection').find({username : x}).toArray(function(err,results){
      if (err) throw err;
      if(results.length === 0 ){
        alert("Invalid username: Please try again!");
      }
      else if (results[0].password === y){
        req.session.user = results[0];
        res.redirect('/home');
      }
      else {
        alert("Wrong Password: Please try again!");
      }
    });
  });
});


//---------------------------------------------------------------------------------------------------------------------------
// Home:
function wantToGoInsert(req,res,destination){
  MongoClient.connect('mongodb://127.0.0.1:27017/myDB',function(err,client){
    if(err) throw err;
    var db = client.db('myDB');
    if(!req.session.user.wantToGoList.includes(destination)){
      req.session.user.wantToGoList.push(destination);
      req.session.save();
      db.collection('myCollection').updateOne(
        {username: req.session.user.username},
        {$set: {wantToGoList: req.session.user.wantToGoList}}
      );
      // db.collection("Users").findOne({username:req.session.user.username},(err,data)=>{
      //   req.session.user = data;
      //   req.session.save();
      // });
    }
    else {
      var alertString =  "This Destination (" + destination + ") is in your want to go list";
      alert(alertString);
    }
  });
}
app.get('/home',checkSession,function(req,res){
  res.render('home');
});

//---------------------------------------------------------------------------------------------------------------------------
// Search:
app.get('/search',checkSession,function(req,res){
  res.render('searchresults');
});
app.post('/search',function(req,res){

  var x = req.body.Search;
  MongoClient.connect('mongodb://127.0.0.1:27017/myDB',function(err,client){
      if (err) throw err;    
      var db = client.db('myDB');
      var destarr = []
      for (var i = 0; i<allDestinationsArray.length ; i++)
      {
        if (allDestinationsArray[i].includes(x.toLowerCase()))
        {
          destarr.push(allDestinationsArray[i]);
        }
      }
      if (destarr.length === 0){
        alert("Not Found")
      }
      res.render('searchresults',{destination : destarr});
  });
});

//---------------------------------------------------------------------------------------------------------------------------
//Register:
app.get('/registration',function(req,res){
  if(req.session.user) delete req.session.user; // when returning to the registeration page we cannot comeback
  res.render('registration');
});

app.post('/register',function(req,res){
  var x = req.body.username;
  var y = req.body.password;
  MongoClient.connect('mongodb://127.0.0.1:27017/myDB',function(err,client){
    if (err) throw err;
    var db = client.db('myDB');
    if(req.body.username == ''){
      alert("Userrname is Empty: Please choose your username.");
    } else if (req.body.password == ''){
      alert("Password is empty: Please write your password.");
    }
    else {
      db.collection('myCollection').find({username : x}).toArray((err,results) => {
        if(err) throw err;
        if(results.length === 0 ){
          db.collection('myCollection').insertOne({username: x , password: y , wantToGoList : []});
          res.redirect('/');      
       }
       else if(results[0].username === x){
        alert("Username Already Exists : Please Choose a different username.");
       }
      })
    }
  });
});

//Want to go list:
app.get('/wanttogo',checkSession,function(req,res){
  res.render('wanttogo',{wantToGoDest : req.session.user.wantToGoList});
});

// MongoClient.connect('mongodb://127.0.0.1:27017/MyDB',function(err,client){
//   var db = client.db('MyDB');
//   db.collection('Cities').find().toArray(function(err,results){
//     if (results.length === 0) {
//       db.collection('Cities').insertOne({cityName: 'annapurna'});
//       db.collection('Cities').insertOne({cityName: 'bali'});
//       db.collection('Cities').insertOne({cityName: 'inca'});
//       db.collection('Cities').insertOne({cityName: 'paris'});
//       db.collection('Cities').insertOne({cityName: 'rome'});
//       db.collection('Cities').insertOne({cityName: 'santorini'});
//     }
//   })
// });






