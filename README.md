# simple-express-proxy

## Overview

**simple-express-proxy** is a [Node.js](https://nodejs.org/en) proxy written
with [Express](https://expressjs.com/). Although it is intended to be deployed
on [Vercel](https://vercel.com), you can run it on your machine locally for
experimental purposes.

## Deploying with Vercel

**Why Vercel?** Because it lets you easily deploy Express applications with
dynamic IPs. Moreover, you can choose the region in which you want the proxy to
be located.

Simply fork this repository and connect to Vercel using your Github account. In
the dashboard, select _Add new_ > _Project_ and choose the repository in the
_Import Git Repository_ section.

When deployment is complete, check the proxy website: if it says “invalid URL”,
everything worked! If not, check the deployment logs.

Check out an example at:
https://simple-express-proxy.vercel.app/https://example.org.

### How to change the proxy region

Vercel can manage several regions for serverless functions. Thus, the proxy can
be located anywhere in the regions listed
[here](https://vercel.com/docs/edge-network/regions#region-list).

Once the deployment is complete, you can add a specific region to the Vercel
project settings by following this
[tutorial](https://vercel.com/docs/functions/configuring-functions/region#setting-your-default-region). Do not forget to redeploy afterwards so that the changes are taken into account.

## How to use

Let's assume that `https://my-proxy.vercel.app` is your proxy's domain. To use
it, send a request to the proxy specifying as a param the URL you wish to
retrieve:

```
(async function () {
    const proxy = 'https://my-proxy.vercel.app';

    const res = await fetch(`${proxy}/https://example.org`, {
        method: 'GET'
    });

    console.log(res.headers.get('x-url')); // shows https://example.org
    console.log(await res.text());
})();
```

**The request method, body and headers you send to the proxy will be used by the
proxy to retrieve the target URL**, with the exception of certain headers such
as `x-forwarded-for` which contains informations about the client.

**Similarly, the headers, status and body included in the proxy's response are
those sent by the target URL website to the proxy**, with the exception of
certain headers such as `access-control-allow-origin` for obvious reasons.

The proxy sets up a response header, `x-url`, which contains the final URL
(_after all redirections_) of the request it sends.

## Use it locally

Install the necessary dependencies with `npm install`. Then build the `api`
folder using `npx tsc` (the output directory will be `/dist`). To start the
server, simply run `node dist/index`.
