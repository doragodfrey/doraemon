var express = require('express');
var router = express.Router();
var moment = require('moment');

module.exports = router;




// =========================================================
// =
// =   SET UP MONGODB AND MONGOOSE
// =

// MongoDB is a JavaScript-oriented database.
// http://docs.mongodb.org/manual/core/crud-introduction/

// --> In Cloud9, you need to start MongoDB before running your app by typing 
// ./mongod 
// at the terminal ("bash" window). But you only need to do that once per workspace. 
// MongoDB should run forever after that.

// Mongoose makes it easy to access MongoDB using a pattern of "models".
// http://mongoosejs.com

// Use Mongoose to connect to the MongoDB database. We'll call our
// database "networks". It will be created automatically if it doesn't already exist.

var mongoose = require('mongoose');
mongoose.connect('mongodb://' + process.env.IP + '/networks');




// =========================================================
// =
// =   DEFINE OUR DATA MODELS
// =

// Define the data structure of a Submission model
// It has left, up, right, and down attributes, which should be numbers
// We'll force them to be integers (with 0 as default) using parseInt in a setter, and also validate their min and max values.
// Allowed data types (Number, String, Date...): http://mongoosejs.com/docs/schematypes.html

var Submission = mongoose.model('Submission', {
  left: {type: Number, min: 0, max: 50, required: true, set: function(v) { return parseInt(v || 0); }},
  up: {type: Number, min: 0, max: 35, required: true, set: function(v) { return parseInt(v || 0); }},
  right: {type: Number, min: 0, max: 50, required: true,set: function(v) { return parseInt(v || 0); }},
  down: {type: Number, min: 0, max: 35, required: true, set: function(v) { return parseInt(v || 0); }},
  created: {type: Date, default: Date.now}
});





// =========================================================
// =
// =   WEB ROUTES
// =


// HOME PAGE
// /
// Shows _all_ the phrases

router.get('/', function(request, response, toss) {
  
  // TODO: Arrowheads
  // TODO: Change direction every night at midnight
  // TODO: Don't allow values to go off the page
  
  // When the server receives a request for "/", this code runs

  // Find all the Shape records in the database
  Submission.find(function(err, submissions) {
    // This code will run once the database find is complete.
    // phrases will contain a list (array) of all the phrases that were found.
    // err will contain errors if any.

    // If there's an error, tell Express to do its default behavior, which is show the error page.
    if (err) return toss(err);
    
    // Size of a grid unit in pixels
    var grid_unit_w = 22;
    var grid_unit_h = 22;
  
    // Starting position in grid units
    var x = 22;
    var y = 15;
    
    // Starting color
    var color = 1;
    
    var segments = [];
    
    // Go through each submission
    var i = 0;
    while (i < submissions.length) {
      var submission = submissions[i];
      
      if (submission.left > 0) {
        x -= submission.left;
        segments.push({
          left: x * grid_unit_h,
          top: y * grid_unit_h,
          width: submission.left * grid_unit_w,
          height: 2,
          color: color,
          id: submission.id
        })
      }
      if (submission.up > 0) {
        y -= submission.up;
        segments.push({
          left: x * grid_unit_h,
          top: y * grid_unit_h,
          width: 2,
          height: submission.up * grid_unit_h,
          color: color,
          id: submission.id
        })
      }
      if (submission.right > 0) {
        segments.push({
          left: x * grid_unit_h,
          top: y * grid_unit_h,
          width: submission.right * grid_unit_w,
          height: 2,
          color: color,
          id: submission.id
        })
        x += submission.right;
      }
      if (submission.down > 0) {
        segments.push({
          left: x * grid_unit_h,
          top: y * grid_unit_h,
          width: 2,
          height: submission.down * grid_unit_h,
          color: color,
          id: submission.id
        })
        y += submission.down;
      }

      // When we go to the next submission, increase the color
      color += 1;
      if (color > 4) {
        color = 1;
      }

      i += 1;
    }
    
    // The list of segments will be passed to the template.
    // Any additional variables can be passed in a similar way (response.locals.foo = bar;)
    response.locals.segments = segments;
    response.locals.submissions = submissions.reverse().slice(0, 121);
    response.locals.remaining = 200 - submissions.length;
    
    // layout tells template to wrap itself in the "layout" template (located in the "views" folder).
    response.locals.layout = 'layout';

    // Render the "home" template (located in the "views" folder).
    response.render('home');

  });
  
});




// CREATE PAGE
// /create?up=1&down=2&right=3&left=4
// Normally you get to this page by clicking "Submit" on the /new page, but
// you could also enter a URL like the above directly into your browser.

router.get('/create', function(request, response, toss) {
  
  // When the server receives a request for "/create", this code runs
  
  response.locals.layout = 'layout';
  
  // Count the number of submissions so far
  Submission.count(function(err, how_many) {
    if (err) return toss(err);
    if (how_many >= 200) {
      console.log("Resetting!");
      Submission.find().remove(function(err) {
        if (err) return toss(err);
      });
    }
    
    // Make a new Submission in memory, with the parameters that come from the URL 
    // and store it in the submission variable
    // TODO: When a remove happens, this hsould really happen in the remove callback, otherwise \
    //   the remove could happen after the new segment is added.
    var submission = new Submission({
      up: request.query.up,
      down: request.query.down,
      left: request.query.left,
      right: request.query.right,
    });
    
    // Now save it to the database
    submission.save(function(err) {
      // This code runs once the database save is complete
  
      // An err here can be due to validations
      if (err) return toss(err);
      
      // Instead of rendering a "thank you" page, just redirect home now
      response.redirect('/');
  
    });  
    
  });
  
});



// RESET PAGE
// /reset
// DANGER! Clears the whole database with no warning

router.get('/reset', function(request, response, toss) {
  Submission.find().remove(function(err) {
    if (err) return toss(err);
    response.redirect('/');
  });
});