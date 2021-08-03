//jshint eversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

//set our apps view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
//res.render uses the view engine to render index page

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//item schema and model with a string
const itemsSchema = {
  name: String
};

const Item = new mongoose.model("item", itemsSchema);

const item1 = new Item({
  name:"Welcome to my TO DO List"
});
//item1.save();
const defaultItem = [item1];


//list schema and model with a name and items in it
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = new mongoose.model("list", listSchema);

//default lists
const personalList = new List({
  name: "Personal",
  items: defaultItem
});

const workList = new List({
  name: "Work",
  items: defaultItem
});

const miscList = new List({
  name: "Miscellaneous",
  items: defaultItem
});

const defaultList = [personalList, workList, miscList];


app.get("/", function(req, res) {
  var day = date.getDate();
  // we have to find the list of List Items
  List.find({}, function(err, foundLists) {
    //console.log("foundLists:"+foundLists);

    if (foundLists.length === 0) {
      //  if List Items is empty we insert default list names
      List.insertMany(defaultList, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default list");
        }
      });
      res.redirect("/");
    } else {
      // else we render the home page with the list
      res.render("home", {ListTitle: day, newList: foundLists});
    }
  });
});

 app.post("/", function(req, res) {
   //console.log(req.body);
   const newListName = _.capitalize(req.body.newList);
   //console.log(newListName);

   //checking if the newListName already exist
   List.findOne({name: newListName}, function(err, foundList) {
     //console.log("Found List: " + foundList);
     if (!err) {
       if (!foundList) {
         //if does not exist then add a new list name
         const newlistItem = new List({
           name: newListName,
           items: defaultItem
         });
         newlistItem.save();
         //console.log("New List added successfully: " + newlistItem);
         res.redirect("/");
       } else {
         //else go back to the home page
         res.redirect("/");
       }
     }
   });
 })


app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const checkedListName = req.body.listName;

  List.findOneAndUpdate({name:checkedListName},{$pull:{items:{_id:checkedItemId}}}, function(err, foundlist){
    if(!err){
      Item.findByIdAndRemove({_id:checkedItemId}, function(err, foundItem){
        if(!err){
          console.log("Successfully deleted checked item.");
          res.redirect("/"+checkedListName);
        }
      });
    }
  });
 });

//
// // // app.get("/about", function(req, res) {
// // //   res.render("about");
// // // });
//
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  console.log(customListName);

  //check if the list exists
  List.findOne({name: customListName}, function(err, foundList) {
    if(!err){
      //console.log("custom foundList:"+foundList);
      if (!foundList) {
        //if the list does not exists create the list
        const newList = new List({
          name: customListName,
          items: defaultItem
        });
        newList.save();
        //console.log(newList);
        res.redirect("/" + customListName);
      } else {
        //if list exists, add default items
        res.render("list", {ListTitle: foundList.name, newItems: foundList.items});
        //console.log(foundList.items);
      }
    }
  });
});

app.post("/:customListName", function(req, res) {
  const listName = req.params.customListName;
  const newItemName = req.body.newItem;
  List.findOne({name: listName}, function(err, foundList) {
    //console.log("List with same custom name: " + foundList);
    if (!err) {
      if (foundList) {
        const newItem = new Item({
          name: newItemName
        });
        newItem.save();
        foundList.items.push(newItem);
        foundList.save();
        //console.log("List after saving new item: " + foundList);
        res.render("list", {
          ListTitle: foundList.name,
          newItems: foundList.items
        });
      }
    }
  });
});

app.listen(3000, function(req, res) {
  console.log("Server started on port 3000");
});
