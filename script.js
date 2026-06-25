const searchForm = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const message = document.querySelector("#message");
const weatherResult = document.querySelector("#weatherResult");
const locationName = document.querySelector("#locationName");
const weatherDescription = document.querySelector("#weatherDescription");
const temperature = document.querySelector("#temperature");
const apparentTemperature = document.querySelector("#apparentTemperature");
const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");
const updatedAt = document.querySelector("#updatedAt");
const recentList = document.querySelector("#recentList");
const clearRecentButton = document.querySelector("#clearRecentButton");

const recentStorageKey = "weatherRecentSearches";
let recentSearches = JSON.parse(localStorage.getItem(recentStorageKey)) || [];

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

function saveRecentSearch(city) {
  recentSearches = [
    city,
    ...recentSearches.filter((item) => item.toLowerCase() !== city.toLowerCase()),
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

  recentSearches.forEach((city) => {
    const item = document.createElement("li");
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = city;
    button.dataset.city = city;

    item.appendChild(button);
    recentList.appendChild(item);
  });
}

async function getCityCoordinates(city) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
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

  return data.results[0];
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
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Nao foi possivel buscar o clima.");
  }

  return response.json();
}

function showWeather(city, weather) {
  const current = weather.current;
  const country = city.country || "Pais nao informado";
  const region = city.admin1 ? `, ${city.admin1}` : "";

  locationName.textContent = `${city.name}${region}, ${country}`;
  weatherDescription.textContent = weatherDescriptions[current.weather_code] || "Condicao nao informada";
  temperature.textContent = Math.round(current.temperature_2m);
  apparentTemperature.textContent = `${Math.round(current.apparent_temperature)} °C`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  updatedAt.textContent = formatTime(current.time);
  weatherResult.classList.remove("hidden");
}

async function searchWeather(city) {
  const cleanedCity = city.trim();

  if (!cleanedCity) {
    showMessage("Digite o nome de uma cidade.", true);
    return;
  }

  try {
    showMessage("Buscando clima...");
    weatherResult.classList.add("hidden");

    const cityData = await getCityCoordinates(cleanedCity);
    const weatherData = await getWeather(cityData);

    showWeather(cityData, weatherData);
    saveRecentSearch(cityData.name);
    showMessage("Clima atualizado.");
  } catch (error) {
    showMessage(error.message, true);
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchWeather(cityInput.value);
});

recentList.addEventListener("click", (event) => {
  if (!event.target.dataset.city) return;
  cityInput.value = event.target.dataset.city;
  searchWeather(event.target.dataset.city);
});

clearRecentButton.addEventListener("click", () => {
  recentSearches = [];
  localStorage.removeItem(recentStorageKey);
  renderRecentSearches();
  showMessage("Buscas recentes limpas.");
});

renderRecentSearches();
