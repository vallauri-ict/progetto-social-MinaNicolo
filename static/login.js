"use strict";

$(document).ready(function () {

    /***** LOGIN *****/
    let _lUsername = $("#lUsername");
    let _lPwd = $("#lPwd");
    let _lblErrore = $("#lblErrore");
    let _close=$(".close");

    _lblErrore.hide();

    _close.on("click",function(){
        _lblErrore.hide();
    })

    $("#btnLogin").on("click", controllaLogin);

    function controllaLogin() {

        _lUsername.css("border","");
        _lPwd.css("border","");     

        if (_lUsername.val() == "") {
            _lUsername.css("border","1px solid red");
        }
        else if (_lPwd.val() == "") {
            _lPwd.css("border","1px solid red");
        }
        else {
            let request = inviaRichiesta("POST", "/api/login",
                {
                    "username": _lUsername.val(),
                    "password": _lPwd.val()
                }
            );
            request.fail(function(jqXHR, test_status, str_error) {
				if (jqXHR.status == 401) {  // unauthorized
					_lblErrore.show();
				} else
					errore(jqXHR, test_status, str_error)
			});
            request.done(function (data) {
                window.location.href = "./htmlTemplate/loading.html";
            })
        }
    }
});