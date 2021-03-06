const express = require('express');
const path = require('path');

const expressSession = require('express-session');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const jwt = require('jsonwebtoken');

const accessTokenSecret = 'youraccesstokensecret';
require('dotenv').config();

const open = require('open');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRouter = require('./auth');

// App Variables
const app = express();
const port = process.env.PORT || '8000';

// Session Configuration
const session = {
    secret: process.env.SESSION_SECRET,
    cookie: {},
    resave: false,
    saveUninitialized: false,
};

if (app.get('env') === 'production') {
    // Serve secure cookies, requires HTTPS
    session.cookie.secure = true;
}

// Passport Configuration
const strategy = new Auth0Strategy(
    {
        domain: process.env.AUTH0_DOMAIN,
        clientID: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        callbackURL: process.env.AUTH0_CALLBACK_URL,
    },
    (accessToken, refreshToken, extraParams, profile, done) => {
        // Access tokens are used to authorize users to an API
        // accessToken is the token to call the Auth0 API or a secured 3rd-party API
        // extraParams.id_token has the JSON Web Token (JWT)
        // profile has all the information from the user
        return done(null, profile);
    },
);

// App Configuration
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.use(expressSession(session));

passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Creating custom middleware with Express
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    if (req.user) {
        if(typeof(res._headers.authorization) === "undefined") {
            const accessToken = jwt.sign(req.user._json, accessTokenSecret, {expiresIn: '20m'});
            res.setHeader('Authorization', 'Bearer ' + accessToken);
        }
    }else if (!req.user){
        try {
            res.setHeader('Authorization', ' ');
        }catch{}
    }
    next();
});

// Router Mounting
app.use('/', authRouter);


// Routes Definitions
const secured = (req, res, next) => {
    if (req.user) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
};
const authenticateJWT = (req, res, next) => {
    console.log("authenticating");
    if (req.user) {
        const authHeader = res._headers.authorization;
        console.log(authHeader);
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, accessTokenSecret, (err, user) => {
                if (err) {
                    return res.sendStatus(403);
                }
                req.user = user;
                next();
            });
        } else {
            res.sendStatus(401);
        }
    } else {
        console.log("Failed to validate token!");
        req.session.returnTo = req.originalUrl;
        res.redirect("/login");
    }
};
app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

app.get('/user', authenticateJWT, (req, res, next) => {
    const { _raw, _json, ...userProfile } = req.user;
    res.render('user', {
        title: 'Profile',
        userProfile: userProfile,
    });
});

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});

/*
const app = express();
app.use(cors());
app.use(express.static('docs'));

// create express app

// Setup server port
// const port = process.env.PORT || 5000;

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// define a root route

// Require employee routes
const citiesRoutes = require('./routes/cities.routes');

// using as middleware
app.use('/api/v1/cities', citiesRoutes);

app.set('port', process.env.PORT || 8000);
app.set('ip', process.env.NODEJS_IP || '127.0.0.1');

app.listen(app.get('port'), () => {
    console.log('%s: Node server started on %s ...', Date(Date.now()), app.get('port'));
    open('http://localhost:8000');
}); */

