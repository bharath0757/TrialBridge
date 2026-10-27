import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const axiosURL = pathToFileURL(require.resolve('axios')).href;
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
globalThis.window = { location: { hostname: 'trialbridge-in-5443.web.app', href: '/' } };
async function loadTS(path) {
  let source = readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('import.meta.env', '({})').replace("from 'axios'", `from '${axiosURL}'`);
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
const { default: api } = await loadTS('../src/lib/api.ts');
const { apiErrorMessage } = await loadTS('../src/lib/apiError.ts');
function respond(data, type='application/json') {
  api.defaults.adapter = async config => ({data, status:200, statusText:'OK', headers:{'content-type':type}, config});
}
test('rejects Firebase HTML fallback before dashboard state can receive it', async () => {
  respond('<!doctype html><html><div id="root"></div></html>', 'text/html');
  await assert.rejects(api.get('/studies/'), /API is not connected/);
});
test('rejects HTML even when the server mislabels its content type', async () => {
  respond('   <!DOCTYPE html><html></html>');
  await assert.rejects(api.get('/participants/'), /API is not connected/);
});
test('accepts legitimate empty collections', async () => {
  respond([]);
  assert.deepEqual((await api.get('/studies/')).data, []);
});
test('attaches the current token to API requests', async () => {
  storage.set('trialbridge_token','signed-token');
  respond([]);
  assert.equal((await api.get('/studies/')).config.headers.Authorization, 'Bearer signed-token');
});
test('expired sessions clear stored identity', async () => {
  storage.set('trialbridge_user','cached-user');
  api.defaults.adapter = async config => {throw {config, response:{status:401}};};
  await assert.rejects(api.get('/studies/'));
  assert.equal(storage.has('trialbridge_token'), false);
  assert.equal(storage.has('trialbridge_user'), false);
});
test('login validation errors do not reload the page', async () => {
  window.location.href='/login-test';
  await assert.rejects(api.post('/auth/login'));
  assert.equal(window.location.href, '/login-test');
});
test('structured validation and database errors produce readable messages', () => {
  assert.equal(apiErrorMessage({isAxiosError:true,response:{status:422,data:{detail:[{msg:'Invalid email'}]}}}), 'Invalid email');
  assert.match(apiErrorMessage({isAxiosError:true,response:{status:503,data:{detail:{status:'disconnected'}}}}), /temporarily unavailable/);
});

test('frontend-only deployments explicitly reject the unavailable API response', async () => {
  respond({service_unavailable: true, detail: 'Backend deployment is pending.'});
  await assert.rejects(api.post('/auth/login'), /API is not connected/);
});

const { normalizeResource } = await loadTS('../src/lib/normalizeResource.ts');
test('live visits and tasks map API fields to dashboard fields', () => {
  const visit = normalizeResource('visits', {id:'v1',participant_id:'p1',study_id:'s1',visit_name:'Baseline',date:'2026-11-01T10:30:00',status:'SCHEDULED'});
  assert.equal(visit.participantId, 'p1'); assert.equal(visit.type, 'Baseline'); assert.equal(visit.time, '10:30'); assert.equal(visit.location, 'Not specified');
  const task = normalizeResource('tasks', {id:'t1',assignee_id:'u1',study_id:'s1',status:'TODO',due_date:'2026-11-01T00:00:00'});
  assert.equal(task.status, 'pending'); assert.equal(task.dueDate, '2026-11-01');
});
test('private documents and messages retain ownership and content', () => {
  assert.equal(normalizeResource('documents', {id:'d1',participant_id:'p1',title:'Consent'}).name, 'Consent');
  const message = normalizeResource('messages', {id:'m1',from_id:'u1',to_id:'u2',content:'Research update',read:false});
  assert.equal(message.body, 'Research update'); assert.equal(message.to, 'u2');
});
test('malformed collection records are rejected before reaching dashboard state', () => {
  for (const value of [null, 'html', [], {}, {name:'missing identity'}]) assert.throws(() => normalizeResource('visits', value));
});
