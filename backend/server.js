import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from "connect-mongo";
import connectDB from './config/database.js'
import Authentication from './routes/Authentication.js'
import issueRoutes from './routes/issueRoutes.js'
import schemeRoutes from './routes/schemeRoutes.js'
import InitiativeRoutes from './routes/InitiativeRoutes.js'

const app = express();
const port = 3000;


app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

connectDB();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        collectionName: "sessions",
    }),
    cookie: {
        httpOnly: true,
        secure: true, //Make it true when deploy
        maxAge: 1000 * 60 * 60 * 24,
    }
}));

app.use(express.json());


app.use('/api/auth', Authentication)
app.use('/api/issues', issueRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/initiatives', InitiativeRoutes);

app.listen(port, () => console.log(`Server started on port: ${port}`));
