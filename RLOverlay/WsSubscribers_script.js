/// WsSubscribers Script

const WsSubscribers = {
    __subscribers: {},
    websocket: undefined,
    webSocketConnected: false,
    registerQueue: [],
    init: function(port, debug, debugFilters) {
        port = port || 49322;
        debug = debug || false;
        if (debug) {
            if (debugFilters !== undefined) {
                console.warn("WebSocket Debug Mode enabled with filtering. Only events not in the filter list will be dumped");
            } else {
                console.warn("WebSocket Debug Mode enabled without filters applied. All events will be dumped to console");
                console.warn("To use filters, pass in an array of 'channel:event' strings to the second parameter of the init function");
            }
        }
        WsSubscribers.webSocket = new WebSocket("ws://localhost:" + port);
        WsSubscribers.webSocket.onmessage = function (event) {
            let jEvent = JSON.parse(event.data);
            if (!jEvent.hasOwnProperty('event')) {
                return;
            }
            let eventSplit = jEvent.event.split(':');
            let channel = eventSplit[0];
            let event_event = eventSplit[1];
            if (debug) {
                if (!debugFilters) {
                    console.log(channel, event_event, jEvent);
                } else if (debugFilters && debugFilters.indexOf(jEvent.event) < 0) {
                    console.log(channel, event_event, jEvent);
                }
            }
            WsSubscribers.triggerSubscribers(channel, event_event, jEvent.data);
        };
        WsSubscribers.webSocket.onopen = function () {
            WsSubscribers.triggerSubscribers("ws", "open");
            WsSubscribers.webSocketConnected = true;
            WsSubscribers.registerQueue.forEach((r) => {
                WsSubscribers.send("wsRelay", "register", r);
            });
            WsSubscribers.registerQueue = [];
        };
        WsSubscribers.webSocket.onerror = function () {
            WsSubscribers.triggerSubscribers("ws", "error");
            WsSubscribers.webSocketConnected = false;
        };
        WsSubscribers.webSocket.onclose = function () {
            WsSubscribers.triggerSubscribers("ws", "close");
            WsSubscribers.webSocketConnected = false;
        };
    },
    /**
     * Add callbacks for when certain events are thrown
     * Execution is guaranteed to be in First In First Out order
     * @param channels
     * @param events
     * @param callback
     */
    subscribe: function(channels, events, callback) {
        if (typeof channels === "string") {
            let channel = channels;
            channels = [];
            channels.push(channel);
        }
        if (typeof events === "string") {
            let event = events;
            events = [];
            events.push(event);
        }
        channels.forEach(function(c) {
            events.forEach(function (e) {
                if (!WsSubscribers.__subscribers.hasOwnProperty(c)) {
                    WsSubscribers.__subscribers[c] = {};
                }
                if (!WsSubscribers.__subscribers[c].hasOwnProperty(e)) {
                    WsSubscribers.__subscribers[c][e] = [];
                    if (WsSubscribers.webSocketConnected) {
                        WsSubscribers.send("wsRelay", "register", `${c}:${e}`);
                    } else {
                        WsSubscribers.registerQueue.push(`${c}:${e}`);
                    }
                }
                WsSubscribers.__subscribers[c][e].push(callback);
            });
        })
    },
    clearEventCallbacks: function (channel, event) {
        if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers.__subscribers[channel] = {};
        }
    },
    triggerSubscribers: function (channel, event, data) {
        if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers.__subscribers[channel][event].forEach(function(callback) {
                if (callback instanceof Function) {
                    callback(data);
                }
            });
        }
    },
    send: function (channel, event, data) {
        if (typeof channel !== 'string') {
            console.error("Channel must be a string");
            return;
        }
        if (typeof event !== 'string') {
            console.error("Event must be a string");
            return;
        }
        if (channel === 'local') {
            this.triggerSubscribers(channel, event, data);
        } else {
            let cEvent = channel + ":" + event;
            WsSubscribers.webSocket.send(JSON.stringify({
                'event': cEvent,
                'data': data
            }));
        }
    }
};

///

$(() => {
    WsSubscribers.init(49322, true);
    WsSubscribers.subscribe("game", "update_state", (d) => {

        //Left Team Name, Score and Color
        $("#leftScore").text(d['game']['teams'][0]['score']);
        $("#leftName").text(d['game']['teams'][0]['name']);
        //$('#leftName').css('color', '#' + d['game']['teams'][0]['color_primary']);

        //Right Team Name, Score and Color
        $("#rightScore").text(d['game']['teams'][1]['score']);
        $("#rightName").text(d['game']['teams'][1]['name']);
        //$('#rightName').css('color', '#'+ d['game']['teams'][1]['color_primary']);
        
        //Targeted player
        $("#targetName").text(d['game']['target'].slice(0,-2));
        
        //Targeted player boost
        var targetPlayer = d['game']['target'];
        if (targetPlayer === '') {
            var targetShot = "";
            var targetGoal = "";
            var targetAssist = "";
            var targetSave = "";
            var targetScore = "";
            var targetDemo = "";
            $("#player1Background").css('background-color', "white");
            $("#player1Name").css('color', "#1873ff");
            $("#player1Boost").css('color', "#1873ff");
            $("#player2BoostBar").css('background-color', "#1873ff");
            $("#player2Background").css('background-color', "white");
            $("#player2Name").css('color', "#1873ff");
            $("#player2Boost").css('color', "#1873ff");
            $("#player2BoostBar").css('background-color', "#1873ff");
            $("#player3Background").css('background-color', "white");
            $("#player3Name").css('color', "#1873ff");
            $("#player3Boost").css('color', "#1873ff");
            $("#player3BoostBar").css('background-color', "#1873ff");

            $("#player4Background").css('background-color', "white");
            $("#player4Name").css('color', "#ff7200");
            $("#player4Boost").css('color', "#ff7200");
            $("#player4BoostBar").css('background-color', "#ff7200");
            $("#player5Background").css('background-color', "white");
            $("#player5Name").css('color', "#ff7200");
            $("#player5Boost").css('color', "#ff7200");
            $("#player5BoostBar").css('background-color', "#ff7200");
            $("#player6Background").css('background-color', "white");
            $("#player6Name").css('color', "#ff7200");
            $("#player6Boost").css('color', "#ff7200");
            $("#player6BoostBar").css('background-color', "#ff7200");
        } else {
            var targetShot = d['players'][targetPlayer]['shots'];
            var targetGoal = d['players'][targetPlayer]['goals'];
            var targetAssist = d['players'][targetPlayer]['assists'];
            var targetSave = d['players'][targetPlayer]['saves'];
            var targetScore = d['players'][targetPlayer]['score'];
            var targetDemo = d['players'][targetPlayer]['demos'];
        }
        if (targetPlayer === '') {
            $('.stat-label').text("");
        } else { /* aaaa*/
            $('#goalLabel').text("Gol: ");
            $('#assistLabel').text("Asist: ");
            $('#saveLabel').text("Kurtarış: ");
            $('#shotLabel').text("Şut: ");
            $('#scoreLabel').text("Skor: ");
            $('#demoLabel').text("Patlatma: ");
        }
        $('#targetShot').text(targetShot);
        $('#targetGoal').text(targetGoal);
        $('#targetAssist').text(targetAssist);
        $('#targetSave').text(targetSave);
        $('#targetScore').text(targetScore);
        $('#targetDemo').text(targetDemo);

        //Game time generation
        var time = d['game']['time_seconds'];
        var minutes = Math.floor(time / 60); // Calculate the minutes
        var seconds = time % 60; // Calculate the remaining seconds

        // Format the minutes and seconds
        var formattedMinutes = minutes < 10 ? minutes.toString() : minutes;
        var formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
        var formattedTime = formattedMinutes + ":" + formattedSeconds;
        
        //Sending the game time
        if (d['game']['isOT'] === true) {
            $("#gameTime").text("+"+formattedTime);
        } else {
            $("#gameTime").text(formattedTime);
        }
;
        
        //Getting team list
        const rawPlayerList = d['players'];
        const processedPlayerList = Object.values(rawPlayerList);

        const leftPlayers = [];
        const rightPlayers = [];
        var i = 0;

        //console.log(processedPlayerList[i]['team']);

        while (i < 7) {
            var checkingPlayerTeam = processedPlayerList[i]?.['team'];
            if (checkingPlayerTeam === 0) {
                leftPlayers.push(processedPlayerList[i]['id']);
            }
            if (checkingPlayerTeam === 1) {
                rightPlayers.push(processedPlayerList[i]['id']);
            }
            i = i+1;
        }
        const sortedPlayerListAll = leftPlayers.concat(rightPlayers)
        
        //console.log(leftPlayers)
        //console.log(rightPlayers)
        
        function getBoost (playerID) {
            return d['players'][sortedPlayerListAll[playerID]]['boost'];
        }

        // An attempt at sorting teams

        //Player 1 info
        $('#player1Name').text(d['players'][leftPlayers[0]]['name']);
        $('#player1Boost').text(getBoost(0));
        $('#player1BoostBar').css('width', getBoost(0)*3 + 'px');

        //Player 2 info
        $('#player2Name').text(d['players'][leftPlayers[1]]['name']);
        $('#player2Boost').text(getBoost(1));
        $('#player2BoostBar').css('width', getBoost(1)*3 + 'px');

        //Player 3 info
        $('#player3Name').text(d['players'][leftPlayers[2]]['name']);
        $('#player3Boost').text(getBoost(2));
        $('#player3BoostBar').css('width', getBoost(2)*3 + 'px');

        //Player 4 info
        $('#player4Name').text(d['players'][rightPlayers[0]]['name']);
        $('#player4Boost').text(getBoost(3));
        $('#player4BoostBar').css('width', getBoost(3)*3 + 'px');

        //Player 5 info
        $('#player5Name').text(d['players'][rightPlayers[1]]['name']);
        $('#player5Boost').text(getBoost(4));
        $('#player5BoostBar').css('width', getBoost(4)*3 + 'px');
        
        //Player 6 info
        $('#player6Name').text(d['players'][rightPlayers[2]]['name']);
        $('#player6Boost').text(d['players'][rightPlayers[2]]['boost']);
        $('#player6BoostBar').css('width', getBoost(5)*3 + 'px');

        //Active player color change
        function activePlayerChanges () {
            //Background color change
            if (targetPlayer !== "") {
                let htmlID = sortedPlayerListAll.indexOf(targetPlayer) + 1;
                if (d['players'][targetPlayer]['team'] === 0) {
                    var targetColor = '#1873ff';
                } else {
                    var targetColor = '#ff7200';
                }
                $("#player"+htmlID+"Background").css('background-color', targetColor);
                $("#player"+htmlID+"Name").css('color', "#fff");
                $("#player"+htmlID+"Boost").css('color', "#fff");
                $("#player"+htmlID+"BoostBar").css('background-color', "#fff");
                // Stuff to be added: fix back to old colours once player is switched.
                // Function is disabled until fixed.
                for (let j = 0; j <= 5; j++) {
                    if (j !== sortedPlayerListAll.indexOf(targetPlayer)) {
                        let current_html_id = j+1;
                        if (d['players'][sortedPlayerListAll[j]]['team'] === 0) {
                            $("#player"+current_html_id+"Background").css('background-color', "white");
                            $("#player"+current_html_id+"Name").css('color', "#1873ff");
                            $("#player"+current_html_id+"Boost").css('color', "#1873ff");
                            $("#player"+current_html_id+"BoostBar").css('background-color', "#1873ff");
                        } else {
                            $("#player"+current_html_id+"Background").css('background-color', "white");
                            $("#player"+current_html_id+"Name").css('color', "#ff7200");
                            $("#player"+current_html_id+"Boost").css('color', "#ff7200");
                            $("#player"+current_html_id+"BoostBar").css('background-color', "#ff7200");
                        }
                    }
                }
            }
        }
        activePlayerChanges();
        //Active player stats
    });
});

/*
$(() => { //Generate the Goal Scored text
    WsSubscribers.init(49322, true);
    WsSubscribers.subscribe("game", "goal_scored", (d) => {
        $(".goal.state").text((d['ball_last_touch']['player'].slice(0,-2))+" Scored!");
    })
});

$(() => { //Remove the Goal Scored text
    WsSubscribers.init(49322, true);
    WsSubscribers.subscribe("game", "replay_end", (d) => {
        $(".goal.state").text("")
    })
}); */

/*
$(() => {
    WsSubscribers.init(49322, true);
    WsSubscribers.subscribe("game", "statfeed_event", (d) => {
        $("#sentStatfeed").text("There is/was an active game:statfeed event")
    })
}); */