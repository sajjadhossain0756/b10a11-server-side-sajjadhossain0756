const express = require('express')
const cors = require('cors')
require('dotenv').config()

const port = process.env.PORT || 9000
const app = express()

app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
  res.send('Welcome to Lost and Found Server....')
})

app.listen(port, () => console.log(`Server running at http://localhost:${port}`))
