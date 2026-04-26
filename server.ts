import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { OAuth2Client } from 'google-auth-library';

async function startServer() {
  const app = express();
  const PORT = 3000;

  const oauth2Client = new OAuth2Client(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    `${process.env.APP_URL}/auth/callback`
  );

  console.log("Starting server...");
  console.log("Check Env Vars:");
  console.log("- OAUTH_CLIENT_ID:", !!process.env.OAUTH_CLIENT_ID);
  console.log("- OAUTH_CLIENT_SECRET:", !!process.env.OAUTH_CLIENT_SECRET);
  console.log("- APP_URL:", process.env.APP_URL);

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API to get OAuth URL
  app.get("/api/auth/url", (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/analytics.readonly'];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force refresh token
    });
    console.log("Generated OAuth URL");
    res.json({ url });
  });

  // OAuth CallbackHandler
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;
    console.log("Received OAuth callback with code", !!code);
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      console.log("Tokens acquired successfully");
      
      res.send(`
        <html>
          <body>
            <script>
              const oauth_token = ${JSON.stringify(tokens)};
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', tokens: oauth_token }, '*');
              window.close();
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (e: any) {
      console.error("OAuth token exchange failed:", e.message);
      res.status(500).send('OAuth failed');
    }
  });

  // API Route for Google Analytics Data
  app.get("/api/analytics", async (req, res) => {
    console.log("Analytics request received for property:", req.query.propertyId);
    // We expect the auth token in an Authorization header
    const authHeader = req.headers.authorization;
    const tokenStr = authHeader?.replace('Bearer ', '');
    const propertyId = req.query.propertyId || process.env.GA4_PROPERTY_ID;

    if (!tokenStr) {
        console.warn("Unauthorized request: missing token");
        return res.status(401).json({ status: "error", message: "Not authenticated" });
    }

    if (!propertyId || propertyId === 'undefined') {
        console.warn("Bad request: missing Property ID");
        return res.status(400).json({ status: "error", error: "GA4 Property ID is missing. Please provide it." });
    }

    const dateRangeParam = req.query.dateRange as string || '7days';
    let startDate = '7daysAgo';
    let endDate = 'today';

    switch (dateRangeParam) {
      case 'today':
        startDate = 'today';
        endDate = 'today';
        break;
      case 'yesterday':
        startDate = 'yesterday';
        endDate = 'yesterday';
        break;
      case '14days':
        startDate = '14daysAgo';
        break;
      case '30days':
        startDate = '30daysAgo';
        break;
      case '60days':
        startDate = '60daysAgo';
        break;
      case '90days':
        startDate = '90daysAgo';
        break;
      case '180days':
        startDate = '180daysAgo';
        break;
      case 'custom':
        startDate = (req.query.customStart as string) || '7daysAgo';
        endDate = (req.query.customEnd as string) || 'today';
        break;
      case '7days':
      default:
        startDate = '7daysAgo';
        break;
    }

    console.log(`Using date range: ${startDate} to ${endDate}`);

    // Use token for GA4
    try {
      const tokens = JSON.parse(tokenStr);
      console.log("Token structure keys:", Object.keys(tokens));

      if (!tokens.refresh_token) {
        console.warn("Missing refresh_token in credentials. Forcing re-auth.");
        return res.status(401).json({ status: "error", error: "refresh_token_missing" });
      }

      // Re-create client per request to ensure fresh credentials state
      const requestAuth = new OAuth2Client(
          process.env.OAUTH_CLIENT_ID,
          process.env.OAUTH_CLIENT_SECRET
      );
      requestAuth.setCredentials(tokens);

      const analyticsDataClient = new BetaAnalyticsDataClient({
        authClient: requestAuth
      });

      console.log("Running GA4 source report for property:", propertyId);
      const [sourceResponse] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }, { name: 'sessionCampaignName' }],
        metrics: [
          { name: 'sessions' }, 
          { name: 'conversions' },
          { name: 'ecommercePurchases' },
          { name: 'purchaseRevenue' },
          { name: 'advertiserAdCost' }
        ],
      });

      console.log("Running GA4 items report...");
      const [itemResponse] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }, { name: 'itemName' }],
        metrics: [
          { name: 'itemsPurchased' },
          { name: 'itemRevenue' }
        ],
      });
      
      console.log("Reponses acquired. Sending success.");
      res.json({ status: "success", data: { sources: sourceResponse, items: itemResponse } });
    } catch (error: any) {
      console.error("GA4 Proxy Final Error:", error);
      let errorMessage = error.message || "Failed to fetch from GA4";
      if (errorMessage.includes("JSON")) {
          errorMessage = "Invalud session token. Please reconnect.";
      }
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
