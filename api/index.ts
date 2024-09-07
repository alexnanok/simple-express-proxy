import axios from 'axios';
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';

const VERBOSE = true;

const FORBIDDEN_REQ_HEADERS = [
    "host", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-forwarded-port", "x-vercel-id",
    "x-vercel-forwarded-for", "x-vercel-deployment-url", "x-real-ip", "cf-connecting-ip", "x-vercel-proxied-for",
    "x-vercel-ip-country-region", "x-vercel-ip-latitude", "x-vercel-ip-longitude", "x-vercel-ip-city", "forwarded",
    "x-vercel-ip-as-number", "x-vercel-proxy-signature-ts", "x-vercel-proxy-signature", "x-vercel-ja4-digest",
    "x-vercel-ip-continent", "x-vercel-ip-country", "x-vercel-ip-timezone"
];

const FORBIDDEN_RES_HEADERS = [
    "content-length", "content-encoding", "transfer-encoding", "content-security-policy-report-only", "content-security-policy"
];

const DEFAULT_RES_HEADERS = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-expose-headers": "*",
    "access-control-allow-methods": "*",
    "access-control-allow-credentials": "true"
};

const app = express();

app.all('/*', async (req: ExpressRequest, res: ExpressResponse) => {
    // Extraire l'URL de la requête
    const url = req.path.substring(1); // Enlève le premier caractère '/' de la route

    // test whether the URL provided as a path is valid or not
    try {
        new URL(url);
    } catch (err: any) {
        console.error(err.message);
        res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: 'Invalid URL' }));
        return;
    }

    // construction of the headers object with allowed request headers
    const reqHeaders = Object.fromEntries(
        Object.entries(req.headers)
            .filter(([key]) => !FORBIDDEN_REQ_HEADERS.includes(key.toLowerCase()))
            .map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : value ?? ''])
    );

    // construction of body as a buffer
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await new Promise<Buffer>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });

    if (VERBOSE) {
        console.log(`\n==> Sending ${req.method} request to ${url}`);
        console.log(`> with headers ${JSON.stringify(reqHeaders)}`);
        if (body) {
            try {
                console.log(`> with body ${JSON.stringify(JSON.parse(body.toString()))}`);
            } catch (err) {
                console.log(`> with body ${body.toString()}`);
            }
        }
    }

    try {
        const proxyResponse = await axios({
            url,
            method: req.method,
            headers: reqHeaders,
            data: body,
            responseType: 'stream',
            validateStatus: (status: number) => true // don't throw an exception on error status
        });

        // construction of response headers object with allowed response headers
        const resHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(proxyResponse.headers)) {
            if (!FORBIDDEN_RES_HEADERS.includes(key.toLowerCase())) {
                resHeaders[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value as string;
            }
        }

        // headers like access-control-allow-origin must not be set by the proxy request
        Object.assign(resHeaders, DEFAULT_RES_HEADERS);
        resHeaders['x-url'] = proxyResponse.request.res.responseUrl;

        if (VERBOSE) {
            console.log('\n==> Response received:');
            console.log(`> with url ${resHeaders['x-url']}`)
            console.log(`> with status ${proxyResponse.status}`);
            console.log(`> with headers ${JSON.stringify(resHeaders)}`);
        }

        res.writeHead(proxyResponse.status, resHeaders);
        proxyResponse.data.pipe(res);

    } catch (error: any) {
        console.error(error.message);
        res.writeHead(500, { "content-type": "application/json" }).end(JSON.stringify({ error: error.message }));
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    if (VERBOSE) console.log(`Proxy server is running on port ${PORT}!`);
});

export default app;
