# simple-mcp-http

MCP genérico que transforma definições de APIs HTTP em MCP Tools, configurado inteiramente por
variáveis de ambiente — sem necessidade de código específico para cada API.

## Instalação local

```
npm install
npm run dev
```

## Build

```
npm run build
```

## Testes

```
npm test
```

## Docker

```
docker compose build
docker compose run --rm simple-mcp
```

## Configuração

### `HEADERS`

Headers enviados em todas as requisições HTTP. Opcional. Formato JSON:

```
HEADERS={"Authorization":"Bearer XXXXXXXX","X-Tenant-ID":"123"}
```

### `TOOLS`

Define todas as MCP Tools expostas pelo servidor. Obrigatória. Formato JSON:

```json
{
  "FindInvoices": { "method": "GET", "url": "https://api.example.com/invoices" },
  "FindCustomer": { "method": "GET", "url": "https://api.example.com/customers/{{ID}}" }
}
```

Métodos suportados: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

### Parâmetros

Parâmetros em path ou query string são declarados com `{{PARAMETER}}` e detectados automaticamente:

```
https://api.example.com/invoices?status={{STATUS}}&page={{PAGE}}
```

gera uma tool com input schema:

```json
{
  "type": "object",
  "properties": { "STATUS": { "type": "string" }, "PAGE": { "type": "string" } },
  "required": ["STATUS", "PAGE"]
}
```

Os valores recebidos são URL encoded antes de compor a URL final.

### Body

Para `POST`, `PUT` e `PATCH`, a tool ganha automaticamente um parâmetro opcional `BODY`, enviado
como JSON no corpo da requisição (com `Content-Type: application/json`):

```json
{ "BODY": { "name": "Victor", "email": "victor@example.com" } }
```

### Erros

Respostas HTTP fora da faixa `2xx` são retornadas como erro da tool, preservando o status e o body
original da API, por exemplo:

```
HTTP 404: {"message":"Customer not found"}
```

## Exemplo completo

```
HEADERS={"Authorization":"Bearer XXXXX"}
TOOLS={
  "FindInvoices":{
    "method":"GET",
    "url":"https://api.example.com/invoices"
  },
  "FindCustomer":{
    "method":"GET",
    "url":"https://api.example.com/customers/{{ID}}"
  }
}
```

Isso disponibiliza, via MCP:

```
FindInvoices()
FindCustomer(ID)
```

## Escopo

O servidor roda via stdio e é stateless. OAuth, autenticação própria, persistência, cache, retry,
rate limiting e demais recursos avançados estão fora do escopo desta versão — veja `doc.md` para o
detalhamento completo dos requisitos.
