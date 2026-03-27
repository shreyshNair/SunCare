const express = require('express');
const axios = require('axios');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Default Home Location (Mumbai default)
const DEFAULT_LAT = 19.0760;
const DEFAULT_LNG = 72.8777;

app.get('/', async (req, res) => {
    const lat = req.query.lat || DEFAULT_LAT;
    const lng = req.query.lng || DEFAULT_LNG;
    
    const apiKey = process.env.OPENUV_API_KEY;

    if (!apiKey) {
        return res.render('index', { 
            uvData: null, 
            error: "API Key missing. Please set OPENUV_API_KEY in your .env file." 
        });
    }

    try {
        const response = await axios.get(`https://api.openuv.io/api/v1/uv?lat=${lat}&lng=${lng}`, {
            headers: {
                'x-access-token': apiKey
            }
        });

        const uvData = response.data.result;
        
        // Recommendation logic
        let recommendation = "";
        let advice = "";
        let colorClass = "";

        if (uvData.uv <= 2) {
            recommendation = "Safe to go out without sunscreen.";
            advice = "Low UV radiation. No protection needed for most people.";
            colorClass = "uv-low";
        } else if (uvData.uv <= 5) {
            recommendation = "Apply sunscreen if you're outside for long.";
            advice = "Moderate UV. Seek shade during midday, wear a hat and sunglasses.";
            colorClass = "uv-moderate";
        } else if (uvData.uv <= 7) {
            recommendation = "Apply sunscreen and wear protective gear!";
            advice = "High UV radiation. SPF 30+ recommended. Avoid midday sun.";
            colorClass = "uv-high";
        } else if (uvData.uv <= 10) {
            recommendation = "Extreme UV! Stay indoors or fully protected.";
            advice = "Very High UV. Reapply SPF 50 every 2 hours. Seek shade.";
            colorClass = "uv-very-high";
        } else {
            recommendation = "Dangerously High UV! Avoid direct exposure.";
            advice = "Extreme UV. Stay inside. If must go out, use full coverage and SPF 50+.";
            colorClass = "uv-extreme";
        }

        res.render('index', { 
            uvData: {
                ...uvData,
                recommendation,
                advice,
                colorClass,
                location: { lat, lng }
            }, 
            error: null 
        });
    } catch (error) {
        console.error("Error fetching UV data:", error.response ? error.response.data : error.message);
        res.render('index', { 
            uvData: null, 
            error: "Failed to fetch UV data. Please check your API key and location." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
