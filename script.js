const searchForm = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const suggestions = document.querySelector("#suggestions");
const message = document.querySelector("#message");
const cityOptions = document.querySelector("#cityOptions");
const cityOptionsList = document.querySelector("#cityOptionsList");
const weatherResult = document.querySelector("#weatherResult");
const locationName = document.querySelector("#locationName");
const weatherDescription = document.querySelector("#weatherDescription");
const weatherIcon = document.querySelector("#weatherIcon");
const mapLink = document.querySelector("#mapLink");
const temperature = document.querySelector("#temperature");
const apparentTemperature = document.querySelector("#apparentTemperature");
const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");
const updatedAt = document.querySelector("#updatedAt");
const forecastList = document.querySelector("#forecastList");
const recentList = document.querySelector("#recentList");
const clearRecentButton = document.querySelector("#clearRecentButton");
const clearCacheButton = document.querySelector("#clearCacheButton");
const locationButton = document.querySelector("#locationButton");
const themeButton = document.querySelector("#themeButton");
const unitInputs = document.querySelectorAll("input[name='temperatureUnit']");

const recentStorageKey = "weatherRecentSearches";
const themeStorageKey = "weatherTheme";
const unitStorageKey = "weatherTemperatureUnit";
const geocodingCacheKey = "weatherGeocodingCache";

let recentSearches = JSON.parse(localStorage.getItem(recentStorageKey)) || [];
let geocodingCache = JSON.parse(localStorage.getItem(geocodingCacheKey)) || {};
let cityResults = [];
let suggestionResults = [];
let currentCity = null;
let currentWeather = null;
let temperatureUnit = localStorage.getItem(unitStorageKey) || "celsius";
let suggestionTimer = null;
let suggestionRequestId = 0;

const weatherDescriptions = {
  0: "Ceu limpo",
  1: "Principalmente limpo",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina com gelo",
  51: "Garoa fraca",
  53: "Garoa moderada",
  55: "Garoa intensa",
  61: "Chuva fraca",
  63: "Chuva moderada",
  65: "Chuva forte",
  71: "Neve fraca",
  73: "Neve moderada",
  75: "Neve forte",
  80: "Pancadas de chuva fracas",
  81: "Pancadas de chuva moderadas",
  82: "Pancadas de chuva fortes",
  95: "Trovoada",
  96: "Trovoada com granizo",
  99: "Trovoada forte com granizo",
};

function getWeatherVisual(code) {
  if (code === 0) return { label: "Sol", type: "sun" };
  if ([1, 2].includes(code)) return { label: "Claro", type: "sun" };
  if ([3].includes(code)) return { label: "Nuvens", type: "cloud" };
  if ([45, 48].includes(code)) return { label: "Neblina", type: "fog" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { label: "Chuva", type: "rain" };
  if ([71, 73, 75].includes(code)) return { label: "Neve", type: "snow" };
  if ([95, 96, 99].includes(code)) return { label: "Raio", type: "storm" };
  return { label: "Clima", type: "cloud" };
}

function getWeatherIcon(code) {
  return getWeatherVisual(code).label;
}

function setWeatherIcon(element, code) {
  const visual = getWeatherVisual(code);
  element.className = `weather-icon weather-icon--${visual.type}`;
  element.setAttribute("aria-label", visual.label);
}

function createWeatherIcon(code) {
  const icon = document.createElement("span");
  setWeatherIcon(icon, code);
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function formatTime(dateText) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateText));
}

function formatDay(dateText) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${dateText}T12:00:00`));
}

function formatTemperature(value) {
  if (temperatureUnit === "fahrenheit") {
    return `${Math.round((value * 9) / 5 + 32)} F`;
  }

  return `${Math.round(value)} C`;
}

function formatCityName(city) {
  const region = city.admin1 ? `${city.admin1}, ` : "";
  const country = city.country || "Pais nao informado";
  return `${city.name}, ${region}${country}`;
}

function normalizeCity(city) {
  return {
    name: city.name,
    admin1: city.admin1 || "",
    country: city.country || "",
    latitude: Number(city.latitude),
    longitude: Number(city.longitude),
    source: city.source || "open-meteo",
  };
}

function normalizeNominatimPlace(place) {
  const address = place.address || {};
  const name = place.name
    || address.suburb
    || address.neighbourhood
    || address.city
    || address.town
    || address.village
    || place.display_name.split(",")[0];

  return normalizeCity({
    name,
    admin1: address.state || address.city || address.county || "",
    country: address.country || "",
    latitude: place.lat,
    longitude: place.lon,
    source: "nominatim",
  });
}

function removeDuplicateCities(cities) {
  const uniqueCities = new Map();

  cities.forEach((city) => {
    const normalized = normalizeCity(city);
    const key = [
      normalized.name.toLowerCase(),
      normalized.admin1.toLowerCase(),
      normalized.country.toLowerCase(),
      normalized.latitude.toFixed(2),
      normalized.longitude.toFixed(2),
    ].join("|");

    if (!uniqueCities.has(key)) {
      uniqueCities.set(key, normalized);
    }
  });

  return [...uniqueCities.values()];
}

function saveRecentSearch(city) {
  const recentCity = normalizeCity(city);

  recentSearches = [
    recentCity,
    ...recentSearches.filter((item) => (
      item.latitude !== city.latitude || item.longitude !== city.longitude
    )),
  ].slice(0, 5);

  localStorage.setItem(recentStorageKey, JSON.stringify(recentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  recentList.innerHTML = "";

  if (recentSearches.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "Nenhuma busca recente.";
    recentList.appendChild(emptyItem);
    return;
  }

  recentSearches.forEach((city, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = formatCityName(city);
    button.dataset.index = index;

    item.appendChild(button);
    recentList.appendChild(item);
  });
}

function renderCityOptions(cities) {
  cityOptionsList.innerHTML = "";
  cityResults = cities;

  cities.forEach((city, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const details = document.createElement("span");

    button.type = "button";
    button.dataset.index = index;
    button.textContent = city.name;
    details.textContent = `${city.admin1 || "Regiao nao informada"}, ${city.country || "Pais nao informado"}`;

    button.appendChild(details);
    item.appendChild(button);
    cityOptionsList.appendChild(item);
  });

  cityOptions.classList.remove("hidden");
}

function renderExactSearchSuggestion(query, helperText = "Busca completa por bairros, cidades e localidades") {
  const button = document.createElement("button");
  const details = document.createElement("span");

  button.type = "button";
  button.dataset.action = "full-search";
  button.dataset.query = query;
  button.textContent = `Buscar "${query}"`;
  details.textContent = helperText;

  button.appendChild(details);
  suggestions.appendChild(button);
}

function renderSuggestions(cities, query = "") {
  suggestions.innerHTML = "";
  suggestionResults = cities;
  const cleanedQuery = query.trim();
  const shouldShowExactSearch = cleanedQuery.length >= 3;

  if (cities.length === 0 && !shouldShowExactSearch) {
    suggestions.classList.add("hidden");
    return;
  }

  if (cleanedQuery.includes(",")) {
    renderExactSearchSuggestion(cleanedQuery, "Melhor para bairro, estado ou cidade com nome repetido");
    suggestions.classList.remove("hidden");
    return;
  }

  cities.slice(0, 6).forEach((city, index) => {
    const button = document.createElement("button");
    const details = document.createElement("span");

    button.type = "button";
    button.dataset.index = index;
    button.textContent = city.name;
    details.textContent = `${city.admin1 || "Regiao nao informada"}, ${city.country || "Pais nao informado"}`;

    button.appendChild(details);
    suggestions.appendChild(button);
  });

  if (shouldShowExactSearch) {
    renderExactSearchSuggestion(cleanedQuery);
  }

  suggestions.classList.remove("hidden");
}

async function getCityOptions(city) {
  const cacheKey = city.toLowerCase();

  if (geocodingCache[cacheKey]) {
    return geocodingCache[cacheKey];
  }

  const [openMeteoCities, nominatimCities] = await Promise.all([
    getOpenMeteoCityOptions(city),
    getNominatimCityOptions(city),
  ]);

  const cities = removeDuplicateCities([...openMeteoCities, ...nominatimCities])
    .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));

  if (cities.length === 0) {
    throw new Error("Cidade nao encontrada.");
  }

  geocodingCache[cacheKey] = cities;
  localStorage.setItem(geocodingCacheKey, JSON.stringify(geocodingCache));

  return cities;
}

async function getOpenMeteoCityOptions(city) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "50");
  url.searchParams.set("language", "pt");
  url.searchParams.set("format", "json");

  const response = await fetch(url);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.results || [];
}

async function getNominatimCityOptions(city) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", city);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "20");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("accept-language", "pt-BR");
  url.searchParams.set("featureType", "settlement");

  const response = await fetch(url);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.map(normalizeNominatimPlace);
}

async function getWeather({ latitude, longitude }) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("current", [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "weather_code",
    "wind_speed_10m",
  ].join(","));
  url.searchParams.set("daily", [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
  ].join(","));
  url.searchParams.set("forecast_days", "4");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Nao foi possivel buscar o clima.");
  }

  return response.json();
}

function renderForecast(daily) {
  forecastList.innerHTML = "";

  daily.time.forEach((day, index) => {
    const card = document.createElement("article");
    const dayText = document.createElement("span");
    const icon = createWeatherIcon(daily.weather_code[index]);
    const temperatureText = document.createElement("strong");
    const rainText = document.createElement("span");

    card.className = "forecast-card";
    dayText.textContent = index === 0 ? "Hoje" : formatDay(day);
    temperatureText.textContent = `${formatTemperature(daily.temperature_2m_min[index])} / ${formatTemperature(daily.temperature_2m_max[index])}`;
    rainText.textContent = `Chuva: ${daily.precipitation_probability_max[index] ?? 0}%`;

    card.append(dayText, icon, temperatureText, rainText);
    forecastList.appendChild(card);
  });
}

function showWeather(city, weather) {
  const current = weather.current;

  locationName.textContent = formatCityName(city);
  weatherDescription.textContent = weatherDescriptions[current.weather_code] || "Condicao nao informada";
  setWeatherIcon(weatherIcon, current.weather_code);
  mapLink.href = `https://www.openstreetmap.org/?mlat=${city.latitude}&mlon=${city.longitude}#map=12/${city.latitude}/${city.longitude}`;
  temperature.textContent = formatTemperature(current.temperature_2m).replace(" C", "").replace(" F", "");
  document.querySelector(".temperature span:last-child").textContent = temperatureUnit === "fahrenheit" ? "F" : "C";
  apparentTemperature.textContent = formatTemperature(current.apparent_temperature);
  humidity.textContent = `${current.relative_humidity_2m}%`;
  wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  updatedAt.textContent = formatTime(current.time);
  renderForecast(weather.daily);
  weatherResult.classList.remove("hidden");
}

async function selectCity(city) {
  try {
    showMessage("Buscando clima...");
    weatherResult.classList.add("hidden");

    const normalizedCity = normalizeCity(city);
    const weatherData = await getWeather(normalizedCity);

    currentCity = normalizedCity;
    currentWeather = weatherData;
    showWeather(normalizedCity, weatherData);
    saveRecentSearch(normalizedCity);
    cityOptions.classList.add("hidden");
    suggestions.classList.add("hidden");
    showMessage("Clima atualizado.");
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function searchSuggestions(city) {
  const cleanedCity = city.trim();
  const requestId = suggestionRequestId + 1;
  suggestionRequestId = requestId;

  if (cleanedCity.length < 3) {
    renderSuggestions([], cleanedCity);
    return;
  }

  if (cleanedCity.includes(",")) {
    renderSuggestions([], cleanedCity);
    return;
  }

  const cities = await getOpenMeteoCityOptions(cleanedCity);

  if (requestId !== suggestionRequestId) {
    return;
  }

  renderSuggestions(removeDuplicateCities(cities).slice(0, 6), cleanedCity);
}

async function searchCities(city) {
  const cleanedCity = city.trim();

  if (!cleanedCity) {
    showMessage("Digite o nome de uma cidade.", true);
    return;
  }

  try {
    showMessage("Buscando cidades...");
    weatherResult.classList.add("hidden");

    const cities = await getCityOptions(cleanedCity);

    if (cities.length === 1) {
      selectCity(cities[0]);
      return;
    }

    renderCityOptions(cities);
    showMessage("Escolha uma das cidades encontradas.");
  } catch (error) {
    cityOptions.classList.add("hidden");
    showMessage(error.message, true);
  }
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  themeButton.textContent = isDark ? "Tema claro" : "Tema escuro";
}

function applyTemperatureUnit(unit) {
  temperatureUnit = unit;
  localStorage.setItem(unitStorageKey, unit);

  unitInputs.forEach((input) => {
    input.checked = input.value === unit;
  });

  if (currentCity && currentWeather) {
    showWeather(currentCity, currentWeather);
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

async function searchByCurrentLocation() {
  if (!navigator.geolocation) {
    showMessage("Seu navegador nao suporta localizacao.", true);
    return;
  }

  try {
    showMessage("Buscando sua localizacao...");
    const position = await getCurrentPosition();
    const city = {
      name: "Minha localizacao",
      admin1: "",
      country: "",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    await selectCity(city);
  } catch {
    showMessage("Nao foi possivel acessar sua localizacao.", true);
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchCities(cityInput.value);
});

cityInput.addEventListener("input", () => {
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(() => {
    searchSuggestions(cityInput.value).catch(() => renderSuggestions([]));
  }, 350);
});

suggestions.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "full-search") {
    cityInput.value = button.dataset.query;
    suggestions.classList.add("hidden");
    searchCities(button.dataset.query);
    return;
  }

  const city = suggestionResults[Number(button.dataset.index)];
  cityInput.value = city.name;
  selectCity(city);
});

cityOptionsList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  selectCity(cityResults[Number(button.dataset.index)]);
});

recentList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const city = recentSearches[Number(button.dataset.index)];
  cityInput.value = city.name;
  selectCity(city);
});

clearRecentButton.addEventListener("click", () => {
  recentSearches = [];
  localStorage.removeItem(recentStorageKey);
  renderRecentSearches();
  showMessage("Buscas recentes limpas.");
});

clearCacheButton.addEventListener("click", () => {
  geocodingCache = {};
  localStorage.removeItem(geocodingCacheKey);
  showMessage("Cache de buscas limpo.");
});

themeButton.addEventListener("click", () => {
  const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(newTheme);
  localStorage.setItem(themeStorageKey, newTheme);
});

locationButton.addEventListener("click", searchByCurrentLocation);

unitInputs.forEach((input) => {
  input.addEventListener("change", () => {
    applyTemperatureUnit(input.value);
  });
});

applyTheme(localStorage.getItem(themeStorageKey) || "light");
applyTemperatureUnit(temperatureUnit);
renderRecentSearches();
