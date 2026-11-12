(() => {
  const style = document.createElement("style");
  style.textContent = "#zgt-auth-gate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:20px;background:radial-gradient(ellipse at 50% 0%,#244b9b66,transparent 55%),#080711;color:#f8f5ff;font:15px/1.5 system-ui,sans-serif}"+
  "#zgt-auth-gate *{box-sizing:border-box}.zgt-auth-card{width:min(430px,100%);padding:28px;border:1px solid #7650bd;border-radius:22px;background:linear-gradient(145deg,#171326,#0c0a13);box-shadow:0 25px 90px #000a}"+
  ".zgt-auth-logo{font-size:12px;font-weight:900;letter-spacing:.2em;color:#c4a5fd}.zgt-auth-card h1{font-size:30px;margin:9px 0 4px}.zgt-auth-sub{color:#b7abc9;margin:0 0 20px}"+
  ".zgt-auth-card label{display:block;font-size:12px;color:#d7c9ef;margin:13px 0 6px}.zgt-auth-card input{width:100%;padding:13px;border-radius:10px;border:1px solid #403452;background:#090711;color:white;outline:none}"+
  ".zgt-auth-card input:focus{border-color:#a855f7;box-shadow:0 0 0 3px #a855f722}.zgt-auth-submit{width:100%;margin-top:18px;padding:13px;border:0;border-radius:10px;background:linear-gradient(110deg,#7c3aed,#2563eb);color:white;font-weight:850;cursor:pointer}"+
  ".zgt-auth-switch{width:100%;margin-top:12px;padding:9px;border:0;background:transparent;color:#c4b5fd;cursor:pointer}.zgt-auth-message{min-height:22px;margin:12px 0 0;color:#fca5a5;font-size:13px}.zgt-auth-small{margin-top:16px;color:#81758f;font-size:11px;text-align:center}";
  document.head.appendChild(style);
  const gate = document.createElement("div");
  gate.id = "zgt-auth-gate";
  gate.innerHTML = '<div class="zgt-auth-card"><div class="zgt-auth-logo">ZGT TEAM · ZGTHUB</div><h1 id="zgt-auth-title">Welcome back.</h1><p class="zgt-auth-sub" id="zgt-auth-sub">Sign in to continue to ZGTHUB.</p><form id="zgt-auth-form"><label for="zgt-auth-user">Username</label><input id="zgt-auth-user" name="username" autocomplete="username" minlength="3" maxlength="20" required><label for="zgt-auth-pass">Password</label><input id="zgt-auth-pass" name="password" type="password" autocomplete="current-password" minlength="10" maxlength="128" required><button class="zgt-auth-submit" id="zgt-auth-submit" type="submit">Sign in</button></form><button class="zgt-auth-switch" id="zgt-auth-switch" type="button">Need an account? Register</button><p class="zgt-auth-message" id="zgt-auth-message" role="status"></p><div class="zgt-auth-small">No profile. Just your ZGTHUB account.</div></div>';
  document.body.appendChild(gate);
  let mode = "login";
  const form = gate.querySelector("#zgt-auth-form"), user = gate.querySelector("#zgt-auth-user"), pass = gate.querySelector("#zgt-auth-pass");
  const message = gate.querySelector("#zgt-auth-message"), submit = gate.querySelector("#zgt-auth-submit"), switcher = gate.querySelector("#zgt-auth-switch");
  function renderMode() {
    gate.querySelector("#zgt-auth-title").textContent = mode === "login" ? "Welcome back." : "Create account.";
    gate.querySelector("#zgt-auth-sub").textContent = mode === "login" ? "Sign in to continue to ZGTHUB." : "Registration is open to everyone.";
    submit.textContent = mode === "login" ? "Sign in" : "Create account";
    switcher.textContent = mode === "login" ? "Need an account? Register" : "Already registered? Sign in";
    pass.autocomplete = mode === "login" ? "current-password" : "new-password"; message.textContent = "";
  }
  switcher.addEventListener("click", () => { mode = mode === "login" ? "register" : "login"; renderMode(); });
  async function api(path, body) {
    const response = await fetch("/api/" + path, {method:body ? "POST" : "GET",credentials:"same-origin",headers:body ? {"Content-Type":"application/json"} : {},body:body ? JSON.stringify(body) : undefined});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.error || "Something went wrong."); error.status = response.status; throw error; }
    return data;
  }
  function showSite(username) {
    gate.remove();
    const logout = document.createElement("button"); logout.id = "zgt-logout"; logout.type = "button"; logout.textContent = "Log out · " + username;
    logout.style.cssText = "position:fixed;right:16px;top:84px;z-index:9999;padding:8px 12px;border:1px solid #a855f755;border-radius:9px;background:#171326;color:#e9d5ff;cursor:pointer";
    logout.addEventListener("click", async () => { logout.disabled = true; try { await api("logout", {}); location.reload(); } catch (e) { logout.disabled = false; alert(e.message); } });
    document.body.appendChild(logout);
  }
  form.addEventListener("submit", async event => {
    event.preventDefault(); submit.disabled = true; submit.textContent = mode === "login" ? "Signing in..." : "Creating..."; message.textContent = "";
    try { const result = await api(mode, {username:user.value.trim(),password:pass.value}); showSite(result.username); }
    catch (error) { message.textContent = error.message; }
    finally { submit.disabled = false; submit.textContent = mode === "login" ? "Sign in" : "Create account"; }
  });
  api("me").then(data => showSite(data.username)).catch(error => { if (error.status !== 401) gate.remove(); });
})();
