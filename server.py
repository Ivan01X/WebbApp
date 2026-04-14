from flask import Flask, request, render_template, jsonify
from flask_sock import Sock
import database_helper as dbH
import json
import math
import random
import re

# source specified_directory/bin/activate
# flask --app server run

wsDict ={}

app = Flask(__name__)
sockets = Sock(app)


@sockets.route('/echo')
def echo(ws):
    while True:
        token = ws.receive()
        email = dbH.findEmailByToken(token)
        print(token, email)
        if email:
            wsDict[email] = ws
            

@app.route("/", methods=['GET'])
def startPage():
    return render_template('client.html')   



@app.route("/sign_up", methods =['POST'])
def sign_up():
    requestData = request.get_json()

    if request.method != 'POST':
        return jsonify({"success": False, "message": "Method not allowed."}), 405

    #Check if every input is a string
    if(not (isinstance(requestData['email'], str) and
        isinstance(requestData['password'], str) and
        isinstance(requestData['firstname'], str) and
        isinstance(requestData['familyname'], str) and
        isinstance(requestData['gender'], str) and
        isinstance(requestData['city'], str) and
        isinstance(requestData['country'], str))):

        return jsonify({"success": False, "message": "Form data missing or incorrect type."}), 400

    userExists = dbH.findUser(requestData['email'])
    #Check if email does NOT exist to create a user.
    if not userExists:
        emailPattern = r"^[a-zA-Z0-9.-_]+@[a-zA-Z0-9.-_]+\.[a-zA-Z]"
        if re.match(emailPattern, requestData['email']):
            dbH.registerUser(requestData)
            return jsonify({"success": True, "message": "Successfully created a new user."}), 201
        else:
            return jsonify({"success": False, "message": "Wrong email format."}), 400
    elif userExists:
        return jsonify({"success": False, "message": "User already exists."}), 409
    
    return jsonify({"success": False, "message": "Internal Server Error."}), 500




@app.route("/sign_in", methods =['POST'])
def sign_in():
    requestData = request.get_json()
    user = dbH.findUser(requestData['username'])
    
    if (not isinstance(requestData['username'], str)) or (not isinstance(requestData['password'], str)):
        return jsonify({"success": False, "message": "Bad request."}), 400
    
    if request.method != 'POST':
        return jsonify({"success": False, "message": "Method not allowed."}), 405

    if (user != None) and (user[1] == requestData['password']):
        letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
        token = ""
        for i in range(36):
            token += letters[math.floor(random.random() * len(letters))]
        
        # check if user in wsDict, meaning logged in already
        # logout if already logged in
        if len(wsDict) != 0:

            old_ws = wsDict.get(requestData['username'])
            print (wsDict)
            print("USER ALREADY LOGGED IN, SENDING LOGOUT")
            jdata = {"data": "logout"}
            old_ws.send(json.dumps(jdata))

        #wait for other browser to logout so that new browser can be logged in
        while dbH.findTokenByEmail(requestData['username']) != None:
          pass

        dbH.addToken(requestData['username'], token)
        return jsonify({"success": True, "message": "Successfully signed in.", "data": token}), 200
    
    elif (user == None) or (user[1] != requestData['password']):
        return jsonify({"success": False, "message": "Wrong username or password."}), 401
    
    return jsonify({"success": False, "message": "Internal Server Error."}), 500
    

@app.route("/sign_out", methods =['DELETE'])
def sign_out():
    token = request.headers.get('Authorization')

    if not request:
        return jsonify({"success": False, "message": "Bad request."}), 400

    if not dbH.checkValidToken(token):
        return jsonify({"success": False, "message": "Incorrect token."}), 401
    
    if request.method != 'DELETE':
        return jsonify({"success": False, "message": "Method not allowed."}), 405
    
    wsDict.pop(dbH.findEmailByToken(token))

    if dbH.deleteToken(token):
        return jsonify({"success": True, "message": "Successfully signed out."}), 200
    
    return jsonify({"success": False, "message": "Internal Server Error."}), 500


@app.route("/change_password", methods =['PUT'])
def change_password():
    token = request.headers.get('Authorization')
    requestData = request.get_json()

    #check if requestData is valid.
    if not isinstance(requestData, dict) or requestData == None or requestData['oldpassword'] == None or requestData['newpassword'] == None:
        return jsonify({"success": False, "message": "Data error."}), 400

    if request.method != 'PUT':
        return jsonify({"success": False, "message": "Method not allowed."}), 405
    
    if not dbH.checkValidToken(token):
        return jsonify({"success": False, "message": "Incorrect token."}), 401

    pswChanged = dbH.changePassword(requestData, token)
    if pswChanged:
        return jsonify({"success": True, "message": "Password changed."}), 200
    elif not pswChanged:
        return jsonify({"success": False, "message": "Wrong password."}), 401
    
    return jsonify({"success": False, "message": "Internal Server Error."}), 500


@app.route("/get_user_data_by_token", methods =['GET'])
def get_user_data_by_token():
    token = request.headers.get('Authorization')

    if request.method != 'GET':
        return jsonify({"success": False, "message": "Method not allowed."}), 405

    validToken = dbH.checkValidToken(token)
    if validToken:
        data = dbH.getUserData(None, token)
        
        if data != None:
            return jsonify({"success": True, "message": "Data retrived.", "data": data}), 200
        else:
            return jsonify({"success": False, "message": "User data not found, email incorrect."}), 404
    elif not validToken:
        return jsonify({"success": False, "message": "Incorrect token."}), 401
    
    return jsonify({"success": False, "message": "Internal Server Error."}), 500

    
    

@app.route("/get_user_data_by_email/<searchEmail>", methods =['GET'])
def get_user_data_by_email(searchEmail):
    token = request.headers.get('Authorization')
    
    if request.method != 'GET':
        return jsonify({"success": False, "message": "Method not allowed."}), 405
    
    validToken = dbH.checkValidToken(token)
    if validToken:
        data = dbH.getUserData(searchEmail, token)
        
        if data != None:
            return jsonify({"success": True, "message": "Data retrived.", "data": data}), 200
        else:
            return jsonify({"success": False, "message": "User data not found, email incorrect."}), 404
    elif not validToken:
        return jsonify({"success": False, "message": "Incorrect token."}), 401
    
    return jsonify({"success": False, "message": "Internal Server Error."}), 500


@app.route("/get_user_messages_by_token", methods =['GET'])
def get_user_messages_by_token():
    token = request.headers.get('Authorization')

    if request.method != 'GET':
        return jsonify({"success": False, "message": "Method not allowed."}), 405

    validToken = dbH.checkValidToken(token)
    if validToken:
        data = dbH.getMessages(None, token)

        if data != None:
            return jsonify({"success": True, "message": "Messages retrived.", "data": data}), 200
        else:
            return jsonify({"success": False, "message": "Messages not found, email incorrect."}), 404
    elif not validToken:
        return jsonify({"success": False, "message": "Incorrect token."}), 401
    
    return jsonify({"success": False, "message": "Internal Server Error."}), 500


@app.route("/get_user_messages_by_email/<searchEmail>", methods =['GET'])
def get_user_messages_by_email(searchEmail):
    token = request.headers.get('Authorization')
    
    if request.method != 'GET':
        return jsonify({"success": False, "message": "Method not allowed."}), 405

    if not dbH.findUser(searchEmail):
        return jsonify({"success": False, "message": "email not found."}), 404
    
    validToken = dbH.checkValidToken(token)
    if validToken:
        data = dbH.getMessages(searchEmail, token)
        
        if data != None:
            return jsonify({"success": True, "message": "Messages retrived.", "data": data}), 200
        else:
            return jsonify({"success": False, "message": "Messages not found, email incorrect."}), 404
    elif not validToken:
        return jsonify({"success": False, "message": "Incorrect token."}), 401
    
    return jsonify({"success": False, "message": "Internal Server Error."}), 500


@app.route("/post_message", methods =['POST'])
def post_message():
    requestData = request.get_json()
    token = request.headers.get('Authorization')
    emailTo = requestData['email']
    message = requestData['message']
    
    if request.method != 'POST':
        return jsonify({"success": False, "message": "Method not allowed."}), 405

    if(emailTo == "home"):
        emailTo = dbH.findEmailByToken(token)
    
    if emailTo == None:
        return jsonify({"success": False, "message": "invalid email."}), 400

    if not dbH.findUser(emailTo):
        return jsonify({"success": False, "message": "email not found."}), 404
    
    if(message != None):
        if dbH.checkValidToken(token):
            dbH.sendMessage(token, emailTo, message)
            return jsonify({"success": True, "message": "Message sent."}), 201
        else:
            return jsonify({"success": False, "message": "Incorrect token."}), 401
    elif message == None:
        return jsonify({"success": False, "message": "Message is empty."}), 400
    
    return jsonify({"success": False, "message": "Internal Server Error."}), 500

