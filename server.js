const fs = require("fs")                                // Image file conversion
const mime = require("mime")                            // Configure image mime-types
const cors = require("cors")                            // Configure cross-origin sharing
const cfenv = require("cfenv")                          // IBM Cloudant environment query tool
const bcrypt = require("bcrypt")                        // Generate hased passwords for storage
const express = require("express")                      // Actual node server framework
const bodyParser = require("body-parser")               // Parsing of HTTP requests


/*
    INITIAL DATABASE SHAPE
*/
let state = {

    // All user credentials
    UACData: [
        // Password generated with bcrypt.hashSync("user", bcrypt.genSaltSync(12))
        { name: "Cliente Exemplo", email: "user@example.com",  rights: "customer",   password: "$2b$12$ddYjsOv9wcS3JmmXNAAoJe7vD7bObxxooY0.LVi/jGG.s9XnuKQVq"},
        // Password gneerated with bcrypt.hashSync("admin", bcrypt.genSaltSync(12))
        { name: "Admin Exemplo",   email: "admin@example.com", rights: "supervisor", password: "$2b$12$.PrrD1QFQvxDmlZnQVgYjuW6NUsB5h5elbn7u.c.vSmlFeOVc0hme"},
    ],

    // Globally available site data
    SiteData: {
        products: [
            { id: 0, name: "Biscoitos Caninos", description: "Deliciosos agrados de qualidade para cachorros",  price: 10.0, amount: 1000 , media: "./media/product1.jpg", localMedia: true},
            { id: 2, name: "Coleira", description: "Coleira de couro sintético",                                price: 10.0, amount: 1000 , media: "./media/product3.jpg", localMedia: true},
            { id: 3, name: "Erva de Gato", description: "Erva recreativa ressequida para gatos",                price: 10.0, amount: 0    , media: "./media/product4.jpg", localMedia: true},
            { id: 4, name: "Guia", description: "Guia para coleiras padrão",                                    price: 10.0, amount: 1000 , media: "./media/product5.jpg", localMedia: true},
            { id: 5, name: "Petisco de Gato", description: "Deliciosos agrados de qualidade para gatos",        price: 10.0, amount: 1000 , media: "./media/product6.jpg", localMedia: true},
            { id: 6, name: "Ração", description: "Ração de primeira qualidade",                                 price: 10.0, amount: 1000 , media: "./media/product7.jpg", localMedia: true}
        ],
        services: [
            { id: 0, name: "Banho", description: "Banho com xampu hipoalergênico para gatos e cães",                        available: true,  media: "./media/service1.jpg", localMedia: true },
            { id: 1, name: "Corte de Unhas", description: "Cuidados com a unha de seu gato com segurança e sem machucá-lo", available: false, media: "./media/service2.jpg", localMedia: true },
            { id: 2, name: "Massagem", description: "Massagem relaxante para seu cão",                                      available: true,  media: "./media/service3.jpg", localMedia: true },
            { id: 3, name: "Tosa", description: "Corte dos pêlos do seu animal",                                            available: true,  media: "./media/service4.jpg", localMedia: true }
        ],
    },

    // Customer specific business data
    CustomerData: [
        {
            // Personal data
            name: "Cliente Exemplo",
            email: "user@example.com",

            // Business data
            animals: [
                { id: 0, name: "Felicloper", race: "Bernese",       media: "./media/dog1.jpg", localMedia: true },
                { id: 1, name: "Glauber", race: "McNab",            media: "./media/dog2.jpg", localMedia: true },
                { id: 2, name: "Gustavo", race: "Buldogue",         media: "./media/dog3.jpg", localMedia: true },
                { id: 3, name: "Caramelo", race: "Harrier",         media: "./media/dog4.jpg", localMedia: true },
                { id: 4, name: "Carolhos", race: "SRD",             media: "./media/dog5.jpg", localMedia: true },
                { id: 5, name: "Nerso", race: "Labrador",           media: "./media/dog6.jpg", localMedia: true },
                { id: 6, name: "Sabrino", race: "Pharaoh Hound",    media: "./media/dog7.jpg", localMedia: true },
                { id: 7, name: "Kik", race: "Chihuahua",            media: "./media/dog8.jpg", localMedia: true },
                { id: 8, name: "Frederico", race: "Siamês",         media: "./media/cat1.jpg", localMedia: true },
                { id: 9, name: "Fofinho", race: "Maine Coon",       media: "./media/cat2.jpg", localMedia: true }
            ],
            appointments: [
                { id: 0, serviceId: 0, serviceName: "Banho", animalId: 6,       animalName: "Sabrino",      date: "2018-08-06T17:00:00.000Z", status: "pending",  message: "" },
                { id: 1, serviceId: 2, serviceName: "Massagem", animalId: 5,    animalName: "Nerso",        date: "2019-08-24T17:00:00.000Z", status: "approved", message: "Aprovado pelo supervisor (sujeito à mudanças)" },
                { id: 2, serviceId: 1, serviceName: "Cortar Unha", animalId: 9, animalName: "Fofinho",      date: "2018-08-08T17:00:00.000Z", status: "pending",  message: "" },
                { id: 3, serviceId: 3, serviceName: "Tosa", animalId: 0,        animalName: "Felicloper",   date: "2018-08-04T17:00:00.000Z", status: "revoked",  message: "Requisição negada: emergência de plantão (nenhum doutor disponivel)" },
                { id: 4, serviceId: 3, serviceName: "Tosa", animalId: 0,        animalName: "Felicloper",   date: "2018-08-09T17:00:00.000Z", status: "revoked",  message: "Requisição negada: nenhum horário indisponível" },
                { id: 5, serviceId: 0, serviceName: "Banho", animalId: 5,       animalName: "Nerso",        date: "2019-08-28T17:00:00.000Z", status: "approved", message: "Aprovado pelo supervisor (sujeito à mudanças)" },
                /*
                    status:
                        - pending: not yet processed
                        - revoked: processed and denied
                        - approved: processed and approved
                        - we're planning to add "edited" as well but we still don't have the logic very clear
                 */
            ],
            shoppingCart: [
                { itemId: 1, itemName: "Bola de Tênis", itemPrice: 10.0, itemAmount: 3 },
                { itemId: 6, itemName: "Ração", itemPrice: 10.0, itemAmount: 15 },
                { itemId: 2, itemName: "Coleira", itemPrice: 10.0, itemAmount: 1 },
            ],
        },
        {
            // Personal data
            name: "Admin Exemplo",
            email: "admin@example.com",

            // Business data
            animals: [],
            appointments: [],
            shoppingCart: []
        },
    ],
}


/*
    BUILD THE DATABASE

        When sending images:
        Prepend media with "data:<mimetype>;charset=utf-8;base64, <data>"

        When receiving images:
        Trim received base64 string with "<data>split(/,(.+)/)[1]"

        This relies on the data URI scheme to work:
        https://en.wikipedia.org/wiki/Data_URI_scheme#Syntax
*/
// Encode image to base64 for transfer
const base64_encode = file => {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer.from(bitmap).toString('base64');
}

// Decode received base64 encoded image
const base64_decode = (base64str, file) => {
    // create buffer object from base64 encoded string 
    // tell the constructor that the string is base64 encoded
    var bitmap = new Buffer.from(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
}

// --> Encode (with schema) product images
for (const product of state.SiteData.products) {
    let fileName = product.media
    let fileMime = mime.lookup(fileName)
    product.media = "data:" + fileMime + ";charset=utf-8;base64, " + base64_encode(fileName)
    product.localMedia = false // force image to be interpreted as data
}

// --> Encode (with schema) service images
for (const service of state.SiteData.services) {
    let fileName = service.media
    let fileMime = mime.lookup(fileName)
    service.media = "data:" + fileMime + ";charset=utf-8;base64, " + base64_encode(fileName)
    service.localMedia = false // force image to be interpreted as data
}

// --> Encode (with schema) pet images
for (const customer of state.CustomerData) {
    for (const animal of customer.animals) {
        let fileName = animal.media
        let fileMime = mime.lookup(fileName)
        animal.media = "data:" + fileMime + ";charset=utf-8;base64, " + base64_encode(fileName)
        animal.localMedia = false // force image to be interpreted as data
    }
}

// Useful error info display routine
const displayError = error => {
    console.log("==================================================")
    console.log("==================================================")
    console.log("[ERROR: " + error.error + ": " + error.reason + "]")
    console.log("==================================================")
    console.log("==================================================")
}

// Complete db initialization routine
const engageDatabase = handler => {
    handler.list((err, body) => {
        if (err) displayError(err)

        // Create initial database
        if (body.rows.length === 0) {
            handler.insert({ domain: state.UACData }, "uac_data", err => {
                if (err) displayError(err)
                console.log("[db: insert uac_data]")
            })
            handler.insert({ domain: state.SiteData.products }, "site_data_products", err => {
                if (err) displayError(err)
                console.log("[db: insert site_data_products]")
            })
            handler.insert({ domain: state.SiteData.services }, "site_data_services", err => {
                if (err) displayError(err)
                console.log("[db: insert site_data_services]")
            })
            for (const customer of state.CustomerData) {
                let docName = "customer_data_" + customer.email
                handler.insert({ domain: customer }, docName, err => {
                    if (err) displayError(err)
                    console.log("[db: insert " + docName + "]")
                    petshopwd.dec(1)
                })
            }
        }
    })
}

// --> Start: PREAMBLE
let vcapLocal
try {
    vcapLocal = require("./vcap-local.json")
    console.log("[cloudant: loaded local vcap file]")
} catch(error) {
    // Means it's running remotely
}

// --> Start: WRANGLER
let cloudant = null
let petshopdb = null
const petshopenv = cfenv.getAppEnv((vcapLocal ? { vcap: vcapLocal } : {}))
if (petshopenv.services["cloudantNoSQLDB"] || petshopenv.getService("cloudantNoSQLDB")) {
    let Cloudant = require("cloudant")

    if (petshopenv.services["cloudantNoSQLDB"]) {
        // Load based on local vcap file
        cloudant = Cloudant(petshopenv.services["cloudantNoSQLDB"][0].credentials)
        console.log("[cloudant: wrangler is local]")
    } else {
        // Load from environment set by cloudant
        cloudant = Cloudant(petshopenv.getService("cloudantNoSQLDB").credentials)
        console.log("[cloudant: wrangler is remote]")
    }

    // Actually engage and start the database system
    cloudant.db.create("pet-shop-database", (err, body) => {
        if (err) {
            console.log("[cloudant: database exists :)]")
        } else {
            console.log("[cloudant: database created]")
        }
        petshopdb = cloudant.use("pet-shop-database")
        console.log("[cloudant: wrangler online]")
        engageDatabase(petshopdb)
    })
}


/*
    BUILD THE SERVER
*/
// Configure the eserver
const application = express()
application.set("port", process.env.PORT || 3002)           // Set port to 3002 if PORT is undefined
application.use(bodyParser.urlencoded({ extended: false })) // Parse application/x-www-form-urlencoded datatypes
application.use(bodyParser.json({limit: "200kb"}))          // Parse application/json datatypes (200kb quota)
application.use(cors())                                     // Allow cross origin sharing with anyone

// ENDPOINT: use root for test only
application.get("/", (req, res) => {
    res.send("<h1>Hi :)</h1><br><h2>Our root is only used for keep-alive messages</h2><br><h2> To use the app,\
    please refer to our front-end hosted on <a href='https://dnery.github.io/pet-shop-app'>github</h2>")
})

// ENDPOINT: user sign-in & sign-up
application.route("/uac")
    .put((req, res) => { // Sign-up
        // Set timeout behavior
        req.setTimeout(5000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })
        const name = req.body.name
        const user = req.body.user
        const pass = req.body.pass

        petshopdb.get("uac_data", (err, body) => {
            if (err) {
                displayError(err);
                res.json({ error: "Database: error getting UAC data :(" })
                return
            }
            console.log("[db: query uac_data]")

            // Check existence
            for (const row of body.domain) {
                if (row.email === user) {
                    res.json({ error: "Unauthorized: user already exists :(" })
                    return
                }
            }

            // Cascate: STEP 1
            let UACList = [
                ...body.domain,
                { name: name, email: user, rights: "customer", password: bcrypt.hashSync(pass, bcrypt.genSaltSync(12)) }
            ]
            petshopdb.insert({ _id: body._id, _rev: body._rev, domain: UACList }, (err2, body2) => {
                if (err2) {
                    displayError(err2);
                    res.json({ error: "Database: error updating UAC data :(" })
                    return
                }
                console.log("[db: update uac_data]")

                // Cascade: STEP 2
                const documentName = "customer_data_" + user
                const documentData = { name: name, email: user, animals: [], appointments: [], shoppingCart: [] }
                petshopdb.insert({ domain: documentData }, documentName, (err3, body3) => {
                    if (err3) {
                        displayError(err3);
                        res.json({error: "Database: error creating customer record :("})
                        return
                    }
                    console.log("[db: insert " + documentName + "]")

                    // Finally respond
                    res.json({ ok: true, name: name, email: user, rights: "customer" }) // SUCCESS
                    console.log("[db: cascade job completed]")
                })
            })
        })
    })
    .post((req, res) => { // Sign-in
        // Set timeout behavior
        req.setTimeout(5000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })
        const user = req.body.user
        const pass = req.body.pass

        // Do user "sign in"
        petshopdb.get("uac_data", (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting UAC data :(" })
                return
            }
            console.log("[db: query uac_data]")

            for (const registry of body.domain) {
                if (user === registry.email) {
                    if (bcrypt.compareSync(pass, registry.password)) {
                        // Finally respond
                        res.json({ ok: true, name: registry.name, email: registry.email, rights: registry.rights }) // SUCCESS
                        return
                    }
                    res.json({ error: "Unauthorized: wrong password :(" })
                    return
                }
            }
            res.json({ error: "Unauthorized: user not found :(" })
            return
        })
    })

// ENDPOINT: retrieve products list
application.get("/products", (req, res) => {
    // Set timeout
    req.setTimeout(6000, () => {
        console.log("[local: request timeout]")
        res.status(408).end()
        return
    })

    // Retrieve data
    petshopdb.get("site_data_products", (err, body) => {
        if (err) {
            displayError(err)
            res.json({ error: "Database: error getting product list :(" })
            return
        }
        console.log("[db: query site_data_products]")
        res.json({ ok: true, products: body.domain }) // SUCCESS
    })
})

// ENDPOINT: retrieve services list
application.get("/services", (req, res) => {
        // Set timeout
        req.setTimeout(6000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Retrieve data
        petshopdb.get("site_data_services", (err, body) => {
            if (err) {
                displayError(err)
                res.json({error: "Database error"})
                return
            }
            console.log("[db: query site_data_services]")
            res.json({ ok: true, services: body.domain }) // SUCCESS
        })
})

// ENDPOINT: retrieve user info list
application.get("/userInfo", (req, res) => {
    // Set timeout
    req.setTimeout(5000, () => {
        console.log("[local: request timeout]")
        res.status(408).end()
        return
    })

    // Retrieve data
    petshopdb.get("uac_data", (err, body) => {
        if (err) {
            displayError(err)
            res.json({ error: "Database: error getting customer record :(" })
        }
        console.log("[db: query uac_data]")
        res.json({ ok: true, userInfo: body.domain })
    })
})

// ENDPOINT: customer pet control
application.route("/:user/pets/:petId*?")

     // Query
    .get((req, res) => {
        // Set timeout
        req.setTimeout(8000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })
        // Retrieve data
        const user = req.params.user
        const docName = "customer_data_" + user
        petshopdb.get(docName, (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query " + docName + "]")
            res.json({ ok: true, animals: body.domain.animals }) // SUCCESS
        })
    })

    // Create
    .put((req, res) => {
        // Set timeout
        req.setTimeout(8000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Parse body
        const petName = req.body.name
        const petRace = req.body.race
        const petMedia = req.body.media
        if (!petName || !petRace || !petMedia) {
            console.log("[local: missing info]")
            res.json({ error: "Missing information :(" })
            return
        }

        // Cascade: STEP 1
        const user = req.params.user
        const docName = "customer_data_" + user
        petshopdb.get(docName, (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query " + docName + "]")

            // Cascade: STEP 2
            const nRecords = body.domain.animals.length
            const domain = Object.assign({}, body.domain, {
                animals: [
                    ...body.domain.animals,
                    {
                        id: (nRecords > 0) ? (body.domain.animals[nRecords - 1].id + 1) : 0,
                        name: petName,
                        race: petRace,
                        media: petMedia,
                        localMedia: false
                    }
                ]
            })
            petshopdb.insert({ _id: body._id, _rev: body._rev, domain: domain }, (err2, body2) => {
                if (err2) {
                    displayError(err2)
                    res.json({ error: "Database: error updating customer record :(" })
                    return
                }
                console.log("[db: update " + docName + "]")
                res.json({ ok: true }) // SUCCESS
                console.log("[db: cascade job completed]")
            })
        })
    })

    // Update
    .post((req, res) => {
        // Set timeout
        req.setTimeout(8000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Parse body
        const petId = req.body.id // Already a number !!!
        const petName = req.body.name
        const petRace = req.body.race
        const petMedia = req.body.media
        if ((typeof(petId) === "undefined") || !petName || !petRace || !petMedia) { // petId might be zero
            console.log("[local: missing info]")
            res.json({ error: "Missing information :(" })
            return
        }

        // Cascade: STEP 1
        const user = req.params.user
        const docName = "customer_data_" + user
        petshopdb.get(docName, (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query " + docName + "]")

            // Cascade: STEP 2
            const domain = Object.assign({}, body.domain, {
                animals: body.domain.animals.map(pet => {
                    if (pet.id === petId) {
                        return Object.assign({}, pet, {
                            name: petName,
                            race: petRace,
                            media: petMedia
                        })
                    }
                    return pet
                })
            })
            petshopdb.insert({ _id: body._id, _rev: body._rev, domain: domain }, (err2, body2) => {
                if (err2) {
                    displayError(err2)
                    res.json({ error: "Database: error updating customer record :(" })
                    return
                }
                console.log("[db: update " + docName + "]")
                res.json({ ok: true }) // SUCCESS
                console.log("[db: cascade job completed]")
            })
        })
    })

    // Delete
    .delete((req, res) => {
        // Set timeout
        req.setTimeout(8000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Cascade: STEP 1
        const user = req.params.user
        const docName = "customer_data_" + user
        petshopdb.get(docName, (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query " + docName + "]")

            // Cascade: STEP 2
            const petId = parseInt(req.params.petId, 10) // Not a number by default!!!
            const domain = Object.assign({}, body.domain, {
                animals: body.domain.animals.filter(pet => (pet.id !== petId))
            })
            petshopdb.insert({ _id: body._id, _rev: body._rev, domain: domain }, (err2, body2) => {
                if (err2) {
                    displayError(err2)
                    res.json({ error: "Database: error updating customer record :(" })
                    return
                }
                console.log("[db: update " + docName + "]")
                res.json({ ok: true }) // SUCCESS
                console.log("[db: cascade job completed]")
            })
        })
    })

// ENDPOINT: customer appointment control
application.route("/:user/appointments/:appId*?")

    // Query
    .get((req, res) => {
        // Set timeout
        req.setTimeout(8000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Retrieve data
        const user = req.params.user
        const docName = "customer_data_" + user
        petshopdb.get(docName, (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query " + docName + "]")
            res.json({ ok: true, appointments: body.domain.appointments }) // SUCCESS
        })
    })

    // Create
    .put((req, res) => {
        // Set timeout
        req.setTimeout(8000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Parse body
        const serviceId = req.body.serviceId; const serviceName = req.body.serviceName
        const animalId = req.body.animalId; const animalName = req.body.animalName
        const appDate = req.body.date; const appStatus = req.body.status
        const appMessage = req.body.message
        if ((typeof(serviceId) === "undefined") || (typeof(animalId) === "undefined") ||
            !serviceName || !animalName || !appDate) {
            console.log("[local: missing info]")
            res.json({ error: "Missing information :(" })
            return
        }

        // Cascade: STEP 1
        const user = req.params.user
        const docName = "customer_data_" + user
        petshopdb.get(docName, (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query " + docName + "]")

            // Cascade: STEP 2
            const nRecords = body.domain.appointments.length
            const domain = Object.assign({}, body.domain, {
                appointments: [
                    ...body.domain.appointments,
                    {
                        id: (nRecords > 0) ? (body.domain.appointments[nRecords - 1].id + 1) : 0,
                        serviceId: serviceId, serviceName: serviceName,
                        animalId: animalId, animalName: animalName,
                        date: appDate,
                        status: appStatus,
                        message: appMessage
                    }
                ]
            })
            petshopdb.insert({ _id: body._id, _rev: body._rev, domain: domain }, (err2, body2) => {
                if (err2) {
                    displayError(err2)
                    res.json({ error: "Database: error updating customer record :(" })
                    return
                }
                console.log("[db: update " + docName + "]")
                res.json({ ok: true }) // SUCCESS
                console.log("[db: cascade job completed]")
            })
        })
    })

    // Update
    .post((req, res) => {
        // Set timeout
        req.setTimeout(8000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Parse body
        const serviceId = req.body.serviceId; const serviceName = req.body.serviceName
        const animalId = req.body.animalId; const animalName = req.body.animalName
        const appDate = req.body.date; const appStatus = req.body.status
        const appMessage = req.body.message; const appId = req.body.id
        if ((typeof (serviceId) === "undefined") ||
            (typeof (animalId) === "undefined") ||
            (typeof (appId) === "undefined") ||
            !serviceName || !animalName || !appDate) {
            console.log("[local: missing info]")
            res.json({ error: "Missing information :(" })
            return
        }

        // Cascade: STEP 1
        const user = req.params.user
        const docName = "customer_data_" + user
        petshopdb.get(docName, (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query " + docName + "]")

            // Cascade: STEP 2
            const domain = Object.assign({}, body.domain, {
                appointments: body.domain.appointments.map(app => {
                    if (app.id === appId) {
                        return Object.assign({}, app, {
                            serviceId: serviceId, serviceName: serviceName,
                            animalId: animalId, animalName: animalName,
                            id: appId,
                            date: appDate,
                            status: appStatus,
                            message: appMessage
                        })
                    }
                    return app
                })
            })
            petshopdb.insert({ _id: body._id, _rev: body._rev, domain: domain }, (err2, body2) => {
                if (err2) {
                    displayError(err2)
                    res.json({ error: "Database: error updating customer record :(" })
                    return
                }
                console.log("[db: update " + docName + "]")
                res.json({ ok: true }) // SUCCESS
                console.log("[db: cascade job completed]")
            })
        })
    })

    // Delete
    .delete((req, res) => {
        // Set timeout
        req.setTimeout(8000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Cascade: STEP 1
        const user = req.params.user
        const docName = "customer_data_" + user
        petshopdb.get(docName, (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query " + docName + "]")

            // Cascade: STEP 2
            const appId = parseInt(req.params.appId, 10) // Not a number by default!!!
            const domain = Object.assign({}, body.domain, {
                appointments: body.domain.appointments.filter(app => (app.id !== appId))
            })
            petshopdb.insert({ _id: body._id, _rev: body._rev, domain: domain }, (err2, body2) => {
                if (err2) {
                    displayError(err2)
                    res.json({ error: "Database: error updating customer record :(" })
                    return
                }
                console.log("[db: update " + docName + "]")
                res.json({ ok: true }) // SUCCESS
                console.log("[db: cascade job completed]")
            })
        })
    })


// ENDPOINT: customer shopping cart control
application.route("/:user/shoppingCart/:itemId*?")

    // Query
    .get((req, res) => {
        // Set timeout
        req.setTimeout(8000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Retrieve data
        const user = req.params.user
        const docName = "customer_data_" + user
        petshopdb.get(docName, (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query " + docName + "]")
            res.json({ ok: true, shoppingCart: body.domain.shoppingCart }) // SUCCESS
        })
    })

    // Create
    .post((req, res) => {
        // Set timeout
        req.setTimeout(12000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Parse body
        //{ itemId: 2, itemName: "Coleira", itemPrice: 10.0, itemAmount: 1 },
        const itemId = req.body.itemId
        const itemName = req.body.itemName
        const itemPrice = req.body.itemPrice
        const itemAmount = req.body.itemAmount
        if ((typeof(itemId) === "undefined")
            (typeof(itemName) === "undefined") ||
            (typeof(itemPrice) === "undefined") ||
            (typeof(itemAmount) === "undefined")) {
            console.log("[local: missing info]")
            res.json({ error: "Missing information :(" })
            return
        }

        // Cascade: STEP 1
        petshopdb.get("ste_data_products", (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query site_data_products]")

            // Check op validity
            const targetProduct = body.domain.find(item => (item.id === itemId))
            if (typeof(targetProduct) === "undefined") {
                console.log("[db: query attempt for unavailable record]")
                res.json({ error: "Product no longer exists 8O" })
                return
            }
            if (targetProduct.amount < itemAmount) {
                console.log("[db: attempted registering negative value]")
                res.json({ error: "Amount requested unavailable" })
                return
            }

            // Cascade: STEP 2
            const domainWithNewProduct = body.domain.map(item => {
                if (item.id === itemId) {
                    return Object.assign({}, item, {
                        amount: (item.amount - itemAmount)
                    })
                }
                return item
            })
            petshopdb.insert({ _id: body._ud, _rev: body._rev, domain: domainWithNewProduct }, (err2, body2) => {
                if (err2) {
                    displayError(err2)
                    res.json({ error: "Database: error updating site data :(" })
                    return
                }

                // Cascade: STEP 3
                const user = req.params.user
                const docName = "customer_data_" + user
                petshopdb.get(docName, (err3, body3) => {
                    if (err3) {
                        displayError(err3)
                        res.json({ error: "Database: error getting customer record :(" })
                        return
                    }
                    console.log("[db: query " + docName + "]")

                    // properly insert item in cart
                    let domainWithNewShoppingCart = null
                    let targetCartItem = body3.domain.shoppingCart.find(item => (item.itemId === itemId))
                    if (typeof(targetCartItem) === "undefined") {
                        domainWithNewShoppingCart = Object.assign({}, body3.domain, {
                            shoppingCart: [
                                ...body3.domain.shoppingCart,
                                {
                                    itemId: itemId,
                                    itemName: itemName,
                                    itemPrice: itemPrice,
                                    itemAmount: itemAmount
                                }
                            ]
                        })
                    } else {
                        domainWithNewShoppingCart = Object.assign({}, body3.domain, {
                            shoppingCart: body3.domain.shoppingCart.map(item => {
                                if (item.id === itemId) {
                                    return Object.assign({}, item, {
                                        itemAmount: (item.itemAmount + itemAmount)
                                    })
                                }
                                return item
                            })
                        })
                    }

                    // Cascade: STEP 4
                    petshopdb.insert({ _id: body3._id, _rev: body3._rev, domain: domainWithNewShoppingCart }, (err4, body4) => {
                        if (err4) {
                            displayError(err4)
                            res.json({ error: "Database: error updating customer record :(" })
                            return
                        }
                        console.log("[db: update " + docName + "]")
                        res.json({ ok: true }) // SUCCESS
                        console.log("[db: cascade job completed]")
                    })
                })
            })
        })
    })

    // Delete
    .delete((req, res) => {
        // Set timeout
        req.setTimeout(8000, () => {
            console.log("[local: request timeout]")
            res.status(408).end()
            return
        })

        // Cascade: STEP 1
        const user = req.params.user
        const docName = "customer_data_" + user
        petshopdb.get(docName, (err, body) => {
            if (err) {
                displayError(err)
                res.json({ error: "Database: error getting customer record :(" })
                return
            }
            console.log("[db: query " + docName + "]")

            // Cascade: STEP 2
            const itemId = parseInt(req.params.itemId, 10) // Not a number by default!!!
            const domain = Object.assign({}, body.domain, {
                shoppingCart: body.domain.shoppingCart.filter(item => (item.itemId !== itemId))
            })
            petshopdb.insert({ _id: body._id, _rev: body._rev, domain: domain }, (err2, body2) => {
                if (err2) {
                    displayError(err2)
                    res.json({ error: "Database: error updating customer record :(" })
                    return
                }
                console.log("[db: update " + docName + "]")
                res.json({ ok: true }) // SUCCESS
                console.log("[db: cascade job completed]")
            })
        })
    })


// MIDDLEWARE: resource not found (last possible match)
application.use((req, res) => {
    res.status(404).send("<h2>This resource does not exist :(</h2>")
})

application.listen(application.get("port"), () => {
    console.log("[local: listening on port " + String(application.get("port"))+ "]")
})