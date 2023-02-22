const mongoose = require("mongoose");

exports.connectDatabase = () => {
  mongoose
    .connect(`mongodb+srv://pritam:${process.env.password}@news1.hujrnsz.mongodb.net/shortNews`)
    .then((con) => console.log("database connected ", con.connection.host))
    .catch((err) => console.error(err));
};
