
const fs = require("fs")                                // Image file conversion
const mime = require("mime")                            // Configure image mime-types

const cors = require("cors")                            // Configure cross-origin sharing
const cfenv = require("cfenv")
const bcrypt = require("bcrypt")                        // Generate hased passwords for storage
const express = require("express")                      // Actual node server framework
const bodyParser = require("body-parser")               // Parsing of POST requests
const nano = require('nano')('http://localhost:5984')   // CouchDB handler


/*
    SET THE DATABASE SHAPE
*/
let state = {

    // TODO Not sure if this needs to be here
    currentUserView: "home",        // Any user starts at home page
    currentUserEmail: "none",       // No sense in tracking a visitors e-mail
    currentUserRights: "visitor",   // Any user starts browsing as a visitor
    currentUserLoggedIn: false,     // Any user starts as not logged in

    // All user credentials
    UACData: [
        // Password generated with bcrypt.hashSync("user", bcrypt.genSaltSync(12))
        { email: "user@example.com",  rights: "customer" ,   password: "$2b$12$ddYjsOv9wcS3JmmXNAAoJe7vD7bObxxooY0.LVi/jGG.s9XnuKQVq"},
        // Password gneerated with bcrypt.hashSync("admin", bcrypt.genSaltSync(12))
        { email: "admin@example.com", rights: "supervisor" , password: "$2b$12$.PrrD1QFQvxDmlZnQVgYjuW6NUsB5h5elbn7u.c.vSmlFeOVc0hme"},
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
            name: "Administrador Exemplo",
            email: "admin@example.com",

            // Business data
            animals: [],
            appointments: [],
            shoppingCart: []
        },
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
console.log("[local: transformed product images]")

// --> Encode (with schema) service images
for (const service of state.SiteData.services) {
    let fileName = service.media
    let fileMime = mime.lookup(fileName)
    service.media = "data:" + fileMime + ";charset=utf-8;base64, " + base64_encode(fileName)
    service.localMedia = false // force image to be interpreted as data
}
console.log("[local: transformed service images]")

// --> Encode (with schema) pet images
for (const customer of state.CustomerData) {
    for (const animal of customer.animals) {
        let fileName = animal.media
        let fileMime = mime.lookup(fileName)
        animal.media = "data:" + fileMime + ";charset=utf-8;base64, " + base64_encode(fileName)
        animal.localMedia = false // force image to be interpreted as data
    }
}
console.log("[local: transformed customer pet images]")

// Useful error info display routine
const displayError = error => {
    console.log("=================================")
    console.log("=================================")
    console.log("[ERROR: " + error.error + ": " + error.reason + "]")
    console.log("=================================")
    console.log("=================================")
}

// Complete db initialization routine
const engageDatabase = handler => {
    handler.list((err, body) => {
        if (err) { displayError(err); return }

        // Create initial database
        if (body.rows.length === 0) {
            handler.insert({ domain: state.UACData }, "uac_data", err => {
                if (err) displayError(err)
                console.log("[db: insert uac_data doc]")
            })
            handler.insert({ domain: state.SiteData.products }, "site_data_products", err => {
                if (err) displayError(err)
                console.log("[db: insert site_data_products doc]")
            })
            handler.insert({ domain: state.SiteData.services }, "site_data_services", err => {
                if (err) displayError(err)
                console.log("[db: insert site_data_services doc]")
            })
            for (const customer of state.CustomerData) {
                let docName = "customer_data_" + customer.email
                handler.insert({ domain: customer }, docName, err => {
                    if (err) displayError(err)
                    console.log("[db: insert " + docName + " doc]")
                })
            }
        }
    })
}

// --> Start: PREAMBLE
let vcapLocal
try {
    vcapLocal = require("./vcap-local.json")
    console.log("[local: loaded local vcap file]")
} catch(error) {
    // Means it's running remotely
}

// --> Start: WRANGLER
let cloudant = null
const petshopenv = cfenv.getAppEnv((vcapLocal ? { vcap: vcapLocal } : {}))
if (petshopenv.services["cloudantNoSQLDB"] || petshopenv.getService("cloudantNoSQLDB")) {
    let Cloudant = require("cloudant")

    if (petshopenv.services["cloudantNoSQLDB"]) {
        // Load based on local vcap file
        cloudant = Cloudant(petshopenv.services["cloudantNoSQLDB"][0].credentials)
    } else {
        // Load from environment set by cloudant
        cloudant = Cloudant(petshopenv.getService("cloudantNoSQLDB").credentials)
    }
}

// --> Start: DATABASE
let petshopdb = null
cloudant.db.get("pet-shop-database", (err, body) => {
    if (err) { displayError(err); return }
    petshopdb = cloudant.use("pet-shop-database")
    engageDatabase(petshopdb)
})
let petshopwd = {
    // Sets pending operations!
    // -> Anything bigger than zero means
    //    that the database is not ready to use
    ops: 1,
    ready: false,

    opsListener: (value) => {},
    set(value) {
        this.ops = value
        this.opsListener(value)
    },
    get(value) {
        return this.ops
    },
    registerListener: (listener) => {
        this.opsListener = listener
    }
}
petshopwd.registerListener((value) => {
    const dbstatus = (value === 0) ? "database is ready" : "database engaged..."
    console.log("[database: " + dbstatus + "]")
})


/*
    BUILD THE SERVER
*/
// Configure the eserver
const application = express()
application.set("port", process.env.PORT || 3002)           // Set port to 3002 if PORT is undefined
application.use(cors())                                     // Allow cross origin sharing with anyone
//application.use(cors({ origin: "http://localhost:3000" }))  // Allow cross origin sharing with this guy
application.use(bodyParser.urlencoded({ extended: false })) // Parse application/x-www-form-urlencoded datatypes
application.use(bodyParser.json())                          // Parse application/json datatypes

// ENDPOINT: test
application.get("/secret-test-endpoint", function(req, res) {
    res.send("<img src='" + state.SiteData.products[0].media + "' alt='product' >")
})

//// ENDPOINT: all content
//application.get("/default-content", (req, res) => {
//    // Set failure behavior
//    req.setTimeout(2500, () => {
//        res.json({ error: "Request timed out" })
//    })
//
//    // Query site data
//    petshopdb.get("site_data", (err, body) => {
//        if (err) {
//            displayError(err);
//            res.json({ error: "Failed to fetch site data" })
//            return
//        }
//        let siteData = body.domain
//
//        // Query customer data
//        petshopdb.get("customer_data", (err2, body2) => {
//            if (err2) {
//                displayError(err2);
//                res.json({ error: "Failed to fetch customer data" })
//                return
//            }
//            let customerData = body2.domain
//
//            // Return all fetched data
//            res.json({ SiteData: siteData, CustomerData: customerData })
//        })
//    })
//})

// ENDPOINT: user sign-in & sign-up
application.route("/UAC")
    .post((req, res) => {
        // OR trim received string with "<data>split(/,(.+)/)[1]"
        const user = req.body.user
        const pass = req.body.pass

        // Set failure behavior
        req.setTimeout(2500, () => {
            res.json({ error: "Request timed out" })
        })

        // Do user "sign in"
        petshopdb.get("uac_data", (err, body) => {
            if (err) {
                displayError(err)
                return
            }

            for (const registry of body.domain) {
                if (user === registry.email) {
                    if (bcrypt.compareSync(pass, registry.password)) {
                        res.json({ ok: true, email: registry.email, rights: registry.rights }) // SUCCESS
                        return
                    }
                    res.json({ error: "Unauthorized: wrong password" })
                    return
                }
            }
            res.json({ error: "Unauthorized: user not found" })
            return
        })
    })
    .put((req, res) => {
        // OR trim received string with "<data>split(/,(.+)/)[1]"
        const name = req.body.name
        const user = req.body.user
        const pass = req.body.pass

        // Set failure behavior
        req.setTimeout(2500, () => {
            res.json({ error: "Request timed out" })
        })

        // Cascade: STEP 1
        petshopdb.get("uac_data", (err, body) => {
            if (err) { displayError(err); return }
            // Check existence
            for (const row of body.domain) {
                if (row.email === user) {
                    res.json({ error: "Unauthorized: user already exists" })
                    return
                }
            }
            // Update UAC list
            let UACList = [
                ...body.domain, 
                { email: user, rights: "customer", password: bcrypt.hashSync(pass, bcrypt.genSaltSync(12)) }
            ]
            petshopdb.insert({ _id: "uac_data", _rev: body._rev, domain: UACList }, (err2, body2) => {
                if (err2) { displayError(err2); return }

                // Cascade: STEP 2
                const documentName = "customer_data_" + user
                const documentData = { name: name, email: user, animals: [], appointments: [], shoppingCart: [] }
                petshopdb.insert({ domain: documentData }, documentName, (err3, body3) => {
                    if (err3) { displayError(err3); return }
                    // Finally respond
                    res.json({ ok: true, name: name, email: user, rights: "customer" }) // SUCCESS
                })
            })
        })
    })

// MIDDLEWARE: resource not found (last possible match)
application.use((req, res) => {
    res.status(404).send("This resource does not exist :(")
})

application.listen(application.get("port"), () => {
    console.log("[local: listening on port " + String(application.get("port"))+ "]")
})