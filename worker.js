const SESSION_DAYS = 30;
const ITERATIONS = 310000;
const encoder = new TextEncoder();
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers}})}
function bytesToHex(bytes){return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("")}
function hexToBytes(hex){const out=new Uint8Array(hex.length/2);for(let i=0;i<out.length;i++)out[i]=parseInt(hex.slice(i*2,i*2+2),16);return out}
function randomHex(length=32){return bytesToHex(crypto.getRandomValues(new Uint8Array(length)))}
async function sha256(value){return bytesToHex(await crypto.subtle.digest("SHA-256",encoder.encode(value)))}
async function passwordHash(password,salt){const key=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:hexToBytes(salt),iterations:ITERATIONS},key,256);return bytesToHex(bits)}
function cookie(token,maxAge){return "zgt_session="+token+"; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age="+maxAge}
function clearCookie(){return "zgt_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"}
function getCookie(request,name){const header=request.headers.get("Cookie")||"";const item=header.split(";").map(v=>v.trim()).find(v=>v.startsWith(name+"="));return item?item.slice(name.length+1):""}
function validOrigin(request){const origin=request.headers.get("Origin");if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}}
async function sessionUser(request,env){const token=getCookie(request,"zgt_session");if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const tokenHash=await sha256(token);return await env.DB.prepare("SELECT users.id, users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?").bind(tokenHash,Date.now()).first()}
async function handleApi(request,env){
 const url=new URL(request.url);
 if(request.method==="GET"&&url.pathname==="/api/me"){const user=await sessionUser(request,env);return user?json({username:user.username}):json({error:"Not signed in."},401)}
 if(request.method==="POST"&&!validOrigin(request))return json({error:"Invalid request origin."},403);
 if(request.method==="POST"&&url.pathname==="/api/logout"){const token=getCookie(request,"zgt_session");if(token)await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256(token)).run();return json({ok:true},200,{"Set-Cookie":clearCookie()})}
 if(request.method==="POST"&&(url.pathname==="/api/register"||url.pathname==="/api/login")){
  let body;try{body=await request.json()}catch{return json({error:"Invalid request."},400)}
  const username=String(body.username||"").trim(),usernameKey=username.toLowerCase(),password=String(body.password||"");
  if(!/^[A-Za-z0-9_]{3,20}$/.test(username))return json({error:"Username: 3–20 letters, numbers or underscores."},400);
  if(password.length<10||password.length>128)return json({error:"Password must be 10–128 characters."},400);
  let user;
  if(url.pathname==="/api/register"){
   const salt=randomHex(16),hash=await passwordHash(password,salt);
   try{const result=await env.DB.prepare("INSERT INTO users(username,username_key,password_hash,password_salt,created_at) VALUES(?,?,?,?,?)").bind(username,usernameKey,hash,salt,Date.now()).run();user={id:result.meta.last_row_id,username}}
   catch(error){if(String(error).toLowerCase().includes("unique"))return json({error:"That username is already taken."},409);throw error}
  }else{
   user=await env.DB.prepare("SELECT id,username,password_hash,password_salt FROM users WHERE username_key=?").bind(usernameKey).first();
   if(!user)return json({error:"Incorrect username or password."},401);
   const candidate=await passwordHash(password,user.password_salt);if(candidate!==user.password_hash)return json({error:"Incorrect username or password."},401);
  }
  const token=randomHex(32),tokenHash=await sha256(token),expiresAt=Date.now()+SESSION_DAYS*86400000;
  await env.DB.prepare("INSERT INTO sessions(user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?)").bind(user.id,tokenHash,expiresAt,Date.now()).run();
  return json({ok:true,username:user.username},200,{"Set-Cookie":cookie(token,SESSION_DAYS*86400)});
 }
 return json({error:"Not found."},404);
}
export default {async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith("/api/")){try{return await handleApi(request,env)}catch(error){return json({error:"Server error. Please try again."},500)}}return env.ASSETS.fetch(request)}};
