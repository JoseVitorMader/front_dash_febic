# Dashboard de Metas (React + Firebase Realtime Database + Power BI)

Aplicação React para cadastro e acompanhamento de metas de equipes em tempo real usando Firebase Realtime Database, com pipeline opcional para Power BI (streaming quase em tempo real).

## Funcionalidades
- Criar meta (equipe, título, valor alvo)
- Editar meta existente
- Incrementos rápidos (+1, +5, +10) com transação no Realtime Database
- Barra de progresso e porcentagem
- Atualização instantânea via listeners

## Estrutura de dados (Realtime Database)
```
/goals/{goalId} = {
	team: string,
	title: string,
	target: number,
	current: number,
	createdAt: epoch_ms,
	updatedAt: epoch_ms
}
```

## Rodar localmente
```powershell
npm install
npm start
```

## Integração Power BI (Melhor abordagem: Dataset de Streaming + Cloud Function)

### 1. Criar dataset de streaming no Power BI
1. Acesse Power BI Service > Workspace desejado.
2. New > Streaming dataset > API.
3. Campos (marque Historic data analysis se quiser histórico):
	 - goalId (Texto)
	 - team (Texto)
	 - title (Texto)
	 - target (Número)
	 - current (Número)
	 - percent (Número)
	 - updatedAt (DateTime)
4. Salve e copie a URL de push (endpoint). Exemplo: `https://api.powerbi.com/beta/.../pushdataset/rows?key=...`

### 2. Configurar Cloud Functions
Instale Firebase CLI e inicialize funções (já existe pasta `functions/`).
```powershell
firebase login
firebase use <SEU_PROJECT_ID>
cd functions
npm install
```

### 3. Guardar a URL do Power BI como segredo
Crie um arquivo temporário com a URL (ou digite diretamente):
```powershell
echo https://api.powerbi.com/beta/.../rows?key=SEU_KEY > pbi_url.txt
firebase functions:secrets:set PBI_PUSH_URL --data-file=pbi_url.txt
```

### 4. Deploy das funções
No diretório raiz (onde está firebase.json, se ainda não existir rode `firebase init functions` antes):
```powershell
firebase deploy --only functions
```

### 5. Testar fluxo
1. Abra o app e crie/edite/incremente uma meta.
2. No Power BI Service, adicione um tile de streaming (Add tile > Custom streaming data > escolha dataset > Campos). Deve atualizar em segundos.

### 6. Relatório analítico (opcional)
Se marcou Historic data analysis, você pode criar um relatório a partir do dataset (Workspace > Datasets > Create report) e usar métricas:
```
Progresso % = DIVIDE(SUM(goals[current]), SUM(goals[target]))
Restante = SUM(goals[target]) - SUM(goals[current])
```

## Alternativas de integração
- BigQuery: replicar via função e conectar com DirectQuery (mais escalável).
- Power Query REST direto: menor complexidade, sem “puxar” em segundos.

## Segurança
- Ajuste regras do Realtime Database para restringir escrita se necessário.
- Nunca exponha a URL do push do Power BI no frontend.
- Use segredos (`functions:secrets`) para variáveis sensíveis.

## Cloud Function usada
Arquivo: `functions/index.js` exporta `goalToPowerBI` que envia cada alteração em `/goals/{goalId}`.

---

# Create React App (documentação padrão)

Este projeto foi criado com [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
