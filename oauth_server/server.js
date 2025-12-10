
import express from "express"
import dotenv from "dotenv"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import fetch from "node-fetch"

dotenv.config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))

// ----------------------------
// In-memory demo stores
// ----------------------------
const inviteTokens = {}       // token -> { email, expires }
const pendingAllowed = {}     // email -> true

// ----------------------------
const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    BASE_URL,
    JWT_SECRET,
    SITE_ADMIN_EMAIL
} = process.env

// ----------------------------
// Send invite (admin only)
// ----------------------------
app.post("/invite", (req, res) => {
    const { adminEmail, email } = req.body
    if (adminEmail !== SITE_ADMIN_EMAIL) {
        return res.status(403).json({ error: "not admin" })
    }

    const token = crypto.randomBytes(20).toString("hex")
    inviteTokens[token] = {
        email,
        expires: Date.now() + 1000 * 60 * 60 * 24
    }

    // In real world, email the link:
    // send mail with nodemailer. For now, just return:
    const link = `${BASE_URL}/accept-invite?token=${token}`
    res.json({ ok: true, link })
})

// ----------------------------
// Accept invite
// ----------------------------
app.get("/accept-invite", (req, res) => {
    const { token } = req.query
    const inv = inviteTokens[token]
    if (!inv || inv.expires < Date.now()) {
        return res.status(400).send("Invalid or expired.")
    }

    // Mark pending email
    pendingAllowed[inv.email] = true
    delete inviteTokens[token]

    res.send("Invite accepted! Now open /admin and login via GitHub.")
})

// ----------------------------
// OAuth authorize (GitHub redirect)
// ----------------------------
app.get("/oauth/authorize", (req, res) => {
    const { state, code_challenge } = req.query

    const redirect = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${state}`
    res.redirect(redirect)
})

// ----------------------------
// OAuth callback
// ----------------------------
app.get("/oauth/callback", async (req, res) => {
    const { code, state } = req.query

    // Exchange code -> token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new URLSearchParams({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code
        })
    })
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Get user email info
    const userRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `token ${accessToken}` }
    })
    const emails = await userRes.json()
    const primary = emails.find(e => e.primary) || emails[0]

    if (!primary?.email) {
        return res.status(400).send("No email from GitHub")
    }

    // Check if invited
    if (!pendingAllowed[primary.email]) {
        return res.status(403).send("This email is not invited.")
    }

    // Issue our JWT to Decap
    const jwtToken = jwt.sign(
        { email: primary.email },
        JWT_SECRET,
        { expiresIn: "8h" }
    )

    // Decap expects token delivered to its popup via URL hash
    res.redirect(`/oauth-success?token=${jwtToken}`)
})

// ----------------------------
// Token exchange for PKCE
// (Decap uses POST /oauth/token)
// ----------------------------
app.post("/oauth/token", (req, res) => {
    const { code, code_verifier, redirect_uri } = req.body
    // In this flow, we don't use PKCE, we already issued token at callback.
    // so just return error (Decap won't call this since we're redirecting token)
    return res.status(400).json({ error: "Use /oauth/callback redirect flow" })
})

// ----------------------------
// user endpoint (Decap fetches user info)
// ----------------------------
app.get("/user", (req, res) => {
    const auth = req.headers.authorization || ""
    if (!auth.startsWith("Bearer ")) return res.status(401).end()
    try {
        const payload = jwt.verify(auth.slice(7), JWT_SECRET)
        res.json({ user: payload })
    } catch (e) {
        res.status(401).end()
    }
})

// ----------------------------
app.listen(3000, () => {
    console.log("OAuth + Invite server running on http://localhost:3000")
})
