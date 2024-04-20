const dotenv = require('dotenv')
dotenv.config({path : './config.env'})
const app = require('./app')


<<<<<<< HEAD
const port = process.env.PORT || 3000;
=======
const port = process.env.PORT || 8000;
>>>>>>> 49baad980be8db8cdb9df8fce9158e04829da182
app.listen(port, () => {
    console.log(`App is running on port ${port}...`)
})