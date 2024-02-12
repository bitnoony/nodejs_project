var mysql = require("mysql");
const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "daniel100!",
    database: "myboard",
});

conn.connect();

const express = require('express');
const app = express();
const sha = require('sha256');

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

let session = require('express-session');
app.use(session({
    secret : 'dkufe8938493j4e08349u',
    resave : false,
    saveUninitialized : true
}));

app.use(passport.initialize());
app.use(passport.session());

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

//정적 파일 라이브러리 추가
app.use(express.static("public"));

app.listen(8080, function(){
    console.log("포트 8080으로 서버 대기중...")
});

app.get('/book', function(req, res){
    res.send('도서 목록 관련 페이지입니다.');
});

app.get('/', function(req, res){
    res.render("index.ejs");
});

app.get('/list', function(req,res){
    conn.query("select * from post", function(err, rows){
        if(err) throw err;
        res.render('list.ejs', { data: rows });
        console.log(rows);
    });
});

app.get('/enter', function(req, res){
   res.render('enter.ejs');

});

app.post('/save', function(req, res){
    
    let sql = "insert into post (title, content, created) values(?,?,?)";
    let params = [req.body.title, req.body.content, req.body.someDate];
    conn.query(sql, params, function(err, result){
        if(err) throw err;
        console.log('데이타 추가 성공');
    });
    res.redirect("/list");
});

app.post("/delete", function(req, res){
    let sql = "delete from post where id = ?";
    let data = req.body.id; 
    // sql 의 ? 에 들어감. list.ejs에서 전송된 data 객체 = req.body
    conn.query(sql, data, function(err, results) {
        if(err) throw err;
        console.log('삭제완료');
        res.status(200).send();
    })

});

app.get('/content/:id', function(req, res){
    let sql = "select * from post where id = ?";
    let pid = [req.params.id ];   
    conn.query(sql, pid, function(err, rows) {
        if(err) throw err;
        console.log(rows);
        res.render('content.ejs', { data : rows });
    })
    
})

app.get("/edit/:id", function(req, res){
    let sql = "select * from post where id = ?";
    let pid = [req.params.id ];   
    conn.query(sql, pid, function(err, rows) {
        if(err) throw err;
        console.log(rows);
        res.render('edit.ejs', { data : rows });
    })
})

app.post("/edit", function(req, res){
    let sql = "update post set title = ?, content = ?, created = ? where id = ? ";
    let params = [req.body.title, req.body.content, req.body.created, req.body.id];

    conn.query(sql, params, function(err, rows) {
        if(err) throw err;
       res.redirect('/list');
    })
    
})

let cookieParser = require('cookie-parser');

app.use(cookieParser());
app.get('/cookie', function(req, res){
    let milk = parseInt(req.cookies.milk) + 1000;
    if(isNaN(milk))
    {
        milk = 0;
    }
    res.cookie('milk', milk, {maxAge : 1000});
    res.send('product : ' + milk + '원');
});



app.get("/login", function(req, res){
    console.log(req.session);
    if(req.session.user){
        console.log('세션 유지');
        res.render('index.ejs', { user: req.session.user });
    }else{
        res.render("login.ejs");
    }
});

passport.serializeUser(function(user, done){
    console.log("serializeUser");
    console.log(user.userid);
    done(null, user.userid);
});

passport.deserializeUser(function(puserid, done){
    console.log("deserializeUser");
    console.log(puserid);

    let sql = "select * from account where userid = ?";
     conn.query(sql, puserid, function(err, result) {
          console.log(result);
          done(null, result);   
        })
});

app.post("/login", passport.authenticate("local", {
    failureRedirect: "/fail",
    }),
    function(req, res){
      console.log(req.session);
      console.log(req.session.passport);
      res.render("index.ejs", { user : req.session.passport });
    }
    );

passport.use(
    new LocalStrategy(
        { 
            usernameField: "userid",
            passwordField: "userpw",
            session: true,
            passReqToCallback: false,
        },
        function(inputid, inputpw, done){
            let sql = "select * from account where userid = ?";
            conn.query(sql, inputid, function(err, result) {
            if(result[0].userpw == sha(inputpw)){
              console.log('새로운 로그인');
              done(null, result);
            } else {
              done(null, false, { message: "비밀번호 틀렸어요."});
            }
        });
    }
    )
);

app.get("/logout", function(req, res){
    console.log("로그 아웃");
    req.session.destroy();
    res.render('index.ejs', { user: null });
});

app.get("/signup", function(req, res){
    res.render("signup.ejs");
})

app.post("/signup", function(req, res){
    console.log(req.body.userid);
    console.log(sha(req.body.userpw));
    console.log(req.body.usergroup);
    console.log(req.body.email); 

    let sql = "insert into account (userid, userpw, usergroup, email) values (?, ?, ?, ?)";
    let params = [req.body.userid, sha(req.body.userpw), req.body.usergroup, req.body.email];

    conn.query(sql, params, function(err, rows) {
        if(err) throw err;
        console.log("회원가입 성공!");
        req.session.user = req.body;
        res.render('index.ejs', { user: req.session.user });
    })
})