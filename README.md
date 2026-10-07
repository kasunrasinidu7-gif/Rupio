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
2. For local development, create a Firebase service-account key and keep its JSON file outside this repository. For Render, upload it as a service Secret File as described below.
3. Copy `backend/.env.example` to `backend/.env`. Set `FIREBASE_PROJECT_ID`, the local-only `GOOGLE_APPLICATION_CREDENTIALS` path, `RUPIO_API_KEY`, and `RUPIO_CALLBACK_SECRET`.
4. Rupio issues the integration API key. Generate a long random value locally, keep it in Rupio's backend configuration, and give the same value securely to the integrating application's backend. That backend sends it in the `X-API-Key` header. The key must never be put in a browser or mobile app.
5. Generate a different random value for `RUPIO_CALLBACK_SECRET`. Configure that same secret in the integrating backend so it can verify Rupio's signed callbacks.
6. In `backend`, run `npm install` and `npm run dev`. In a second terminal, in `frontend`, run `npm install` and `npm run dev`.
7. A checkout is only available from a session-specific link returned by `POST /api/v1/sessions`; opening the site root or typing an example `<sessionId>` does not create a session.

For local testing, add `RUPIO_TEST_PAGE_ENABLED=true` to `backend/.env`, restart the backend, and open `http://localhost:5173/test`. Click **Start test checkout** to go through the amount, test-card, and result pages. Rupio uses a local callback receiver for this test flow. In production, test routes are available only when both `RUPIO_ENVIRONMENT=staging` and `RUPIO_TEST_PAGE_ENABLED=true` are set on a separate staging service.

Generate a random value in PowerShell with Node.js (run once for each secret):

~~~powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
~~~

For the prototype there is one Rupio integration API key. Before onboarding unrelated external clients in production, issue separate revocable keys per integration and add rate limits and key rotation.

## Hosting (Vercel frontend + Render backend)

1. Import this GitHub repository into Vercel. Set **Root Directory** to `frontend`, build command to `npm run build`, and output directory to `dist`. The Vercel rewrite config keeps checkout links working on refresh.
2. After Vercel gives you the frontend URL, create a Render Blueprint from the repository's root `render.yaml`. Enter that Vercel origin for both `RUPIO_PUBLIC_URL` and `FRONTEND_ORIGIN`, and enter the Firebase project ID when prompted.
3. In Render's Environment settings, upload a Secret File named `rupio-service-account.json` containing the Firebase service-account JSON. The Blueprint points `GOOGLE_APPLICATION_CREDENTIALS` to it. Never commit this JSON.
4. Copy the Render service URL into Vercel's `VITE_RUPIO_API_URL` setting (origin only, no `/api/v1` suffix), then redeploy Vercel.
5. Copy Render's generated `RUPIO_API_KEY` into the integrating app's backend secrets. Keep it out of Vercel/browser code. Render also generates `RUPIO_CALLBACK_SECRET`; share it with the integrating backend for callback verification.

The Blueprint uses Render's Singapore region, the closest Render region for this Sri Lanka/Mumbai setup. Its free plan is for testing: Render spins it down after 15 idle minutes and waking can take about a minute. Choose a paid plan for production availability. The `/test` page and test-session API are disabled in production by default.

## Staging-only hosted test page

Keep the public production deployment's test page disabled. To test the hosted flow online:

1. Create a Vercel Preview deployment from a non-production branch. In Vercel Project Settings > Environment Variables, set `VITE_ENABLE_TEST_PAGE=true` and later `VITE_RUPIO_API_URL` for the **Preview** environment only. Use the Preview URL for the staging branch, not `rupio-six.vercel.app`.
2. Create a separate Render Blueprint from this repository and set its Blueprint Path to `render.staging.yaml`. This creates `rupio-api-staging` without changing the production service.
3. Set `FIREBASE_PROJECT_ID` to the development Firebase project, and set both `RUPIO_PUBLIC_URL` and `FRONTEND_ORIGIN` to the exact Vercel Preview origin (no trailing slash). Upload the Firebase service-account JSON as the secret file `rupio-service-account.json`.
4. After Render creates the staging service, set Vercel Preview's `VITE_RUPIO_API_URL` to that service's origin (no `/api/v1` suffix), then redeploy the Preview deployment.

The test-session endpoint is enabled only when `RUPIO_TEST_PAGE_ENABLED=true` and the backend's `RUPIO_ENVIRONMENT=staging`. It remains unavailable on the production backend. Staging uses the configured development Firestore project, so its test records are written there.

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
