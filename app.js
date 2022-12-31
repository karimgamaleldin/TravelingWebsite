const{ Console } = require('console');
var express = require('express');
var path = require('path');
var session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var alert = require('alert');
const { Template } = require('ejs');




var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    resave:true,
    saveUninitialized:true,
    secret:"secret"
  })
);


// constants:
const allDestinationsArray = ['annapurna','bali','inca','paris','rome','santorini'] ;
var embAcc = {
  username: 'admin',
  password: 'admin',
  wantToGoList: []
}

//helper functions

function checkSession(req,res,next){
  if(req.session.user) return next();
  else res.redirect('/');
}

function getRealName(dest) {
  switch(dest) {
    case "paris": return "Paris";
    case "bali": return "Bali Island";
    case "annapurna": return "Annapurna Circuit";
    case "inca": return "Inca Trail to Machu Picchu";
    case "rome": return "Rome";
    case "santorini": return "Santorini Island";
    default: return "";
  }
}

// function getPageNamesForWantToGo(dest) {
//   var arr = [];
//   for (var i = 0 ; i < dest.length ; i++){
//     switch(dest[i]) {
//       case "Paris": arr.push("paris"); break;
//       case "Bali Island": arr.push("bali"); break;
//       case "Annapurna Circuit": arr.push("annapurna"); break;
//       case "Inca Trail to Machu Picchu": arr.push("inca"); break;
//       case "Rome":  arr.push("rome"); break;
//       case "Santorini Island":  arr.push("santorini"); break;
//       default: break;
//     }
//   }
//   return arr;
// }


function wantToGoInsert(req,res,destination){
  MongoClient.connect('mongodb://127.0.0.1:27017/myDB',function(err,client){
    if(err) throw err;
    var db = client.db('myDB');
    if(!req.session.user.wantToGoList.includes(getRealName(destination))){
      req.session.user.wantToGoList.push(getRealName(destination));
      req.session.save();
      db.collection('myCollection').updateOne(
        {username: req.session.user.username},
        {$set: {wantToGoList: req.session.user.wantToGoList}}
      );
    }
    else {
      var alertString =  "This Destination (" + getRealName(destination) + ") is in your want to go list";
      alert(alertString);
    }
  });
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
  if(x === embAcc.username && y === embAcc.password){
    req.session.user = embAcc;
    req.session.save();
    res.redirect('/home');
  }
  else {
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
          req.session.save();
          res.redirect('/home');
        }
        else {
          alert("Wrong Password: Please try again!");
        }
      });
    });
  }
});


//---------------------------------------------------------------------------------------------------------------------------
// Home:
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
      var destarr = [];
      var destArrRealNames = [];
      for (var i = 0; i<allDestinationsArray.length ; i++)
      {
        if (getRealName(allDestinationsArray[i]).toLowerCase().includes(x.toLowerCase()))
        {
          destarr.push(allDestinationsArray[i]);
          destArrRealNames.push(getRealName(allDestinationsArray[i]));
        }
      }
      if (destarr.length === 0){
        alert("Not Found")
      }
      res.render('searchresults',
                  {destination: destarr, 
                   destinationRealNames: destArrRealNames});
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
      alert("Username is Empty: Please choose your username.");
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
  var arr = [];
  for (var i = 0 ; i < req.session.user.wantToGoList.length ; i++){
    switch(req.session.user.wantToGoList[i]) {
      case "Paris": arr.push("paris"); break;
      case "Bali Island": arr.push("bali"); break;
      case "Annapurna Circuit": arr.push("annapurna"); break;
      case "Inca Trail to Machu Picchu": arr.push("inca"); break;
      case "Rome":  arr.push("rome"); break;
      case "Santorini Island":  arr.push("santorini"); break;
      default: break;
    }
  }  
  res.render('wanttogo',{wantToGoDest : req.session.user.wantToGoList , pages : arr });
});

const PORT = process.env.PORT || 3030;


app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});