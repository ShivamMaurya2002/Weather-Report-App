// DOM Elements
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const datetimeElement = document.getElementById('datetime');
const currentYear = document.getElementById('currentYear');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const errorBox = document.getElementById('errorBox');
const loadingIndicator = document.getElementById('loadingIndicator');
const weatherContainer = document.getElementById('weatherContainer');
const forecastToggle = document.getElementById('forecastToggle');
const forecastContainer = document.getElementById('forecastContainer');
const forecastDetail = document.getElementById('forecastDetail');

// API Key
const API_KEY = 'f799efbb5a1af014a7aed2d9fceec541';

// Initialize with empty data
function initializeEmptyData() {
    document.getElementById('city').textContent = '--';
    document.getElementById('temperature').textContent = '--°C';
    document.getElementById('description').textContent = '--';
    document.getElementById('humidity').textContent = 'Humidity: --%';
    document.getElementById('wind').textContent = 'Wind: -- km/h';
    document.getElementById('pressure').textContent = 'Pressure: -- hPa';
    document.getElementById('feelsLike').textContent = 'Feels Like: --°C';
    document.getElementById('weatherIcon').src = '';
    forecastContainer.innerHTML = '';
    forecastDetail.innerHTML = '';
    weatherContainer.style.display = 'flex';
}

// Set current year in footer
currentYear.textContent = new Date().getFullYear();
initializeEmptyData();

// Theme Toggle
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', isDarkMode);
});

// Check for saved theme preference
if (localStorage.getItem('darkMode') === 'true') {
    body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Update Date and Time with seconds
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    datetimeElement.textContent = now.toLocaleDateString('en-US', options);
}

// Update time every second
updateDateTime();
setInterval(updateDateTime, 1000);

// Fetch weather data with case-insensitive search
async function fetchWeather(location) {
    try {
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        weatherContainer.style.display = 'none';
        errorBox.style.display = 'none';

        // First try direct search
        let currentResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${API_KEY}`
        );

        // If direct search fails, try with different combinations
        if (!currentResponse.ok) {
            // Try with lowercase
            currentResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location.toLowerCase())}&units=metric&appid=${API_KEY}`
            );
        }

        if (!currentResponse.ok) {
            // Try with capitalized first letter
            const capitalized = location.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            currentResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(capitalized)}&units=metric&appid=${API_KEY}`
            );
        }

        if (!currentResponse.ok) {
            throw new Error('Location not found');
        }

        const currentData = await currentResponse.json();

        // Fetch forecast using the coordinates from current weather to ensure accuracy
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&units=metric&appid=${API_KEY}`
        );

        if (!forecastResponse.ok) {
            throw new Error('Forecast not available');
        }

        const forecastData = await forecastResponse.json();

        // Update UI
        updateCurrentWeather(currentData);
        updateForecast(forecastData);

        // Hide loading indicator and show weather
        loadingIndicator.style.display = 'none';
        weatherContainer.style.display = 'flex';
    } catch (error) {
        console.error('Error fetching weather data:', error);
        loadingIndicator.style.display = 'none';
        errorBox.style.display = 'block';
        initializeEmptyData();
    }
}

// Update current weather UI
function updateCurrentWeather(data) {
    const locationName = data.name || 'Unknown Location';
    const country = data.sys?.country || '';
    document.getElementById('city').textContent = country ? `${locationName}, ${country}` : locationName;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('description').textContent = data.weather[0]?.description || '--';
    document.getElementById('humidity').textContent = `Humidity: ${data.main.humidity || '--'}%`;
    document.getElementById('wind').textContent = `Wind: ${data.wind?.speed ? Math.round(data.wind.speed * 3.6) : '--'} km/h`;
    document.getElementById('pressure').textContent = `Pressure: ${data.main.pressure || '--'} hPa`;
    document.getElementById('feelsLike').textContent = `Feels Like: ${data.main.feels_like ? Math.round(data.main.feels_like) : '--'}°C`;

    // Update weather icon
    if (data.weather[0]?.icon) {
        document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        document.getElementById('weatherIcon').alt = data.weather[0].main || 'Weather icon';
    } else {
        document.getElementById('weatherIcon').src = '';
    }
}

// Update forecast UI
function updateForecast(data) {
    forecastContainer.innerHTML = '';
    forecastDetail.innerHTML = '';

    // Group forecasts by day
    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });

        if (!dailyForecasts[day]) {
            dailyForecasts[day] = item;
        }
    });

    // Create forecast cards
    Object.entries(dailyForecasts).forEach(([day, forecast], index) => {
        if (index >= 5) return; // Limit to 5 days

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
                    <div class="forecast-day">${day}</div>
                    <img class="forecast-icon" src="https://openweathermap.org/img/wn/${forecast.weather[0]?.icon || ''}.png" alt="${forecast.weather[0]?.main || ''}">
                    <div class="forecast-temp">${forecast.main?.temp ? Math.round(forecast.main.temp) : '--'}°C</div>
                    <div class="forecast-desc">${forecast.weather[0]?.main || '--'}</div>
                `;

        // Add click event to show detailed forecast
        card.addEventListener('click', () => showForecastDetail(forecast, day));
        forecastContainer.appendChild(card);
    });
}

// Show detailed forecast
function showForecastDetail(forecast, day) {
    forecastDetail.innerHTML = `
                <h4>${day} Details</h4>
                <div class="detail-row">
                    <span>Temperature:</span>
                    <span>${forecast.main?.temp ? Math.round(forecast.main.temp) : '--'}°C (${forecast.main?.temp_min ? Math.round(forecast.main.temp_min) : '--'}°C - ${forecast.main?.temp_max ? Math.round(forecast.main.temp_max) : '--'}°C)</span>
                </div>
                <div class="detail-row">
                    <span>Weather:</span>
                    <span>${forecast.weather[0]?.description || '--'}</span>
                </div>
                <div class="detail-row">
                    <span>Humidity:</span>
                    <span>${forecast.main?.humidity || '--'}%</span>
                </div>
                <div class="detail-row">
                    <span>Wind:</span>
                    <span>${forecast.wind?.speed ? Math.round(forecast.wind.speed * 3.6) : '--'} km/h</span>
                </div>
                <div class="detail-row">
                    <span>Pressure:</span>
                    <span>${forecast.main?.pressure || '--'} hPa</span>
                </div>
            `;
    forecastDetail.style.display = 'block';
}

// Toggle forecast visibility
forecastToggle.addEventListener('click', function () {
    const isHidden = forecastContainer.style.display === 'none';
    forecastContainer.style.display = isHidden ? 'flex' : 'none';
    forecastDetail.style.display = 'none';
    this.querySelector('i').style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
});

// Search functionality with case-insensitive handling
function handleSearch() {
    const location = cityInput.value.trim();
    if (location) {
        fetchWeather(location);
    }
}

searchBtn.addEventListener('click', handleSearch);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// ✅ Set default input value and fetch weather for Bangalore on load
cityInput.value = 'Bangalore';
fetchWeather('Bangalore');
