const express = require('express');
const app = express();
require('dotenv').config(); 
const cors = require('cors');
const dbConfig = require('./config/dbConfig'); 

app.use(express.json()); 
app.use(cors()); 

// Routes
const usersRoute = require('./routes/usersRoute');
const busesRoute = require('./routes/busesRoute');
const bookingsRoute = require('./routes/bookingsRoute');
const companysRoute = require('./routes/companysRoute');
const adminRoute = require('./routes/adminRoute');
const tripsRoute = require('./routes/tripsRoute');
const stationsRoute = require('./routes/stationsRoute');

// Utilisation des Routes
app.use('/api/users', usersRoute);
app.use('/api/buses', busesRoute);
app.use('/api/bookings', bookingsRoute);
app.use('/api/companys', companysRoute);
app.use('/api/admin', adminRoute);
app.use('/api/trips', tripsRoute);
app.use('/api/stations', stationsRoute);


// Port d'écoute
const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Listening on port ${port}!`);
});  
