# Petshop Application Backend
Server side functionality for the [pet-shop-app interface.](https://github.com/dnery/pet-shop-app)

### Availability
This application is deployed on IBM Cloud, and has endpoints accessible via the
root https://pet-shop-connector-shiny-reedbuck.mybluemix.net


The service was created on IBM's lite plan, which is set to be deleted after
30 days of no activity. (Initial publication date is 2018/07/08.)

### Storage
Application data is stored on a NoSQL CouchDB instance, created via
IBM Cloudant. You can query it via the public endpoint
https://4e4987cb-ab00-4b17-801a-1e55b7177e19-bluemix.cloudant.com/
(Also set to expire after 30 days of inactivity).
