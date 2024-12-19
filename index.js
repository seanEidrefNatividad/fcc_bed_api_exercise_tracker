const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose')
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({extended:false}))

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
})

const exerciseLogSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  }
})

const User = mongoose.model('user',userSchema);
const Log = mongoose.model('exercise_log',exerciseLogSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users')
.get((req,res) => {
  User.find({}, (err,result)=>{
    res.json(result)
  })
})
.post((req,res) => {
  const username = req.body.username
  const newUser = new User({
    username
  })
  newUser.save((err, result)=>{
    if (err) {console.log(err); return;}
    res.json({username, "_id":result._id})
  })
})

app.route('/api/users/:_id/exercises')
.post((req,res) => {
  const {description, duration} = req.body
  const id = req.params._id;
  const d = req.body.date
  const date = new Date(d).toString() === "Invalid Date" 
    ? new Date().toDateString()
    : new Date(d).toDateString();
  const newExerciseLog = new Log({
    description, 
    duration, 
    date,
    user_id: id
  })
  newExerciseLog.save((err,result) => {
    if (err) {console.log(err); return;}
    User.find({_id:id}, (err,result)=>{
      if (err) {console.log(err); return;}
      const {_id, username} = result[0]
      res.json({_id, username, date, duration:parseInt(duration), description})
    })
  })
})

app.route('/api/users/:_id/logs')
.get((req,res)=>{
  console.log('body',req.body)

  const {from} = req.query
  console.log('from',from)

  const _id = req.params._id;
  User.find({_id}, (err,result)=>{  
    if(err) {console.log(err); return;}
    const {username} = result[0]

    Log.find({user_id:_id})
    .select('-_id description duration date')
    .exec((err,log)=>{
      if(err) {console.log(err); return;}

      const count = log.length
      res.json({_id,username,count,log})
    })
  })
})
.post((req,res)=>{
  console.log('body',req.body)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
