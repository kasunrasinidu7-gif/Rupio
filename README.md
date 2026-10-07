# Rupio

Rupio is a generic hosted test-payment gateway. Any authorized application can create a checkout session through Rupio's API, send the customer to Rupio's hosted checkout, and receive a signed server-to-server result callback. Rupio does not depend on VPay or update an integrating application's balance. The integration application remains responsible for applying a successful result.

The project keeps the simple MVC structure: Express routes call controllers, controllers use Firestore models, and shared React components render the hosted checkout.

## Project layout

~~~text
backend/
  src/config       Firebase setup
  src/controllers  Request and response handling
  src/middleware   API key and error handling
  src/models       Firestore session and payment records
  src/routes       Versioned API endpoints
  src/utils        Validation and signed callbacks
frontend/
  src/api          Rupio API client
  src/components   Reusable checkout UI
  src/context      Shared checkout session state
  src/hooks        Countdown behavior
  src/pages        Amount, card, result, and unavailable pages
~~~

## Local setup

1. Use an existing Firebase project or create a dedicated Rupio project, then enable Cloud Firestore.
2. For local development, create a Firebase service-account key and keep its JSON file outside this repository. When deployed on Google Cloud Run, attach a service account to the service instead of uploading a JSON key.
3. Copy `backend/.env.example` to `backend/.env`. Set `FIREBASE_PROJECT_ID`, the local-only `GOOGLE_APPLICATION_CREDENTIALS` path, `RUPIO_API_KEY`, and `RUPIO_CALLBACK_SECRET`.
4. Rupio issues the integration API key. Generate a long random value locally, keep it in Rupio's backend configuration, and give the same value securely to the integrating application's backend. That backend sends it in the `X-API-Key` header. The key must never be put in a browser or mobile app.
5. Generate a different random value for `RUPIO_CALLBACK_SECRET`. Configure that same secret in the integrating backend so it can verify Rupio's signed callbacks.
6. In `backend`, run `npm install` and `npm run dev`. In a second terminal, in `frontend`, run `npm install` and `npm run dev`.
7. A checkout is only available from a session-specific link returned by `POST /api/v1/sessions`; opening the site root or typing an example `<sessionId>` does not create a session.

For local testing, add `RUPIO_TEST_PAGE_ENABLED=true` to `backend/.env`, restart the backend, and open `http://localhost:5173/test`. Click **Start test checkout** to go through the amount, test-card, and result pages. Rupio uses a local callback receiver for this test flow. Do not enable the test page in production.

Generate a random value in PowerShell with Node.js (run once for each secret):

~~~powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
~~~

For the prototype there is one Rupio integration API key. Before onboarding unrelated external clients in production, issue separate revocable keys per integration and add rate limits and key rotation.

For a hosted deployment, build the frontend with `npm run build` in `frontend`, then deploy the backend. Express serves the built checkout UI. Set `RUPIO_PUBLIC_URL` to the public HTTPS origin and `FRONTEND_ORIGIN` to the frontend's public origin. Store secrets using the hosting provider's secret manager. On Cloud Run, use its attached service identity for Firestore and omit `GOOGLE_APPLICATION_CREDENTIALS`.

## Integration API

Create a checkout session from the integrating application's backend:

~~~http
POST /api/v1/sessions
X-API-Key: <RUPIO_API_KEY>
Content-Type: application/json
~~~

~~~json
{
  "merchantReference": "ORDER_12345",
  "amount": 5000,
  "currency": "LKR",
  "callbackUrl": "https://merchant.example/api/rupio/callback",
  "returnUrl": "merchant-app://payment/result",
  "customerReference": "customer-reference"
}
~~~

The response contains `sessionId`, `checkoutUrl`, and `expiresAt`. Redirect the customer to the returned `checkoutUrl`; it contains the real session ID. The amount, card, and OTP pages each have a two-minute timer. The overall backend session defaults to eight minutes to allow time to move between steps.

Rupio sends a signed server-to-server callback to the supplied `callbackUrl`. The JSON body includes `eventId`, `sessionId`, `paymentId`, `merchantReference`, `requestedAmount`, `amount`, `status`, `currency`, `message`, and `occurredAt`. Status is `SUCCESS`, `FAILED`, `CANCELLED`, or `TIMEOUT`. The `X-Rupio-Signature` header is `sha256=<hex HMAC-SHA256 of the exact JSON body>`; `X-Rupio-Event-Id` is an idempotency key. Verify the signature and process each event idempotently. Only the integrating application should update its own balance/order state, and only after validating a successful callback.

Useful endpoints:

~~~text
POST  /api/v1/sessions
GET   /api/v1/sessions/:sessionId
PATCH /api/v1/sessions/:sessionId/amount
POST  /api/v1/process
GET   /api/v1/payments/:paymentId
GET   /health
~~~

The former `/mockpay/api/...` and `/mockpay/checkout/...` paths remain as compatibility aliases during migration. New integrations should use the Rupio paths above.

## Simulated card outcomes

- `4242 4242 4242 4242` — success
- `4000 0000 0000 0002` — declined
- `4000 0000 0000 0003` — simulated timeout

The simulated OTP is `0000`.

Use any future expiry date and a three- or four-digit CVV. Rupio accepts only these fake test numbers and does not save card numbers, expiry dates, or CVVs. This is not a real payment processor.

Firestore stores session/payment references, requested and final amounts, currency, status, expiry, callback URL, and callback delivery status. It never stores card details. Existing Firestore collection names are retained to avoid disrupting any records created by the earlier prototype.
