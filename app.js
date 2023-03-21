const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Database
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {
    useNewUrlParser: true,
});

const itemsSchema = {
    name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!",
});

const item2 = new Item({
    name: "Hit the + button to add a new item.",
});

const item3 = new Item({
    name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

// Get, Post
app.get("/", (req, res) => {
    const day = date.getDate();
    Item.find()
        .then((foundItems) => {
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems)
                    .then((res) => {
                        console.log("Successfully saved default items to DB.");
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                res.redirect("/");
            } else {
                res.render("list", {
                    listTitle: day,
                    newListItems: foundItems,
                });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName,
    });
    if (listName === date.getDate()) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then((foundList) => {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.list;

    if (listName === date.getDate()) {
        Item.findByIdAndRemove(checkedItemId)
            .then((res) => {
                console.log("Successfully deleted checked item.");
            })
            .catch((err) => {
                console.log(err);
            });
        res.redirect("/");
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } }
        )
            .then((res) => {
                console.log("Successfully deleted checked item.");
            })
            .catch((err) => {
                console.log(err);
            });
        res.redirect("/" + listName);
    }
});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName })
        .then((foundList) => {
            if (!foundList) {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items,
                });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
