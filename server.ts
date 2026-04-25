import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/callback`
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to get OAuth URL
  app.get("/api/auth/url", (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/analytics.readonly'];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
    res.json({ url });
  });

  // OAuth CallbackHandler
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Store tokens securely in a session or similar in production
      // For this prototype, we'll return a script that posts them to the opener.
      res.send(`
        <html>
          <body>
            <script>
              oauth_token = ${JSON.stringify(tokens)};
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', tokens: oauth_token }, '*');
              window.close();
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (e) {
      res.status(500).send('OAuth failed');
    }
  });

  // API Route for Google Analytics Data
  app.get("/api/analytics", async (req, res) => {
    // We expect the auth token in an Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    const propertyId = req.query.propertyId || process.env.GA4_PROPERTY_ID;

    if (!token) {
        return res.status(401).json({ status: "error", message: "Not authenticated" });
    }

    if (!propertyId || propertyId === 'undefined') {
        return res.status(400).json({ status: "error", error: "GA4 Property ID is missing. Please provide it." });
    }

    // Use token for GA4
    try {
      const analyticsDataClient = new BetaAnalyticsDataClient({
        authClient: oauth2Client
      });
      oauth2Client.setCredentials(JSON.parse(token));

      const [response] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '14daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }, { name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
      });
      
      res.json({ status: "success", data: response });
    } catch (error: any) {
      console.error("GA4 API Error:", error);
      let errorMessage = error.message || "Failed to fetch from GA4";
      if (errorMessage.includes("Google Analytics Data API has not been used in project") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = `The Google Analytics Data API is not enabled for your Google Cloud Project. Please enable it by visiting: https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview and try again.`;
      }
      res.status(500).json({ status: "error", error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
