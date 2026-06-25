const searchForm = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const message = document.querySelector("#message");
const cityOptions = document.querySelector("#cityOptions");
const cityOptionsList = document.querySelector("#cityOptionsList");
const weatherResult = document.querySelector("#weatherResult");
const locationName = document.querySelector("#locationName");
const weatherDescription = document.querySelector("#weatherDescription");
const weatherIcon = document.querySelector("#weatherIcon");
const temperature = document.querySelector("#temperature");
const apparentTemperature = document.querySelector("#apparentTemperature");
const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");
const updatedAt = document.querySelector("#updatedAt");
const forecastList = document.querySelector("#forecastList");
const recentList = document.querySelector("#recentList");
const clearRecentButton = document.querySelector("#clearRecentButton");
const locationButton = document.querySelector("#locationButton");
const themeButton = document.querySelector("#themeButton");

const recentStorageKey = "weatherRecentSearches";
const themeStorageKey = "weatherTheme";
let recentSearches = JSON.parse(localStorage.getItem(recentStorageKey)) || [];
let cityResults = [];

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

function getWeatherIcon(code) {
  if (code === 0) return "☀";
  if ([1, 2].includes(code)) return "◐";
  if ([3, 45, 48].includes(code)) return "☁";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "☂";
  if ([71, 73, 75].includes(code)) return "❄";
  if ([95, 96, 99].includes(code)) return "⚡";
  return "◌";
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

function formatCityName(city) {
  const region = city.admin1 ? `${city.admin1}, ` : "";
  const country = city.country || "Pais nao informado";
  return `${city.name}, ${region}${country}`;
}

function saveRecentSearch(city) {
  const recentCity = {
    name: city.name,
    admin1: city.admin1 || "",
    country: city.country || "",
    latitude: city.latitude,
    longitude: city.longitude,
  };

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

async function getCityOptions(city) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "pt");
  url.searchParams.set("format", "json");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Nao foi possivel buscar a cidade.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Cidade nao encontrada.");
  }

  return data.results;
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
    const icon = document.createElement("strong");
    const temperatureText = document.createElement("strong");

    card.className = "forecast-card";
    icon.className = "forecast-icon";
    dayText.textContent = index === 0 ? "Hoje" : formatDay(day);
    icon.textContent = getWeatherIcon(daily.weather_code[index]);
    temperatureText.textContent = `${Math.round(daily.temperature_2m_min[index])} / ${Math.round(daily.temperature_2m_max[index])} C`;

    card.append(dayText, icon, temperatureText);
    forecastList.appendChild(card);
  });
}

function showWeather(city, weather) {
  const current = weather.current;

  locationName.textContent = formatCityName(city);
  weatherDescription.textContent = weatherDescriptions[current.weather_code] || "Condicao nao informada";
  weatherIcon.textContent = getWeatherIcon(current.weather_code);
  temperature.textContent = Math.round(current.temperature_2m);
  apparentTemperature.textContent = `${Math.round(current.apparent_temperature)} C`;
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

    const weatherData = await getWeather(city);

    showWeather(city, weatherData);
    saveRecentSearch(city);
    cityOptions.classList.add("hidden");
    showMessage("Clima atualizado.");
  } catch (error) {
    showMessage(error.message, true);
  }
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

cityOptionsList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  selectCity(cityResults[Number(button.dataset.index)]);
});

recentList.addEventListener("click", (event) => {
  if (!event.target.dataset.index) return;

  const city = recentSearches[Number(event.target.dataset.index)];
  cityInput.value = city.name;
  selectCity(city);
});

clearRecentButton.addEventListener("click", () => {
  recentSearches = [];
  localStorage.removeItem(recentStorageKey);
  renderRecentSearches();
  showMessage("Buscas recentes limpas.");
});

themeButton.addEventListener("click", () => {
  const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(newTheme);
  localStorage.setItem(themeStorageKey, newTheme);
});

locationButton.addEventListener("click", searchByCurrentLocation);

applyTheme(localStorage.getItem(themeStorageKey) || "light");
renderRecentSearches();
