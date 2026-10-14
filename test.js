const assert = require("assert")
const { spawn } = require("child_process")
const DiskHashTable = require("presidium/DiskHashTable")
const HTTP = require("presidium/HTTP")
const Readable = require("presidium/Readable")
const run = require("./run")

async function integration_test() {
  {
    const sessionHt = new DiskHashTable({
      storagePath: `${__dirname}/database/session-storage`,
      headerPath: `${__dirname}/database/session-header`,
      initialLength: 1073741824,
      itemSize: 1024,
    })
    await sessionHt.init()
    await sessionHt.destroy()

    const accountHt = new DiskHashTable({
      storagePath: `${__dirname}/database/account-storage`,
      headerPath: `${__dirname}/database/account-header`,
      initialLength: 1073741824,
      itemSize: 1024,
    })
    await accountHt.init()
    await accountHt.destroy()
  }

  const { server, dependencies: { accountHt, sessionHt } } = await run()
  await new Promise(resolve => setTimeout(resolve, 500))

  const http = new HTTP("http://localhost:8080")

  const response1 = await http.GET("/health")
  const text1 = await Readable.Text(response1)
  assert.equal(response1.status, 200)
  assert.equal(text1, "OK")

  const email = "test-email@test-domain.com"
  const password = "0~qi%?`BN<DTcD@lZO:x"

  const response2 = await http.POST("/account", {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const text2 = await Readable.Text(response2)
  assert.equal(response2.status, 200)
  assert.equal(text2, "OK")

  const response3 = await http.POST("/account", {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const text3 = await Readable.Text(response3)
  assert.equal(response3.status, 409)
  assert.equal(text3, "Conflict")

  const wrongPassword = "wrongpassword"

  const response4 = await http.PUT("/login", {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: wrongPassword,
    }),
  })

  const text4 = await Readable.Text(response4)
  assert.equal(response4.status, 401)
  assert.equal(text4, "Unauthorized")

  const newEmail = "new.email@test-domain.com"

  const response5 = await http.PUT("/login", {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: newEmail,
      password,
    }),
  })

  const text5 = await Readable.Text(response5)
  assert.equal(response5.status, 401)
  assert.equal(text5, "Unauthorized")

  const response6 = await http.PUT("/login", {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  assert.equal(response6.headers["content-type"], "application/json")
  const data6 = await Readable.JSON(response6)
  assert.equal(response6.status, 200)
  assert.equal(typeof data6.accessToken, "string")

  const { accessToken } = data6

  const response7 = await http.GET("/account", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  })

  assert.equal(response7.headers["content-type"], "application/json")
  const data7 = await Readable.JSON(response7)
  assert.equal(response7.status, 200)
  assert.equal(data7.email, email)

  const accountJson = await accountHt.get(email)
  await accountHt.delete(email)
  assert.strictEqual(await accountHt.get(email), undefined)

  const response8 = await http.GET("/account", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  })

  const text8 = await Readable.Text(response8)
  assert.equal(response8.status, 500)
  assert.equal(text8, "Internal Server Error")

  const badAuthToken = "badtoken"

  const response9 = await http.GET("/account")
  const text9 = await Readable.Text(response9)
  assert.equal(response9.status, 400)
  assert.equal(text9, "Bad Request")

  const response10 = await http.GET("/account", {
    headers: {
      "Authorization": `Bearer ${badAuthToken}`,
    },
  })
  const text10 = await Readable.Text(response10)
  assert.equal(response10.status, 401)
  assert.equal(text10, "Unauthorized")

  const response11 = await http.GET("/x")
  const text11 = await Readable.Text(response11)
  assert.equal(response11.status, 404)
  assert.equal(text11, "Not Found")

  server.close()

  console.log("success")
}

integration_test()
