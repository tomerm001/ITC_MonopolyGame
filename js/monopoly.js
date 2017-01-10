var Monopoly = {};
Monopoly.allowRoll = true;  //control useraction
Monopoly.moneyAtStart = 3;  //default value for money to start game
Monopoly.doubleCounter = 0;   //counts amount of double throws
Monopoly.doubleTrown = false; //each throw check if double thrown
Monopoly.maxPlayers  = 6; //maximum amount of players
Monopoly.playersRemoved = 0;


// =====  INIT FUNCTION FOR GAME  =====
Monopoly.init = function(){
    $(document).ready(function(){
        
        //Calulate and adjust board size
        Monopoly.adjustBoardSize();

        //binds event listener to window resize
        $(window).bind("resize",Monopoly.adjustBoardSize);

        //add even listener to dice so can be clicked
        Monopoly.initDice();

        //initiate the popups
        Monopoly.initPopups();

        //start the monopoly game
        Monopoly.start();        
    });
};


//start game by showing the popup window
Monopoly.start = function(){
    Monopoly.showPopup("intro")
};

//remove player from game
Monopoly.removePlayer = function (player){

    //player name in string
    var playerString = player.attr("id");

    //find all properties of user
    var allProprties = $(".game.cell.property"+ "." + playerString);

    //remove all attributes
    allProprties.addClass("available");
    allProprties.removeAttr('data-owner');
    allProprties.removeAttr('data-rent');


    //remove player from class of property
    allProprties.removeClass(playerString);

    //add to removed counter
    Monopoly.playersRemoved++;

    //remove player from game board / DOM
    player.remove();

}


//user is bankrupt
Monopoly.handleBroke = function(player) {

    //show popup for you have to pay rent
    var popup = Monopoly.getPopup("broke");

    //add event listener
    popup.find("button").unbind("click").bind("click",function(){
        
        Monopoly.setNextPlayerTurn();
        Monopoly.removePlayer(player);
       
        Monopoly.closePopup();

    });

    Monopoly.closePopup();


    //show pop up window
    Monopoly.showPopup("broke");

    //play sound of broke
    Monopoly.playSound("woopwoop");
}


//adds event listner to dice, only works if allowRoll = true
Monopoly.initDice = function(){
    $(".dice").click(function(){
        if (Monopoly.allowRoll){
            Monopoly.rollDice();
        }
    });
};

//gets drom DOM player with .current player
Monopoly.getCurrentPlayer = function(){
    return $(".player.current-turn");
};

//gets the closest div with class .cell that the player is in
Monopoly.getPlayersCell = function(player){
    return player.closest(".cell");
};

//get balance of mony for specific player
Monopoly.getPlayersMoney = function(player){
    return parseInt(player.attr("data-money"));
};

//adjust the wallet of the user
Monopoly.updatePlayersMoney = function(player,amount){
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;

    //check if broke
    if (playersMoney < 0 ){
        Monopoly.handleBroke(player);
        return true;
    }
    else{
        //update title and data-money attribute
        player.attr("data-money",playersMoney);
        player.attr("title",player.attr("id") + ": $" + playersMoney);
        Monopoly.playSound("chaching");
    }
};


//Randomizer of Dice, get current user and call function to handle move
Monopoly.rollDice = function(){

    //randomize number from 1 - 6
    var result1 = Math.floor(Math.random() * 6) + 1 ;
    var result2 = Math.floor(Math.random() * 6) + 1 ;

    //gets only divs which could have a black dot and makes all to oppacity 0
    $(".dice").find(".dice-dot").css("opacity",0);

    //change opacity of correct dots
    $(".dice#dice1").attr("data-num",result1).find(".dice-dot.num" + result1).css("opacity",1);
    $(".dice#dice2").attr("data-num",result2).find(".dice-dot.num" + result2).css("opacity",1);
    
    //if dice hits double add to counter
    if (result1 == result2){
        Monopoly.doubleCounter++;
        Monopoly.doubleTrown = true;
    }

    //get current activae player, DOM with class current player
    var currentPlayer = Monopoly.getCurrentPlayer();


    //move the player according to the ammount of dice
    Monopoly.handleAction(currentPlayer,"move",result1 + result2);
};


//moves the player to the correct DIV according to dice
Monopoly.movePlayer = function(player,steps){
    
    //Sets boolean so user can not roll the dice
    Monopoly.allowRoll = false;
    
    //Creates a loop with counter steps, untill step is 0
    var playerMovementInterval = setInterval(function(){
        
        //if not more steps left
        if (steps == 0){
            clearInterval(playerMovementInterval);

            //play the actual move
            Monopoly.handleTurn(player);
        }
        //if steps left
        else{

            //gets the div the player is currently in
            var playerCell = Monopoly.getPlayersCell(player);

            //get next cell and act if a Go cell
            var nextCell = Monopoly.getNextCell(playerCell);

            //append the player into next cell (in turn removing from the previous one)
            nextCell.find(".content").append(player);
            steps--;
        }
    },200);
};


//handle the case when player lands on a spot and no turns left
Monopoly.handleTurn = function(){

    //get object of current player
    var player = Monopoly.getCurrentPlayer();

    //get the position div of current player
    var playerCell = Monopoly.getPlayersCell(player);

    //check class of landed div

    //if the cell is a property and availble to purchase
    if (playerCell.is(".available.property")){
        Monopoly.handleBuyProperty(player,playerCell);
    }
    
    //if the cell is a property but not availble  --> pay rent
    else if(playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))){
         Monopoly.handlePayRent(player,playerCell);
    }
    
    //if landing on go to jail --> send to jail
    else if(playerCell.is(".go-to-jail")){
        Monopoly.handleGoToJail(player);
    }
    
    //if take a chance --> pull card
    else if(playerCell.is(".chance")){
        Monopoly.handleChanceCard(player);
    }
    
    //if community --> take card
    else if(playerCell.is(".community")){
        Monopoly.handleCommunityCard(player);
    }
    
    //if non of the cases above next users turn
    else{
        Monopoly.setNextPlayerTurn();
    }
}

//update current player to next player taking into account if user is in jail
Monopoly.setNextPlayerTurn = function(){

    //check if user trew a double and if its not its third time
    if(Monopoly.doubleTrown && (Monopoly.doubleCounter < 3 )){

        //get DOM object of current player
        var currentPlayerTurn = Monopoly.getCurrentPlayer();

        //reset double throw
        Monopoly.doubleTrown = false;

        if (currentPlayerTurn.is(".jailed")){

            //reset double counter
            Monopoly.doubleCounter = 0;

            //Set the next player (will not enter next round)
            Monopoly.setNextPlayerTurn();
            return;
        }
    
    }

    //if no double
    else{
        //get DOM object of current player
        var currentPlayerTurn = Monopoly.getCurrentPlayer();

        // get id of player
        var playerId = parseInt(currentPlayerTurn.attr("id").replace("player",""));

        var nextPlayerId = playerId;

        do{
            //increase id number
            var nextPlayerId = nextPlayerId + 1;

            //check amount of players and if more chnage back to 1
            if (nextPlayerId > (($(".player").length) + Monopoly.playersRemoved)){
                nextPlayerId = 1;
            }

            //get object of next player
            var nextPlayer = $(".player#player" + nextPlayerId);

            //check if playerIsInGame
        }while(nextPlayer.length == 0);


        //remove class from current player
        currentPlayerTurn.removeClass("current-turn");

        //get object of next player
        var nextPlayer = $(".player#player" + nextPlayerId);

        
        //add class to new player
        nextPlayer.addClass("current-turn");


        //reset double counter
        Monopoly.doubleCounter = 0;

        //check if the player is in jail
        if (nextPlayer.is(".jailed")){

            //check how long in jail
            var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
            currentJailTime++;

            //update new time in jail
            nextPlayer.attr("data-jail-time",currentJailTime);
            if (currentJailTime > 3){

                //if already in jail 3 turns join game for next turn
                nextPlayer.removeClass("jailed");
                nextPlayer.removeAttr("data-jail-time");
            }

            //Set the next player (will not enter if clause for jail this time)
            Monopoly.setNextPlayerTurn();
            return;
        }
    }

    Monopoly.closePopup();

    //update boolean to allow click
    Monopoly.allowRoll = true;
};

//if cell is free and user can purchase
Monopoly.handleBuyProperty = function(player,propertyCell){

    //caluclate cost for purchase
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    
    //show popup window
    var popup = Monopoly.getPopup("buy");

    //update content of pop up cell with actual price
    popup.find(".cell-price").text(propertyCost);
    
    //add event listener to button
    popup.find("button").unbind("click").bind("click",function(){
        
        //save click object
        var clickedBtn = $(this);
        
        //if yes is pressed call buy function
        if (clickedBtn.is("#yes")){
            Monopoly.handleBuy(player,propertyCell,propertyCost);
        }
        //if not, close the popup window and proceed to next player
        else{
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};

//in case rent has to be paid
Monopoly.handlePayRent = function(player,propertyCell){
    
    //show popup for you have to pay rent
    var popup = Monopoly.getPopup("pay");

    //get rent price for porperty
    var currentRent = parseInt(propertyCell.attr("data-rent"));

    //get the id of the owner
    var properyOwnerId = propertyCell.attr("data-owner");

    //update content of popup window (owner and rent price)
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    
    //add event listener to click button
    popup.find("button").unbind("click").bind("click",function(){
        
        //get DOM object for proprty owner
        var properyOwner = $(".player#"+ properyOwnerId);
        console.log(properyOwnerId)

        //add money to owner
        Monopoly.updatePlayersMoney(player,currentRent);

        //remove money from payer
        Monopoly.updatePlayersMoney(properyOwner,-1*currentRent);

        //jump to next turn
        Monopoly.closeAndNextTurn();
    });

    ///close the popup window for paying
   Monopoly.showPopup("pay");
};

//send user to jail 
Monopoly.handleGoToJail = function(player){
    
    //popup jail window
    var popup = Monopoly.getPopup("jail");

    //add event listener
    popup.find("button").unbind("click").bind("click",function(){
        
        //put user in jail and adjust classes and jail counters
        Monopoly.handleAction(player,"jail");
    });

    // show pop up of going to jail
    Monopoly.showPopup("jail");
};

//gandle chance card
Monopoly.handleChanceCard = function(player){

    //Open popup window for chance card
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");

    //Make an AJAX call to get a new card
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function(chanceJson){

        //call back function with results
        //update content of popup window
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);

        //Remove the class of loading 
        popup.find(".popup-content").removeClass("loading-state");

        //add card content to the button (amount and action type)
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");


    //add event listner to button
    popup.find("button").unbind("click").bind("click",function(){

        //get DOM of button
        var currentBtn = $(this);

        //update variables with button content of card
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        console.log("testing the action and amount " + action + " " + amount)

        //handle the action provided by the card
        Monopoly.handleAction(player,action,amount);
    });

    //show the result of the popup
    Monopoly.showPopup("chance");
};

//handle community card, not implemented
Monopoly.handleCommunityCard = function(player){

    //Open popup window for chance card
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");

 
    //Make an AJAX call to get a new card
    $.get("https://itcmonopoly.appspot.com//get_random_community_card", function(communJson){

        console.log(communJson);


         //call back function with results
        //update content of popup window
        popup.find(".popup-content #text-placeholder").text(communJson["content"]);
        popup.find(".popup-title").text(communJson["title"]);

        //Remove the class of loading 
        popup.find(".popup-content").removeClass("loading-state");

        //add card content to the button (amount and action type)
        popup.find(".popup-content button").attr("data-action",communJson["action"]).attr("data-amount",communJson["amount"]);

    },"json");



     //add event listner to button
    popup.find("button").unbind("click").bind("click",function(){

        //get DOM of button
        var currentBtn = $(this);

        //update variables with button content of card
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        console.log("testing the action and amount " + action + " " + amount)

        Monopoly.closePopup();

        //handle the action provided by the card
        Monopoly.handleAction(player,action,amount);
    });

    //show the result of the popup
    Monopoly.showPopup("community");
     
};

//send user to jail, udate class and add jail time counter
Monopoly.sendToJail = function(player){
    player.addClass("jailed");
    player.attr("data-jail-time",1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};


//show the popup window of specific event
Monopoly.getPopup = function(popupId){
    return $(".popup-lightbox .popup-page#" + popupId);
};


//calculate the cost of purchasing the property
Monopoly.calculateProperyCost = function(propertyCell){

    //get attribute of data-group which holds the price data
    var cellGroup = propertyCell.attr("data-group");

    //calculate price
    var cellPrice = parseInt(cellGroup.replace("group","")) * 5;

    //if property is a rail, default 10
    if (cellGroup == "rail"){
        cellPrice = 10;
    }
    return cellPrice;
};

//calculate the cost for rental 
Monopoly.calculateProperyRent = function(propertyCost){
    return propertyCost/2;
};

//sets the next player and closes all popups
Monopoly.closeAndNextTurn = function(){
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};

//initiate the popup mene
Monopoly.initPopups = function(){

    //add event listner to button
    $(".popup-page#intro").find("button").click(function(){

        //get content of input
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        
        //if inout is undefined dont do anything
        if (Monopoly.isValidInput("numofplayers",numOfPlayers)){

            //create players according to inout
            Monopoly.createPlayers(numOfPlayers);

            //close/fade out the popup window
            Monopoly.closePopup();
        }
    });
};

//function for user to purchsase property
Monopoly.handleBuy = function(player,propertyCell,propertyCost){

    // get balalance of player
    var playersMoney = Monopoly.getPlayersMoney(player)
    
    //if not sufficient funds
    if (playersMoney < propertyCost){

        Monopoly.playSound("woopwoop");
        Monopoly.showErrorMsg();
    }
    
    //if enough buy property
    else{

        //reduce the players wallet
        Monopoly.updatePlayersMoney(player,propertyCost);
        
        //calcualte the cost for rental on the property
        var rent = Monopoly.calculateProperyRent(propertyCost);

        //adjust classes and attributes, 
        propertyCell.removeClass("available")
                    .addClass(player.attr("id"))
                    .attr("data-owner",player.attr("id"))
                    .attr("data-rent",rent);
        
        //jump to next player
        Monopoly.setNextPlayerTurn();
    }
};




//function to handle moves, payments and jail for a  player
Monopoly.handleAction = function(player,action,amount){
    console.log(action)
    var broke = false;

    switch(action){
        case "move":
       	    console.log(amount)

            //moves the player
            Monopoly.movePlayer(player,amount);
             break;
        case "pay":

            //update wallet
            broke = Monopoly.updatePlayersMoney(player,amount);

            if(!broke){
                //update to  next player
                Monopoly.setNextPlayerTurn();
            }
                break;

        case "jail":

            //set person to jail
            Monopoly.sendToJail(player);
            break;
    };

    if(!broke){
        Monopoly.closePopup();
    }
    
};


//create all player objects
Monopoly.createPlayers = function(numOfPlayers){

    //get object for go cell
    var startCell = $(".go");

    //loop amout of users requried
    for (var i=1; i<= numOfPlayers; i++){


        var player = $("<div />").addClass("player shadowed").attr("id","player" + i).attr("title","player" + i + ": $" + Monopoly.moneyAtStart);

        //add class of playernumber
        player.addClass("player" + i);

        //append user to start cell
        startCell.find(".content").append(player);
        
        //for the first player add current player class
        if (i==1){
            player.addClass("current-turn");
        }

        //add starting money for usrs
        player.attr("data-money",Monopoly.moneyAtStart);
    }
};

//returns the DOM object for the next cell/div the user will jump to
Monopoly.getNextCell = function(cell){
    var currentCellId = parseInt(cell.attr("id").replace("cell",""));
    var nextCellId = currentCellId + 1
    if (nextCellId > 40){
        console.log("YAY")
        
        //if the user gets to cell 40, being the go, it will jump back to 1 and handle go
        Monopoly.handlePassedGo();

        //provide next cell ID
        nextCellId = 1;
    }

    //return the DOM object  of next cell
    return $(".cell#cell" + nextCellId);
};


//function to add money to user when he passes GO
Monopoly.handlePassedGo = function(){
    var player = Monopoly.getCurrentPlayer();

    //update balance of player
    Monopoly.updatePlayersMoney(player,((-1)*(Monopoly.moneyAtStart/10)));
};

//check if input is valid
Monopoly.isValidInput = function(validate,value){
    
    var isValid = false;
    
    switch(validate){
        
        case "numofplayers":
            if(value > 1 && value <= Monopoly.maxPlayers){
                isValid = true;
            }
            else {

            console.log("the val " + value)
            isValid = false;
        }

            break;
    }

    if (!isValid){
        Monopoly.showErrorMsg();
    }
    return isValid;

}

//error message when not enough money to purchase
Monopoly.showErrorMsg = function(){
    $(".popup-page .invalid-error").fadeTo(500,1);
    setTimeout(function(){
            $(".popup-page .invalid-error").fadeTo(500,0);
    },2000);
};

//Adjust the size of board container
Monopoly.adjustBoardSize = function(){
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(),$(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) *2;
    $(".board").css({"height":boardSize,"width":boardSize});
}

//fade out the popup window
Monopoly.closePopup = function(){
    $(".popup-lightbox").fadeOut();
};

//play specific sound 
Monopoly.playSound = function(sound){
    var snd = new Audio("./sounds/" + sound + ".wav"); 
    snd.play();
}

//fucntion to show a specific popup window and hide all others before
Monopoly.showPopup = function(popupId){
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

Monopoly.init();