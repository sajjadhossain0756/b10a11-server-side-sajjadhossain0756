require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 9000
const app = express()

app.use(cors())
app.use(express.json())

// username: Lost_and_Found
// password: qZf8ZVAqeS1Fh96X


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

    // get all items mongodb to server
    app.get('/allItems',async(req,res)=>{
        const result = await lostAndFoundCollection.find().toArray()
        res.send(result)
    })
    // get one items by id from mongodb to server
    app.get('/allItems/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await lostAndFoundCollection.findOne(query)
        res.send(result)
    })
    // insert one item client to db;
    app.post('/allItems',async(req,res)=>{
        const lostAndFoundItems = req.body;
        const result = await lostAndFoundCollection.insertOne(lostAndFoundItems);
        res.send(result)
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
