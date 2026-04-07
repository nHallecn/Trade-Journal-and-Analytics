import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-b9e0526f/health", (c) => {
  return c.json({ status: "ok" });
});

// Signup endpoint
app.post("/make-server-b9e0526f/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, user: data.user });
  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ error: error.message || 'Signup failed' }, 500);
  }
});

// Get trades endpoint (protected)
app.get("/make-server-b9e0526f/trades", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user?.id) {
      console.error('Authorization error while getting trades:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const trades = await kv.getByPrefix(`trades:${user.id}:`);
    return c.json({ trades });
  } catch (error: any) {
    console.error('Error getting trades:', error);
    return c.json({ error: error.message || 'Failed to get trades' }, 500);
  }
});

// Add trade endpoint (protected)
app.post("/make-server-b9e0526f/trades", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user?.id) {
      console.error('Authorization error while adding trade:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const trade = await c.req.json();
    const tradeKey = `trades:${user.id}:${trade.id}`;
    
    await kv.set(tradeKey, trade);
    
    return c.json({ success: true, trade });
  } catch (error: any) {
    console.error('Error adding trade:', error);
    return c.json({ error: error.message || 'Failed to add trade' }, 500);
  }
});

// Delete trade endpoint (protected)
app.delete("/make-server-b9e0526f/trades/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user?.id) {
      console.error('Authorization error while deleting trade:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const tradeId = c.req.param('id');
    const tradeKey = `trades:${user.id}:${tradeId}`;
    
    await kv.del(tradeKey);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting trade:', error);
    return c.json({ error: error.message || 'Failed to delete trade' }, 500);
  }
});

Deno.serve(app.fetch);