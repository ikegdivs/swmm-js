const http2 = require('http2');
const tls = require('tls');
const {promisify} = require('util');
const test = require('ava');
const pem = require('pem');
const resolveALPN = require('.');

const createCertificate = promisify(pem.createCertificate);

const createServer = async () => {
	const caKeys = await createCertificate({
		days: 1,
		selfSigned: true
	});

	const caRootKey = caKeys.serviceKey;
	const caRootCert = caKeys.certificate;

	const keys = await createCertificate({
		serviceCertificate: caRootCert,
		serviceKey: caRootKey,
		serial: Date.now(),
		days: 500,
		country: '',
		state: '',
		locality: '',
		organization: '',
		organizationUnit: '',
		commonName: 'localhost'
	});

	const key = keys.clientKey;
	const cert = keys.certificate;

	const s = http2.createSecureServer({cert, key, allowHTTP1: true});

	s.listen = promisify(s.listen);
	s.close = promisify(s.close);

	s.options = {
		host: 'localhost',
		rejectUnauthorized: false,
		ALPNProtocols: ['h2']
	};

	s.on('listening', () => {
		s.options.port = s.address().port;
	});

	return s;
};

let s;

test.before('setup', async () => {
	s = await createServer();
	await s.listen();
});

test.after('cleanup', async () => {
	await s.close();
});

test('works', async t => {
	const result = await resolveALPN(s.options);
	t.deepEqual(result, {
		alpnProtocol: 'h2',
		timeout: false
	});
});

test('`resolveSocket` option', async t => {
	const result = await resolveALPN({
		...s.options,
		resolveSocket: true
	});

	t.is(result.alpnProtocol, 'h2');
	t.true(result.socket instanceof tls.TLSSocket);

	result.socket.destroy();
});

test('empty options', async t => {
	const error = await t.throwsAsync(() => resolveALPN());
	const {code} = error;

	t.true(code === 'ECONNREFUSED' || code === 'ERR_MISSING_ARGS' || code === 'EADDRNOTAVAIL', error.stack);
});

test('works with timeout', async t => {
	t.timeout(100);

	const {socket, timeout} = await resolveALPN({
		host: '123.123.123.123',
		port: 443,
		ALPNProtocols: ['h2'],
		timeout: 1,
		resolveSocket: true
	});

	await new Promise((resolve, reject) => {
		socket.once('error', error => {
			reject(error);
			t.fail(error);
		});

		socket.once('timeout', resolve);
	});

	socket.destroy();

	t.true(timeout);
});
