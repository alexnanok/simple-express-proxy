const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

// Proxy para la API de Mirakl
app.post('/api/shops', async (req, res) => {
    try {
        const response = await fetch('https://pccomponentes-prod.mirakl.net/api/shops', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '95a32e5a-fcdf-4931-9c4d-e15494e5096e'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar la solicitud a la API de Mirakl' });
    }
});

app.listen(3000, () => {
    console.log('Proxy server running at http://localhost:3000');
});
