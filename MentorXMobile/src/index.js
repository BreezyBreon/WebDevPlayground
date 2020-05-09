require('./models/User')

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();


const app = express();

app.use(bodyParser.json());
app.use(authRoutes);

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
    console.log("Connected to MongoDB instance succesfully");
});

mongoose.connection.on('error', err => {
    console.error("Error in connecting to MongoDB", err);
});



app.get('/', (req, res) => {
    res.send('Hi there!')
});

app.listen(3000, () => {
    console.log('Server succesffully started on port 3000');
});