export async function onRequestPost({ request, env }) {
  try {
    const { uid, token } = await request.json();

    if (!uid) {
      return new Response(JSON.stringify({ error: "Missing UID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // NOTE: In a production environment, you should verify the Firebase ID Token
    // using a Firebase Admin library or by calling the Google token verification endpoint.
    // For this bridge example, we will proceed with the UID update.

    // Update Firebase Realtime DB
    // We use the Firebase REST API with a database secret or a service account token.
    // You must set FIREBASE_DB_SECRET in your Cloudflare Pages environment variables.
    
    const dbUrl = `https://${env.FIREBASE_PROJECT_ID || 'runehaven-textbased'}.firebaseio.com/world/ownership/${uid}.json?auth=${env.FIREBASE_DB_SECRET}`;

    const fbResponse = await fetch(dbUrl, {
      method: "PUT",
      body: JSON.stringify(true),
      headers: { "Content-Type": "application/json" }
    });

    if (!fbResponse.ok) {
      const errorText = await fbResponse.text();
      return new Response(JSON.stringify({ error: "Database update failed", details: errorText }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, message: "License granted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal Server Error", message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
