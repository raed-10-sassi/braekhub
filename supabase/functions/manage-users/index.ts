import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check admin role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST users
    if (req.method === "GET" && action === "list") {
      const { data: profiles, error } = await adminClient
        .from("profiles")
        .select("id, username, full_name, email, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get roles for all users
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role");

      const usersWithRoles = (profiles || []).map((p: any) => ({
        ...p,
        role: roles?.find((r: any) => r.user_id === p.id)?.role || null,
      }));

      return new Response(JSON.stringify(usersWithRoles), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE user
    if (req.method === "POST" && action === "create") {
      const { username, full_name, email, password, role } = await req.json();

      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: "username and password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a placeholder email if not provided
      const userEmail = email || `${username}@placeholder.local`;

      // Check username uniqueness
      const { data: existing } = await adminClient
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Username already exists" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: userEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || username },
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // Update profile with username
      await adminClient
        .from("profiles")
        .update({ username, full_name: full_name || username })
        .eq("id", userId);

      // Assign role if provided
      if (role) {
        await adminClient
          .from("user_roles")
          .insert({ user_id: userId, role });
      }

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE user
    if ((req.method === "PUT" || req.method === "POST") && action === "update") {
      const { user_id, username, full_name, password, role } = await req.json();

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update profile
      const profileUpdate: any = {};
      if (username !== undefined) profileUpdate.username = username;
      if (full_name !== undefined) profileUpdate.full_name = full_name;

      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await adminClient
          .from("profiles")
          .update(profileUpdate)
          .eq("id", user_id);
        if (error) throw error;
      }

      // Update password if provided
      if (password) {
        const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
        if (error) throw error;
      }

      // Update role
      if (role !== undefined) {
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        if (role) {
          await adminClient.from("user_roles").insert({ user_id, role });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE user
    if ((req.method === "DELETE" || req.method === "POST") && action === "delete") {
      const { user_id } = await req.json();

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Don't allow deleting yourself
      if (user_id === callerId) {
        return new Response(
          JSON.stringify({ error: "Cannot delete your own account" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete roles first, then auth user (cascade handles profile)
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
