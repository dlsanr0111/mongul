export function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

export function jsonError(status, message, headers = {}) {
  return json(status, { error: { message } }, headers);
}
