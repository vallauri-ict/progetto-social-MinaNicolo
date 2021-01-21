"use strict"

const DBNAME = "DB_socialNetwork";

const asyncc=require("async");
const mongo = require("mongodb");
const bcrypt=require("bcryptjs");


let mongoClient = mongo.MongoClient;
const CONNECTIONSTRING = "mongodb://127.0.0.1:27017";
const CONNECTIONOPTIONS = { useNewUrlParser: true, useUnifiedTopology: true };

mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client)
{
    if (err)
    {
        console.log("Errore connessione DB");
    }
    else
    {
        let db = client.db(DBNAME);
        let collection = db.collection("users");

        collection.find({}).project({"password":1}).toArray(function(err,data){
            if (err)
                console.log("Errore eseguzione query");
            else
            {
                //1° parametro --> collezione
                //2° paramentro --> funzione da eseguire su ogni elemento della collezione
                //3° parametro --> callback finale che verrà eseguita dopo che saranno state richiamate tutte le callback parziali
                asyncc.forEach(data, function(item, callback){
                    let pw = bcrypt.hashSync((item["password"]), 10);
                    collection.updateOne({"_id":item["_id"]},{"$set":{"password":pw}}, function(err,data){
                        callback(err);
                    })
                }, function(err){
                    //err è un riassuntivo di tutti err
                    //se tutte le callback hanno restituito err=false err sarà false, altrimenti sarà true
                    //se è false non c'è stato nessun errore
                    if(err)
                        console.log("Errore: "+err.message);
                    else
                        console.log("Aggiornamento eseguito correttamente");
                    client.close();
                });
            }
        });
    }
});