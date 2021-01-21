"use strict";

$(document).ready(function () {

    let navBar = $(".nav_links");

    let _closeButton = $(".close");
    let _userButton = $("#user");
    let _divProfile = $(".profile");

    let _body = $("body");
    let _wrapper = $(".wrapper");

    let request = inviaRichiesta("GET", "/api/TrovaCorso");
    request.fail(errore);
    request.done(function (data) {
        createPage(data);
        console.log(data);
        console.log("OK")
    })

    _userButton.on("click", function () {
        $(".profile-card").addClass("show")
        $("body").css("overflow", "hidden");
    });

    $("#btnLogout").on("click", function () {
        let request = inviaRichiesta("POST", "/api/logout");
        request.fail(errore);
        request.done(function (data) {
            console.log(data);
            window.location.href = "./../login.html";
        })
    })

    _userButton.on("click", function () {
        let request = inviaRichiesta("POST", "/api/userLogged");
        request.fail(errore);
        request.done(function (data) {
            creaProfilo(data, "00");
        })
    })

    _closeButton.on("click", function () {
        $(".profile-card").removeClass("show");
        _textWrite.html("");
        $("body").css("overflow", "");
    })

    function creaProfilo(item, codice) {
        _divProfile.empty();
        let divCardHeader;

        switch (codice) {
            case "00": {
                let id = parseInt(item[0]["codUtente"].split('u')[1]);
                divCardHeader = $("<div>").addClass("card-header").appendTo(_divProfile);
                let divPic = $("<div>").addClass("pic").appendTo(divCardHeader);
                if (id > 15)
                    /*img user*/$("<img>").prop("src", "./../imgSocial/users/default.svg").appendTo(divPic);
                else
                    /*img user*/$("<img>").prop("src", "./../imgSocial/users/" + item[0]["codUtente"] + ".jpg").appendTo(divPic);

                /*name user*/$("<div>").addClass("name").html(item[0]["cognome"] + " " + item[0]["nome"]).appendTo(divCardHeader);
                /*mail user*/$("<div>").addClass("desc").html(item[0]["mail"]).appendTo(divCardHeader);
                let date = item[0]["dob"].split("T")[0];
                /*dob user*/$("<div>").addClass("desc").html(date).appendTo(divCardHeader);
            } break;
        }
        $(".profile-card").addClass("show");
        $("body").css("overflow", "hidden");
    }

    function createPage(item) {

        let req = inviaRichiesta("POST", "/api/userLogged");
        req.fail(errore);
        req.done(function (user) {
            let trovato = false;
            let i = 0;
            let li = $("<li>").appendTo(navBar);
            while (!trovato && i < user[0]["corsiJoin"].length) {
                if (user[0]["corsiJoin"][i] == item[0]["codCorso"]) {
                    trovato = true;
                }
                else
                    i++;
            }
            if (trovato)
                $("<button>").html("REMOVE COURSE").prop("userL", user[0]["codUtente"]).prop("courseCod", item[0]["codCorso"])
                    .on("click", updateCourseFollowed).addClass("glow-on-hover")
                    .prop("type", "button").appendTo(li);
            else
                $("<button>").html("FOLLOW COURSE").prop("userL", user[0]["codUtente"]).prop("courseCod", item[0]["codCorso"])
                    .on("click", updateCourseFollowed).addClass("glow-on-hover")
                    .prop("type", "button").appendTo(li);

            $("<h1>").html(item[0]["nome"].toUpperCase()).appendTo(_body);

            $("<p>").html(item[0]["descrizione"]).appendTo(_body);

            /*contenitore img */
            let _divCard1 = $("<div class='contenitore' id='card1'>").appendTo(_wrapper);
            let _divImage1 = $("<div class='image'>").appendTo(_divCard1);
            let img = $("<img>").css({ "width": "100%", "height": "100%" }).appendTo(_divImage1);

            /*descrizione img */
            let _story1 = $("<div class='story' id='story1'>").appendTo(_divCard1);
            let divInfo1 = $("<div class='info'>").appendTo(_story1);
            $("<h3>").html(item[0]["nome"]).appendTo(divInfo1);
            $("<p>").html(item[0]["imgCorso"][0]["descrizioneImg"]).appendTo(divInfo1);

            /*contenitore video */
            let _divCard2 = $("<div class='contenitore' id='card2'>").appendTo(_wrapper);
            let _divImage2 = $("<div class='image'>").appendTo(_divCard2);
            let video = $("<iframe>").addClass("card").appendTo(_divImage2);

            /*descrizione video */
            let _story2 = $("<div class='story' id='story2'>").appendTo(_divCard2);
            let divInfo2 = $("<div class='info'>").appendTo(_story2);
            $("<p>").html(item[0]["imgCorso"][0]["descrizioneVideo"]).appendTo(divInfo2);

            let tr = false;
            let j = 0;

            while (!tr && j < user[0]["corsiLiked"].length) {
                if (user[0]["corsiLiked"][j] == item[0]["codCorso"])
                    tr = true;
                else
                    j++;
            }

            /*img like */
            let divLike = $("<div>").addClass("like").appendTo(_story1);
            if (tr) {
                $("<img>").addClass("imgLike").prop("title", "Remove Like")
                    .prop("src", "./../imgSocial/courses/dislike.png").on("click", aggiornaLike)
                    .prop("codCorso", item[0]["codCorso"])
                    .prop("codUser", user[0]["codUtente"]).appendTo(divLike);
            }
            else {
                $("<img>").addClass("imgLike").prop("title", "Add Like")
                    .prop("src", "./../imgSocial/courses/like.png").on("click", aggiornaLike)
                    .prop("codCorso", item[0]["codCorso"])
                    .prop("codUser", user[0]["codUtente"]).appendTo(divLike);
            }


            switch (item[0]["nome"]) {
                case "batteria": {

                    img.prop("src", "./../media/batteria/batteria.jpg");
                    video.prop("src", "https://www.youtube.com/embed/MHj9XlV3fFg");

                } break;
                case "c#": {

                    img.prop("src", "./../media/c/c.jpg");
                    video.prop("src", "https://www.youtube.com/embed/W8u2vIAFIEc");

                } break;
                case "chitarra": {

                    img.prop("scr", "./../media/chitarra/chitarra.jpg");
                    video.prop("src", "https://www.youtube.com/embed/dHy2K02Z1ig");

                } break;
                case "giapponese": {

                    img.prop("src", "./../media/giapponese/sushi.jpg");
                    video.prop("src", "https://www.youtube.com/embed/Xe0pifwizJU");

                } break;
                case "inglese": {

                    img.prop("src", "./../media/inglese/inglese.jpg");
                    video.prop("src", "https://www.youtube.com/embed/oC2A0wheU9M");

                } break;
                case "italiana": {

                    img.prop("src", "./../media/italiana/pizza.jpg");
                    video.prop("src", "https://www.youtube.com/embed/zXWGhFXH-Ss");

                } break;
                case "judo": {

                    img.prop("src", "./../media/judo/judo.jpg");
                    video.prop("src", "https://www.youtube.com/embed/Zy7bRVk5hP0");

                } break;
                case "palestra": {

                    img.prop("src", "./../media/palestra/palestra.jpg");
                    video.prop("src", "https://www.youtube.com/embed/WkDgUZKr_oU")

                } break;
                case "php": {

                    img.prop("src", "./../media/php/php.jpg");
                    video.prop("src", "https://www.youtube.com/embed/OK_JCtrrv-c");

                } break;
                case "spagnolo": {

                    img.prop("src", "./../media/spagnolo/spagnolo.jpg");
                    video.prop("src", "https://www.youtube.com/embed/dcBRybf9zJg");

                } break;
            }
        })
    }

    function aggiornaLike() {
        let codCorso = $(this).prop("codCorso");
        let codUser= $(this).prop("codUser");

        if ($(this).prop("title") == "Add Like") {
            let request = inviaRichiesta("POST", "/api/aggiornaLike", { "cod": codCorso, "number":1 });
            request.fail(errore);
            request.done(function (data) {
                alert("Grazie per aver messo like!");

                let req = inviaRichiesta("POST", "/api/addCourseLiked", { "codCorso": codCorso, "codUser":codUser});
                req.fail(errore);
                req.done(function (data) {
                    $(".imgLike").prop("title", "Remove Like").prop("src", "./../imgSocial/courses/dislike.png");
                })
            })
        }
        else {
            let request = inviaRichiesta("POST", "/api/aggiornaLike", { "cod": codCorso, "number":-1 });
            request.fail(errore);
            request.done(function (data) {
                alert("Il tuo like è stato rimosso!");

                let req = inviaRichiesta("POST", "/api/removeCourseLiked", { "codCorso": codCorso, "codUser":codUser});
                req.fail(errore);
                req.done(function (data) {
                    $(".imgLike").prop("title", "Add Like").prop("src", "./../imgSocial/courses/like.png");
                })
            })
        }
    }

    function updateCourseFollowed() {
        let userCod = $(this).prop("userL");
        let courseCod = $(this).prop("courseCod");

        let req;

        if ($(this).html() == "FOLLOW COURSE") {
            req = inviaRichiesta("POST", "/api/addCourse", { "codUser": userCod, "codCourse": courseCod });
            req.fail(errore);
            req.done(function (data) {
                alert("Ti sei iscritto al corso con successo!!");
                $("button").html("REMOVE COURSE");
                let r = inviaRichiesta("POST", "/api/updateNumberIscritti", { "codCourse": courseCod, "number": 1 });;
                r.fail(errore);
                r.done(function (data) {
                    console.log("OK");
                })
            })
        }
        else {
            req = inviaRichiesta("POST", "/api/removeCourse", { "codUser": userCod, "codCourse": courseCod });
            req.fail(errore);
            req.done(function (data) {
                alert("Ti sei disiscritto dal corso con successo!!");
                $("button").html("FOLLOW COURSE");
                let r = inviaRichiesta("POST", "/api/updateNumberIscritti", { "codCourse": courseCod, "number": -1 });;
                r.fail(errore);
                r.done(function (data) {
                    console.log("OK");
                })
            })
        }
    }
});