# Rupio API guide for integrating applications

This guide is for developers integrating the Rupio API into an application such as VPay. Rupio is a simulated gateway for this project: it records a test result and sends it to the integrating application's backend, but it does not add funds to that application's wallet or virtual card. The integrating application remains responsible for crediting its customer's balance.

## Recommended flow

1. The client app asks its own backend to start a top-up. The integrating app creates its own top-up record as `PENDING` and generates a unique client reference.
2. The integrating app's backend calls Rupio to create a checkout session. Keep the Rupio API key on the server; never put it in a browser or mobile app.
3. The app returns Rupio's `checkoutUrl` to its client, which opens it in a browser or web view.
4. The customer completes Rupio's hosted checkout. Rupio records the session/payment in Firestore and sends a signed callback to the integrating application's backend.
5. The integrating application verifies the callback, matches it to the pending top-up, and credits the amount only for a verified `SUCCESS` event. It then marks its top-up complete.
6. Rupio redirects to the optional `returnUrl` for user experience. Do not treat that redirect as payment proof; rely on the verified callback (or a server-to-server status check).

```text
Client app -> Integrating app backend -> Rupio API -> Rupio hosted checkout
                                      Rupio -> signed callback -> Integrating app backend
Integrating backend -> verify + apply top-up once -> client app shows result
```

## Create a checkout session

Use the Rupio staging or production backend origin assigned to your integration. The value below is a placeholder: do not use it literally. Append `/api/v1` only in the request path.

Suggested integrating-application backend environment variables:

```env
RUPIO_BASE_URL=<Rupio backend origin, without /api/v1>
RUPIO_API_KEY=<key issued by the Rupio operator>
RUPIO_CALLBACK_SECRET=<shared callback-signing secret>
```

Set these only in the integrating application's backend environment. The callback secret must match Rupio's `RUPIO_CALLBACK_SECRET`; it is different from the API key.

```http
POST <RUPIO_BACKEND_ORIGIN>/api/v1/sessions
X-API-Key: <RUPIO_API_KEY>
Content-Type: application/json
```

```json
{
  "clientReference": "APP_TOPUP_83921",
  "amount": 1000,
  "currency": "LKR",
  "callbackUrl": "https://<your-app-backend>/api/webhooks/rupio",
  "returnUrl": "vpay://topup/result",
  "customerReference": "<your-internal-customer-id>"
}
```

`clientReference` should uniquely identify the top-up in the integrating application and is limited to 100 characters. This is the current API field name; older prototype examples may use a different name, but new requests must send `clientReference`. Amounts must be positive and no more than 1,000,000; LKR must be a whole number of rupees. `callbackUrl` must be publicly reachable over HTTP or HTTPS. `returnUrl` is optional.

On success, Rupio responds with HTTP `201`:

```json
{
  "sessionId": "rupio_sess_<uuid>",
  "checkoutUrl": "https://<rupio-host>/checkout/rupio_sess_<uuid>",
  "expiresAt": "<ISO-8601 timestamp>"
}
```

Open the exact returned `checkoutUrl`; do not construct a session URL yourself. The overall session defaults to eight minutes (configurable up to ten minutes). Each hosted checkout step has its own two-minute timer.

## Receive and verify the callback

Rupio sends a JSON `POST` to the `callbackUrl` with these headers:

- `X-Rupio-Signature: sha256=<hex HMAC-SHA256>`
- `X-Rupio-Event-Id: <paymentId>`

The JSON includes `eventId`, `sessionId`, `paymentId`, `clientReference`, `requestedAmount`, `amount`, `currency`, `status`, `message`, and `occurredAt`. The callback signature is calculated using `RUPIO_CALLBACK_SECRET` over the exact raw request body bytes. Configure that same secret in Rupio and the integrating application's backend, but keep it separate from `RUPIO_API_KEY`.

Example callback body:

```json
{
  "eventId": "rupio_pay_<uuid>",
  "sessionId": "rupio_sess_<uuid>",
  "paymentId": "rupio_pay_<uuid>",
  "clientReference": "APP_TOPUP_83921",
  "requestedAmount": 1000,
  "amount": 1000,
  "currency": "LKR",
  "status": "SUCCESS",
  "message": "Test payment approved.",
  "occurredAt": "<ISO-8601 timestamp>"
}
```

Example event body:

```json
{
  "eventId": "rupio_pay_<uuid>",
  "sessionId": "rupio_sess_<uuid>",
  "paymentId": "rupio_pay_<uuid>",
  "clientReference": "APP_TOPUP_83921",
  "requestedAmount": 1000,
  "status": "SUCCESS",
  "amount": 1000,
  "currency": "LKR",
  "message": "Test payment approved.",
  "occurredAt": "<ISO-8601 timestamp>"
}
```

Example Express setup for capturing raw bytes while parsing JSON:

```js
app.use(express.json({
  verify(req, res, buffer) {
    req.rawBody = Buffer.from(buffer);
  }
}));

app.post('/api/webhooks/rupio', async (req, res) => {
  const supplied = req.get('X-Rupio-Signature') || '';
  const expected = 'sha256=' + createHmac('sha256', process.env.RUPIO_CALLBACK_SECRET)
    .update(req.rawBody)
    .digest('hex');
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  const valid = suppliedBytes.length === expectedBytes.length
    && timingSafeEqual(suppliedBytes, expectedBytes);

  if (!valid) return res.sendStatus(401);

  const event = req.body;
  // In a database transaction: find the app's pending top-up by clientReference,
  // confirm it is still pending, validate amount/currency, and process once.
  // Credit only when event.status === 'SUCCESS'.
  return res.sendStatus(200);
});
```

Import `createHmac` and `timingSafeEqual` from Node's `node:crypto` module. If the integrating app already has JSON middleware, add raw-body capture to that middleware before the webhook route. Verify the signature before using the event. Return a `2xx` response after safely recording/processing the event; Rupio attempts delivery up to three times when delivery fails.

Use `eventId` (or `paymentId`) as an idempotency key so duplicate callbacks cannot credit the same top-up twice. In the same database transaction, confirm that the client reference belongs to a pending top-up, validate the expected currency and acceptable amount, record the event, and apply the balance change exactly once. Never credit on `FAILED`, `CANCELLED`, or `TIMEOUT`, and never credit based only on the browser redirect.

The checkout currently allows the customer to edit the amount. In a callback, `requestedAmount` is the initial amount and `amount` is the final checkout amount. The integrating application must validate the final `amount` against its own top-up rules before applying it.

## Errors and status checks

Session creation can return `400` for invalid input, `401` for a missing/incorrect API key, or `503` if Rupio callback signing is not configured. Treat non-`201` responses as a failed session start; do not send the customer to checkout without a returned `checkoutUrl`.

The integrating application's backend can query `GET <RUPIO_BACKEND_ORIGIN>/api/v1/sessions/<sessionId>` for the session state. Rupio also has `GET /api/v1/payments/<paymentId>` once a payment exists. These endpoints are for server-side reconciliation; the signed callback should be the normal completion signal.

## Test mode

Use the separate Rupio staging service and its staging API key. The demo checkout accepts these fake card numbers with any future expiry and a 3- or 4-digit CVV:

- `4242 4242 4242 4242` — `SUCCESS`
- `4000 0000 0000 0002` — `FAILED` (declined)
- `4000 0000 0000 0003` — `TIMEOUT`

The demo OTP is `000000`. No real card or OTP should be entered. Confirm each result in the integrating app's top-up history and the staging Firestore records. Never enable the Rupio test page on the production service.

## Adapter pattern recommendation

Yes. The Adapter pattern is a good fit in the integrating application. Rupio's API is provider-specific; the app can wrap it behind a small provider-neutral contract. Its top-up business logic then calls that contract rather than depending on Rupio URLs, headers, and payload details.

For example, define an application-owned interface such as `PaymentGateway.startCheckout(...)` and `PaymentGateway.verifyCallback(...)`, then implement `RupioAdapter` to translate those operations to Rupio's API and callback format. The application's top-up service should own pending/completed state and balance changes. If the app later changes gateway, a new adapter can implement the same contract while the top-up flow stays mostly unchanged.

Keep the adapter small: session creation, response mapping, signature verification, and event mapping belong in it. Keep app-specific rules—customer authorization, allowed top-up limits, idempotency, and balance updates—in the app's own services. The Adapter pattern is an integration choice; Rupio does not require a particular language, framework, or design pattern.
