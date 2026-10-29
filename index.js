const http = require("http");

const QUESTIONS = [
  "شنو أول حاجة عجبتك فيا؟",
  "شنو الحاجة لي نديرها وتقلقك ومتقولهاش؟",
  "واش غرت عليا مرة؟ علاش؟",
  "شنو أحلى ذكرى ليك معايا؟",
  "شنو الحاجة لي تحب نبدلها فيا؟",
  "أي لحظة حسيت فيها بلي نحبك بزاف؟",
  "شنو أكبر خوف عندك في علاقتنا؟",
  "لو نسافرو مع بعض، وين تحب نروحو؟",
  "شنو الحاجة الصغيرة لي نديرها وتفرحك؟",
  "واش كذبت عليا مرة؟ على شنو؟",
  "كيفاش تتخيل حياتنا بعد 5 سنين؟",
  "شنو الحاجة لي تحشم تقولها ليا؟",
  "أي صفة فيا تحبها أكثر؟",
  "واش فكرت تبعد عليا مرة؟",
  "شنو الهدية لي تحلم تاخذها مني؟",
  "شنو أكثر كلمة تحب تسمعها مني؟",
  "كي تكون زعفان، شنو لي يهدّيك؟",
  "شنو لي ما تحبهش في روتيننا؟",
  "قولي حاجة عمرك ما قلتهالي.",
  "علاش اخترتني أنا؟",
  "شنو أجرأ حاجة فكرت تديرها معايا؟",
  "واش خطرت ليك فكرة عليا وحشمت تقولها؟",
  "كي نكون قريب منك، شنو لي يخلي قلبك يدق؟",
  "شنو أكثر لبسة عليا تعجبك؟",
  "واش شفت حلم عليا؟ حكيهولي.",
  "أول حاجة تفكر فيها كي تشوفني؟",
  "من 10، شحال تعطي لبوسي؟ ولماذا؟",
  "واش تغار كي واحد آخر يهدر معايا؟",
  "شنو أكثر وقت تشتاقلي فيه؟",
  "لو تقدر تبدل حاجة في أول لقاء لينا، شنو تبدل؟",
  "واش سبق وقلت ليا حاجة وما كنتش تقصدها؟",
  "شنو الحاجة لي تتمنى نديرها أكثر؟",
  "من منا الأكثر غيرة وعلاش؟",
  "شنو أغرب حاجة في مخك تفكر فيها عليا؟",
  "واش تحس بلي تعرفني بزاف ولا مازال فيا أسرار؟",
  "لو نغيب عليك أسبوع، شنو يصرالك؟",
  "شنو هي أكبر غلطة درتها معايا؟",
  "علاش بدلتي رايك فيا من أول؟",
  "واش خبيت عليا حاجة دبا؟",
  "اختار: نهدر معاك ساعة في التيليفون ولا نشوفك دقيقة؟ علاش؟",
  "شنو الحاجة لي تحب نقولها ليك كل نهار؟",
  "كلمة وحدة تلخص حبك ليا؟"
];

const rooms = {};
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function body(req) {
  return new Promise(r => { let d = ""; req.on("data", c => (d += c)); req.on("end", () => { try { r(JSON.parse(d || "{}")); } catch (e) { r({}); } }); });
}
const send = (res, obj, code = 200) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(obj)); };
const clean = s => String(s || "").trim().slice(0, 300);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(HTML);
  }
  if (url.pathname === "/api/join" && req.method === "POST") {
    const b = await body(req);
    const room = clean(b.room).toLowerCase(), name = clean(b.name);
    if (!room || !name) return send(res, { error: "عمر الاسم و الكود" }, 400);
    const r = (rooms[room] = rooms[room] || { players: [], qs: shuffle(QUESTIONS.map((_, i) => i)), i: 0, answers: {}, msgs: [] });
    if (!r.players.includes(name)) {
      if (r.players.length >= 2) return send(res, { error: "الغرفة عامرة، اختار كود آخر" }, 400);
      r.players.push(name);
    }
    return send(res, { ok: true });
  }
  if (url.pathname === "/api/state") {
    const r = rooms[(url.searchParams.get("room") || "").toLowerCase()];
    if (!r) return send(res, { error: "الغرفة ما كانتش" }, 404);
    const me = url.searchParams.get("name");
    const both = r.players.length === 2 && r.players.every(p => r.answers[p] !== undefined);
    return send(res, {
      players: r.players,
      q: QUESTIONS[r.qs[r.i % r.qs.length]],
      i: r.i,
      answered: Object.keys(r.answers),
      mine: r.answers[me],
      msgs: r.msgs,
      answers: both ? r.answers : null
    });
  }
  if (url.pathname === "/api/answer" && req.method === "POST") {
    const b = await body(req);
    const r = rooms[clean(b.room).toLowerCase()];
    if (!r || !r.players.includes(b.name) || !clean(b.text)) return send(res, { error: "غلط" }, 400);
    if (r.answers[b.name] === undefined) r.answers[b.name] = clean(b.text);
    return send(res, { ok: true });
  }
  if (url.pathname === "/api/chat" && req.method === "POST") {
    const b = await body(req);
    const r = rooms[clean(b.room).toLowerCase()];
    if (!r || !r.players.includes(b.name) || !clean(b.text)) return send(res, { error: "غلط" }, 400);
    r.msgs.push({ n: b.name, t: clean(b.text) });
    if (r.msgs.length > 200) r.msgs.shift();
    return send(res, { ok: true });
  }
  if (url.pathname === "/api/next" && req.method === "POST") {
    const b = await body(req);
    const r = rooms[clean(b.room).toLowerCase()];
    if (r && b.i === r.i && (!b.auto || Date.now() - (r.last || 0) > 8000)) {
      r.i++; r.answers = {}; r.last = Date.now();
    }
    return send(res, { ok: true });
  }
  res.writeHead(404); res.end("Not found");
});

const HTML = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#3b0a1e">
<title>مصارحة 💕</title>
<style>
:root{--bg:#3b0a1e;--card:#5a1530;--ink:#fff1ea;--soft:#e9b8c4;--hot:#ff6b81;--gold:#ffd8a8}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:radial-gradient(circle at 50% 0,#6b1b3b,var(--bg) 60%);color:var(--ink);font-family:"Segoe UI",Tahoma,Arial,sans-serif;display:flex;justify-content:center}
main{width:100%;max-width:460px;padding:28px 20px;display:flex;flex-direction:column;gap:16px}
h1{font-size:2.2rem;margin:8px 0 0;text-align:center}
.sub{text-align:center;color:var(--soft);margin:0 0 8px}
input,textarea{width:100%;padding:14px;border-radius:14px;border:2px solid #7d2a4a;background:#2a0615;color:var(--ink);font:inherit;font-size:1.05rem}
input:focus,textarea:focus{outline:none;border-color:var(--hot)}
textarea{min-height:110px;resize:none}
button{padding:14px;border:0;border-radius:14px;background:var(--hot);color:#2a0615;font:inherit;font-size:1.1rem;font-weight:700}
button:active{transform:scale(.98)}
button:disabled{opacity:.5}
.q{background:var(--card);border-radius:22px;padding:26px 20px;font-size:1.45rem;line-height:1.5;text-align:center;border:1px solid #7d2a4a}
.meta{display:flex;justify-content:space-between;color:var(--soft);font-size:.95rem}
.ans{background:#2a0615;border-radius:16px;padding:14px 16px;border-right:5px solid var(--gold)}
.ans b{display:block;color:var(--gold);margin-bottom:6px}
.ans.b2{border-right-color:var(--hot)}.ans.b2 b{color:var(--hot)}
.err{color:#ffb3bd;text-align:center;min-height:1.2em}
.wait{text-align:center;color:var(--soft)}
.hide{display:none}
#chat{margin-top:22px;border-top:1px solid #7d2a4a;padding-top:14px}
#chat h2{margin:0 0 10px;font-size:1.1rem;color:var(--soft)}
#msgs{height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px}
.m{max-width:80%;padding:9px 13px;border-radius:16px;background:var(--card);align-self:flex-start;line-height:1.4;word-break:break-word}
.m.me{align-self:flex-end;background:var(--hot);color:#2a0615}
.m small{display:block;opacity:.7;font-size:.75rem;margin-bottom:2px}
#cbar{display:flex;gap:8px;margin-top:10px}
#cbar input{flex:1}
#cbar button{padding:0 18px}
</style></head><body><main>
<h1>مصارحة 💕</h1>
<p class="sub">لعبة صدق بين زوج</p>

<section id="join">
  <input id="name" placeholder="سميتك" autocomplete="off">
  <input id="room" placeholder="كود الغرفة (نفسو عند الاثنين)" autocomplete="off" style="margin-top:12px">
  <button id="go" style="width:100%;margin-top:12px">ادخل</button>
  <p class="err" id="err"></p>
</section>

<section id="game" class="hide">
  <div class="meta"><span id="who"></span><span id="num"></span></div>
  <div class="q" id="q"></div>
  <div id="write" style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
    <textarea id="text" placeholder="جاوب بصراحة..."></textarea>
    <button id="send">ابعث الجواب</button>
  </div>
  <p class="wait hide" id="wait"></p>
  <div id="reveal" class="hide" style="display:flex;flex-direction:column;gap:12px;margin-top:16px"></div>
  <button id="next" class="hide" style="margin-top:12px">السؤال الجاي</button>
  <div id="chat">
    <h2>الدردشة 💬</h2>
    <div id="msgs"></div>
    <div id="cbar"><input id="ctext" placeholder="اكتب رسالة..." autocomplete="off"><button id="csend">ابعث</button></div>
  </div>
</section>
</main>
<script>
var $=function(i){return document.getElementById(i)};
var me="",room="",cur=-1,timer=null;
try{me=localStorage.getItem("n")||"";room=localStorage.getItem("r")||"";}catch(e){}
$("name").value=me;$("room").value=room;

function post(u,d){return fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(function(r){return r.json()})}

var joined=false;
function stateUrl(){return "/api/state?room="+encodeURIComponent(room)+"&name="+encodeURIComponent(me)}
function skipIfFree(){
  return fetch(stateUrl()).then(function(r){return r.json()}).then(function(s){
    if(s.error)return;
    if(s.answered.length===0||s.answers)return post("/api/next",{room:room,i:s.i,auto:true});
  }).catch(function(){});
}
function enter(){
  me=$("name").value.trim();room=$("room").value.trim();
  post("/api/join",{name:me,room:room}).then(function(r){
    if(r.error){$("err").textContent=r.error;return}
    try{localStorage.setItem("n",me);localStorage.setItem("r",room)}catch(e){}
    $("join").classList.add("hide");$("game").classList.remove("hide");
    joined=true;
    skipIfFree().then(function(){poll();timer=setInterval(poll,1500)});
  });
}
$("go").onclick=enter;
if(me&&room)enter();
document.addEventListener("visibilitychange",function(){
  if(!document.hidden&&joined)skipIfFree().then(poll);
});

$("send").onclick=function(){
  var t=$("text").value.trim();if(!t)return;
  $("send").disabled=true;
  post("/api/answer",{name:me,room:room,text:t}).then(poll);
};

function sendChat(){
  var t=$("ctext").value.trim();if(!t)return;
  $("ctext").value="";
  post("/api/chat",{name:me,room:room,text:t}).then(poll);
}
$("csend").onclick=sendChat;
$("ctext").onkeydown=function(e){if(e.key==="Enter")sendChat()};
var shown=0;
function drawMsgs(list){
  if(list.length===shown)return;
  var box=$("msgs");var atEnd=box.scrollHeight-box.scrollTop-box.clientHeight<60;
  box.innerHTML="";
  list.forEach(function(m){
    var d=document.createElement("div");d.className="m"+(m.n===me?" me":"");
    var sm=document.createElement("small");sm.textContent=m.n;
    var tx=document.createElement("span");tx.textContent=m.t;
    d.appendChild(sm);d.appendChild(tx);box.appendChild(d);
  });
  shown=list.length;
  if(atEnd||true)box.scrollTop=box.scrollHeight;
}

$("next").onclick=function(){post("/api/next",{room:room,i:cur}).then(poll)};

function poll(){
  fetch(stateUrl())
  .then(function(r){return r.json()}).then(function(s){
    if(s.error)return;
    if(s.i!==cur){cur=s.i;$("text").value="";$("send").disabled=false}
    drawMsgs(s.msgs||[]);
    $("who").textContent=s.players.join(" 💕 ");
    $("num").textContent="سؤال "+(s.i+1);
    $("q").textContent=s.q;
    var solo=s.players.length<2;
    var show=!!s.answers;
    $("write").style.display=(s.mine===undefined&&!solo)?"flex":"none";
    if(solo){$("wait").textContent="ستنى الطرف الآخر يدخل بنفس الكود...";$("wait").classList.remove("hide")}
    else if(s.mine!==undefined&&!show){$("wait").textContent="جاوبت ✅ ستنى جواب الطرف الآخر...";$("wait").classList.remove("hide")}
    else $("wait").classList.add("hide");
    var rv=$("reveal");
    if(show){
      rv.innerHTML="";
      s.players.forEach(function(p,k){
        var d=document.createElement("div");d.className="ans"+(k?" b2":"");
        var b=document.createElement("b");b.textContent=p;
        var t=document.createElement("span");t.textContent=s.answers[p];
        d.appendChild(b);d.appendChild(t);rv.appendChild(d);
      });
      rv.classList.remove("hide");$("next").classList.remove("hide");
    }else{rv.classList.add("hide");$("next").classList.add("hide")}
  }).catch(function(){});
}
</script></body></html>`;

server.listen(process.env.PORT || 3000, "0.0.0.0", () => console.log("Musarha running"));
