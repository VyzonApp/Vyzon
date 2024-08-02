window.onload = function () {
    if (localStorage.getItem("username") == null) {
        document.getElementById("loginNotice").show();
    } else {
        document.querySelector(".openinfo").style.display = "none";
    }
}

CurrentList = 0;

function getTasks(list) {
    document.querySelector(".loader").style.display = "initial";
    var tasksPromise = apiRequest("tasks/get?list=" + list, "GET", false);
    tasksPromise.then(function(tasks) {
        document.querySelector(".loader").style.display = "none";
        document.getElementById("taskholder").innerHTML = "";
        if (tasks != undefined) {
            Object.keys(tasks).forEach(element => {
                if (element != "name") {
                    createTaskElem(tasks[element]["name"], tasks[element]["description"], tasks[element]["label"], tasks[element]["labelicon"], element);
                }
            })
        } else {
            document.querySelector(".notasks").style.display = "block";
        }
    })
}

function getSettings() {
    var settingsPromise = apiRequest("settings/get", "GET", false);
    settingsPromise.then(function(settings) {
        Inter = 0;
        Object.keys(settings).forEach(element => {
            if (settings[element] == 1) {
                var newstate = true;
            } else {
                var newstate = false;
            }
            document.getElementById("setting" + element).selected = newstate;
            setSettingClient(element, newstate)
        })
    })
}
function getLists() {
    Array.from(document.getElementById("listselect").children).forEach(function (element) {
        if (element.value != "new" && element.value != "del" && element.value != "0") {
            element.remove();
        }
    })
    Array.from(document.getElementById("dellistselectfield").children).forEach(function (element) {
        if (element.disabled != true) {
            element.remove();
        }
    })
    var listsPromise = apiRequest("lists/get", "GET", false);
    listsPromise.then(function(lists) {
        if (lists != undefined) {
            Object.keys(lists).forEach(element => {
                createListElem(lists[element]["name"], element)
            })
            Lists = lists;
            document.getElementById("dellist").disabled = false;
        } else {
            document.getElementById("dellist").disabled = true;
        }
    })
}

window.addEventListener("load", function () {
    getTasks(0);
    getLists();
    getSettings();
});

function addNewTask() {
    if (document.getElementById('tasklabelfield').value == "") {
        var labelicon = "";
    } else {
        var labelicon = document.getElementById('selectoricon').textContent;
    }
    apiRequest("tasks/add?list=" + CurrentList, "POST", true, JSON.stringify({
        "name": document.getElementById("tasknamefield").value,
        "desc": document.getElementById("taskdescfield").value,
        "labelicon": labelicon,
        "label": document.getElementById("tasklabelfield").value
    }))
    createTaskElem(document.getElementById("tasknamefield").value, document.getElementById("taskdescfield").value, document.getElementById("tasklabelfield").value, labelicon);
    event.target.parentElement.close();
    document.getElementById("addTaskForm").reset();
}

function createTaskElem(name, description, labelt, labelicont, taskid) {
    document.querySelector(".notasks").style.display = "none";
    var elem = document.createElement("div");
    var box = document.createElement("md-radio");
    var label = document.createElement("span");
    var desc = document.createElement("span");
    var labelicon = document.createElement("md-icon");
    var labeltext = document.createElement("span");

    elem.id = taskid;

    label.textContent = name;
    desc.textContent = description;
    labeltext.textContent = labelt; 
    labelicon.textContent = labelicont;

    elem.classList.add("task");
    label.classList.add("tlabel");
    desc.classList.add("descript");
    labeltext.classList.add("label");

    elem.appendChild(label);
    label.prepend(box);
    elem.appendChild(desc);
    labeltext.prepend(labelicon);
    elem.appendChild(labeltext);

    box.onclick = function () { completeTask(box.parentElement.parentElement.id); }

    document.getElementById("taskholder").appendChild(elem);

    if (description == "") {
        desc.remove();
    }
}

function createListElem(listname, listid) {
    var listelem = document.getElementById("newlist");
    var parent = document.getElementById("listselect");
    var elem = document.createElement("md-select-option");
    elem.value = listid;
    var head = document.createElement("div");
    head.slot = "headline";
    head.textContent = listname;
    elem.appendChild(head);
    parent.insertBefore(elem, listelem);
}

function completeTask(id) {
    setTimeout(function () {
        document.getElementById(id).remove();
        apiRequest("tasks/complete?list=" + CurrentList, "DELETE", false, id);
        if (!document.querySelector(".task")) {
            document.querySelector(".notasks").style.display = "block";
        }
    },200)
}

function listSwitch() {
    if (event.target.value == "new") {
        event.target.value = CurrentList.toString();
        document.getElementById("addList").show();
    } else if (event.target.value == "del") {
        Array.from(document.getElementById("dellistselectfield").children).forEach(function (element) {
            if (element.disabled != true) {
                element.remove();
            }
        })
        Object.keys(Lists).forEach(function (element) {
            event.target.value = CurrentList.toString();
            var parent = document.getElementById("dellistselectfield");
            var elem = document.createElement("md-select-option");
            elem.value = element;
            var head = document.createElement("div");
            head.slot = "headline";
            head.textContent = Lists[element]["name"];
            elem.appendChild(head);
            parent.appendChild(elem);
            document.getElementById("delList").show();
        })
    } else {
        CurrentList = event.target.value;
        getTasks(CurrentList);
    }
}

function addNewList() {
    apiRequest("lists/create", "POST", true, JSON.stringify({
        "name": document.getElementById("listnamefield").value
    })).then(function () {
        getLists();
    })
    event.target.parentElement.close();
    document.getElementById("addListForm").reset();
}

function deleteList() {
    apiRequest("lists/delete", "POST", true, document.getElementById("dellistselectfield").value);
    event.target.parentElement.close();
    getLists();
    if (CurrentList = document.getElementById("dellistselectfield").value) {
        CurrentList = 0;
        document.getElementById("listselect").value = "0";
        getTasks(CurrentList);
    }
    document.getElementById("delListForm").reset();
}
document.getElementById("usernameacc").textContent = localStorage.getItem("username");

function iconSelect() {
    document.getElementById('addTask').close();
    document.getElementById('iconSelect').show();
}
document.getElementById('iconSelect').onclose = function () {
    document.getElementById('addTask').show();
}
function returnIcon() {
    document.getElementById('selectoricon').textContent = event.target.textContent;
    document.getElementById('iconSelect').close();
}

// Social
function generateFriendElem(type, name) {
    if (type == 0) {
        var base = document.createElement("div");
        var icon = document.createElement("md-icon");
        var username = document.createElement("span");
        var button1 = document.createElement("md-filled-icon-button");
        var button2 = document.createElement("md-outlined-icon-button");
        var b1i = document.createElement("md-icon");
        var b2i = document.createElement("md-icon");

        base.classList.add("request");
        username.classList.add("rname");

        button1.onclick = function () { acceptRequest() };
        button2.onclick = function () { declineRequest() };

        icon.textContent = "move_to_inbox"
        username.textContent = name;
        b1i.textContent = "check";
        b2i.textContent = "close";

        base.appendChild(icon);
        base.appendChild(username);
        button1.appendChild(b1i);
        button2.appendChild(b2i);
        base.appendChild(button1);
        base.appendChild(button2);
        document.getElementById("finc").appendChild(base);
    } else if (type == 1) {
        var base = document.createElement("div");
        var icon = document.createElement("md-icon");
        var username = document.createElement("span");
        var button = document.createElement("md-icon-button");
        var bi = document.createElement("md-icon");

        base.classList.add("request");
        username.classList.add("rname");

        button.onclick = function () { cancelRequest() };

        icon.textContent = "outbox"
        username.textContent = name;
        bi.textContent = "close";

        base.appendChild(icon);
        base.appendChild(username);
        button.appendChild(bi);
        base.appendChild(button);
        document.getElementById("fout").appendChild(base);
    } else if (type == 2) {
        var base = document.createElement("div");
        var username = document.createElement("span");
        var button = document.createElement("md-icon-button");
        var bi = document.createElement("md-icon");

        base.classList.add("friend");
        username.classList.add("rname");

        button.onclick = function () { removeFriend() }

        username.textContent = name;
        bi.textContent = "delete";

        base.appendChild(username);
        button.appendChild(bi);
        base.appendChild(button);
        document.getElementById("friendRows").appendChild(base);
    }
}
function removeFriend() {
    EvTarget = event.target;
    console.log(EvTarget.parentElement.firstChild.textContent)
    var friendsPromise = apiRequest("friends/remove", "POST", false, JSON.stringify({
        "name": EvTarget.parentElement.firstChild.textContent
    }), true);
    friendsPromise.then(function(result) {
        if (result["status"] == 200) {
            EvTarget.parentElement.remove();
        }
    })
    addRoasts()
}
LoadedFriends = false;
function friendListOpen(flo) {
    Famount = 0;
    if (flo != true) {
        document.getElementById("friendList").show();
    }
    if (LoadedFriends == false) {
        LoadedFriends = true;
        var friendsPromise = apiRequest("friends/get", "GET", false);
        friendsPromise.then(function(result) {
            document.getElementById("cpf1").remove();
            document.getElementById("cpf2").remove();
            if (result != null) {
                var resultparsed = result;
            } else {
                var resultparsed = {};
            }
            if (resultparsed["requestsin"] == undefined && resultparsed["requestsout"] == undefined) {
                document.getElementById("roast1").textContent = "You have no requests."
            } else {
                if (resultparsed["requestsin"] != undefined) {
                    Object.keys(resultparsed["requestsin"]).forEach(function (item) {
                        generateFriendElem(0, item)
                        Famount = Famount + 1;
                        displayFbadge();
                    })
                }
                if (resultparsed["requestsout"] != undefined) {
                    Object.keys(resultparsed["requestsout"]).forEach(function (item) {
                        generateFriendElem(1, item)
                    })
                }
            }
            if (resultparsed["friends"] == undefined) {
                document.getElementById("roast2").textContent = "You have no friends."
            } else {
                if (resultparsed["friends"] != undefined) {
                    FriendArray = Object.keys(resultparsed["friends"])
                    Object.keys(resultparsed["friends"]).forEach(function (item) {
                        generateFriendElem(2, item)
                    })
                } else {
                    FriendArray = []
                }
                FriendArray.forEach(element => {
                    var mdso = document.createElement("md-select-option");
                    mdso.textContent = element;
                    mdso.value = element;
                    document.getElementById("ctaskAgainst").appendChild(mdso);
                });
            }
        })
    }
    addRoasts()
}
friendListOpen(true)
function displayFbadge() {
    if (Famount == 0) {
        document.getElementById("friendRequests").style.display = "none";
    } else {
        document.getElementById("friendRequests").style.display = "flex";
    }
    document.getElementById("friendRequests").textContent = Famount;
}
function addFriend() {
    document.getElementById("friendaddbtn").disabled = true;
    document.getElementById("addfriendfield").disabled = true;
    var friendsPromise = apiRequest("friends/send", "POST", false, JSON.stringify({
        "name": document.getElementById("addfriendfield").value
    }), true);
    friendsPromise.then(function(result) {
        if (result["status"] == 200) {
            generateFriendElem(1, document.getElementById("addfriendfield").value);
            document.getElementById("addfriendfield").value = "";
            document.getElementById("roast1").textContent = "";
            document.getElementById("ferror").textContent = ""
        } else {
            document.getElementById("addfriendfield").value = "";
            document.getElementById("ferror").textContent = "Error " + result["status"]
            switch (result["status"]) {
                case 400: document.getElementById("ferror").textContent = "You can't add yourself."
                    break;
                case 404: document.getElementById("ferror").textContent = "That user is not real."
                    break;
                case 409: document.getElementById("ferror").textContent = "That user is already added."
                    break;
                case 403: document.getElementById("ferror").textContent = "You've already sent a friend request to this user."
                    break;
                case 423: document.getElementById("ferror").textContent = "This user has requests disabled."
                    break;
                default: document.getElementById("ferror").textContent = "Unknown error."
            }
        }
        document.getElementById("friendaddbtn").disabled = false;
        document.getElementById("addfriendfield").disabled = false;
    })
}
function acceptRequest() {
    EvTarget = event.target;
    console.log(EvTarget.parentElement.firstChild.nextSibling.textContent)
    var friendsPromise = apiRequest("friends/accept", "POST", false, JSON.stringify({
        "name": EvTarget.parentElement.firstChild.nextSibling.textContent
    }), true);
    friendsPromise.then(function(result) {
        if (result["status"] == 200) {
            generateFriendElem(2, EvTarget.parentElement.firstChild.nextSibling.textContent);
            EvTarget.parentElement.remove();
            addRoasts()
        }
    })
    document.getElementById("friendRequests").textContent = new Number(document.getElementById("friendRequests").textContent) - 1;
    displayFbadge();
}
function declineRequest() {
    EvTarget = event.target;
    console.log(EvTarget.parentElement.firstChild.nextSibling.textContent)
    var friendsPromise = apiRequest("friends/decline", "POST", false, JSON.stringify({
        "name": EvTarget.parentElement.firstChild.nextSibling.textContent
    }), true);
    friendsPromise.then(function(result) {
        if (result["status"] == 200) {
            EvTarget.parentElement.remove();
            addRoasts()
        }
    })
    document.getElementById("friendRequests").textContent = new Number(document.getElementById("friendRequests").textContent) - 1;
    displayFbadge();
}
function cancelRequest() {
    EvTarget = event.target;
    console.log(EvTarget.parentElement.firstChild.nextSibling.textContent)
    var friendsPromise = apiRequest("friends/cancel", "POST", false, JSON.stringify({
        "name": EvTarget.parentElement.firstChild.nextSibling.textContent
    }), true);
    friendsPromise.then(function(result) {
        if (result["status"] == 200) {
            EvTarget.parentElement.remove();
            addRoasts()
        }
    })
}

function addRoasts() {
    if (document.getElementById("finc").innerHTML == "" && document.getElementById("fout").innerHTML == "") {
        document.getElementById("roast1").textContent = "You have no requests.";
    } else {
        document.getElementById("roast1").textContent = "";
    }
    if (document.getElementById("friendRows").innerHTML == "") {
        document.getElementById("roast2").textContent = "You have no friends.";
    } else {
        document.getElementById("roast2").textContent = "";
    }
}

function setSetting(setting, state) {
    if (state == true) {
        nstate = 1;
    } else {
        nstate = 0;
    }
    apiRequest("settings/set", "POST", true, JSON.stringify({
        "setting": setting,
        "state": nstate
    }));
    setSettingClient(setting, state);
}
function setSettingClient(setting, state) {
    console.log(setting, state)
    if (setting == 0) {
        if (state == true) {
            document.getElementById("lmodestyle").media = "max-width: 1px";
            document.getElementById("dmodestyle").media = "";
        } else if (state == false) {
            document.getElementById("dmodestyle").media = "max-width: 1px";
            document.getElementById("lmodestyle").media = "";
        }
    }
    if (setting == 2) {
        if (state == true) {
            document.getElementById("feedbtn").style.display = "initial";
        } if (state == false) {
            document.getElementById("feedbtn").style.display = "none";
        }
    }
}

// Competition
function setCompetitionStatus(name, user2, status1, status2, total) {
    document.getElementById("cname").textContent = name;
    document.getElementById("user2name").textContent = user2;

    var percent1 = (status1 / total);
    var percent2 = (status2 / total);

    document.getElementById("bar1").value = percent1;
    document.getElementById("bar2").value = percent2;

    document.getElementById("competition").style.display = "flex";
    setTimeout(function () {
        if (status1 == total) {
            document.getElementById("win").style.display = "flex";
            var winner = "You";
        } else if (status2 == total) {
            document.getElementById("lose").style.display = "flex";
            var winner = user2;
        }
        setTimeout(function () {
            if (status1 == total || status2 == total) {
                document.getElementById("cstats").style.display = "none";
                document.getElementById("win").style.display = "none";
                document.getElementById("lose").style.display = "none";
                document.getElementById("creveal").style.display = "flex";
                document.getElementById("winneruser").textContent = winner;
            }
        },5000)
    },1000)
}

function readyCompetition() {
    friendListOpen(true);
    document.getElementById("startCompetition").show();
}
function competitionFriendCallback(opens) {
    document.getElementById("ctaskAgainst").innerHTML = "";
    FriendArray.forEach(function (friend) {
        var soption = document.createElement("md-select-option");
        soption.value = friend;
        soption.innerHTML = friend;
        document.getElementById("ctaskAgainst").appendChild(soption);
    })
    if (!opens) {
        document.getElementById("friendList").close();
        document.getElementById("startCompetitionForm").reset();
        document.getElementById("startCompetition").show();
    }
}
function sendCompetitionRequest() {
    
}

// Feedback
function sendFeedback() {
    if (document.getElementById("fEmail").value == "") {
        apiRequest("feedback/send", "POST", true, JSON.stringify({
            "type": document.getElementById("fType").value,
            "title": document.getElementById("fTitle").value,
            "text": document.getElementById("fText").value,
        }));
    } else {
        apiRequest("feedback/send", "POST", true, JSON.stringify({
            "type": document.getElementById("fType").value,
            "email": document.getElementById("fEmail").value,
            "title": document.getElementById("fTitle").value,
            "text": document.getElementById("fText").value,
        }));
    }
    document.getElementById("sendFeedbackForm").reset();
    document.getElementById("sendFeedback").close();
    document.getElementById("sendFeedbackConfirm").show();
}
function feedbackEmail() {
    if (event.target.value == 'support') {
        document.getElementById('fEmail').required = true;
    } else {
        document.getElementById('fEmail').required = false;
    }
}

// API
function apiRequest(endpoint, type, async, send, withstatus) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(type, "https://api.vyzon.app/" + endpoint, async);
        xhr.setRequestHeader("Username", localStorage.getItem("username"));
        xhr.setRequestHeader("Password", localStorage.getItem("password"));
        xhr.onload = function () {
            if (withstatus) {
                try {
                    resolve({
                        "data": JSON.parse(xhr.response),
                        "status": xhr.status
                    });
                } catch {
                    resolve({
                        "data": xhr.response,
                        "status": xhr.status
                    });
                }
            } else {
                try {
                    resolve(JSON.parse(xhr.response))
                } catch {
                    resolve(xhr.response);
                }
            }
        }
        xhr.onerror = function () {
            reject(new Error(`Client error.`));
        }
        xhr.send(send);
    })
}

const anchorEl = document.body.querySelector('#menu-anchor');
const menuEl = document.body.querySelector('#menu-menu');
anchorEl.addEventListener('click', () => { menuEl.open = !menuEl.open; });

function logOut() {
    localStorage.clear();
    location.reload();
}
function changePassword() {
    if (document.getElementById("newpassword").value == document.getElementById("confirmpassword").value) {
        event.target.disabled = true;
        apiRequest("account/changepassword", "POST", false, document.getElementById("newpassword").value)
        localStorage.setItem("password", document.getElementById("newpassword").value);
        event.target.parentElement.close();
        document.getElementById("cperror").textContent = "";
        document.getElementById("changePasswordForm").reset();
    } else {
        document.getElementById("cperror").textContent = "Passwords must match!";
    }
}
function deleteAccount() {
    event.target.disabled = true;
    apiRequest("account/delete", "POST", false);
    logOut();
}