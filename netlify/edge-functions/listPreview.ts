import { Config } from '@netlify/edge-functions';

export default async (request: Request) => {

  const url = new URL(request.url);
  const [type, id] = url.search.substring(1).split('=');
  return new Response(`     
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="description"
    content="View ${type} in SounDroid">
  <meta name="author" content="n-ce">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${type} | SounDroid">
  <meta property="og:url" content="https://ytify.pp.ua">
  <meta property="og:site_name" content="SounDroid">
  <meta property="og:description" content="View ${id} - ${type} in SounDroid">
  <title>${type} | SounDroid</title>
</head>
<script>location.replace('/?e=' + encodeURI(location.pathname + location.search))</script></html>
    `, {
    headers: { 'content-type': 'text/html' },
  });
};

export const config: Config = {
  path: '/list'
};


