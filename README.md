# App Clima Open-Meteo

Um aplicativo de clima feito com HTML, CSS e JavaScript. O projeto usa a API da Open-Meteo para buscar cidades, resolver cidades com nomes iguais e exibir clima atual com previsao dos proximos dias.

## Funcionalidades

- Buscar clima atual por cidade
- Mostrar opcoes quando existem cidades, bairros ou localidades com nomes parecidos
- Exibir temperatura, sensacao termica, umidade e vento
- Mostrar descricao e icone da condicao do tempo
- Exibir previsao resumida dos proximos dias com chance de chuva
- Buscar clima pela localizacao atual do usuario
- Alternar entre tema claro e escuro
- Salvar preferencia de tema no navegador
- Alternar temperatura entre Celsius e Fahrenheit
- Salvar buscas recentes no navegador
- Tratar cidade nao encontrada e erros de busca
- Incluir testes basicos em `tests.html`
- Layout responsivo

## Tecnologias

- HTML
- CSS
- JavaScript
- Open-Meteo API
- OpenStreetMap/Nominatim API
- Geolocation API do navegador

## Como usar

Abra o arquivo `index.html` no navegador ou publique o projeto no GitHub Pages.

Para executar os testes basicos, abra `tests.html` no navegador.

## API utilizada

O projeto usa a Open-Meteo e uma busca complementar com OpenStreetMap/Nominatim:

1. Geocoding API: transforma o nome digitado em uma lista de cidades com latitude e longitude.
2. Nominatim Search API: complementa resultados para bairros e localidades que podem nao aparecer na Open-Meteo.
3. Forecast API: usa latitude e longitude para buscar clima atual e previsao diaria.

Importante: a busca complementar por Nominatim deve respeitar a politica de uso do OpenStreetMap. Este projeto faz buscas apenas por acao do usuario e salva resultados em cache local para reduzir requisicoes repetidas.

## Proximas melhorias

- Melhorar os icones de clima com uma biblioteca visual
- Adicionar mapa simples da localidade escolhida
- Permitir limpar o cache de buscas salvas
