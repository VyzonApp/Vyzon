window.onload = function () {
    if (localStorage.getItem("username") == null) {
        document.getElementById("loginNotice").show();
    } else {
        document.querySelector(".openinfo").style.display = "none";
        if (localStorage.getItem('modalVersion') != Version.slice(0, 7)) {
            document.getElementById('newVersion').show();
        }
    }
}
if (navigator.userAgent.indexOf('AppleWebKit') != -1) {
    DateOffset = 0
} else {
    DateOffset = 0
}
var statusReturn = apiRequest("competition/get", "GET", true, "", true);
statusReturn.then(function (status) {
    if (status["status"] == 200) {
        setCompetitionStatus(status["data"]["competitor"], status["data"]["user1"], status["data"]["user2"], status["data"]["finish"])
    }
})

function getFirstDayOfMonth(year, month) {
    return new Date(year, month - 1, 1).getDay();
}
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate() 
}
function numberToArray(n) {
    return Array.from({ length: n }, (_, i) => i + 1);
}

Modes = ["Tasks", "Calendar", "Whiteboard"]
switchModes(0)
function switchModes(modenum) {
    for (let index = 0; index < Modes.length; index++) {
        document.getElementById("ch" + Modes[index]).style.display = "none";
    }
    document.getElementById("ch" + Modes[modenum]).style.display = "flex";
    document.getElementById("modeindicator").textContent = Modes[modenum];
    if (modenum == 0) {
        getTasks(0);
    } else if (modenum == 1) {
        var tasksPromise = apiRequest("tasks/get?list=all", "GET", false);
        tasksPromise.then(function(tasks) {
            AllTasks = tasks;
            startCalendar(new Date().getFullYear(), new Date().getMonth() + 1);
        });
    } else if (modenum == 2) {
        var tasksPromise = apiRequest("tasks/get?list=all", "GET", false);
        tasksPromise.then(function(tasks) {
            AllTasks = tasks;
            startWhiteboard();
        });
    }
    CurrentMode = modenum;
}

CurrentList = 0;

TasksObject = {}
function getTasks(list) {
    document.querySelector(".loader").style.display = "initial";
    var tasksPromise = apiRequest("tasks/get?list=" + list, "GET", false);
    tasksPromise.then(function(tasks) {
        document.querySelector(".loader").style.display = "none";
        document.getElementById("taskholder").innerHTML = "";
        if (tasks != undefined) {
            Object.keys(tasks).forEach(element => {
                if (element != "name") {
                    createTaskElem(
                        tasks[element]["name"],
                        tasks[element]["description"],
                        tasks[element]["date"],
                        element,
                        tasks[element]["priority"],
                        tasks[element]["repeat"],
                        document.getElementById("taskholder"));
                }
                TasksObject[element] = {
                    "name": tasks[element]["name"],
                    "description": tasks[element]["description"],
                    "date": tasks[element]["date"],
                    "priority": tasks[element]["priority"],
                    "repeat": tasks[element]["repeat"],
                    "list": list
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
    getLists();
    getSettings();
});

function addNewTask() {
    var addTaskPromise = apiRequest("tasks/add?list=" + CurrentList, "POST", true, JSON.stringify({
        "name": document.getElementById("tasknamefield").value,
        "description": document.getElementById("taskdescfield").value,
        "date": document.getElementById("taskdatefield").value,
        "priority": document.getElementById("taskpriorityfield").checked,
        "repeat": document.getElementById("taskrepeatfield").value
    }))
    addTaskPromise.then(function (ntid) {
        createTaskElem(
            document.getElementById("tasknamefield").value,
            document.getElementById("taskdescfield").value,
            document.getElementById("taskdatefield").value,
            ntid,
            document.getElementById("taskpriorityfield").checked,
            document.getElementById("taskrepeatfield").value,
            document.getElementById("taskholder"));
            TasksObject[ntid] = {
                "name": document.getElementById("tasknamefield").value,
                "description": document.getElementById("taskdescfield").value,
                "date": document.getElementById("taskdatefield").value,
                "priority": document.getElementById("taskpriorityfield").checked,
                "repeat": document.getElementById("taskrepeatfield").value,
                "list": CurrentList
            }
            document.getElementById("addTask").close();
            document.getElementById("addTaskForm").reset();
    })
}

function createTaskElem(name, description, datet, taskid, priority, repeat, container) {
    document.querySelector(".notasks").style.display = "none";
    var elem = document.createElement("div");
    var box = document.createElement("md-radio");
    var label = document.createElement("span");
    var desc = document.createElement("span");
    var datetext = document.createElement("span");
    var date2 = document.createElement("span");
    var date3 = document.createElement("span");

    elem.id = taskid;

    label.textContent = name;
    desc.textContent = description;
    if (new Date(datet) != "Invalid Date") {
        date2.style.display = "flex";
        datetasdate = new Date(datet);
        datetasdate.setDate(datetasdate.getDate() + 1);
        datetext.textContent = new Date(datetasdate).toLocaleDateString();
        date3.textContent = timeDifference(datetasdate);
    } else {
        date2.style.display = "none";
    }
    if (repeat != 0) {
        switch (repeat) {
            case undefined:
                break;
            case "1":
                date3.textContent = "Repeats daily"
                break;
            case "7":
                date3.textContent = "Repeats weekly"
                break;
            case "30":
                date3.textContent = "Repeats monthly"
                break;
            case "365":
                date3.textContent = "Repeats yearly"
                break;
            default:
                date3.textContent = "Repeats every " + repeat + " days"
                break;
        }
        date3.classList.add("repeatnotify");
        date2.style.display = "flex";
    }

    elem.classList.add("task");
    label.classList.add("tlabel");
    desc.classList.add("descript");
    date2.classList.add("date");
    date3.classList.add("daterelative");
    datetext.classList.add("datetext")

    if (priority) {
        label.classList.add("priorityt");
    }

    elem.appendChild(label);
    label.prepend(box);
    elem.appendChild(desc);
    if (description == undefined || description == "") {
        desc.style.display = "none";
    }
    date2.appendChild(datetext);
    date2.appendChild(date3);
    elem.appendChild(date2);

    elem.onclick = function () { editTask(taskid, name, description, datet, priority, repeat); }
    box.onclick = function () { BoxClicked = true; completeTask(event.target.parentElement.parentElement.id); }

    if (priority) {
        container.prepend(elem);
    } else {
        container.appendChild(elem);
    }
}
BoxClicked = false;

function timeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 10) {
        return "now";
    } else if (seconds < 60) {
        return `${seconds} seconds ago`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minutes ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hours ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days} days ago`;
    }
    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
        return `${weeks} weeks ago`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} months ago`;
    }
    const years = Math.floor(days / 365);
    return `${years} years ago`;
}
function timeUntil(date) {
    const now = new Date();
    const seconds = Math.floor((date - now) / 1000);
    if (seconds < 10) {
        return "in a few seconds";
    } else if (seconds < 60) {
        return `in ${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `in ${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `in ${hours} hours`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `in ${days} days`;
    }
    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
        return `in ${weeks} weeks`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `in ${months} months`;
    }
    const years = Math.floor(days / 365);
    return `in ${years} years`;
}
function timeDifference(date) {
    const now = new Date();
    if (date < now) {
        return timeAgo(date);
    } else {
        return timeUntil(date);
    }
}
function getMonthName(monthNumber) {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
}

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
function convertToDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day);
}
function completeTask(id) {
    var taskRequest = apiRequest("tasks/complete?list=" + TasksObject[id]["list"], "DELETE", false, id);
    if (TasksObject[id]["repeat"] == 0 || TasksObject[id]["repeat"] == undefined) {
        document.querySelectorAll("#" + id).forEach(function (element) {
            element.remove();
        })
        if (!document.querySelector(".task")) {
            document.querySelector(".notasks").style.display = "block";
        }
    } else {
        document.querySelectorAll("#" + id).forEach(function (element) {
            element.firstChild.firstChild.remove();
            var newradio = document.createElement("md-radio");
            element.firstChild.prepend(newradio);
            newradio.onclick = function () { BoxClicked = true; completeTask(event.target.parentElement.parentElement.id); }
        });

        document.querySelectorAll("#" + id).forEach(function (element) {
            var elem = element.firstChild.nextSibling.nextSibling;
            if (TasksObject[id]["date"] != '') {
                var tempdate = new Date(elem.firstChild.textContent);
            } else {
                var tempdate = new Date();
            }
            tempdate.setDate(tempdate.getDate() + new Number(TasksObject[id]["repeat"]));
            elem.firstChild.textContent = tempdate.toLocaleDateString();
        })
    }
    taskRequest.then(function (tparse) {
        if (tparse["competitor"] != undefined) {
            setCompetitionStatus(tparse["competitor"], tparse["user1"], tparse["user2"], tparse["finish"])
        }
    })
    if (document.getElementById("calendartasksholder").innerHTML == "") {
        document.getElementById("nodatetasks").style.display = "block";
    } else {
        document.getElementById("nodatetasks").style.display = "none";
    }
    if (CurrentMode == 1) {
        if (TasksObject[id]["repeat"] == 0 || TasksObject[id]["repeat"] == undefined) {
            startCalendar(CalYear, CalMonth, true);
        } else {
            var tasksPromise = apiRequest("tasks/get?list=all", "GET", false);
            tasksPromise.then(function(tasks) {
                AllTasks = tasks;
                startCalendar(CalYear, CalMonth, true);
            });
        }
    }
}

function editTask(id, name, desc, date, priority, repeat) {
    if (CurrentMode == 0) {
        if (BoxClicked) {
            BoxClicked = false;
        } else {
            document.getElementById("etempid").textContent = id;
            document.getElementById("etasknamefield").value = name;
            document.getElementById("etaskrepeatfield").value = repeat;
            if (desc != undefined) {
                document.getElementById("etaskdescfield").value = desc;
            }
            document.getElementById("etaskdatefield").value = date;
            if (priority) {
                document.getElementById("etaskpriorityfield").checked = true;
            } else {
                document.getElementById("etaskpriorityfield").checked = false;
            }
            document.getElementById("editTask").show();
        }
    }
}
function finalizeTaskEdit() {
    apiRequest("tasks/add?list=" + TasksObject[document.getElementById("etempid").textContent]["list"], "POST", false, JSON.stringify({
        "id": document.getElementById("etempid").textContent,
        "name": document.getElementById("etasknamefield").value,
        "description": document.getElementById("etaskdescfield").value,
        "date": document.getElementById("etaskdatefield").value,
        "priority": document.getElementById("etaskpriorityfield").checked,
        "repeat": document.getElementById("etaskrepeatfield").value
    }))
    setTimeout(function() {
        getTasks(CurrentList);
        document.getElementById("editTask").close();
    },500)
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
    if (CurrentList = document.getElementById("dellistselectfield").value) {
        CurrentList = 0;
        document.getElementById("listselect").value = "0";
        getTasks(CurrentList);
    }
    document.getElementById("delListForm").reset();
    setTimeout(() => {
        getLists();
    }, 500);
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
function reload2() {
    var statusReturn = apiRequest("competition/get", "GET", true, "", true);
    statusReturn.then(function (status) {
        if (status["status"] == 200) {
            setCompetitionStatus(status["data"]["competitor"], status["data"]["user1"], status["data"]["user2"], status["data"]["finish"])
        }
    })
    getTasks(CurrentList);
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
    LoadedFriends = true;
    document.getElementById("friendRows").innerHTML = "";
    document.getElementById("finc").innerHTML = "";
    document.getElementById("fout").innerHTML = "";
    document.getElementById("listuserfield").innerHTML = "";
    document.getElementById("ctaskAgainst").innerHTML = "";
    var friendsPromise = apiRequest("friends/get", "GET", false);
    friendsPromise.then(function(result) {
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
function setCompetitionStatus(user2, status2, status1, total) {
    CompetitionOn = true;
    document.getElementById("user2name").textContent = user2;

    var percent1 = (new Number(status1) / new Number(total));
    var percent2 = (new Number(status2) / new Number(total));

    document.getElementById("bar1").value = percent1;
    document.getElementById("bar2").value = percent2;
    document.getElementById("sbar1").value = percent1;
    document.getElementById("sbar2").value = percent2;
    document.getElementById("nstat1").textContent = `${status1}/${total} (${Math.round(percent1*100)}%)`;
    document.getElementById("nstat2").textContent = `${status2}/${total} (${Math.round(percent2*100)}%)`;
    document.getElementById("cname1").textContent = localStorage.getItem("username");
    document.getElementById("cname2").textContent = user2;

    document.getElementById("content").classList.add("cstarted");

    setTimeout(function () {
        if (status1 == total) {
            document.getElementById("win").style.display = "flex";
            var winner = "You";
            document.getElementById("abandonBtn").disabled = true;
        } else if (status2 == total) {
            document.getElementById("lose").style.display = "flex";
            var winner = user2;
            document.getElementById("abandonBtn").disabled = true;
        } else {
            document.getElementById("lose").style.display = "none";
            document.getElementById("win").style.display = "none";
        }
        setTimeout(function () {
            if (status1 >= total || status2 >= total) {
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
        "competitor": document.getElementById("ctaskAgainst").value,
        "finish": document.getElementById("tasksAmount").value
    }), true);
    statusReturn.then(function (status) {
        if (status["status"] == 409) {
            document.getElementById("startCompetitionForm").reset();
            document.getElementById("cferror").textContent = "This person is already in a competition.";
        } else {
            document.getElementById("startCompetition").close();
            setCompetitionStatus(document.getElementById("ctaskAgainst").value, 0, 0, document.getElementById("tasksAmount").value)
            document.getElementById("startCompetitionForm").reset();
        }
    })
}
function dismissCompetition() {
    document.getElementById("content").classList.remove("cstarted");
    document.getElementById("lose").style.display = "none";
    document.getElementById("win").style.display = "none";
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
    document.getElementById("content").classList.remove("cstarted");
    CompetitionOn = false;
    document.getElementById("lose").style.display = "none";
    document.getElementById("win").style.display = "none";
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

const anchorEl1 = document.body.querySelector('#menu-anchor');
const menuEl1 = document.body.querySelector('#menu-menu');
anchorEl1.addEventListener('click', () => { menuEl1.open = !menuEl1.open; });

const anchorEl2 = document.body.querySelector('#modeswitchanchor');
const menuEl2 = document.body.querySelector('#modesmenu');
anchorEl2.addEventListener('click', () => { menuEl2.open = !menuEl2.open; });

function deleteTask(id) {
    apiRequest("tasks/delete?list=" + TasksObject[id]["list"], "DELETE", false, id);
    document.querySelectorAll("#" + id).forEach(function (element) {
        element.remove();
    });
    if (!document.querySelector(".task")) {
        document.querySelector(".notasks").style.display = "block";
    }
}

// Calendar
function startCalendar(curyear, curmonth, noanim) {
    DatesJSON = {};
    if (AllTasks != null) {
        Object.values(AllTasks).forEach(function (listcontent) {
            Inter = 0;
            Object.values(listcontent).forEach(function (taskcontent) {
                if (taskcontent["date"] != "") {
                    taskcontent["id"] = Object.keys(listcontent)[Inter];
                    if (DatesJSON[taskcontent["date"]] == undefined) {
                        DatesJSON[taskcontent["date"]] = [taskcontent];
                    } else {
                        DatesJSON[taskcontent["date"]].push(taskcontent);
                    }
                }
                if (taskcontent["list"] != undefined) {
                    TasksObject[Object.keys(listcontent)[Inter]] = taskcontent;
                }
                Inter = Inter + 1;
            })
        })
    }
    var daysincur = getDaysInMonth(curyear, curmonth);
    var firstcurday = getFirstDayOfMonth(curyear, curmonth);
    document.getElementById("calendargrid").innerHTML = "";
    numberToArray(firstcurday).forEach(function () {
        addCalendarItem(0, 1)
    });
    for (let index = 0; index < numberToArray(daysincur).length; index++) {
        if (noanim) {
            var timeouttime = 0;
        } else {
            var timeouttime = index*10;
        }
        const element = numberToArray(daysincur)[index];
        setTimeout(() => {
            if (element == new Date().getDate() && new Date().getMonth() + 1 == curmonth) {
                addCalendarItem(element, 2, noanim);
            } else {
                addCalendarItem(element, 0, noanim);
            }
        }, timeouttime);
    }
    document.getElementById("mnyear").textContent = curyear;
    document.getElementById("mnmonth").textContent = getMonthName(curmonth);
    CalYear = curyear;
    CalMonth = curmonth;
}
function addCalendarItem(number, type, noanim) {
    if (type == 0 || type == 2) {
        var calelem = document.createElement("div");
        var caltext = document.createElement("span");
        var minitasks = document.createElement("div");
        var caripple = document.createElement("md-ripple");
        calelem.classList.add("calendarbox");
        if (noanim) {
            calelem.classList.add("noanim");
        }
        if (type == 2) {
            calelem.classList.add("cbtoday");
        }
        caltext.classList.add("daynum");
        minitasks.classList.add("minitasks");
        calelem.appendChild(caltext);
        calelem.appendChild(minitasks);
        calelem.appendChild(caripple);
        document.getElementById("calendargrid").appendChild(calelem);
        caltext.textContent = number;
        var tempdate = new Date();
        tempdate.setDate(number);
        tempdate.setFullYear(CalYear);
        tempdate.setMonth(CalMonth - 1);
        var month = String(tempdate.getMonth() + 1).padStart(2, '0');
        var day = String(tempdate.getDate()).padStart(2, '0');
        var datestring = `${CalYear}-${month}-${day}`;
        if (DatesJSON[datestring] != undefined) {
            DatesJSON[datestring].forEach(function (numdaytask) {
                var minitask = document.createElement("div");
                minitask.classList.add("minitask");
                minitask.textContent = numdaytask["name"];
                minitasks.appendChild(minitask);
            })
            var calbadge = document.createElement("div");
            calbadge.classList.add("calbadge");
            calbadge.textContent = DatesJSON[datestring].length;
            calelem.appendChild(calbadge);
        }
        calelem.onclick = function () {
            loadTasksIntoDayModal(datestring)
        }
    } else if (type == 1) {
        var calelem = document.createElement("div");
        calelem.classList.add("calendarbox");
        calelem.classList.add("cbempty");
        document.getElementById("calendargrid").appendChild(calelem);
    }
}
function switchMonth() {
    switch (event.target.id) {
        case "msforwardbtn":
            if (CalMonth == 12) {
                startCalendar(CalYear + 1, 1);
            } else {
                startCalendar(CalYear, CalMonth + 1);
            }
            break;
        case "msbackwardbtn":
            if (CalMonth == 1) {
                startCalendar(CalYear - 1, 12);
            } else {
                startCalendar(CalYear, CalMonth - 1);
            }
    }
}
function loadTasksIntoDayModal(date) {
    document.getElementById("calendartasksholder").innerHTML = "";
    if (DatesJSON[date] != undefined) {
        DatesJSON[date].forEach(function (element) {
            createTaskElem(
                element["name"],
                element["description"],
                element["date"],
                element["id"],
                element["priority"],
                element["repeat"],
                document.getElementById("calendartasksholder"));
        })
        document.getElementById("nodatetasks").style.display = "none";
    } else {
        document.getElementById("nodatetasks").style.display = "block";
    }
    document.getElementById("calendartasks").show();
    dateparsed = new Date(date);
    dateparsed.setMonth(dateparsed.getMonth());
    dateparsed.setDate(dateparsed.getDate() + 1);
    document.getElementById("calendarmodaldate").textContent = dateparsed.toDateString().split(' ').slice(1).join(' ');;
}

// Whiteboard
function startWhiteboard() {
    document.getElementById("whiteboardcontent").innerHTML = "";
    ListNames = [];
    for (let index = 0; index < Object.values(AllTasks).length; index++) {
        const element = Object.values(AllTasks)[index];
        if (element["name"] != undefined) {
            ListNames.push(element["name"]);
        } else {
            ListNames.push("Main List");
        }
    }
    if (AllTasks != null) {
        Object.values(AllTasks).forEach(function (listcontent) {
            Inter = 0;
            Object.values(listcontent).forEach(function (taskcontent) {
                if (taskcontent["list"] != undefined) {
                    TasksObject[Object.keys(listcontent)[Inter]] = taskcontent;
                }
                Inter = Inter + 1;
            })
        })
    }
    for (let index = 0; index < Object.values(AllTasks).length; index++) {
        const list = Object.values(AllTasks)[index];
        
        const wbbox = document.createElement("div");
        wbbox.classList.add("whiteboardbox");
        document.getElementById("whiteboardcontent").appendChild(wbbox);

        var wbname = document.createElement("div");
        wbname.classList.add("whiteboardname");
        wbname.textContent = ListNames[index];
        wbbox.appendChild(wbname);

        if (Object.values(list).length == 1 && list["name"]) {
            var wbtask = document.createElement("div");
            wbtask.textContent = "No tasks on this list.";
            wbtask.classList.add("notaskswhiteboard");
            wbbox.appendChild(wbtask);
        } else {
            for (let index = 0; index < Object.values(list).length; index++) {
                const task = Object.values(list)[index];
                
                if (Object.keys(list)[index] != "name") {
                    createTaskElem(
                        task["name"],
                        task["description"],
                        task["date"],
                        Object.keys(list)[index],
                        task["priority"],
                        task["repeat"],
                        wbbox);
                }
            }
        }
    }
    if (document.getElementById("whiteboardcontent").innerHTML == "") {
        document.getElementById("whiteboardlistsempty").style.display = "flex";
    } else {
        document.getElementById("whiteboardlistsempty").style.display = "none";
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