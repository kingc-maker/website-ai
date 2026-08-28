// Configuration
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const weatherContainer = document.getElementById('weatherContainer');
const forecastContainer = document.getElementById('forecastContainer');
const airQualitySection = document.getElementById('airQualitySection');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        fetchWeatherByCity(city);
    } else {
        showError('Please enter a city name');
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) {
            fetchWeatherByCity(city);
        }
    }
});

locationBtn.addEventListener('click', getLocationAndFetchWeather);

// Initialize - Show demo or prompt for API key
window.addEventListener('load', () => {
    if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
        showError('Please set your OpenWeatherMap API key in script.js');
    }
});

/**
 * Fetch weather by city name
 */
async function fetchWeatherByCity(city) {
    try {
        showLoading(true);
        hideError();

        // Get current weather
        const weatherResponse = await fetch(
            `${BASE_URL}/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!weatherResponse.ok) {
            throw new Error('City not found');
        }

        const weatherData = await weatherResponse.json();
        const { lat, lon } = weatherData.coord;

        // Get forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();

        // Get air quality (optional)
        const airQualityResponse = await fetch(
            `${BASE_URL}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        const airQualityData = airQualityResponse.ok ? await airQualityResponse.json() : null;

        displayWeather(weatherData);
        displayForecast(forecastData);
        if (airQualityData) {
            displayAirQuality(airQualityData);
        }

        showLoading(false);
        weatherContainer.style.display = 'block';
    } catch (err) {
        showLoading(false);
        showError(err.message || 'Failed to fetch weather data');
    }
}

/**
 * Fetch weather using geolocation
 */
async function getLocationAndFetchWeather() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    showLoading(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoordinates(latitude, longitude);
        },
        (err) => {
            showLoading(false);
            showError('Unable to access your location');
        }
    );
}

/**
 * Fetch weather by coordinates
 */
async function fetchWeatherByCoordinates(lat, lon) {
    try {
        // Get current weather
        const weatherResponse = await fetch(
            `${BASE_URL}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        if (!weatherResponse.ok) {
            throw new Error('Failed to fetch weather');
        }

        const weatherData = await weatherResponse.json();

        // Get forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();

        // Get air quality
        const airQualityResponse = await fetch(
            `${BASE_URL}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        const airQualityData = airQualityResponse.ok ? await airQualityResponse.json() : null;

        displayWeather(weatherData);
        displayForecast(forecastData);
        if (airQualityData) {
            displayAirQuality(airQualityData);
        }

        showLoading(false);
        weatherContainer.style.display = 'block';
    } catch (err) {
        showLoading(false);
        showError(err.message || 'Failed to fetch weather data');
    }
}

/**
 * Display current weather
 */
function displayWeather(data) {
    const { name, sys, main, weather, wind, clouds, visibility } = data;

    document.getElementById('cityName').textContent = `${name}, ${sys.country}`;
    document.getElementById('weatherDescription').textContent = weather[0].description;
    document.getElementById('temp').textContent = Math.round(main.temp);
    document.getElementById('feelsLike').textContent = Math.round(main.feels_like);
    document.getElementById('humidity').textContent = main.humidity;
    document.getElementById('windSpeed').textContent = wind.speed.toFixed(1);
    document.getElementById('pressure').textContent = main.pressure;
    document.getElementById('visibility').textContent = (visibility / 1000).toFixed(1);

    // Weather icon
    const iconCode = weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    document.getElementById('weatherIcon').src = iconUrl;
}

/**
 * Display 5-day forecast
 */
function displayForecast(data) {
    forecastContainer.innerHTML = '';
    
    // Group forecasts by day
    const forecastsByDay = {};
    
    data.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (!forecastsByDay[day]) {
            forecastsByDay[day] = forecast;
        }
    });

    // Display up to 5 days
    Object.entries(forecastsByDay).slice(0, 5).forEach(([day, forecast]) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        const iconCode = forecast.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        
        card.innerHTML = `
            <div class="date">${day}</div>
            <img src="${iconUrl}" alt="weather icon" style="width: 50px; height: 50px;">
            <div class="temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="description">${forecast.weather[0].main}</div>
        `;
        
        forecastContainer.appendChild(card);
    });
}

/**
 * Display air quality
 */
function displayAirQuality(data) {
    const aqi = data.list[0].main.aqi;
    const aqiLevels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const aqiClasses = ['good', 'fair', 'poor', 'poor', 'poor'];
    
    document.getElementById('aqiValue').textContent = aqi;
    const aqiLevelElement = document.getElementById('aqiLevel');
    aqiLevelElement.textContent = aqiLevels[aqi - 1];
    aqiLevelElement.className = `aqi-level ${aqiClasses[aqi - 1]}`;
    
    airQualitySection.style.display = 'block';
}

/**
 * Show loading state
 */
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    error.style.display = 'block';
}

/**
 * Hide error message
 */
function hideError() {
    error.style.display = 'none';
}
