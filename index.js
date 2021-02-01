const express = require('express')
const bodyParser = require("body-parser")
// Sessions can be stored server-side (ex: user auth) or client-side
// (ex: shopping cart). express-session saves sessions in a store, and
// NOT in a cookie. To store sessions in a cookie, use cookie-session.
const session = require('express-session')

// TODO: DB
const users = [
  { id: 1, name: 'Aitor', email: "aitor@a.com", password: "secret" },
  { id: 2, name: 'Ana', email: "ana@a.com", password: "secret" },
  { id: 3, name: 'Maria', email: "maria@a.com", password: "secret" }
]
const app = express()

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(
  // Creates a session middleware with given options.
  session({

    // Defaults to MemoryStore, meaning sessions are stored as POJOs
    // in server memory, and are wiped out when the server restarts.
    // store,

    // Name for the session ID cookie. Defaults to 'connect.sid'.
    name: 'sid',

    // Whether to force-save unitialized (new, but not modified) sessions
    // to the store. Defaults to true (deprecated). For login sessions, it
    // makes no sense to save empty sessions for unauthenticated requests,
    // because they are not associated with any valuable data yet, and would
    // waste storage. We'll only save the new session once the user logs in.
    saveUninitialized: false,

    // Whether to force-save the session back to the store, even if it wasn't
    // modified during the request. Default is true (deprecated). We don't
    // need to write to the store if the session didn't change.
    resave: false,

    // Whether to force-set a session ID cookie on every response. Default is
    // false. Enable this if you want to extend session lifetime while the user
    // is still browsing the site. Beware that the module doesn't have an absolute
    // timeout option (see https://github.com/expressjs/session/issues/557), so
    // you'd need to handle indefinite sessions manually.
    // rolling: false,

    // Secret key to sign the session ID. The signature is used
    // to validate the cookie against any tampering client-side.
    secret: `quiet, pal! it's a secret!`,

    // Settings object for the session ID cookie. The cookie holds a
    // session ID ref in the form of 's:{SESSION_ID}.{SIGNATURE}' for example:
    // s%3A9vKnWqiZvuvVsIV1zmzJQeYUgINqXYeS.nK3p01vyu3Zw52x857ljClBrSBpQcc7OoDrpateKp%2Bc

    // It is signed and URL encoded, but NOT encrypted, because session ID is
    // merely a random string that serves as a reference to the session. Even
    // if encrypted, it still maintains a 1:1 relationship with the session.
    // OWASP: cookies only need to be encrypted if they contain valuable data.
    // See https://github.com/expressjs/session/issues/468

    cookie: {

      // Path attribute in Set-Cookie header. Defaults to the root path '/'.
      // path: '/',

      // Domain attribute in Set-Cookie header. There's no default, and
      // most browsers will only apply the cookie to the current domain.
      // domain: null,

      // HttpOnly flag in Set-Cookie header. Specifies whether the cookie can
      // only be read server-side, and not by JavaScript. Defaults to true.
      // httpOnly: true,

      // Expires attribute in Set-Cookie header. Set with a Date object, though
      // usually maxAge is used instead. There's no default, and the browsers will
      // treat it as a session cookie (and delete it when the window is closed).
      // expires: new Date(...)

      // Preferred way to set Expires attribute. Time in milliseconds until
      // the expiry. There's no default, so the cookie is non-persistent.
      maxAge: 1000 * 60 * 60 * 2,

      // SameSite attribute in Set-Cookie header. Controls how cookies are sent
      // with cross-site requests. Used to mitigate CSRF. Possible values are
      // 'strict' (or true), 'lax', and false (to NOT set SameSite attribute).
      // It only works in newer browsers, so CSRF prevention is still a concern.
      sameSite: true,

      // Secure attribute in Set-Cookie header. Whether the cookie can ONLY be
      // sent over HTTPS. Can be set to true, false, or 'auto'. Default is false.
      secure: process.env.NODE_ENV === 'production'
    }
  })
)

// middlewares
const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/login")
  } else {
    next()
  }
}

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    res.redirect("/home")
  } else {
    next()
  }
}

app.use((req, res, next) => {
  const { userId } = req.session
  if (userId) {
    // special object share between middlewares
    res.locals.user = users.find(
      user => user.id === userId
    )
  }
  next()
})

app.get('/', (req, res) => {
  console.log(req.session)

  const { userId } = req.session

  res.send(`
    <h1>Welcome!</h1>
    ${userId ? `
     <a href='/home'>Home</a> 
     <form method='post' action='/logout'>
       <button>Logout</button>
     </form>
    ` : `
     <a href='/login'>Login</a>
     <a href='/register'>Register</a> 
    `}
  `)

})

app.get('/login', redirectHome, (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method='post' action='/login'>
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <input type="submit" />
    </form>
    <a href="/register">Register</a>
  `)
})

app.get('/register', redirectHome, (req, res) => {
  res.send(`
    <h1>Register</h1>
    <form method='post' action='/register'>
      <input name="name" name="name" placeholder="name" required />
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <input type="submit" />
    </form>
    <a href="/login">Login</a>
  `)
})

app.get('/home', redirectLogin, (req, res) => {
  const { user } = res.locals

  res.send(`
    <h1>Home</h1>
    <a href="/">Main</a>
    <ul>
      <li>Name: ${user.name} </li> 
      <li>Email ${user.email} : </li>
    </ul>
  `)
})

/* app.get('/profile', redirectLogin, (req, res) => {
  const { user } = res.locals
}) */

app.post('/login', redirectHome, (req, res) => {
  const { email, password } = req.body

  if (email && password) { // TODO: validation
    const user = users.find(
      user => user.email === email && user.password === password // TODO: hash
    )

    if (user) {
      // TODO: Instead some on session collection
      // the new session as use their id
      req.session.userId = user.id
      return res.redirect("/home")
    }
  }

  res.redirect("/login")
})


app.post('/register', redirectHome, (req, res) => {
  const { name, email, password } = req.body

  if (name && email && password) { // TODO: validation
    console.log("entra")
    const exists = users.some(
      user => user.email === email
    )

    if (!exists) {
      const user = {
        id: users.length + 1,
        name,
        email,
        password // TODO: Hash
      }

      users.push(user)

      req.session.userId = user.id

      return res.redirect("/home")
    }
  }

  res.redirect("/register")
})

app.post('/logout', redirectLogin, (req, res) => {
  console.log(req.session)

  // Note that the portion between 's%3A' and '.' is the session ID above.
  // 's%3A' is URL encoded and decodes to 's:'. The last part is the signature.
  // sid=s%3A0kVkUn7KUX1UZGnjagDKd_NPerjXKJsA.senfzYOeNHCtGUNP4bv1%2BSdgSdZWFtoAaM73odYtLDo
  console.log(req.get('cookie'))

  req.session.destroy(err => {
    if (err) {
      res.redirect("/home")
    }
    // We can also clear out the cookie here. But even if we don't, the
    // session is already destroyed at this point, so either way, the
    // user won't be able to authenticate with that same cookie again.
    res.clearCookie('sid')

    res.redirect('/login')
  })
})


app.listen(3000, () => console.log('http://localhost:3000'))


