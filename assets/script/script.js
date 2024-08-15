window.onload = function () {
    if (localStorage.getItem("username") == null) {
        document.getElementById("loginNotice").show();
    } else {
        document.querySelector(".openinfo").style.display = "none";
        if (localStorage.getItem('modalVersion') != Version) {
            document.getElementById('newVersion').show();
        }
    }
}

var statusReturn = apiRequest("competition/get", "GET", true, "", true);
statusReturn.then(function (status) {
    if (status["status"] == 200) {
        setCompetitionStatus(status["data"]["name"], status["data"]["competitor"], status["data"]["user1"], status["data"]["user2"], status["data"]["finish"])
    }
})

CurrentList = 0;

function getTasks(list) {
    document.querySelector(".loader").style.display = "initial";
    var tasksPromise = apiRequest("tasks/get?list=" + list, "GET", false);
    tasksPromise.then(function(tasks) {
        TasksObject = tasks;
        document.querySelector(".loader").style.display = "none";
        document.getElementById("taskholder").innerHTML = "";
        if (tasks != undefined) {
            Object.keys(tasks).forEach(element => {
                if (element != "name") {
                    createTaskElem(tasks[element]["name"], tasks[element]["description"], tasks[element]["label"], tasks[element]["labelicon"], element, tasks[element]["priority"]);
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
            if (Inter != 3) {
                if (settings[element] == 1) {
                    var newstate = true;
                } else {
                    var newstate = false;
                }
                document.getElementById("setting" + element).selected = newstate;
                setSettingClient(element, newstate);
            } else {
                switchColor(settings[element], true);
            }
            Inter = Inter + 1;
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
                if (lists[element]["shared"] == undefined) {
                    createListElem(lists[element]["name"], element, null)
                } else {
                    createListElem(lists[element]["name"], element, lists[element]["shared"])
                }
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
        var labelicon = document.getElementById('addTask-selectoricon').textContent;
    }
    var addTaskPromise = apiRequest("tasks/add?list=" + CurrentList, "POST", true, JSON.stringify({
        "name": document.getElementById("tasknamefield").value,
        "description": document.getElementById("taskdescfield").value,
        "labelicon": labelicon,
        "label": document.getElementById("tasklabelfield").value,
        "priority": document.getElementById("taskpriorityfield").checked
    }))
    addTaskPromise.then(function (ntid) {
        createTaskElem(
            document.getElementById("tasknamefield").value,
            document.getElementById("taskdescfield").value,
            document.getElementById("tasklabelfield").value,
            labelicon, ntid,
            document.getElementById("taskpriorityfield").checked);
            document.getElementById("addTask").close();
            document.getElementById("addTaskForm").reset();
    })
}

function createTaskElem(name, description, labelt, labelicont, taskid, priority) {
    document.querySelector(".notasks").style.display = "none";
    var elem = document.createElement("div");
    var box = document.createElement("md-radio");
    var label = document.createElement("span");
    var desc = document.createElement("span");
    var labelicon = document.createElement("md-icon");
    var labeltext = document.createElement("span");
    var label2 = document.createElement("span");

    elem.id = taskid;

    label.textContent = name;
    desc.textContent = description;
    labeltext.textContent = labelt; 
    labelicon.textContent = labelicont;

    elem.classList.add("task");
    label.classList.add("tlabel");
    desc.classList.add("descript");
    label2.classList.add("label");

    if (priority) {
        label.classList.add("priorityt");
    }

    elem.appendChild(label);
    label.prepend(box);
    elem.appendChild(desc);
    if (description == undefined || description == "") {
        desc.style.display = "none";
    }
    label2.appendChild(labelicon);
    label2.appendChild(labeltext);
    elem.appendChild(label2);

    elem.onclick = function () { editTask(box.parentElement.parentElement.id, name, description, labelicont, labelt, priority); }
    box.onclick = function () { BoxClicked = true; completeTask(box.parentElement.parentElement.id); }

    if (priority) {
        document.getElementById("taskholder").prepend(elem);
    } else {
        document.getElementById("taskholder").appendChild(elem);
    }
}
BoxClicked = false;

function createListElem(listname, listid, shared) {
    var listelem = document.getElementById("newlist");
    var parent = document.getElementById("listselect");
    var elem = document.createElement("md-select-option");
    elem.value = listid;
    var head = document.createElement("div");
    head.slot = "headline";
    head.textContent = listname;
    elem.appendChild(head);
    if (shared != null) {
        var sub = document.createElement("div");
        var subicon = document.createElement("md-icon");
        subicon.textContent = "group";
        var subtxt = document.createElement("span");
        subtxt.textContent = shared;
        sub.appendChild(subicon);
        sub.appendChild(subtxt);
        sub.classList.add("lsub");
        elem.appendChild(sub);
    }
    parent.insertBefore(elem, listelem);
}

function completeTask(id) {
    setTimeout(function () {
        document.getElementById(id).remove();
        var taskRequest = apiRequest("tasks/complete?list=" + CurrentList, "DELETE", false, id);
        if (!document.querySelector(".task")) {
            document.querySelector(".notasks").style.display = "block";
        }
        taskRequest.then(function (tparse) {
            if (tparse["name"] != undefined) {
                setCompetitionStatus(tparse["name"], tparse["competitor"], tparse["user1"], tparse["user2"], tparse["finish"])
            }
        })
    },200)
}

function editTask(id, name, desc, labeli, labelt, priority) {
    if (BoxClicked) {
        BoxClicked = false;
    } else {
        document.getElementById("etempid").textContent = id;
        document.getElementById("etasknamefield").value = name;
        if (desc != undefined) {
            document.getElementById("etaskdescfield").value = desc;
        }
        document.getElementById("etasklabelfield").value = labelt;
        if (labeli == "") {
            document.getElementById("editTask-selectoricon").textContent = "star";
        } else {
            document.getElementById("editTask-selectoricon").textContent = labeli;
        }
        if (priority) {
            document.getElementById("etaskpriorityfield").checked = true;
        } else {
            document.getElementById("etaskpriorityfield").checked = false;
        }
        document.getElementById("editTask").show();
    }
}
function finalizeTaskEdit() {
    if (document.getElementById("etasklabelfield").value == "") {
        licon = "";
    } else {
        licon = document.getElementById("editTask-selectoricon").textContent;
    }
    apiRequest("tasks/add?list=" + CurrentList, "POST", true, JSON.stringify({
        "id": document.getElementById("etempid").textContent,
        "name": document.getElementById("etasknamefield").value,
        "description": document.getElementById("etaskdescfield").value,
        "labelicon": licon,
        "label": document.getElementById("etasklabelfield").value,
        "priority": document.getElementById("etaskpriorityfield").checked
    }))
    document.getElementById("editTask").close();
    getTasks(CurrentList);
}

function listSwitch() {
    if (event.target.value == "new") {
        event.target.value = CurrentList.toString();
        document.getElementById("addListForm").reset();
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
        "name": document.getElementById("listnamefield").value,
        "user": document.getElementById("listuserfield").value
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

function iconSelect(modal) {
    document.getElementById(modal).close();
    document.getElementById("tempreturnmodal").textContent = modal;
    document.getElementById('iconSelect').show();
}
document.getElementById('iconSelect').onclose = function () {
    document.getElementById(document.getElementById("tempreturnmodal").textContent).show();
    document.getElementById("tempreturnmodal").textContent = "";
}
function returnIcon() {
    document.getElementById(document.getElementById("tempreturnmodal").textContent + '-selectoricon').textContent = event.target.textContent;
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
        var menuwrap = document.createElement("span");

        button.id = "friendlisting-" + name;
        base.id = "friendbase-" + name;

        var menu = document.createElement("md-menu");
        var menui1 = document.createElement("md-menu-item");
        var menui2 = document.createElement("md-menu-item");
        var menui3 = document.createElement("md-menu-item");
        menui1.textContent = "Start Competition";
        menui2.textContent = "Share List";
        menui3.textContent = "Remove Friend";
        menu.appendChild(menui1);
        menu.appendChild(menui2);
        menu.appendChild(menui3);
        menui1.onclick = function () { readyCompetition(name) }
        menui2.onclick = function () {
            document.getElementById("friendList").close();
            document.getElementById("listuserfield").value = name;
            document.getElementById("addList").show();
        }
        menui3.onclick = function () { removeFriend(name) }

        menuwrap.style.position = "relative";
        menu.anchor = "friendlisting-" + name;
        menu.id = "friendmenu-" + name;
        menu.positioning = "popover";

        base.classList.add("friend");
        username.classList.add("rname");
        menuwrap.classList.add("menuwrap");

        username.textContent = name;
        bi.textContent = "more_vert";

        button.onclick = function () {
            if (document.getElementById("friendmenu-" + name).open) {
                document.getElementById("friendmenu-" + name).close();
            } else {
                document.getElementById("friendmenu-" + name).show();
            }
        }

        base.appendChild(username);
        button.appendChild(bi);
        menuwrap.appendChild(button);
        menuwrap.appendChild(menu);
        base.appendChild(menuwrap);
        document.getElementById("friendRows").appendChild(base);
    }
}
function removeFriend(name) {
    var friendsPromise = apiRequest("friends/remove", "POST", false, JSON.stringify({
        "name": name
    }), true);
    friendsPromise.then(function(result) {
        if (result["status"] == 200) {
            document.getElementById("friendbase-" + name).remove();
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
                    var mdso2 = document.createElement("md-select-option");
                    mdso2.textContent = element;
                    mdso2.value = element;
                    document.getElementById("ctaskAgainst").appendChild(mdso);
                    document.getElementById("listuserfield").appendChild(mdso2);
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
    } else if (state == false) {
        nstate = 0;
    } else {
        nstate = state;
    }
    apiRequest("settings/set", "POST", true, JSON.stringify({
        "setting": setting,
        "state": nstate
    }));
    setSettingClient(setting, state);
}
function setSettingClient(setting, state) {
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
document.getElementById("settingsOptions").addEventListener('change', function () {
    Array.from(document.getElementsByClassName("settingsGroup")).forEach(function (elem) {
        elem.style.display = "none";
    })
    document.getElementById("settingsGroup" + event.target.activeTabIndex).style.display = "initial";   
});
function switchColor(rgb, noset) {
    document.getElementById("accentstyle").textContent = `
        :root {
            --vyzon-accent: rgb(${rgb});
            --vyzon-accent-75: rgb(${rgb},0.75);
            --vyzon-accent-50: rgb(${rgb},0.50);
            --vyzon-accent-25: rgb(${rgb},0.25);
            --vyzon-accent-15: rgb(${rgb},0.15);
            --vyzon-accent-05: rgb(${rgb},0.05);
        }`
    if (!noset) {
        setSetting(3, rgb);
    }
}
CompetitionOn = false;
// Competition
function setCompetitionStatus(name, user2, status1, status2, total) {
    CompetitionOn = true;
    document.getElementById("cname").textContent = name;
    document.getElementById("user2name").textContent = user2;

    var percent1 = (new Number(status1) / new Number(total));
    var percent2 = (new Number(status2) / new Number(total));

    document.getElementById("bar1").value = percent1;
    document.getElementById("bar2").value = percent2;
    document.getElementById("sbar1").value = percent1;
    document.getElementById("sbar2").value = percent2;
    document.getElementById("nstat1").textContent = `${status1}/${total} (${Math.round(percent1*100)}%)`;
    document.getElementById("nstat2").textContent = `${status2}/${total} (${Math.round(percent2*100)}%)`;
    document.getElementById("cName").textContent = name;
    document.getElementById("cname1").textContent = localStorage.getItem("username");
    document.getElementById("cname2").textContent = user2;

    document.getElementById("competition").style.display = "flex";
    setTimeout(function () {
        if (status1 == total) {
            document.getElementById("win").style.display = "flex";
            var winner = "You";
            document.getElementById("abandonBtn").disabled = true;
        } else if (status2 == total) {
            document.getElementById("lose").style.display = "flex";
            var winner = user2;
            document.getElementById("abandonBtn").disabled = true;
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

function readyCompetition(name) {
    document.getElementById("friendList").close();
    if (CompetitionOn) {
        document.getElementById("competitionStats").show();
    } else {
        document.getElementById("startCompetitionForm").reset();
        document.getElementById("startCompetition").show();
        if (name) {
            document.getElementById("ctaskAgainst").value = name;
        }
        document.getElementById("cferror").textContent = "";
    }
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
function startCompetition() {
    var statusReturn = apiRequest("competition/start", "POST", true, JSON.stringify({
        "name": document.getElementById("compName").value,
        "competitor": document.getElementById("ctaskAgainst").value,
        "finish": document.getElementById("tasksAmount").value
    }), true);
    statusReturn.then(function (status) {
        if (status["status"] == 409) {
            document.getElementById("startCompetitionForm").reset();
            document.getElementById("cferror").textContent = "This person is already in a competition.";
        } else {
            document.getElementById("startCompetition").close();
            setCompetitionStatus(document.getElementById("compName").value, document.getElementById("ctaskAgainst").value, 0, 0, document.getElementById("tasksAmount").value)
            document.getElementById("startCompetitionForm").reset();
        }
    })
}
function dismissCompetition() {
    document.getElementById('competition').style.display = 'none';
    apiRequest("competition/dismiss", "POST", true);
    CompetitionOn = false;
}
function openAbandonCompetition() {
    document.getElementById('competitionStats').close();
    document.getElementById('abandonCompetition').show();
}
function abandonCompetition() {
    document.getElementById('abandonCompetition').close();
    apiRequest("competition/abandon", "POST", true);
    document.getElementById('competition').style.display = 'none';
    CompetitionOn = false;
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