const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code&hourly=temperature_2m&timeformat=unixtime';

// showing current weather on page load
getWeather();

// utility function to fetch current weather data
async function getWeather() {
    try {
        document.querySelector('.current-weather-wrapper').style.display = 'none';
        document.querySelector('.weather-loading').classList.add('active');

        const position = await requestPosition();
        if(!position) throw new Error('No position');

        const { latitude, longitude } = position.coords;
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const response = await fetch(`${WEATHER_API_URL}&latitude=${latitude}&longitude=${longitude}&timezone=${timeZone}`);
        const weatherData = await response.json();

        document.querySelector('.current-temp').textContent = Math.round(weatherData.current.temperature_2m);
        document.querySelector('.weather-icon').src = getWeatherIconUrl(weatherData.current.weather_code);
    } catch (err) {
        console.error('Unable to get weather information', err);
    } finally {
        document.querySelector('.current-weather-wrapper').style.display = 'flex';
        document.querySelector('.weather-loading').classList.remove('active');
    }
}

// utility function to get weather icon url based on weather code from icons folder
function getWeatherIconUrl(weatherCode) {
    return `icons/${WEATHER_ICON_MAP.get(weatherCode)}.svg`;
}

const WEATHER_ICON_MAP = new Map();

// mapping weather icon with weather codes
addWeatherIconMapping([0, 1], "sun");
addWeatherIconMapping([2], "cloud-sun");
addWeatherIconMapping([3], "cloud");
addWeatherIconMapping([45, 48], "smog");
addWeatherIconMapping([51, 53, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], "cloud-showers-heavy");
addWeatherIconMapping([71, 73, 75, 77, 85, 86], "snowflake");
addWeatherIconMapping([95, 96, 99], "cloud-bolt");


// utility function to map weather icon with specific weather code
function addWeatherIconMapping(codes, icon) {
    codes.forEach(code => WEATHER_ICON_MAP.set(code, icon));
}

// update current weather information on click of weather icon
document.querySelector('.current-weather-wrapper').addEventListener('click', () => getWeather());