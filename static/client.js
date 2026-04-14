
window.onload = function()
{   
    if(!localStorage.getItem("usertoken"))
    {
        document.getElementById("profileView").innerHTML = '';
        document.getElementById("welcomeView").innerHTML = document.getElementById("welcomeScript").innerHTML; 
    }
    else
    {
        document.getElementById("welcomeView").innerHTML = '';
        document.getElementById("profileView").innerHTML = document.getElementById("profileScript").innerHTML;
        
        showUserInfo();
        
        let connection = new WebSocket('ws://0.0.0.0:5000/echo');
        connection.onopen = function()
        {
            console.log(localStorage.getItem("usertoken"))
            connection.send(localStorage.getItem("usertoken"));  
        }
        connection.onmessage = function(m)
        {
            console.log(m);
            
            let data = JSON.parse(m.data);
            if (data["data"] == "logout")
            {
                logout();
            }
        }
    }
}
/*------------------------------------------------------------*/
//prevent default handling of event, meaning we can call our own drop.
//By default in textarea drop is allowed, so we dont need this func
/*function allowDrop(event) 
{
    event.preventDefault();
}*/

function drag(event) 
{
    //target id is the id of the textarea that is being dragged
    event.dataTransfer.setData("text", event.target.id); 
}

function drop(event) 
{
    //event.preventDefault();

    //when drop we get the id sent from the drag function with the help of getData function
    var data = event.dataTransfer.getData("text");
    
    //other text can be dropped, in that case null
    if (data == "messageWall")
    {   
        event.target.value = document.getElementById(data).value;
    }
        
}

/*------------------------------------------------------------*/
function checkPassword(password, repPassword, feedback)
{
    if(password.length < 8)
    {
        feedback.textContent = "Password is less than 8 characters!";
        feedback.style.display = 'block';
        return false;
    }
    if(password != repPassword)
    {
        feedback.textContent = "Password does not match!";
        feedback.style.display = 'block';
        return false;
    }

    return true;
}

function checkFeedback(func, status, message)
{   
    let feedback

    //incase of multiple messages from server with same status code 
    //we will use the message as key.
    switch(func)
    {
        case "login":
            if(status === 200){feedback = "Successfully logged in."}
            else if(status === 400){feedback = "Username or password wrongly formatted."}
            else if(status === 401){feedback = "Username or password is wrong, try again."}
            else{feedback = "Server error."}
            break;

        case "sign up":
            if(status === 201){feedback = "Successfully created user."}
            else if(status === 400 && message == "Form data missing or incorrect type."){feedback = "Sign up wrongly formatted."}
            else if(status === 400 && message == "Wrong email format."){feedback = "Wrong format of email."}
            else if(status === 409){feedback = "The email you have typed in already exists."}
            else{feedback = "Server error."}
            break;

        case "sign out":
            if(status === 200){console.log("Successfully signed out.")}
            else{console.log("Server error.")}
            break;

        case "change password":
            if(status === 200){feedback = "Successfully changed password."}
            else if(status === 400){feedback = "Password wrongly formatted."}
            else if(status === 401 && message== "Wrong password."){feedback = "Old password is incorrect."}
            else{feedback = "Server error."}
            break;

        case "get data token":
            if(status === 200){console.log("Data retrieved successfully.")}
            else if(status === 404){console.log("Data could not be found.")}
            else{console.log("Server error.")}
            break;

        case "get data email":
            if(status === 200){console.log("Data retrieved successfully.")}
            else if(status === 404){feedback = "User does not exist."}
            else{console.log("Server error.")}
            break;

        case "get messages token":
            if(status === 200){console.log("Messages retrieved successfully.")}
            else if(status === 404){console.log("Messages could not be found.")}
            else{console.log("Server error.")}
            break;

        case "get messages email":
            if(status === 200){console.log("Messages retrieved successfully.")}
            else if(status === 404){console.log("Messages could not be found.")}
            else{console.log("Server error.")}
            break;

        case "post messages":
            if(status === 201){console.log("Message sent.")}
            else{console.log("Server error.")}
            break;
    }
    return feedback;
}

function getFeedback(func, xmlhttp, feedback, saveToken)
{
    if(feedback != null)
    {   
        //Waiting for state change so that message is able to show up.
        xmlhttp.onreadystatechange = function() 
        { 
            if(xmlhttp.readyState === 4)
            {   
                //JSON.parse ändrar tillbaka responsen till object
                let message = JSON.parse(xmlhttp.responseText).message;
                let status = xmlhttp.status;

                feedback.textContent = checkFeedback(func, status, message);      
                feedback.style.display = 'block';
                
                //this if statement will only happen when login function gives saveToken as true
                if(JSON.parse(xmlhttp.responseText).success && saveToken)
                {   
                    window.localStorage.setItem("usertoken", JSON.parse(xmlhttp.responseText).data);
                    window.onload();
                }
            }
        };
    }
}

function signUpFunc(event)
{
    event.preventDefault();

    let xmlhttp = new XMLHttpRequest();
    let regPassword = document.getElementById("regPSW").value;
    let regRepeatPassword = document.getElementById("regRepPSW").value;
    let feedback = document.getElementById("signupFeedback");
    
    if(checkPassword(regPassword, regRepeatPassword, feedback))
    {
        let dataObject = 
        {
            email : document.getElementById("sEmail").value,
            password : regPassword,
            firstname : document.getElementById("fiName").value,
            familyname : document.getElementById("faName").value,
            gender : document.getElementById("gender").value,
            city : document.getElementById("city").value,
            country : document.getElementById("country").value
        };

        getFeedback("sign up", xmlhttp, feedback, false);
        xmlhttp.open("POST", "/sign_up", true);
        xmlhttp.setRequestHeader("Content-Type","application/json")
        xmlhttp.send(JSON.stringify(dataObject));
    }
}

function loginFunc(event)
{
    event.preventDefault();

    let xmlhttp = new XMLHttpRequest();

    //try to connect to websocket invoking the route /echo

    let feedback = document.getElementById("loginFeedback");
    
    let dataObject=
    {
        username : document.getElementById("loginEmail").value,
        password : document.getElementById("loginPSW").value
    }
    
    

    getFeedback("login", xmlhttp, feedback, true);
    
    //initialize request to server
    xmlhttp.open("POST", "/sign_in", true);
    //att server ska förväntas få content som är typen json
    xmlhttp.setRequestHeader("Content-Type","application/json")
    xmlhttp.send(JSON.stringify(dataObject));

    
}

function logout()
{
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() 
    {
        if(xmlhttp.readyState === 4)
        {   
            checkFeedback("sign out", xmlhttp.status, "");

            if(JSON.parse(xmlhttp.responseText).success)
            {   
                window.localStorage.removeItem("usertoken");
            }
            window.onload();
        }
    };
    xmlhttp.open('DELETE', "/sign_out", true);
    //Authorization method to send token to server
    xmlhttp.setRequestHeader('Authorization', window.localStorage.getItem("usertoken"));
    xmlhttp.send();
}

function changePassword(event)
{
    event.preventDefault();

    let xmlhttp = new XMLHttpRequest();
    let repNewPassword = document.getElementById("repNewPassword").value;
    let feedback = document.getElementById("changePswFeedback");
    
    let dataObject =
    {
        oldpassword : document.getElementById("oldPassword").value,
        newpassword : document.getElementById("newPassword").value
    }
    
    if (dataObject.oldpassword != dataObject.newpassword)
    {
        if(checkPassword(dataObject.newpassword, repNewPassword, feedback))
        {
            getFeedback("change password", xmlhttp,feedback, false);
            xmlhttp.open("PUT", "/change_password", true);
            //skicka token via header
            xmlhttp.setRequestHeader('Authorization', window.localStorage.getItem("usertoken"));
            xmlhttp.setRequestHeader("Content-Type","application/json")
            xmlhttp.send(JSON.stringify(dataObject));
        }
    }
    else
    {
        feedback.textContent = "New password should not be the same as old password";
        feedback.style.display = 'block';
    }
}
function showUserInfo()
{
    let xmlhttp = new XMLHttpRequest();
    
    xmlhttp.onreadystatechange =function()
    {   
        if(xmlhttp.readyState === 4)
        {
            checkFeedback("get data token", xmlhttp.status, "");
            if(xmlhttp.status === 200)
            {
                let showUser = JSON.parse(xmlhttp.response);

                document.getElementById("userProfile").innerHTML = 
                "Email: " + showUser.data[0] + "<br/>" +
                "First Name: "+ showUser.data[1] + "<br/>" +
                "Family Name: "+ showUser.data[2] + "<br/>" +
                "Gender: "+ showUser.data[3] + "<br/>" +
                "City: "+ showUser.data[4] + "<br/>" +
                "Country: "+ showUser.data[5];
            }
        }
        
    }

    xmlhttp.open("GET", "/get_user_data_by_token", true);
    xmlhttp.setRequestHeader('Authorization', window.localStorage.getItem("usertoken"));
    xmlhttp.send();
    loadMessageWall("messageWall");
}

function sendMessage(option)
{
    let xmlhttp = new XMLHttpRequest();
    let email = document.getElementById("searchEmail").value;
    let box;
    let wall;
    let feed;

    
    if (option == "home")
    {   
        box = "messageBox";
        wall = "messageWall";
        feed = "homeFeedback";
        email = "home"
    }
    else if(option == "browse")
    {   
        box = "messageBoxOther"
        wall = "messageWallOther"
        feed = "browseFeedback";
        
    }
    let token = window.localStorage.getItem("usertoken");
    let feedback = document.getElementById(feed);
    let dataObject =
    {
        email,
        message : document.getElementById(box).value,
    }
    console.log(dataObject);
    
    if(dataObject.message != '')
    {
        xmlhttp.onreadystatechange =function()
        {
            if(xmlhttp.readyState === 4)
            {
                checkFeedback("post messages", xmlhttp.status, "");

                if(xmlhttp.status === 201)
                {
                    document.getElementById(box).value = '';
                    loadMessageWall(wall);
                    feedback.textContent = "";
                }
            }
            
        };
        xmlhttp.open("POST", "/post_message", true);
        xmlhttp.setRequestHeader("Authorization",token)
        xmlhttp.setRequestHeader("Content-Type","application/json")
        xmlhttp.send(JSON.stringify(dataObject));
    }
    else
    {
        feedback.textContent = "Can't send empty message";
    }

}
function loadMessageWall(where)
{
    let xmlhttp = new XMLHttpRequest();
    let searchEmail = document.getElementById("searchEmail").value;

    document.getElementById(where).value = '';

    xmlhttp.onreadystatechange =function()
    {   
        if(xmlhttp.readyState === 4)
        {
            if(where == "messageWall"){checkFeedback("get messages token", xmlhttp.status, "");}
            else if(where == "messageWallOther"){checkFeedback("get messages email", xmlhttp.status, "");}

            let messageArray = JSON.parse(xmlhttp.response).data;
            let success = JSON.parse(xmlhttp.response).success;
        
            if (success)
            {
                for(let i = 0; i < messageArray.length; i ++)
                {
                    document.getElementById(where).value += messageArray[i][0] +": " + messageArray[i][1] + "\n";
                }
            }
            else
            {
                document.getElementById("browseInfo").style.display = 'none';
            }        
        }
    };

    if(where == "messageWall")
    {
        xmlhttp.open("GET", "/get_user_messages_by_token", true);
    }
    else if(where == "messageWallOther")
    {
        xmlhttp.open("GET", "/get_user_messages_by_email/"+searchEmail, true);
    }    
    xmlhttp.setRequestHeader('Authorization', window.localStorage.getItem("usertoken"));
    xmlhttp.send();
}

/*---------------------------BROWSE------------------------------------*/
function searchUser(event)
{
    event.preventDefault();
    let xmlhttp = new XMLHttpRequest();

    let feedback = document.getElementById("searchFeedback");
    let token = localStorage.getItem("usertoken");
    let searchEmail = document.getElementById("searchEmail").value;

    xmlhttp.onreadystatechange =function()
    {
        if(xmlhttp.readyState === 4)
        {
            let feed = checkFeedback("get data email", xmlhttp.status, "");

            let foundUser = JSON.parse(xmlhttp.response);
                    
            if(foundUser.success)
            {
                document.getElementById("browseInfo").style.display = 'block';
                        
                document.getElementById("userProfileOther").innerHTML = 
                "Email: " + foundUser.data[0] + "<br/>" +
                "First Name: "+ foundUser.data[1] + "<br/>" +
                "Family Name: "+ foundUser.data[2] + "<br/>" +
                "Gender: "+ foundUser.data[3] + "<br/>" +
                "City: "+ foundUser.data[4] + "<br/>" +
                "Country: "+ foundUser.data[5];
        
                feedback.textContent = '';
                        
            }
            else
            {
                feedback.textContent = feed;
                document.getElementById("userProfileOther").innerHTML = ''
            }
            feedback.style.display = 'block'
        }
        
        
    }
    xmlhttp.open("GET", "/get_user_data_by_email/"+searchEmail, true);
    xmlhttp.setRequestHeader('Authorization', token);
    xmlhttp.send();

    loadMessageWall("messageWallOther");
}

/*------------------profile view buttons--------------*/
function toHome()
{
    let hbutton = document.getElementById("homeButton").style;
    hbutton.backgroundColor = 'dodgerblue';
    hbutton.borderColor = 'dodgerblue';
    hbutton.color = 'white';

    let bbutton = document.getElementById("browseButton").style;
    bbutton.backgroundColor = 'white';
    bbutton.borderColor = 'white';
    bbutton.color = 'black';

    let abutton = document.getElementById("accountButton").style;
    abutton.backgroundColor = 'white';
    abutton.borderColor = 'white';
    abutton.color = 'black';

    document.getElementById("homeView").style.display = 'block';
    document.getElementById("browseView").style.display = 'none';
    document.getElementById("accountView").style.display = 'none';
}
function toBrowse()
{
    let hbutton = document.getElementById("homeButton").style;
    hbutton.backgroundColor = 'white';
    hbutton.borderColor = 'white';
    hbutton.color = 'black';

    let bbutton = document.getElementById("browseButton").style;
    bbutton.backgroundColor = 'dodgerblue';
    bbutton.borderColor = 'dodgerblue';
    bbutton.color = 'white';

    let abutton = document.getElementById("accountButton").style;
    abutton.backgroundColor = 'white';
    abutton.borderColor = 'white';
    abutton.color = 'black';

    document.getElementById("homeView").style.display = 'none';
    document.getElementById("browseView").style.display = 'block';
    document.getElementById("accountView").style.display = 'none';
}
function toAccount()
{
    let hbutton = document.getElementById("homeButton").style;
    hbutton.backgroundColor = 'white';
    hbutton.borderColor = 'white';
    hbutton.color = 'black';

    let bbutton = document.getElementById("browseButton").style;
    bbutton.backgroundColor = 'white';
    bbutton.borderColor = 'white';
    bbutton.color = 'black';

    let abutton = document.getElementById("accountButton").style;
    abutton.backgroundColor = 'dodgerblue';
    abutton.borderColor = 'dodgerblue';
    abutton.color = 'white';

    document.getElementById("homeView").style.display = 'none';
    document.getElementById("browseView").style.display = 'none';
    document.getElementById("accountView").style.display = 'block';
}