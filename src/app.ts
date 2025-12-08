import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.json({ message: "Hello World!" });
});

app.listen(3000, () => {
    console.log('Running in http://localhost:3000')
})