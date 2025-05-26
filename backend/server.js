import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Get request received');
});

// console.log(`Port: ${process.env.PORT}`);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});