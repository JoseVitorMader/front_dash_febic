import { onValueWritten } from 'firebase-functions/v2/database';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

admin.initializeApp();

export const goalToPowerBI = onValueWritten({ ref: '/goals/{goalId}' }, async (event) => {
  const after = event.data.after.val();
  if (!after) { return; }
  const percent = after.target ? (after.current || 0) / after.target * 100 : 0;
  const url = process.env.PBI_PUSH_URL;
  if (!url) {
    console.warn('PBI_PUSH_URL não configurada');
    return;
  }
  const rows = [{
    goalId: event.params.goalId,
    team: after.team,
    title: after.title,
    target: after.target,
    current: after.current || 0,
    percent: Number(percent.toFixed(2)),
    updatedAt: new Date(after.updatedAt || Date.now()).toISOString()
  }];
  try {
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('Falha Power BI', resp.status, text);
    }
  } catch (err) {
    console.error('Erro enviando para Power BI', err);
  }
});


let cachedToken = { value: null, exp: 0 };
async function getPowerBiToken() {
  const now = Date.now();
  if (cachedToken.value && now < cachedToken.exp - 30000) return cachedToken.value;
  const tenant = process.env.PBI_TENANT_ID;
  const clientId = process.env.PBI_CLIENT_ID;
  const clientSecret = process.env.PBI_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) throw new Error('Credenciais Power BI não configuradas.');
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://analysis.windows.net/powerbi/api/.default',
    grant_type: 'client_credentials'
  });
  const resp = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, { method:'POST', body });
  if (!resp.ok) throw new Error('Falha token Power BI: ' + resp.status + ' ' + await resp.text());
  const json = await resp.json();
  cachedToken = { value: json.access_token, exp: now + (json.expires_in * 1000) };
  return cachedToken.value;
}

export const goalToPowerBIPushDataset = onValueWritten({ ref: '/goals/{goalId}' }, async (event) => {
  const after = event.data.after.val();
  if (!after) return; 
  const datasetId = process.env.PBI_DATASET_ID;
  const tableName = process.env.PBI_TABLE_NAME || 'RealTimeData';
  if (!datasetId) { console.warn('PBI_DATASET_ID ausente'); return; }
  const percent = after.target ? (after.current || 0) / after.target * 100 : 0;
  try {
    const token = await getPowerBiToken();
    const rows = [{
      goalId: event.params.goalId,
      team: after.team,
      title: after.title,
      target: after.target,
      current: after.current || 0,
      percent: Number(percent.toFixed(2)),
      updatedAt: new Date(after.updatedAt || Date.now()).toISOString()
    }];
    const resp = await fetch(`https://api.powerbi.com/v1.0/myorg/datasets/${datasetId}/tables/${tableName}/rows`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rows })
    });
    if (!resp.ok) {
      console.error('Falha push dataset Power BI', resp.status, await resp.text());
    }
  } catch (err) {
    console.error('Erro push dataset Power BI', err);
  }
});
