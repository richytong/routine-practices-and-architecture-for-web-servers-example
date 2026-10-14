#!/usr/bin/env node

require("rubico/global")
const http = require("http")
const crypto = require("crypto")
const DiskHashTable = require("presidium/DiskHashTable")
const Readable = require("presidium/Readable")
const StrictValidator = require("presidium/StrictValidator")
const Password = require("presidium/Password")

async function run() {
  const sessionHt = new DiskHashTable({
    storagePath: `${__dirname}/database/session-storage`,
    headerPath: `${__dirname}/database/session-header`,
    initialLength: 1073741824,
    itemSize: 1024,
  })
  await sessionHt.init()

  const accountHt = new DiskHashTable({
    storagePath: `${__dirname}/database/account-storage`,
    headerPath: `${__dirname}/database/account-header`,
    initialLength: 1073741824,
    itemSize: 1024,
  })
  await accountHt.init()

  async function createAccount(request, response) {
    const data = await Readable.JSON(request)
    const validator = StrictValidator({
      email: String,
      password: String,
    })
    const { email, password } = validator(data)
    const existingAccount = await accountHt.get(email)
    if (existingAccount) {
      const error = new Error("Conflict")
      error.code = 409
      throw error
    }
    const passwordHash = await Password.hash(password)
    const account = { email, passwordHash }
    await accountHt.set(email, JSON.stringify(account))

    response.writeHead(200, {
      "Content-Type": "text/plain",
    })
    response.end("OK")
  }

  async function login(request, response) {
    const data = await Readable.JSON(request)
    const validator = StrictValidator({
      email: String,
      password: String,
    })
    const { email, password } = validator(data)
    const accountJson = await accountHt.get(email)
    if (accountJson == null) {
      const error = new Error("Unauthorized")
      error.code = 401
      throw error
    }
    const account = JSON.parse(accountJson)
    try {
      await Password.verify(password, account.passwordHash)
      const accessToken = `${crypto.randomBytes(28).toString("hex")}`
      const session = { accessToken, email }
      await sessionHt.set(accessToken, JSON.stringify(session))
      response.writeHead(200, {
        "Content-Type": "application/json",
      })
      response.end(JSON.stringify({ accessToken }))
    } catch {
      const error = new Error("Unauthorized")
      error.code = 401
      throw error
    }
  }

  async function auth(request, response) {
    if (request.headers.authorization == null) {
      const error = new Error("Bad Request")
      error.code = 400
      throw error
    }
    const authToken = request.headers.authorization.replace("Bearer ", "")
    const sessionJson = await sessionHt.get(authToken)
    if (sessionJson == null) {
      const error = new Error("Unauthorized")
      error.code = 401
      throw error
    }
    const session = JSON.parse(sessionJson)
    return session
  }

  async function retrieveAccount(request, response) {
    const session = await auth(request)
    const { email } = session
    const accountJson = await accountHt.get(email)
    if (accountJson == null) {
      const error = new Error("Internal Server Error")
      error.code = 500
      throw error
    }
    const account = JSON.parse(accountJson)
    const publicAccount = {
      email: account.email,
    }
    response.writeHead(200, {
      "Content-Type": "application/json",
    })
    response.end(JSON.stringify(publicAccount))
  }

  const handler = tryCatch(switchCase(
    request => request.method == "GET" && request.url == "/health",
    function healthCheckHandler(request, response) {
      response.writeHead(200, {
        "Content-Type": "text/plain",
      })
      response.end("OK")
    },

    request => request.method == "PUT" && request.url == "/login",
    login,

    request => request.method == "POST" && request.url == "/account",
    createAccount,

    request => request.method == "GET" && request.url == "/account",
    retrieveAccount,

    function notFoundHandler(request, response) {
      response.writeHead(404, {
        "Content-Type": "text/plain",
      })
      response.end("Not Found")
    },
  ), function errorHandler(error, request, response) {
    response.writeHead(error.code ?? 500, {
      "Content-Type": "text/plain",
    })
    response.end(error.message)
  })

  const server = http.createServer(handler)

  server.listen(8080, () => {
    console.log("HTTP server listening on port 8080")
  })

  return { server, dependencies: { accountHt, sessionHt } }
}

if (process.argv[1] == __filename) {
  run()
}

module.exports = run
