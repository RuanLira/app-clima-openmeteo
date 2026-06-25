# App Clima Open-Meteo

Um aplicativo de clima feito com HTML, CSS e JavaScript. O projeto usa a API da Open-Meteo para buscar cidades, resolver cidades com nomes iguais e exibir clima atual com previsao dos proximos dias.

## Funcionalidades

- Buscar clima atual por cidade
- Mostrar opcoes quando existem cidades com o mesmo nome
- Exibir temperatura, sensacao termica, umidade e vento
- Mostrar descricao e icone da condicao do tempo
- Exibir previsao resumida dos proximos dias
- Buscar clima pela localizacao atual do usuario
- Alternar entre tema claro e escuro
- Salvar preferencia de tema no navegador
- Salvar buscas recentes no navegador
- Tratar cidade nao encontrada e erros de busca
- Layout responsivo

## Tecnologias

- HTML
- CSS
- JavaScript
- Open-Meteo API
- Geolocation API do navegador

## Como usar

Abra o arquivo `index.html` no navegador ou publique o projeto no GitHub Pages.

## API utilizada

O projeto usa a Open-Meteo em duas etapas:

1. Geocoding API: transforma o nome digitado em uma lista de cidades com latitude e longitude.
2. Forecast API: usa latitude e longitude para buscar clima atual e previsao diaria.

## Proximas melhorias

- Adicionar mais detalhes na previsao diaria
- Melhorar os icones de clima com uma biblioteca visual
- Permitir escolher unidade de temperatura
- Adicionar testes automatizados para a logica de busca
