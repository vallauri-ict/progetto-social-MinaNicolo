"use strict";

$(document).ready(function () {

    /***** SIGN UP *****/
    let _sUsername = $("#sUsername");
    let _sSurname = $("#sSurname");
    let _sName = $("#sName");
    let _sEmail = $("#sEmail");
    let _sDob = $("#sDob");
    let _sPwd = $("#sPwd");
    let _close = $(".close");

    let _lblErrore = $("#lblErrore");
    _lblErrore.hide();

    _close.on("click", function () {
        _lblErrore.hide();
    })

    $("#btnSignUp").on("click", controllaSignUp)


    function controllaSignUp() {

        removeBorder();

        let username = _sUsername.val();
        let surname = _sSurname.val();
        let name = _sName.val();
        let mail = _sEmail.val();
        let dob = _sDob.val();
        let password = _sPwd.val();

        let regMail = new RegExp("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$");

        if (name == "")
            _sName.css("border", "1px solid red");
        else if (surname == "")
            _sSurname.css("border", "1px solid red");
        else if (mail == "" || !regMail.test(mail))
            _sEmail.css("border", "1px solid red");
        else if (username == "")
            _sUsername.css("border", "1px solid red");
        else if (dob == "")
            _sDob.css("border", "1px solid red");
        else if (password == "")
            _sPwd.css("border", "1px solid red");
        else {
            let request = inviaRichiesta("POST", "/api/signUp",
                { "username": username });
            request.fail(function (jqXHR, test_status, str_error) {
                if (jqXHR.status == 409) {  // unauthorized
                    _lblErrore.show();
                } else
                    errore(jqXHR, test_status, str_error)
            });
            request.done(function (data) {
                if (data["ris"] == "nus") //no user
                {
                    let request2 = inviaRichiesta("POST", "/api/utenti");
                    request2.fail(errore);
                    request2.done(function (data) {
                        let arrayLength = data.length;
                        let num = parseInt(data[arrayLength - 1]["codUtente"].split("u")[1]) + 1
                        let codUtente = "u" + num;

                        let request3 = inviaRichiesta("POST", "/api/insertUser",
                            {
                                "codUtente": codUtente, "username": username, "surname": surname,
                                "name": name, "mail": mail, "dob": dob, "password": password
                            })

                        request3.fail(errore);
                        request3.done(function (data) {
                            let request4 = inviaRichiesta("POST", "/api/login", {
                                "username": username,
                                "password": password
                            })
                            request4.fail(errore);
                            request4.done(function (data) {
                                window.location.href = "./htmlTemplate/loading.html";
                            })
                        })
                    })
                }
            })
        }
    }

    function removeBorder() {
        _sUsername.css("border", "");
        _sSurname.css("border","");
        _sName.css("border", "");
        _sEmail.css("border", "");
        _sDob.css("border", "");
        _sPwd.css("border", "");
    }
});