import sqlite3

#def stopDb():
 #   dbConnection = sqlite3.connect("database.db")
 #   dbConnection.close()

def registerUser(package):
    email = package.get("email")
    password = package.get("password")
    firstname = package.get("firstname")
    familyname = package.get("familyname")
    gender = package.get("gender")
    city = package.get("city")
    country = package.get("country")

    dbConnection = sqlite3.connect("database.db")
    curs = dbConnection.cursor()
    curs.execute('''INSERT INTO user (email, password, firstname, familyname, gender, city, country)
                 VALUES(?, ?, ?, ?, ?, ?, ?)
                 ''', (email, password, firstname, familyname, gender, city, country))
    
    dbConnection.commit()
    dbConnection.close()

def findUser(email):
    dbConnection = sqlite3.connect("database.db")

    #if(email == None):
     #   email = package.get("email")

    curs = dbConnection.cursor()
    curs.execute('''SELECT * FROM user WHERE email = ?''', (email,))
    fetch = curs.fetchone()
    
    dbConnection.close()
    return fetch


def findTokenByEmail(email):
    dbConnection = sqlite3.connect("database.db")
    curs = dbConnection.cursor()
    curs.execute("SELECT token FROM tokens WHERE email = ?",(email,))
    fetch = curs.fetchone()
    
    dbConnection.close()
    return fetch


def findEmailByToken(token):
    dbConnection = sqlite3.connect("database.db")
    
    curs = dbConnection.cursor()
    curs.execute("SELECT email FROM tokens WHERE token = ?",(token,))
    email = curs.fetchone()[0]

    dbConnection.close()
    return email

def addToken(email, token):
    dbConnection = sqlite3.connect("database.db")
    success = True

    try:
        curs = dbConnection.cursor()
        curs.execute("INSERT INTO tokens (email, token) VALUES (?, ?)", (email, token))
        dbConnection.commit()
    except sqlite3.Error as error:
        success = False
        print(error)
    dbConnection.close()

def deleteToken(token):
    dbConnection = sqlite3.connect("database.db")
    success = True
    
    try:
        curs = dbConnection.cursor()
        curs.execute('''DELETE FROM tokens WHERE token = ?''', (token,))
        dbConnection.commit()
    except sqlite3.Error as error:
        success = False
        print(error)

    dbConnection.close()
    return success

def checkValidToken(token):
    dbConnection = sqlite3.connect("database.db")
    success = None

    curs = dbConnection.cursor()
    curs.execute("SELECT email FROM tokens WHERE token = ?",(token,))
    fetch = curs.fetchone()
    
    if fetch != None:
        success = True
    else: 
        success = False

    dbConnection.close()
    return success


def changePassword(package, token):
    oldPassword = package.get("oldpassword")
    newPassword = package.get("newpassword")
    success = True

    dbConnection = sqlite3.connect("database.db")
    
    curs = dbConnection.cursor()
    curs.execute("SELECT email FROM tokens WHERE token = ?",(token,))
    email = curs.fetchone()[0]

    curs.execute("SELECT password FROM user WHERE email = ?",(email,))
    password = curs.fetchone()[0]

    if(oldPassword == password):
        curs.execute("UPDATE user SET password = ? WHERE email = ?",(newPassword, email))
        dbConnection.commit()
        success = True
    else: 
        success = False    

    dbConnection.close()
    return success


def getUserData(emailBySearch, token):
    dbConnection = sqlite3.connect("database.db")
    curs = dbConnection.cursor()

    curs.execute("SELECT email FROM tokens WHERE token = ?",(token,))
    email = curs.fetchone()[0]

    if emailBySearch == None:
        curs.execute("SELECT email, firstname, familyname, gender, city, country FROM user WHERE email = ?", (email,))

    elif emailBySearch != None:
        curs.execute("SELECT email, firstname, familyname, gender, city, country FROM user WHERE email = ?", (emailBySearch,))

    fetch = curs.fetchone()

    dbConnection.close()
    return fetch

def getMessages(byEmail, token):
    dbConnection = sqlite3.connect("database.db")
    curs = dbConnection.cursor()

    curs.execute("SELECT email FROM tokens WHERE token = ?",(token,))
    email = curs.fetchone()[0]

    if byEmail == None:
        curs.execute("SELECT emailfrom, msg FROM messages WHERE email = ? ORDER BY id DESC", (email,))

    elif byEmail != None:
        curs.execute("SELECT emailfrom, msg FROM messages WHERE email = ? ORDER BY id DESC", (byEmail,))

    fetch = curs.fetchall()

    dbConnection.close()
    return fetch
    
def sendMessage(token, emailTo, message):
    dbConnection = sqlite3.connect("database.db")
    curs = dbConnection.cursor()
    
    curs.execute("SELECT email FROM tokens WHERE token = ?",(token,))
    email = curs.fetchone()[0]
    
    curs.execute("INSERT INTO messages (email, emailfrom, msg) VALUES (?, ?, ?)",(emailTo, email, message))
    
    dbConnection.commit()
    dbConnection.close()