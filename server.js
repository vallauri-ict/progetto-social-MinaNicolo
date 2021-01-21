"use strict";
//const http = require('http');
const https = require("https");
const express = require('express');
const cors = require('cors');
const colors = require('colors');
const mongo = require('mongodb');
const bodyParser = require('body-parser');
const fs = require("fs");
const PORT = process.env.PORT || 1337;

let mongoClient = mongo.MongoClient;

//const CONNECTIONSTRING = process.env.MONGODB_URI // heroku app
// const CONNECTIONSTRING = "atlas connectionString" // app locale DBMS atlas
const CONNECTIONSTRING = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017"; // app locale DBMS locale
const CONNECTIONOPTION = { useNewUrlParser: true, useUnifiedTopology: true };
const DB_NAME = "DB_socialNetwork";
const app = express()


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const TTL_Token = 120; //espresso in sec

const privateKey = fs.readFileSync("keys/privateKey.pem", "utf8");
const certificate = fs.readFileSync("keys/certificate.pem", "utf8");
const credentials = { "key": privateKey, "cert": certificate };

//const server = http.createServer(app);
const server = https.createServer(credentials, app);

const io = require('socket.io')(server);

let paginaErrore = "";
//let privateKey;

server.listen(PORT, function () {
    console.log('Server listening on port ' + PORT);
    init();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.set('json spaces', 4);

//AVOID CORS PROBLEM
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

function init(req, res) {
    fs.readFile("./static/error.html", function (err, data) {
        if (!err)
            paginaErrore = data.toString();
        else
            paginaErrore = "<h1>Risorsa non trovata</h1>"
    });
    /*fs.readFile("./keys/private.key", function (err, data) {
        if (!err) {
            privateKey = data.toString();
        }
        else {
            //Richiamo la route di gestione degli errori
            console.log("File mancante: private.key");
            server.close();
        }
    })*/

    app.response.log = function (message) {
        console.log("Errore: " + message);
    }
}



/*********************** MIDDLEWARE ROUTES *********************** */

// log della richiesta
app.use("/", function (req, res, next) {
    // originalUrl contiene la risorsa richiesta
    console.log(" --------> " + req.method + " : " + req.originalUrl);
    next();
});

app.get("/", function (req, res, next) {
    controllaToken(req, res, next);
});

app.get("/index.html", function (req, res, next) {
    controllaToken(req, res, next);
});

//route relativa alle risorse statiche
app.use("/", express.static("./static"))


//routes di lettura dei parametri post
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// log dei parametri
app.use("/", function (req, res, next) {
    // if(req.query!={})
    if (Object.keys(req.query).length > 0)
        console.log("parametri GET: " + JSON.stringify(req.query))
    if (Object.keys(req.body).length > 0)
        console.log("parametri BODY: " + JSON.stringify(req.body))
    next();
})


/******************** CHAT FUNCTION****************************** */
let users = [];
io.on('connection', function (socket) {
    let user = {};
    user.username = "";
    user.socket = socket;
    user.socketId = socket.id;
    users.push(user);
    log(' User ' + colors.yellow(socket.id) + ' connected!');


    // 1) ricezione username
    socket.on('username', function (username) {
        user.username = username;
        log(' User ' + colors.yellow(this.id) + ' name is ' + colors.yellow(username));
    });


    // 2) ricezione di un messaggio	 
    socket.on('message', function (data) {
        let username = user.username;
        log('User ' + colors.yellow(username) + ' sent ' + colors.green(data));

        // notifico a tutti i socket (compreso il mittente) il messaggio appena ricevuto 
        let response = JSON.stringify({
            'from': username,
            'message': data.msg,
            'date': new Date(),
            "id":data.id
        });
        io.emit('notify_message', response);
    });

    // 3) user disconnected
    socket.on('disconnect', function () {
        users.slice(users.indexOf(0));
        log(' User ' + colors.yellow(user.username) + ' disconnected!');
    });
});

// stampa i log con data e ora
function log(data) {
    console.log(colors.cyan("[" + new Date().toLocaleTimeString() + "]") + ": " + data);
}

/********************* END CHAT FUNCTION********************************* */

/**********************Middleware specifico relativo a JWT ********************************** */
app.post('/api/login', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DB_NAME);
            const collection = db.collection("users");

            let username = req.body.username;
            collection.findOne({ "username": username }, function (err, dbUser) {
                if (err)
                    res.status(500).send("Internal Error in Query Execution").log(err.message);
                else {
                    if (dbUser == null)
                        res.status(401).send("Username e/o Password non validi");
                    else {
                        //req.body.password --> password in chiaro inserita dall'utente
                        //dbUser.password --> password cifrata contenuta nel DB
                        //Il metodo compare() cifra req.body.password e la va a confrontare con dbUser.password
                        bcrypt.compare(req.body.password, dbUser.password, function (err, ok) {
                            if (err)
                                res.status(500).send("Internal Error in bcrypt compare").log(err.message);
                            else {
                                if (!ok)
                                    res.status(401).send("Username e/o Password non validi");
                                else {
                                    let token = createToken(dbUser);
                                    writeCookie(res, token);
                                    res.send({ "ris": "ok" });
                                }
                            }
                        });
                    }
                }
                client.close();
            })
        }
    });
});

app.post('/api/logout', function (req, res, next) {
    //res.set("Set-Cookie", `token="";max-age=-1;path=/;httponly=true`);
    res.clearCookie("token");
    res.send({ "ris": "ok" });
});

app.post("/api/signUp", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("users");

            let username = req.body["username"];

            collection.findOne({ "username": username }, function (err, dbUser) {
                if (err)
                    res.status(500).send("Errore find user").log(err.message);
                else {
                    if (dbUser == null)
                        res.send({ "ris": "nus" });
                    else
                        res.status(409).send("Utente già esistente");
                    client.close();
                }

            })
        }
    })
})

app.post("/api/utenti", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("users");
            collection.find({}).toArray(function (err, data) {
                if (err)
                    res.status(500).send("Errore ricerca utenti").log(err.message);
                else
                    res.send(data)
                client.close();
            })
        }
    })
})

app.post("/api/insertUser", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("users");

            let codUtente = req.body["codUtente"];
            let username = req.body["username"];
            let surname = req.body["surname"];
            let name = req.body["name"];
            let mail = req.body["mail"];
            let dob = req.body["dob"];
            let pwd = bcrypt.hashSync(req.body["password"], 10);

            collection.insertOne({
                "codUtente": codUtente,
                "nome": name,
                "cognome": surname,
                "username": username,
                "password": pwd,
                "corsiJoin": [],
                "mail": mail,
                "dob": new Date(dob),
                "corsiLiked": []
            }, function (err, data) {
                if (err)
                    res.status(500).send("Errore insert user").log(err.message);
                else {
                    res.send({ "ris": "ok" });
                }
                client.close();
            })
        }
    })
})

app.use("/api", function (req, res, next) {
    controllaToken(req, res, next);
});

function controllaToken(req, res, next) {
    let token = readCookie(req);
    if (token == "") {
        inviaErrore(req, res, 403, "Token mancante");
    }
    else {
        jwt.verify(token, privateKey, function (err, payload) {
            if (err) {
                inviaErrore(req, res, 403, "Token scaduto o corrotto");
            }
            else {
                let newToken = createToken(payload);
                writeCookie(res, newToken);
                req.payload = payload; //salvo il payload dentro request in modo che le api successive lo possano leggere e ricavare i dati necessari
                next();
            }
        });
    }
}

function inviaErrore(req, res, cod, errorMessage) {
    if (req.originalUrl.startsWith("/api/")) {
        res.status(cod).send(errorMessage);
    }
    else {
        res.sendFile(__dirname + "/static/login.html");
    }
}

function readCookie(req) {
    let valoreCookie = "";
    if (req.headers.cookie) {
        let cookies = req.headers.cookie.split(';');
        for (let item of cookies) {
            item = item.split('='); //item = chiave=valore --> split --> [chiave, valore]
            if (item[0].includes("token")) {
                valoreCookie = item[1];
                break;
            }
        }
    }
    return valoreCookie;
}

//data --> record dell'utente
function createToken(data) {
    //sign() --> si aspetta come parametro un json con i parametri che si vogliono mettere nel token
    let json = {
        "_id": data["_id"],
        "username": data["username"],
        "iat": data["iat"] || Math.floor((Date.now() / 1000)),
        "exp": (Math.floor((Date.now() / 1000)) + TTL_Token)
    }
    let token = jwt.sign(json, privateKey);
    //console.log(token);
    return token;

}

function writeCookie(res, token) {
    //set() --> metodo di express che consente di impostare una o più intestazioni nella risposta HTTP
    res.set("Set-Cookie", `token=${token};max-age=${TTL_Token};path=/;httponly=true`);
}

/**************************************************** */
// route specifiche
let currentId;
let currentCourse;

app.post("/api/userLogged", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("users");
            let username = req.payload["username"];
            collection.find({ "username": username }).toArray(function (err, data) {
                if (err)
                    res.status(500).send("Errore ricerca elenco corsi").log(err.message);
                else
                    res.send(data)
                client.close()
            })
        }
    })
})


app.post("/api/corso", function (req, res, next) {
    currentId = req.body["cod"];
    currentCourse = req.body["name"];
    if (currentId != "" && currentCourse != "")
        res.send({ "ris": "OK" });
    else
        res.status(404).send("Risorsa non trovata");
})

app.get("/api/TrovaCorso", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("courses")
            collection.find({ "codCorso": currentId }).toArray(function (err, data) {
                if (err)
                    res.status(500).send("Errore ricerca elenco corsi").log(err.message);
                else
                    res.send(data)
                client.close()
            })
        }
    })
})

app.post("/api/coursesArea", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("courses")
            collection.find({}).project({ "_id": 0, "codCorso": 1, "nome": 1, "author": 1, "nIscritti": 1, "like":1 }).toArray(function (err, data) {
                if (err)
                    res.status(500).send("Errore ricerca elenco corsi").log(err.message);
                else
                    res.send(data)
                client.close()
            })
        }
    })
})

app.post("/api/nameAuthor", function (req, res, next) {
    let codAuthor = req.body["codAuthor"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("authors")
            collection.find({ "codAutore": codAuthor }).project({ "codAutore": 1, "nome": 1, "cognome": 1 }).toArray(function (err, data) {
                if (err)
                    res.status(500).send("Errore ricerca autores").log(err.message);
                else
                    res.send(data)
                client.close()
            })
        }
    })
});

app.get("/api/SearchUser", function (req, res, next) {
    let testo = req.query["testo"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al DB").log(err.message);
        }
        else {
            console.log("FIND: Connessione OK");
            let db = client.db(DB_NAME);
            let collection = db.collection("users");

            testo = testo.replace("/\s+/g", " ");
            testo = testo.split(" ");
            let vet = [];

            for (let item of testo) {
                let reg = new RegExp("^" + item, "i");
                let json = { "username": { "$regex": reg } };
                vet.push(json);
            }
            collection.find({ "$and": vet }).project({ "username": 1, "codUtente": 1 }).toArray(function (err, data) {
                if (err) {
                    res.status(500).send("Errore eseguzione query").log(err.message);
                }
                else {
                    console.log("Query eseguita correttamente");
                    res.send(data);
                }
                client.close();
            });
        }
    })
});


app.get("/api/datiUser", function (req, res, next) {
    let codUtente = req.query["cod"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("users")
            collection.find({ "codUtente": codUtente }).toArray(function (err, data) {
                if (err)
                    res.status(500).send("Errore ricerca utente").log(err.message);
                else
                    res.send(data);
                client.close()
            })
        }
    })
});

app.post("/api/categoriaCorso", function (req, res, next) {
    let categoria = req.body["categoria"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("courses")
            collection.find({ "categoria": categoria }).toArray(function (err, data) {
                if (err)
                    res.status(500).send("Errore ricerca elenco corsi").log(err.message);
                else
                    res.send(data)
                client.close()
            })
        }
    })
})

app.post("/api/corsiSeguiti", function (req, res, next) {
    let codUtente = req.body["codUtente"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("users")
            collection.find({ "codUtente": codUtente }).project({ "corsiJoin": 1 }).toArray(function (err, data) {
                if (err)
                    res.status(500).send("Errore ricerca elenco corsi").log(err.message);
                else
                    res.send(data)
                client.close()
            })
        }
    })
})

app.get("/api/getCourseFollowed", function (req, res, next) {
    let codCorso = req.query["codCorso"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("courses")
            collection.find({ "codCorso": codCorso }).toArray(function (err, data) {
                if (err)
                    res.status(500).send("Errore ricerca elenco corsi").log(err.message);
                else
                    res.send(data)
                client.close()
            })
        }
    })
})

app.post("/api/aggiornaLike",function(req,res,next){
    let codCorso = req.body["cod"];
    let number = req.body["number"]
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("courses")
            collection.updateOne({ "codCorso": codCorso }, {$inc:{"like":number}}, function (err, data) {
                if (err)
                    res.status(500).send("Errore aggiornamento likes corso").log(err.message);
                else
                    res.send({"ris":"ok"});
                client.close()
            })
        }
    })
})

app.post("/api/addCourse",function(req,res,next){
    let codCorso = req.body["codCourse"];
    let codUser = req.body["codUser"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("users")
            collection.updateOne({ "codUtente": codUser }, {$push:{"corsiJoin":codCorso}}, function (err, data) {
                if (err)
                    res.status(500).send("Errore update corsiJoin").log(err.message);
                else
                    res.send({"ris":"ok"});
                client.close()
            })
        }
    })
})
app.post("/api/removeCourse",function(req,res,next){
    let codCorso = req.body["codCourse"];
    let codUser = req.body["codUser"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("users")
            collection.updateOne({ "codUtente": codUser }, {$pull:{"corsiJoin":codCorso}}, function (err, data) {
                if (err)
                    res.status(500).send("Errore rimozione cod corsiJoin").log(err.message);
                else
                    res.send({"ris":"ok"});
                client.close()
            })
        }
    })
})
app.post("/api/updateNumberIscritti",function(req,res,next){
    let codCorso = req.body["codCourse"];
    let number = req.body["number"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("courses")
            collection.updateOne({ "codCorso": codCorso }, {$inc:{"nIscritti":number}}, function (err, data) {
                if (err)
                    res.status(500).send("Errore aggiornamento numero iscritti corso").log(err.message);
                else
                    res.send({"ris":"ok"});
                client.close()
            })
        }
    })
})

app.post("/api/addCourseLiked",function(req,res,next){
    let codCorso = req.body["codCorso"];
    let codUser = req.body["codUser"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("users")
            collection.updateOne({ "codUtente": codUser }, {$push:{"corsiLiked":codCorso}}, function (err, data) {
                if (err)
                    res.status(500).send("Errore aggiornamento numero iscritti corso").log(err.message);
                else
                    res.send({"ris":"ok"});
                client.close()
            })
        }
    })
})

app.post("/api/removeCourseLiked",function(req,res,next){
    let codCorso = req.body["codCorso"];
    let codUser = req.body["codUser"];
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTION, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB").log(err.message);
        else {
            let db = client.db(DB_NAME)
            let collection = db.collection("users")
            collection.updateOne({ "codUtente": codUser }, {$pull:{"corsiLiked":codCorso}}, function (err, data) {
                if (err)
                    res.status(500).send("Errore aggiornamento numero iscritti corso").log(err.message);
                else
                    res.send({"ris":"ok"});
                client.close()
            })
        }
    })
})

/********** Route di gestione degli errori **********/

app.use("/", function (req, res, next) {
    res.status(404);
    if (req.originalUrl.startsWith("/api/")) {
        //res.send('"Risorsa non trovata"'); //non va così bene, perchè content-type viene messo = "text"
        res.json("Risorsa non trovata"); //La serializzazione viene fatta dal metodo json()
        //res.send({"ris":"Risorsa non trovata"});
    }
    else {
        res.send(paginaErrore);
    }
});

app.use(function (err, req, res, next) {
    console.log(err.stack);
});

