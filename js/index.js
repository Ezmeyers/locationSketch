/**
 * Created by: Nick Bowen & Elisabeth Meyers
 * on 4/12/16
 * Please note, there is an issue with the login if you didn't already see in the documentation
 * Sometimes it only allows the user to login the second time they try. 
 */


var map, marker, userLocation, db, sketchController;
var drawingColor = "#000";

//Setup a new Dexie DB
db = new Dexie("SaveSketchDB");

//Create new data stores
db.version(1).stores({
    locations: "++locationId,position,drawingsId,userId",
    drawings: "++drawingsId,userId,time",
    users: "++userId,username,firstName,lastName,email"
});

//opening our DB
db.open();

//call the init function straightaway
init();
//called when the map is ready (the callback function &callback=initMap)
function initMap(){
    //creating a new map- woohoo
    map = new google.maps.Map(document.getElementById('map'),{
        center: {lat: -34.397, lng: 150.644},
        zoom: 8
    });

    //Attempt to geolocate the user's device
    if(navigator.geolocation){
        //get the current position of the user (creepy!)
        navigator.geolocation.getCurrentPosition(function(position){
            //store the user location (even creepier)
            userLocation={
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            //center on the user's location (ok stop it..)
            map.setCenter(userLocation);
            //call function to show location
            showLocations();
        })
    }
}

//new google maps marker to center on the user location on the map
function showLocations(){
        marker = new google.maps.Marker({
            position: userLocation,
            map: map,
            title: 'Click to position choice',
            draggable: true,
            animation: google.maps.Animation.DROP
        });
    //create a little "you are here" info window.
    //disableAutoPan makes it so the map doesn't move when you hover on the infowindow
    var infowindow = new google.maps.InfoWindow({
        content: "you are here",
        disableAutoPan: true
    });

    //attach event listeners to the marker to handle the window hover
    google.maps.event.addListener(marker, 'mouseover', function() {
        infowindow.open(map, this);
    });
    google.maps.event.addListener(marker, 'mouseout', function() {
        infowindow.close();
    });


}

//this saves the position of the user
function savePosition(drawId) {
    var logUser = $("#logUser").val();
    //find where the username is the same as the logged in user
    db.users.where("username").equals(logUser).first().then
    (function (thisUser) {
        //take the user id and associate it with their position and drawing in the DB.
        var userId = JSON.stringify(thisUser.userId);
               var positionData = {
                   position: {lat: marker.position.lat(), lng: marker.position.lng()
                   },
                   drawingsId: drawId,
                   userId: userId
               };
        //add location, drawing id and user id to the db
                db.locations.add(positionData);
    });
}

//initialize stuff
function init() {
    //hide user profile/past sketches on init until logged in
    $(".panel3").hide();
    $(".panel4").hide();
    //hide save button on initialize
    $("#btnSave").hide();
    $("#logout").hide();
    //make a super cool sketch pad thing
    sketchController = $("#sketchpad").sketch().data('sketch');
    //add event listeners to drawing tools to call the respective functions
    $("#colorpicker").on("input", setDrawingColor);
    $("#sizepicker").on("input", setDrawingSize);
}

//drawing tool event handlers
//set the drawing color
function setDrawingColor(event) {
    sketchController.color = this.value;
}

//set the drawing size
function setDrawingSize(event) {
    sketchController.size = this.value;
}

//when save sketch is clicked
$("#btnSave").click(function(){
    var logUser = $("#logUser").val();
    //get a reference to the sketch canvas
    var canvas = document.getElementById("sketchpad");
    //create a new object based on the canvas with the time and the sketch

    //get the user ID, store with drawing..
    db.users.where("username").equals(logUser).first().then
    (function (thisUser) {
        var drawingData = {
            time: Date.now(),
            pixelData: canvas.toDataURL(),
            userId: thisUser.userId
        };
        //add the drawing and time + user id to the db
        db.drawings.add(drawingData).then(function (drawing) {
            savePosition(drawing);
        });
    })

});



//when the drawing dates are clicked, this function is triggered to show the drawings
function showDrawing(id){
    //get the drawings from the db via dexie magic based on the id we passed in
    db.drawings.get(id)
        .then(function (result) {
            //create a new image
            var cvEl = document.createElement("img");
            //make it display data with a URL image
            cvEl.src= result.pixelData;
            //put that image onto the page
            $("#drawingShowcase").html(cvEl);
        })
}


//Handle user registration
$("#register").click(function() {
    //hide the error display div unless it's needed
    $("#feedback").hide();
    //grab the values of the text boxes for registration/signup
    var userName = $(".signUser").val();
    var firstName = $(".signFirst").val();
    var lastName = $(".signLast").val();
    var email = $(".signEmail").val();


    //display errors in the user registration pane
    $("#feedback").html("");


    //validation: we don't want blank values
    if (firstName == "") {
        //show the feedback error div and display message if there's no data
        $("#feedback").show();
        $("#feedback").html("<i>Please enter a first name</i>");
        return;
    }
    else if (lastName == "") {
        //show the feedback error div and display message if there's no data
        $("#feedback").show();
        $("#feedback").html("<i>Please enter a last name</i>");
        return;
    }
    else if (userName == "") {
        //show the feedback error div and display message if there's no data
        $("#feedback").show();
        $("#feedback").html("<i>Please enter a username</i>");
        return;
    }
    else if (email == "") {
        //show the feedback error div and display message if there's no data
        $("#feedback").show();
        $("#feedback").html("<i>Please enter an email</i>");
        return;

    }

    //Check the database to see if the user is already registered. if they are, display a message or else let them register

    //checking for username
    db.users.where("username").equals(userName).first().then(
        function (user) {
            //if username exists in db, alert the user to change their username
            if (user) {
                $("#feedback").show();
                $("#feedback").html("<i>Please try a different username. That user is registered already</i>");
            return;
            }
            //if the user name is ok, check the email
            if(!user){
                db.users.where("email").equals(email).first().then(function (user) {
                    //if the email exists already in the db alert the user
                    if (user) {
                        $("#feedback").show();
                        $("#feedback").html("<i>Please try a different email. That user is registered already</i>");
                        return;
                    }
                    //finally, if both are ok, let them register
                    if (!user) {
                        register(userName, firstName, lastName, email);
                    }
                })
            }
        });
});

    function register(userName,firstName,lastName,email){
    //create a new user object with the values inputted and enter into our db user store
    //then trigger the function onRegistrationSuccess which prompts the user to login
    db.users.add({
        username: userName,
        firstName: firstName,
        lastName: lastName,
        email: email
    }).then(onRegistrationSuccess());
    //clear the inputs
    clearDivs();
        };

function onRegistrationSuccess(){
    $("#logUser").show();
    //TO DO update user table
    $("#myLogin").foundation('open');
    $("#feedback2").show();
    $("#feedback2").html("<p>Thank you for registering.</p>");
    //from here user will likely log in. When they click "login" the next function on this page will call

}

//check that login information matches the database
$("#logMeIn").click(function(){
    console.log('me');
    $("#logUser").show();
    $("#feedback3").hide();
    //grab the values of the login boxes
    var logUser = $("#logUser").val();
    var logEmail = $("#logEmail").val();

    //display errors in the login pane
    $("#feedback3").html("");

    //validate login information
    if(logUser == ""){
        //show the feedback error div and display message if there's no data
        $("#feedback3").show();
        $("#feedback3").html("<i>Please enter a username</i>");
        return;
    }
    else if(logEmail == ""){
        //show the feedback error div and display message if there's no data
        $("#feedback3").show();
        $("#feedback3").html("<i>Please enter an email</i>");
        return;
    }



    //query DB where username equals the one the user entered
    db.users.where("username").equals(logUser).first().then(
        function(sketchUser){
            //if the username and email match in the DB
              //  allow user to login
                var sketchUserId= sketchUser.userId;
                onLoginSuccess(sketchUserId);
            });

    //this will execute if the username and email do not
    //ask the user to enter the correct login information or register
    $("#feedback3").show();
    $("#feedback3").html("<div>Your Login information was not found.<br><small>Are you sure you're a registered user? Please register <button class='fi-pencil' onclick='onLoginFail()'></button> if you haven't already</small></div>");

    listMarkers(logUser);

});

function onLoginFail(){
    $("#mySignup").foundation('open');
}

//display last 5 user drawings
function listDrawings(userId){
    console.log(userId);
    //div to list the drawings
    var drawingListingDiv = $("#drawingListing");
    drawingListingDiv.html("");
    //find where user id matches the drawing in the drawing DB limit to last 5
    db.drawings.where("userId").equals(userId).reverse().limit(5).each(function(drawing){
        //display the dates. Clicking on the date brings up the drawing
            var drawingDate = new Date(drawing.time);
            drawingListingDiv.append();
            drawingListingDiv.append("<li onclick='showDrawing("+ drawing.drawingsId +")'>" + drawingDate.getMonth()+
                " / " + drawingDate.getDate()+ " " + drawingDate.getHours()+"</li>");
        });

}

//do all cool login stuff
function onLoginSuccess(userId){
    listDrawings(userId);
    clearDivs();

    //TO DO: make the off-canvas close when logging in
    $('#canvas').toggleClass('off-Canvas');
    //Close the login
    $("#myLogin").foundation('close');
    //show the user profile
    $(".panel3").show();
    //show the past sketches tab
    $(".panel4").show();
    //show sketch save button
    $("#btnSave").show();
    //hide the "login to save sketch button"
    $("#defaultDrawingFeedback").hide();
    //hide login/register buttons
    $("#sign").hide();
    $("#login").hide();
    //show logout
    $("#logout").show();

    //Here we will display all the features for logged in users
    db.users.where("userId").equals(userId).each(
        function(user){
            $("#panel3").html("<div>Welcome " + user.username + "<br>" + "First Name: " + user.firstName
            + "<br>Last Name: " + user.lastName + "<br>Email: " + user.email + "</div>");
            //TO DO: Would be cool to update user info if we have time
          //  $("#panel3").append("<button class='fi-pencil'>Edit Information</button>");

        });

}


//utility function..clears things
function clearDivs()
{
//if the login information is legitimate also clear out the feedback divs
//this one is when logging in from registration
    $("#feedback2").html("");
    $("#feedback2").hide();
//clear forms
    $("#feedback3").html("");
    $("#feedback3").hide();
    $(".signUser").val("");
    $(".signFirst").val("");
    $(".signLast").val("");
    $(".signEmail").val("");
    $("#logEmail").val("");
}

//logout
$("#logout").click(function(){
    window.location.reload();
});

//this is convoluted..was thinking in terms of sql joins and kinda had a hard time
//realizing that collections don't work that way!

//pass the username
function listMarkers(logUser){
    //find in user id for the user logged in
    db.users.where("username").equals(logUser).first().then
    (function (thisUser) {
        var userId = JSON.stringify(thisUser.userId);
        //find where user located
        db.locations.where("userId")
            .equals(userId)
            .first().then(function(drawing){
            //find user drawing
                getDrawings(drawing);
                })
            })
}

//get the drawings
function getDrawings(drawing){
    var drawId = JSON.stringify(drawing.drawingsId);
    //get last 5 user drawings
    db.drawings.where("userId").equals(drawId).limit(5).reverse().each(function(drawing){
        JSON.stringify(drawing);
        //convert our pixel data
        var drawingHover = drawing.pixelData;
        var cvEl = document.createElement("img");
        //for each drawing found: create a new marker
        marker = new google.maps.Marker({
            position: userLocation,
            map: map,
            title: 'Click to position choice',
            draggable: true,
            animation: google.maps.Animation.DROP,
        });

        //attach the drawing to the infowindow (content: cvEl)
        cvEl.src= drawingHover;
        var infowindow = new google.maps.InfoWindow({
            disableAutoPan: true,
            content: cvEl
        });
        //add our hover event listeners for the new info window
        google.maps.event.addListener(marker, 'mouseover', function() {
            infowindow.open(map, this);
        });
        google.maps.event.addListener(marker, 'mouseout', function() {
            infowindow.close();
        });
    });

}
