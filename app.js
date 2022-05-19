// Declare imports
const express = require('express') // for creating the routes
const app = express() // initialized it

const fs = require('fs') // read file, write file

const multer = require('multer') // allow upload files to server

const { createWorker } = require('tesseract.js') // to read images
const worker = createWorker({
    logger: m => console.log(m)
}) // analized the images


// Declare storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})


// Specified upload
const upload = multer({
    storage
}).single('avatar') // you can change filename whatever you want
// you can use above code like this: upload('upload this file')


// Render
app.set("view engine", "ejs")


// ROUTES
app.get('/', (req, res) => {
    res.render('index')
}) // display the form

app.post('/upload', (req, res) => {

    upload(req, res, err => {

        fs.readFile(`./uploads/${req.file.originalname}`, (err, image) => {
            if (err) {
                console.log('File Error: ', err)
                return
            }

            (async () => {
                await worker.load()
                await worker.loadLanguage('eng')
                await worker.initialize('eng')
            
                await worker.recognize(Buffer.from(image))
            
                const FILE_NAME = 'tesseract-ocr-result.pdf'
                const { data } = await worker.getPDF('Tesseract OCR Result')
                fs.writeFileSync(FILE_NAME, Buffer.from(data))
            
                console.log(`Generate PDF: ${FILE_NAME}`)

                await worker.terminate()

                res.redirect('download')
            })()
        })
    })
}) // recieve the request data from the form

app.get('/download', (req, res) => {
    const file = fs.createReadStream(`${__dirname}/tesseract-ocr-result.pdf`);

    res.setHeader('Content-Type', 'application/pdf');
    file.pipe(res)
})

// Listen and start server
const PORT = 5000 || process.env.PORT
app.listen(PORT, () => console.log(`I am running on ${PORT}`))