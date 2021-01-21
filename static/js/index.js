"use strict";

const BACKSPACE = 8;

$(document).ready(function () {
    let _divProfile = $(".profile");
    let _sidebar = $("#sidebar");

    let _buttonGroup = $(".project_area .button-group");
    let _divCourseArea = $(".coursesArea");

    /*********** PUNTATORI SEARCH AREA *************** */
    let _buttonSearch = $("#searchButton");
    let _txtSearchUser = $("#txtSearchUser");
    let _closeSearchUser = $("#closeSearchUser");
    $(".form-group").hide();
    let _txtVoci = $("#txtVoci");

    let _userButton = $("#user");
    let _closeButton = $(".close");

    let countCourseFollowed=0;

    /*********** PUNTATORI CHAT ************** */
    let popup = $('.chat-popup');
    let _chatArea = $('.chat-area');
    let _textWrite = $('#myText');
    let emojiBtn = $('#emoji-btn');
    let _btnCloseChat = $("#btnCloseChat");
    let _btnInviaMessage = $("#btnInviaMessage");


    createButton();
    createCoursesArea();

    $("#btnAll").on("click", createCoursesArea);
    $("#btnFollowing").on("click", coursesFollowing);

    _userButton.on("click", function () {
        $(".profile-card").addClass("show")
        $("body").css("overflow", "hidden");
    });

    $("#btnLogout").on("click", function () {
        let request = inviaRichiesta("POST", "/api/logout");
        request.fail(errore);
        request.done(function (data) {
            console.log(data);
            window.location.href = "login.html";
        })
    })

    _userButton.on("click", function () {
        let request = inviaRichiesta("POST", "/api/userLogged");
        request.fail(errore);
        request.done(function (data) {
            creaProfilo(data, "00");
        })
    })

    _closeSearchUser.on("click", function () {
        _txtVoci.empty();
        _txtSearchUser.empty();
        $(".form-group").hide();

    })
    _buttonSearch.on("click", function () {
        $(".form-group").show();
    })

    _closeButton.on("click", function () {
        if (socket != null)
            socket.disconnect();
        $(".profile-card").removeClass("show");
        _textWrite.html("");
        popup.hide();
        $("body").css("overflow", "");
    })

    _btnCloseChat.on("click", function () {
        popup.hide();
    })

    _sidebar.on("click", "a", function () {
        let nome = $(this).children("span").html().toLowerCase();
        let request = inviaRichiesta("POST", "/api/categoriaCorso", { "categoria": nome });
        request.fail(errore);
        request.done(function (data) {
            console.log(data);
            containerCourse(data, "01")
        })
    })

    _txtSearchUser.on("keyup", function (event) {
        if ((event.keyCode >= 48 && event.keyCode <= 57) ||
            (event.keyCode >= 65 && event.keyCode <= 90) ||
            (event.keyCode >= 97 && event.keyCode <= 122) ||
            event.keyCode == BACKSPACE) {
            let testo = _txtSearchUser.val();
            if (testo == "")
                _txtVoci.html("");
            else {
                let req = inviaRichiesta("GET", "/api/SearchUser", { "testo": testo });
                req.fail(errore);
                req.done(function (data) {
                    console.log(data);
                    _txtVoci.html("");
                    let _span = $("<span>").appendTo(_txtVoci).addClass("spanContainer");
                    let i = 0;
                    for (let item of data) {
                        let _div = $("<div>").addClass("divUser").prop("cod", item["codUtente"]).on("click", visualizzaProfilo).appendTo(_span);
                        let num = parseInt(item["codUtente"].split('u')[1]);

                        if (i != 0) {
                            if (num < 15) {
                                $("<img>").prop("src", "./../imgSocial/users/" + item["codUtente"] + ".jpg").addClass("rounded-circle").addClass("small-img").appendTo(_div);
                                _div.html(_div.html() + " " + item["username"]);
                            }
                            else {
                                $("<img>").prop("src", "./../imgSocial/users/default.svg").addClass("rounded-circle").addClass("small-img").appendTo(_div);
                                _div.html(_div.html() + " " + item["username"]);
                            }

                        }
                        else {
                            i++;
                            if (num < 15) {
                                $("<img>").prop("src", "./../imgSocial/users/" + item["codUtente"] + ".jpg").addClass("rounded-circle").addClass("small-img").appendTo(_div);
                                _div.html(_div.html() + " " + item["username"]);
                            }
                            else {
                                $("<img>").prop("src", "./../imgSocial/users/default.svg").addClass("rounded-circle").addClass("small-img").appendTo(_div);
                                _div.html(_div.html() + " " + item["username"]);
                            }
                        }
                    }
                });
            }
        }
    });

    function visualizzaProfilo() {
        let cod = $(this).prop("cod");

        let request = inviaRichiesta("GET", "/api/datiUser", { "cod": cod });
        request.fail(errore);
        request.done(function (data) {
            console.log(data);
            _txtSearchUser.html("");
            _closeSearchUser.trigger("click");
            creaProfilo(data, "01");
        });
    }

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

            case "01": {
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
                /*btn contact*/$("<a>").addClass("contact-btn").html("Contact Me").on("click", openChat).appendTo(divCardHeader);
            } break;
        }
        $(".profile-card").addClass("show");
        $("body").css("overflow", "hidden");
    }


    function createButton() {
        $("<button>").prop("id", "btnAll").html("All").appendTo(_buttonGroup);
        $("<span>").addClass("border").appendTo(_buttonGroup);
        $("<button>").prop("id", "btnFollowing").html("Following").appendTo(_buttonGroup);
    }

    function createCoursesArea() {
        _divCourseArea.empty();
        let request = inviaRichiesta("post", "/api/coursesArea");
        request.fail(errore);
        request.done(function (data) {
            containerCourse(data, "00");
        })
    }

    function containerCourse(data, type) {
        console.log(data);

        switch (type) {
            case "00":
                _divCourseArea.empty();
                _divCourseArea.css({ "grid-template-columns": "repeat(auto-fit,minmax(200px,1fr))" }); break;
            case "01":
                _divCourseArea.empty();
                _divCourseArea.css({ "grid-template-columns": "repeat(4,minmax(200px,1fr))" }); break;
            case "03":{
                    if (countCourseFollowed == 0) {
                        _divCourseArea.empty();
                        countCourseFollowed++;
                    }
                    _divCourseArea.css({ "grid-template-columns": "repeat(4,minmax(200px,1fr))" }); break;
                }
        }

        for (let item of data) {
            console.log(item);
            let _divCourse = $("<div>").addClass("course").appendTo(_divCourseArea)
            let _divContainer = $("<div>").addClass("box element-item " + item["categoria"]).appendTo(_divCourse);
            $("<img>").addClass("imgCourse").prop("src", "./../imgSocial/courses/" + item["codCorso"] + ".jpg").appendTo(_divContainer);

            let _divDetails = $("<div>").addClass("details").appendTo(_divCourse);
            let _a = $("<a>").on("click", directCourse).prop("nomeCorso", item["nome"]).prop("codCorso", item["codCorso"])
                .addClass("linkCourse").appendTo(_divDetails);
            $("<h4>").appendTo(_a).html(item["nome"].toUpperCase());
            let requestAuthor = inviaRichiesta("post", "/api/nameAuthor", { "codAuthor": item["author"] });
            requestAuthor.fail(errore);
            requestAuthor.done(function (data2) {
                let _spanAuthor = $("<span>").addClass("text-body").html("Autore: " + data2[0]["cognome"] + " " + data2[0]["nome"]).appendTo(_divDetails);
                $("<br>").appendTo(_spanAuthor);
                $("<span>").addClass("text-body").html("Membri iscritti: " + item["nIscritti"]).appendTo(_divDetails);
                $("<br>").appendTo(_divDetails);
                $("<span>").addClass("text-body").html("Likes: " + item["like"]).appendTo(_divDetails);
            })
        }
    }

    function directCourse() {
        let cod = $(this).prop("codCorso");
        let name = $(this).prop("nomeCorso")
        let request = inviaRichiesta("POST", "/api/corso", { "cod": cod, "name": name });
        request.fail(errore);
        request.done(function (data) {
            //console.log(data);
            $(location).prop("href", "./../htmlTemplate/course.html");
        })
    }

    function coursesFollowing() {
        countCourseFollowed=0;
        let request = inviaRichiesta("POST", "/api/userLogged");
        request.fail(errore);
        request.done(function (user) {
            let req = inviaRichiesta("POST", "/api/corsiSeguiti", { "codUtente": user[0]["codUtente"] });
            req.fail(errore);
            req.done(function (data) {
                if(data[0]["corsiJoin"].length==0)
                    _divCourseArea.empty();
                else
                {
                    for (let itm of data[0]["corsiJoin"]) {
                        let r = inviaRichiesta("GET", "/api/getCourseFollowed", { "codCorso": itm });
                        r.fail(errore);
                        r.done(function (corso) {
                            containerCourse(corso, "03");
                        })
                    }
                }
            })
        });
    }

    /*********** FUNCTION CHAT*********************** */

    let usernameUserLogged;
    let socket = null;
    let codUserProfile;
    function openChat() {
        _chatArea.empty();
        $("#myText").empty();
        popup.show();
        let request = inviaRichiesta("POST", "/api/userLogged");
        request.fail(errore);
        request.done(function (data) {
            console.log(data);
            usernameUserLogged = data[0]["username"];
            codUserProfile = data[0]["codUtente"];

            socket = io.connect();
            console.log("socket: " + socket);

            socket.on('connect', function () {
                // 1) invio username
                //socket.emit({"username":usernameUserLogged});
                socket.emit("username", usernameUserLogged);
            });

            socket.on('notify_message', function (data) {
                // ricezione di un messaggio dal server			
                data = JSON.parse(data);
                visualizza(data.from, data.message, data.date, data.id);
            });
            socket.on('disconnect', function () {
                alert("Sei stato disconnesso!");
            });
        })
    }

    // 2) invio mesaggio
    _btnInviaMessage.on("click", function () {
        let msg = $("#myText").val();
        if(msg!="")
            socket.emit("message", { "msg": msg, "id": codUserProfile });
    });

    // 3) disconnessione
    $("#btnCloseChat").click(function () {
        socket.disconnect();
    });

    function visualizza(username, message, date, id) {
        let container = $("<div class='income-msg'></div>");
        container.appendTo(_chatArea);

        // img
        let num = parseInt(id.split('u')[1]);
        if (num < 15)
            $("<img>").prop("src", `./imgSocial/users/${id}.jpg`).addClass("avatar").appendTo(container);
        else
            $("<img>").prop("src", "./imgSocial/users/default.svg").addClass("avatar").appendTo(container);

        // messaggio
        let messaggio = $("<span class='msg'>" + message + "</span>").appendTo(container);

        $("<br>").appendTo(messaggio);

        //ora dell'invio
        date = new Date(date);
        $("<small class='message-from'>" + date.toLocaleTimeString() + "</small>").appendTo(messaggio);


        // auto-scroll dei messaggi
        // la proprietà html scrollHeight rappresenta l'altezza di wrapper oppure
        //  l'altezza del testo interno qualora questo ecceda l'altezza di wrapper 
        let h = _chatArea.prop("scrollHeight");
        // fa scorrere il teso verso l'alto
        _chatArea.animate({ "scrollTop": h }, 500);
    }
    /**************** END FUNCTION CHAT***************************** */

});