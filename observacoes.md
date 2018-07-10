 # SCC0219 - Introdução ao Desenvolvimento Web   	

## Trabalho Prático - Parte 3                     	

### Alunos 

Danilo Zecchin Nery - 8602430 	

Felipe Scrochio Custódio - 9442688 	

Caroline Jesuíno Nunes da Silva - 9293925 	

Henrique Martins Loschiavo             8936972 	

---

O backend para a aplicação Petshop foi implementado utilizando: 

* servidor Express 
* requisições http do cliente para o servidor utilizando Axios (https://github.com/axios/axios)
* deploy na IBM Cloud (https://github.com/IBM-Cloud/get-started-node)
* API de couchDB para IBM Cloud com cloudant (https://github.com/cloudant/nodejs-cloudant)

## Disponibilidade

O repositório Petshop Backend (https://github.com/dnery/pet-shop-backend) fornece funcionalidade
de servidor para o frontend das partes 1 e 2 do projeto (https://github.com/dnery/pet-shop-app).

A aplicação foi implantada no serviço de nuvem da IBM, IBM Cloud, tendo seus endpoints acessíveis através 
do link https://pet-shop-connector-shiny-reedbuck.mybluemix.net/

Como o serviço é pago, estamos utilizando a versão IBM Lite, que fica setada para ser deletada após 30
dias de inatividade. A publicação inicial do projeto foi feita no dia 08/07/2018. 

## Armazenamento

Implementamos a parte de armazenamento utilizando uma instância NoSQL do CouchDB, criada utilizando
IBM Cloudant (para acesso ao sistema que foi implantado na IBM Cloud). As queries são feitas através
de um endpoint público, acessível em https://4e4987cb-ab00-4b17-801a-1e55b7177e19-bluemix.cloudant.com/

Lembrando que estamos utilizando a versão Lite, então está setado para expirar após 30 dias de inatividade.

## Observações sobre o Projeto

Tivemos muitas dificuldades durante essa última etapa. O backend do sistema foi, sem dúvidas, a parte mais
desafiadora do projeto. Todos os integrantes estavam aprendendo desenvolvimento web pela primeira vez, então
cada etapa, tentando amarrar os códigos de servidor com as funcionalidades do cliente, foi bem longa.

Somado a esse desafio foi o fim de semestre: quase todas as provas e entregas de outros trabalhos, 
também enormes, de outras disciplinas, como Bases de Dados e Inteligência Artificial, nos deixou com o tempo super corrido para amarrar todas as funcionalidades de administração com o front-end. 

Apesar desse pedaço faltando do sistema, sentimos que conseguimos implementar bastante do que foi pedido para a parte 3, dado o grande escopo do projeto e as novas tecnologias que tivemos que aprender, como fazer as conexões ao CouchDB, fazer o front-end utilizar esses dados do lado do servidor, deploy em um sistema de nuvem, etc. 

Ao final do projeto, aprendemos a levantar uma aplicação web do zero, utilizando tecnologias modernas e que estão em alta no mercado. 








