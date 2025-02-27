require('dotenv').config()
const express = require('express')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 9000
const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://lost-and-found-db5b7.web.app',
    'https://lost-and-found-db5b7.firebaseapp.com'
  ],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'unAthorize Access' })
  }
  // verify token
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unAthorize Access' })
    }
    req.user = decoded;
    next()
  })

}
// username: 
// password: 


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ahkjv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("lost&foundDB");
    const lostAndFoundCollection = database.collection("lostAndFoundItems");
    const recoveredCollection = database.collection("recoveredItems");

    // get all items mongodb to server
    app.get('/allItems', async (req, res) => {
      const search = req.query.search || " ";
      const itemType = req.query.itemType;
      
      let query = {title:{
         $regex: search, $options: 'i'
      }}
      if(itemType){
        query.type = itemType;
      }

      const result = await lostAndFoundCollection.find(query).toArray()
      res.send(result)
    })
    // get one items by id from mongodb to server
    app.get('/allItems/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await lostAndFoundCollection.findOne(query)
      res.send(result)
    })
    // get my add items by user email 
    app.get('/allItems/myItems/:email',verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      //  check valid user
      if(req.user.email !== req.params.email){
        return res.status(403).send({message: 'forbidden'})
    }

      const cursor = lostAndFoundCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.put('/allItems/:id', async (req, res) => {
      const id = req.params.id;
      const updateItem = req.body;
      console.log(updateItem)
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateData = {
        $set: {
          title: updateItem.title,
          type: updateItem.type,
          date: updateItem.date,
          category: updateItem.category,
          description: updateItem.description,
          displayName: updateItem.displayName,
          userEmail: updateItem.userEmail,
          image: updateItem.image
        },
      };
      const result = await lostAndFoundCollection.updateOne(filter, updateData, options);
      res.send(result)

    })
    // delete one items by id from db
    app.delete('/allItems/myItems/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) }
      const result = await lostAndFoundCollection.deleteOne(query);
      res.send(result)
    })

    // insert one item client to db;
    app.post('/allItems', async (req, res) => {
      const lostAndFoundItems = req.body;
      const result = await lostAndFoundCollection.insertOne(lostAndFoundItems);
      res.send(result)
    })
    // update status in db
    app.patch('/allItems/:id',async(req,res)=>{
      const id = req.params.id;
      const {curStatus} = req.body;
      console.log(curStatus)
      const filter = {_id: new ObjectId(id)}
      const updateData = {
        $set: {status: curStatus},
      }
      const result = await lostAndFoundCollection.updateOne(filter,updateData)
      res.send(result)
    })

    // recovered collection start here
    // insert one items client to db;
    app.post('/recoveredItems', async (req, res) => {
      const recoveredItems = req.body;
      const result = await recoveredCollection.insertOne(recoveredItems);
      res.send(result)
    })

    // jwt create start here
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '1h'
      })

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",//its will be when its render for production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
        .send({ success: true })
    })
    // clear cookie 
    app.post('/logout', (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
        .send({ success: true })
    })

    // Send a ping to confirm a successful connection
    // // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Welcome to Lost and Found Server....')
})

app.listen(port, () => console.log(`Server running at http://localhost:${port}`))
