
(function(){
  "use strict";
  /* ============ FIREBASE PROJECT ============ */
  var FIREBASE_CONFIG = {
    apiKey:            "AIzaSyDmAMnxfBorxPkwt4Y2FjhkEB83914ut1U",
    authDomain:        "highway-chat.firebaseapp.com",
    projectId:         "highway-chat",
    storageBucket:     "highway-chat.firebasestorage.app",
    messagingSenderId: "1063748874829",
    appId:             "1:1063748874829:web:5565a2fa6012a0c3b76204"
  };

  /* ============ DEVICE ID (per-tab identity) ============ */
  var DEVICE_ID = sessionStorage.getItem("hw_device_id");
  if(!DEVICE_ID){
    DEVICE_ID = "d-" + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
    sessionStorage.setItem("hw_device_id", DEVICE_ID);
  }

  var PLATFORM = (function(){
    var ua = navigator.userAgent || "";
    if(/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if(/Android/i.test(ua)) return "Android";
    if(/Mac/i.test(ua)) return (navigator.maxTouchPoints > 1) ? "iOS" : "Mac"; // iPad reports as Mac
    if(/Win/i.test(ua)) return "PC";
    if(/Linux/i.test(ua)) return "PC";
    return "Other";
  })();
  (function(){
    if(PLATFORM==="iOS")document.body.classList.add("device-ios");
    var db=document.getElementById("devbadge");
    if(db)db.textContent=PLATFORM;
  })();

  var $ = function(id){ return document.getElementById(id); };
  var chat=$("chat"), msg=$("msg"), sendBtn=$("send"),
      gate=$("gate"), nameIn=$("name"), joinBtn=$("join"),
      err=$("err"), sub=$("sub"), dot=$("livedot"), mebadge=$("mebadge"),
      presenceEl=$("presence"), typingEl=$("typing");
  var MY_NAME=null, db=null, seen={};
  window.HighwayDB=function(){ return db; }; /* push IIFE reads db through this */
  var VOICE_REG={}; /* docId -> {b64, type} : voice audio out of the DOM */
  var EMOJIS=["🔥","❤️","👍","😂","💯","👀"];
  var OWNERS=["sin","grim"]; // co-owners of the Highway — case-insensitive
  function isOwner(n){ return OWNERS.indexOf(String(n||"").toLowerCase())>=0; }
  function crownHtml(n){ return isOwner(n)?'<span class="crown" title="Owner">👑</span>':""; }
  function pingify(s){ return esc(s).replace(/@([a-z0-9_]+)/gi,'<span class="ping">@$1</span>'); }

  function fmtTime(m){var n=m.tsNum||0;if(!n&&m.ts&&m.ts.toDate){try{n=m.ts.toDate().getTime();}catch(e){ warn(e); }}if(!n)return"";var d=new Date(n),h=d.getHours(),a=h>=12?"PM":"AM";return(h%12||12)+":"+("0"+d.getMinutes()).slice(-2)+" "+a;}
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function warn(e){ if(window.console&&console.warn) console.warn("[highway]", e&&e.message||e); }
  function safeUrl(u){ try{ var p=new URL(u,location.href); return (p.protocol==="http:"||p.protocol==="https:")?p.href:"#"; }catch(e){ return "#"; } }

/* ============ QUESTS / WINS / AMBIENT (inside IIFE - needs db/esc/fmtTime) ============ */
function loadQuests(){
  var el=document.getElementById("questlist"); if(!el||!db) return;
  db.collection("highway_tasks").orderBy("ts","desc").limit(20).get().then(function(snap){
    var h='<div style="padding:12px;"><h3 style="color:var(--red);margin:0 0 12px;">\u2694\uFE0F QUEST BOARD</h3>';
    if(snap.empty){ h+='<p style="color:var(--muted);">No active quests. Add one from the Tasks tab.</p>'; }
    else snap.forEach(function(doc){
      var d=doc.data()||{}, done=d.done?'\u2705':'\u23F3';
      h+='<div style="padding:10px;border:1px solid var(--line);border-radius:8px;margin-bottom:8px;">'
        +'<div>'+done+' <b>'+esc(d.text||"Untitled")+'</b></div>'
        +'<div style="font-size:12px;color:var(--muted);">by '+esc(d.createdBy||"unknown")+'</div></div>';
    });
    el.innerHTML=h+'</div>';
  }).catch(warn);
}
function loadWins(){
  var el=document.getElementById("winlist"); if(!el||!db) return;
  db.collection("highway_activity").orderBy("ts","desc").limit(30).get().then(function(snap){
    var h='<div style="padding:12px;"><h3 style="color:var(--red);margin:0 0 12px;">\uD83C\uDFC6 WIN FEED</h3>', found=0;
    snap.forEach(function(doc){
      var d=doc.data()||{}, txt=(d.text||"").toLowerCase();
      if(/win|completed|beat|crushed|done|success/.test(txt)){ found++;
        h+='<div style="padding:8px;border-bottom:1px solid var(--line);"><div>'+esc(d.text||"")
          +'</div><div style="font-size:11px;color:var(--muted);">'+esc(d.by||"")+' \u2022 '+fmtTime(d)+'</div></div>';
      }
    });
    if(!found) h+='<p style="color:var(--muted);">No wins yet. Go get one.</p>';
    el.innerHTML=h+'</div>';
  }).catch(warn);
}
function updateAmbientStatus(){
  var el=document.getElementById("ambient"); if(!el||!db) return;
  db.collection("highway_activity").orderBy("ts","desc").limit(5).get().then(function(snap){
    var h="";
    snap.forEach(function(doc){ var d=doc.data()||{};
      h+='<span style="margin-right:12px;">'+esc(d.by||"")+': '+esc((d.text||"").slice(0,40))+'</span>'; });
    el.innerHTML=h||'<span style="color:var(--muted);">Quiet on the Highway...</span>';
  }).catch(warn);
}
var _ambientTimer=null;
updateAmbientStatus();
_ambientTimer=setInterval(updateAmbientStatus, 60000);
  function scrollDown(el){ requestAnimationFrame(function(){ el.scrollTop = el.scrollHeight; }); }
  function sysLine(t){
    var d=document.createElement("div"); d.className="sys"; d.textContent=t;
    chat.appendChild(d); scrollDown(chat);
  }
  function fmtTs(ts){
    try{
      var d=ts.toDate(); var now=new Date(); var diff=Math.floor((now-d)/1000);
      if(diff<60) return "just now";
      if(diff<3600){ var m=Math.floor(diff/60); return m+"m ago"; }
      if(diff<86400){ var h=Math.floor(diff/3600); return h+"h ago"; }
      if(diff<604800){ var dd=Math.floor(diff/86400); return dd+"d ago"; }
      return d.toLocaleString([], {month:"short",day:"numeric"});
    }catch(e){ return ""; }
  }

  /* ================= CHAT ================= */
  function buildMsgRow(doc){
    var m=doc.data(); if(!m) return null;
    var mine=(m.deviceId===DEVICE_ID);
    var row=document.createElement("div");
    row.className="row "+(mine?"me-row":"them-row");
    var rxHtml="";
    var rx=m.reactions||{};
    Object.keys(rx).forEach(function(e){
      var users=rx[e]||[];
      rxHtml+='<span class="rx'+(users.indexOf(MY_NAME)>=0?" mine":"")+'" data-id="'+doc.id+'" data-e="'+esc(e)+'">'+esc(e)+' '+(users.length||"")+'</span>';
    });
    rxHtml+='<span class="rx rx-add" data-id="'+doc.id+'" data-e="__pick__">＋</span>';
    row.innerHTML='<div class="bwrap"><div class="who">'+esc(m.name||"anon")+
      (mine?"":'<span class="ver">VERIFIED</span>')+crownHtml(m.name)+
      '<span class=ts>'+fmtTime(m)+'</span></div>'+
      '<div class="bubble">'+(m.audio?'<button data-voice="'+doc.id+'" style="background:rgba(248,113,113,.15);border:1px solid rgba(248,113,113,.4);color:#fff;border-radius:20px;padding:8px 16px;font-size:16px;cursor:pointer;margin-bottom:6px;display:block;">▶ voice</button>':'')+pingify(m.text||"")+'</div>'+
      '<div class="reacts">'+rxHtml+'</div></div>';
    chat.appendChild(row);
    /* Crimson pulse on new arrival: the room breathes */
    if(!mine){ row.classList.add("arrived"); setTimeout(function(){row.classList.remove("arrived");},1200); }
    row.querySelectorAll(".rx").forEach(function(el){
      el.addEventListener("click", function(ev){ ev.stopPropagation(); toggleReaction(el.getAttribute("data-id"), el.getAttribute("data-e")); });
    });
    row.querySelectorAll("[data-voice]").forEach(function(btn){
      btn.addEventListener("click", function(){ window.playVoice(btn.getAttribute("data-voice"), btn); });
    });
    return row;
  }
  function renderMsg(doc){
    if(!doc||seen[doc.id]) return; seen[doc.id]=1;
    var _seenKeys=Object.keys(seen);
    if(_seenKeys.length>500){
      for(var _si=0;_si<200;_si++){ delete seen[_seenKeys[_si]]; var vid=_seenKeys[_si]; if(VOICE_REG[vid]) delete VOICE_REG[vid]; }
    }
    var m=doc.data(); if(!m) return;
    if(m.audio){ VOICE_REG[doc.id]={b64:m.audio, type:m.audioType||'audio/webm'}; }
    var row=buildMsgRow(doc);
    if(row){ chat.appendChild(row); scrollDown(chat); }
  }
  var _pickerFor=null;
  function buildPicker(){
    var p=document.getElementById("emoji-picker");
    if(p.children.length) return;
    EMOJIS.forEach(function(e){
      var b=document.createElement("button");
      b.textContent=e;
      b.onclick=function(ev){ ev.stopPropagation(); pickEmoji(e); };
      p.appendChild(b);
    });
    document.addEventListener("click", function(){ p.classList.remove("open"); });
  }
  function showPicker(id, anchorEl){
    buildPicker();
    _pickerFor=id;
    var p=document.getElementById("emoji-picker");
    var r=anchorEl.getBoundingClientRect();
    p.style.left=Math.max(8, Math.min(window.innerWidth-290, r.left-100))+"px";
    p.style.top=Math.max(8, r.top-220)+"px";
    p.classList.remove("open"); void p.offsetWidth; p.classList.add("open");
  }
  function pickEmoji(e){
    document.getElementById("emoji-picker").classList.remove("open");
    if(_pickerFor&&e) toggleReaction(_pickerFor, e.trim().slice(0,4));
    _pickerFor=null;
  }
  function toggleReaction(id, emoji){
    if(emoji==="__pick__"){
      var els=document.querySelectorAll('.rx-add[data-id="'+id+'"]');
      showPicker(id, els.length?els[0]:document.body);
      return;
    }
    var ref=db.collection("highway_messages").doc(id);
    db.runTransaction(function(tx){
      return tx.get(ref).then(function(snap){
        var rx=(snap.data()&&snap.data().reactions)||{};
        var users=rx[emoji]||[];
        var i=users.indexOf(MY_NAME);
        if(i>=0) users.splice(i,1); else users.push(MY_NAME);
        if(users.length) rx[emoji]=users; else delete rx[emoji];
        tx.update(ref,{reactions:rx});
      });
    }).catch(warn);
  }
  function sendMsg(){
    var t=msg.value.trim(); if(!t||!MY_NAME||!db) return;
    msg.value=""; msg.style.height="auto"; setTyping(false); msg.focus();
    if(window.HighwayAmbient)HighwayAmbient.sendChime();
    db.collection("highway_messages").add({
      name:MY_NAME, text:t.slice(0,2000), deviceId:DEVICE_ID, reactions:{},
      ts:firebase.firestore.FieldValue.serverTimestamp(),tsNum:Date.now()
    }).catch(function(e){
      sysLine("Send failed: "+(e.message||"permission denied")+" — try rejoining.");
      msg.value=t;
    });
  }

  /* ================= VOICE MESSAGES ================= */
  var _recorder=null, _chunks=[], _recording=false, _voiceTimer=null;
  var voiceBtn=$("voiceBtn");
  function toggleVoice(){
    if(_recording){ stopVoice(); return; }
    if(!MY_NAME||!db){ return; }
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      sysLine("Voice not supported on this device."); return;
    }
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      _chunks=[];
      _recorder=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported("audio/webm")?"audio/webm":"audio/mp4"});
      _recorder.ondataavailable=function(e){ if(e.data.size>0) _chunks.push(e.data); };
      _recorder.onstop=function(){
        stream.getTracks().forEach(function(t){ t.stop(); });
        var blob=new Blob(_chunks,{type:_recorder.mimeType});
        if(blob.size>800000){ sysLine("Voice message too long — keep it under 30 seconds."); return; }
        var reader=new FileReader();
        reader.onloadend=function(){
          var b64=reader.result.split(",")[1];
          db.collection("highway_messages").add({
            name:MY_NAME, text:"🎤 voice message", deviceId:DEVICE_ID, reactions:{},
            audio:b64, audioType:_recorder.mimeType,
            ts:firebase.firestore.FieldValue.serverTimestamp(),tsNum:Date.now()
          }).then(function(){ sysLine("Voice message sent."); })
          .catch(function(e){ warn(e); sysLine("Voice send failed — try again."); });
        };
        reader.readAsDataURL(blob);
      };
      _recorder.start();
      _recording=true;
      voiceBtn.textContent="⏹"; voiceBtn.style.background="#7f1d1d";
      sysLine("Recording… tap ⏹ to send.");
      // Auto-stop at 30s
      if(_voiceTimer) clearTimeout(_voiceTimer);
      _voiceTimer=setTimeout(function(){ _voiceTimer=null; if(_recording) stopVoice(); }, 30000);
    }).catch(function(e){
      sysLine("Mic access denied.");
    });
  }
  function stopVoice(){
    if(_voiceTimer){ clearTimeout(_voiceTimer); _voiceTimer=null; }
    if(_recorder&&_recording){ try{ _recorder.stop(); }catch(e){ warn(e); } }
    _recording=false;
    voiceBtn.textContent="🎤"; voiceBtn.style.background="";
  }
  if(voiceBtn) voiceBtn.addEventListener("click", toggleVoice);

  /* Play voice messages — one cached Audio per message id, no double-play */
  var VOICE_AUDIO={};
  window.playVoice=function(id,btn){
    var v=VOICE_REG[id]; if(!v){ sysLine("Voice data expired — reload to replay."); return; }
    var audio=VOICE_AUDIO[id];
    if(audio){
      try{
        if(audio.paused){ audio.play().catch(warn); btn.textContent="⏸"; }
        else { audio.pause(); btn.textContent="▶ voice"; }
      }catch(e){ warn(e); }
      return;
    }
    try{
      audio=new Audio("data:"+(v.type||"audio/webm")+";base64,"+v.b64);
      VOICE_AUDIO[id]=audio;
      btn.textContent="⏸";
      audio.onended=function(){ btn.textContent="▶ voice"; delete VOICE_AUDIO[id]; };
      audio.onerror=function(){ btn.textContent="▶ voice"; delete VOICE_AUDIO[id]; };
      audio.play().catch(function(){ btn.textContent="▶ voice"; delete VOICE_AUDIO[id]; });
    }catch(e){ sysLine("Could not play voice message."); }
  };

  /* ================= PRESENCE (who's online) =================
     Each device heartbeats its doc every 20s. Anyone whose ts is fresher
     than 60s counts as online. Best-effort delete on tab close. */
  var _yielded=false, _hbTimer=null, _kickTimer=null;
  var TAB_SESSION=Date.now();
  try{
    var _prevSess=parseInt(sessionStorage.getItem("hw_session")||"0",10)||0;
    TAB_SESSION=Math.max(Date.now(),_prevSess+1);
    sessionStorage.setItem("hw_session",String(TAB_SESSION));
  }catch(e){ warn(e); }
  function stopHeartbeat(){ if(_hbTimer){clearInterval(_hbTimer);_hbTimer=null;} if(_kickTimer){clearInterval(_kickTimer);_kickTimer=null;} }
  function startHeartbeat(){
    stopHeartbeat(); _yielded=false; doBeat();
    _hbTimer=setInterval(doBeat,20000);
    _kickTimer=setInterval(checkKicked,15000); }
  function kickDuplicates(){
    if(!db||!MY_NAME||_yielded) return;
    db.collection("highway_presence").where("name","==",MY_NAME).get().then(function(snap){
      snap.forEach(function(d){
        if(d.id===DEVICE_ID) return;
        var s=d.data()||{};
        if((s.session||0) < TAB_SESSION) d.ref.delete().catch(warn);
      });
    }).catch(warn);
  }
  function doBeat(){
    if(!db||!MY_NAME||_yielded) return;
    var myRef=db.collection("highway_presence").doc(DEVICE_ID);
    // New session takes over: claim presence, old tabs will see their doc gone and go quiet
    myRef.set({name:MY_NAME, platform:PLATFORM, ts:firebase.firestore.FieldValue.serverTimestamp(), session:TAB_SESSION}, {merge:true}).catch(warn);
    kickDuplicates();
  }
  function checkKicked(){
    if(!db||!MY_NAME||_yielded) return;
    // If our presence doc was deleted by a newer session, go idle silently
    db.collection("highway_presence").doc(DEVICE_ID).get().then(function(doc){
      if(!doc.exists && !_yielded){
        _yielded=true; stopHeartbeat();
        // Silent: no annoying message, just stop
      }
    }).catch(warn);
  }
  function _presenceCleanup(){
    if(db){ try{ db.collection("highway_presence").doc(DEVICE_ID).delete().catch(warn); }catch(e){ warn(e); } }
  }
  window.addEventListener("beforeunload", _presenceCleanup);
  window.addEventListener("pagehide", _presenceCleanup);

  /* ================= TYPING INDICATORS ================= */
  var typingTimer=null, _typingState=false, _typingAt=0;
  function setTyping(on){
    if(!db||!MY_NAME) return;
    on=!!on;
    var now=Date.now();
    if(on===_typingState && now-_typingAt<2000) return; /* throttle: state change or 2s */
    _typingState=on; _typingAt=now;
    db.collection("highway_typing").doc(DEVICE_ID).set({
      name:MY_NAME, typing:on, ts:firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true}).catch(warn);
  }

  /* ================= TASKS ================= */
  function renderTask(doc){
    var t=doc.data(); if(!t) return;
    var el=document.createElement("div");
    el.className="trow"+(t.done?" done":""); el.id="task-"+doc.id;
    el.innerHTML='<input type="checkbox" class="tcheck"'+(t.done?" checked":"")+'>'+
      '<span class="ttext">'+esc(t.text||"")+'</span>'+
      '<span class="tby">'+esc(t.createdBy||"")+'</span>'+
      '<button class="tdel">×</button>';
    el.querySelector(".tcheck").addEventListener("change", function(e){
      if(e.target.checked){ el.classList.add("completing"); setTimeout(function(){el.classList.remove("completing");},650); }
      db.collection("highway_tasks").doc(doc.id).update({done:e.target.checked}).catch(warn);
      if(db && MY_NAME){
        var action = e.target.checked ? "completed quest" : "reopened quest";
        db.collection("highway_activity").add({text:action+": "+(t.text||"").slice(0,200), by:MY_NAME,
          ts:firebase.firestore.FieldValue.serverTimestamp()}).catch(warn);
      }
    });
    el.querySelector(".tdel").addEventListener("click", function(){
      if(confirm("Abandon this quest?")){
        var taskText = (t.text||"").slice(0,200);
        db.collection("highway_tasks").doc(doc.id).delete().catch(warn);
        if(db && MY_NAME){
          db.collection("highway_activity").add({text:"abandoned quest: "+taskText, by:MY_NAME,
            ts:firebase.firestore.FieldValue.serverTimestamp()}).catch(warn);
        }
      }
    });
    return el;
  }

  /* ================= NOTES (shared live doc) ================= */
  var notesTimer=null, notesFocused=false, lastNotesTs=null;
  function saveNotes(){
    if(!db||!MY_NAME) return;
    db.collection("highway_notes").doc("shared").set({
      content:$("notes").value.slice(0,20000),
      updatedBy:MY_NAME, ts:firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true}).catch(warn);
  }

  /* ================= ACTIVITY FEED ================= */
  function logActivity(){
    var t=$("actin").value.trim(); if(!t||!db||!MY_NAME) return;
    $("actin").value="";
    db.collection("highway_activity").add({
      text:t.slice(0,300), by:MY_NAME,
      ts:firebase.firestore.FieldValue.serverTimestamp()
    }).catch(warn);
  }

  /* ================= GO LIVE ================= */
  function goLive(){
    try{
      firebase.initializeApp(FIREBASE_CONFIG);
      // Sign in anonymously for authenticated Firestore access
      db=firebase.firestore();
    }
    catch(e){ sub.textContent="config error"; return; }

    dot.classList.remove("off"); sub.textContent="live";
    sysLine("Connected — chat, presence, tasks, notes & activity all sync live.");

    db.collection("highway_messages").orderBy("ts","desc").limit(100)
      .onSnapshot(function(s){ s.docChanges().forEach(function(c){
        if(c.type==="added") renderMsg(c.doc);
        if(c.type==="modified"){ // reactions changed -> replace row in place
          delete seen[c.doc.id];
          var rows=chat.querySelectorAll(".row");
          for(var i=0;i<rows.length;i++){
            if(rows[i].innerHTML.indexOf('data-id="'+c.doc.id+'"')>=0){
              var nr=buildMsgRow(c.doc);
              if(nr){ rows[i].parentNode.replaceChild(nr, rows[i]); }
              else { delete seen[c.doc.id]; }
              break;
            }
          }
        }
      }); }, function(e){ warn(e); dot.classList.add("off"); sub.textContent="reconnecting\u2026"; });

    var _presSnap=null;
    function renderPresence(){
      if(!_presSnap||!presenceEl) return;
      var now=Date.now(), html="";
      _presSnap.forEach(function(d){
        var p=d.data(); if(!p||!p.ts) return;
        try{ if(now-p.ts.toDate().getTime()<60000) html+='<span class="p-chip">'+esc(p.name)+crownHtml(p.name)+(p.platform?' <span style="font-size:9px;opacity:.55">'+esc(p.platform)+'</span>':'')+'</span>'; }catch(e){ warn(e); }
      });
      presenceEl.innerHTML=html||'<span style="font-size:11px;color:var(--muted)">no one else here</span>';
    }
    db.collection("highway_presence").onSnapshot(function(s){ _presSnap=s; renderPresence(); },
      function(e){ warn(e); dot.classList.add("off"); });
    setInterval(renderPresence,15000);

    var _typeSnap=null;
    function renderTyping(){
      if(!_typeSnap||!typingEl) return;
      var names=[];
      _typeSnap.forEach(function(d){
        var t=d.data();
        if(t&&t.typing&&d.id!==DEVICE_ID){
          try{ if(Date.now()-t.ts.toDate().getTime()<8000) names.push(t.name); }catch(e){ warn(e); }
        }
      });
      typingEl.textContent=names.length?names.join(", ")+(names.length>1?" are":" is")+" typing…":"";
    }
    db.collection("highway_typing").onSnapshot(function(s){ _typeSnap=s; renderTyping(); },
      function(e){ warn(e); });
    setInterval(renderTyping,5000);

    db.collection("highway_tasks").orderBy("ts","asc")
      .onSnapshot(function(s){
        var list=$("tasklist"); list.innerHTML="";
        s.forEach(function(d){ var el=renderTask(d); if(el) list.appendChild(el); });
        if(!s.size) list.innerHTML='<div style="text-align:center;padding:40px 20px;color:var(--muted);">'
          +'<div style="font-size:32px;margin-bottom:12px;">⚔️</div>'
          +'<div style="font-size:15px;font-weight:600;color:var(--txt);margin-bottom:6px;">No quests on the board</div>'
          +'<div style="font-size:13px;">Every legend starts with a single step.<br>Set your first quest above.</div></div>';
      }, function(e){ warn(e); });

    db.collection("highway_notes").doc("shared")
      .onSnapshot(function(s){
        var d=s.data(); if(!d) return;
        if(!notesFocused && d.ts && (!lastNotesTs || d.ts.toMillis()>lastNotesTs)){
          lastNotesTs=d.ts.toMillis();
          $("notes").value=d.content||"";
        }
        $("notes-meta").textContent=d.updatedBy?("last edited by "+d.updatedBy):"";
      }, function(e){ warn(e); });

    db.collection("highway_activity").orderBy("ts","desc").limit(30)
      .onSnapshot(function(s){
        var list=$("actlist"); list.innerHTML="";
        s.forEach(function(d){
          var a=d.data(); if(!a) return;
          var el=document.createElement("div"); el.className="arow";
          el.innerHTML="<b>"+esc(a.by||"")+"</b> "+esc(a.text||"")+"<time>"+fmtTs(a.ts)+"</time>";
          list.appendChild(el);
        });
        if(!s.size) list.innerHTML='<div style="text-align:center;padding:40px 20px;color:var(--muted);">'
          +'<div style="font-size:32px;margin-bottom:12px;">📜</div>'
          +'<div style="font-size:15px;font-weight:600;color:var(--txt);margin-bottom:6px;">The story hasn\'t begun</div>'
          +'<div style="font-size:13px;">Every message, quest, and moment<br>will be written here.</div></div>';
      }, function(e){ warn(e); });

    startHeartbeat();
  }

  /* ================= PASSWORD GATE ================= */
  var _PW="TheEnd";
  try{ if(sessionStorage.getItem("hw_pw")==="1"){ $("pwgate").style.display="none"; $("gate").style.display="flex"; } }catch(e){ warn(e); }
  function tryPw(){
    if($("pw").value===_PW){
      try{ sessionStorage.setItem("hw_pw","1"); }catch(e){ warn(e); }
      $("pwgate").style.display="none";
      $("gate").style.display="flex";
      $("name").focus();
    } else {
      $("pwerr").textContent="Wrong password.";
      $("pw").value=""; $("pw").focus();
    }
  }
  $("pwjoin").addEventListener("click", tryPw);
  $("pw").addEventListener("keydown", function(e){ if(e.key==="Enter") tryPw(); });

  /* ================= UI EVENTS ================= */
  var authShown=false;
  function join(){
    var n=nameIn.value.trim().slice(0,24);
    if(!n){ err.textContent="Pick a name first."; return; }
    // First click: reveal the account fields. Second click: sign in.
    if(!authShown){
      authShown=true;
      $("authfields").style.display="block";
      $("email").focus();
      err.textContent="Sign in with your Highway account.";
      return;
    }
    var email=$("email").value.trim();
    var pw=$("password").value;
    if(!email||!pw){ err.textContent="Enter your email and password."; return; }
    err.textContent="Verifying...";
    try{ firebase.initializeApp(FIREBASE_CONFIG); }catch(e){ warn(e); }
    firebase.auth().signInWithEmailAndPassword(email,pw).then(function(cred){
      // Name must match the account's allowed name (enforced server-side too)
      completeJoin(n,true);
    }).catch(function(e){
      var msg="Sign-in failed.";
      if(e&&e.code==="auth/user-not-found") msg="No account for that email.";
      else if(e&&e.code==="auth/wrong-password") msg="Wrong password.";
      else if(e&&e.code==="auth/invalid-email") msg="That email looks invalid.";
      err.textContent=msg+" Try again.";
    });
  }
  function completeJoin(n,verified){
    try{ firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL); }catch(e){ warn(e); }
    MY_NAME=n;
    try{ sessionStorage.setItem("hw_name",n); localStorage.setItem("hw_name",n); }catch(e){ warn(e); }
    mebadge.textContent=n+(verified?" ✓":"");
    gate.style.display="none";
    kickDuplicates();
    sysLine("You joined as "+n+" — verified on everything you do.");
    goLive(); msg.focus();
  }
  joinBtn.addEventListener("click", join);
  nameIn.addEventListener("keydown", function(e){ if(e.key==="Enter") join(); });

  /* Tab glider: slides to the active tab */
  function moveGlider(){
    var active=document.querySelector(".tab.active"); var glider=document.querySelector(".tab-glider");
    var tabs=document.querySelector(".tabs");
    if(!active||!glider||!tabs) return;
    var tr=tabs.getBoundingClientRect(); var ar=active.getBoundingClientRect();
    glider.style.left=(ar.left-tr.left)+"px"; glider.style.width=ar.width+"px";
  }
  document.querySelectorAll(".tab").forEach(function(t){
    t.addEventListener("click", function(){
      document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("active");});
      document.querySelectorAll(".view").forEach(function(x){x.classList.remove("active");});
      t.classList.add("active"); $(t.getAttribute("data-v")).classList.add("active");
      moveGlider();
      if(window.HighwayAmbient)HighwayAmbient.shimmer();
      if(t.getAttribute("data-v")==="view-news" && Date.now()-newsLoadedAt>10*60*1000) loadNews();
      var v=t.getAttribute("data-v");
      if(v==="view-quests") loadQuests();
      if(v==="view-wins") loadWins();
    });
  });
  window.addEventListener("resize", moveGlider);
  setTimeout(moveGlider, 300);

  /* ============ NEWS FEED (money moves: crypto + stocks + macro) ============ */
  var NEWS_URL="https://highway-chat-mcp.onrender.com/news";
  var newsLoadedAt=0;
  function loadNews(){
    var list=$("newslist"); if(!list) return;
    list.innerHTML='<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px;">Pulling the money moves…</div>';
    var ctl=null, to=null;
    try{ if(window.AbortController){ ctl=new AbortController(); to=setTimeout(function(){ try{ctl.abort();}catch(e){ warn(e); } },10000); } }catch(e){ warn(e); }
    fetch(NEWS_URL, ctl?{signal:ctl.signal}:{}).then(function(r){
      if(to) clearTimeout(to);
      if(!r.ok) throw new Error("news HTTP "+r.status);
      return r.json();
    }).then(function(d){
      newsLoadedAt=Date.now();
      var items=(d&&d.items)||[];
      if(!items.length){ list.innerHTML='<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px;">Markets are quiet right now.</div>'; return; }
      var html='<div style="color:var(--muted);font-size:11px;text-align:center;letter-spacing:.4px;">MONEY MOVES · RANKED BY WALLET IMPACT · UPDATED '+esc(new Date(d.updated||Date.now()).toLocaleTimeString())+'</div>';
      var lastSec="";
      items.forEach(function(n){
        var src=(n.source||"?").trim();
        if(src&&src!==lastSec){ lastSec=src; html+='<div class="nsec">'+esc(src)+'</div>'; }
        var initial=esc(src.charAt(0).toUpperCase());
        var img=n.image?'<img class="nthumb" src="'+esc(n.image)+'" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">':'';
        var ph='<span class="nthumb nph" style="'+(n.image?'display:none;':'display:flex;')+'">'+initial+'</span>';
        var desc=n.description?'<span class="ndesc">'+esc(n.description)+'</span>':'';
        html+='<a class="ncard" href="'+safeUrl(n.url||"#")+'" target="_blank" rel="noopener">'
          +'<span class="nthumbwrap">'+img+ph+'</span>'
          +'<span class="nbody"><span class="nsrc">'+esc(src)+'</span>'
          +'<span class="ntitle">'+esc(n.title||"")+'</span>'+desc+'</span></a>';
      });
      list.innerHTML=html;
    }).catch(function(e){
      if(e&&e.name!=="AbortError") warn(e);
      list.innerHTML='<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px;">Feed is warming up — open the tab again in a minute.</div>';
    });
  }

  sendBtn.addEventListener("click", sendMsg);
  $("clear").addEventListener("click", function(){
    if(!db||!confirm("Clear ALL chat messages for everyone? This cannot be undone.")) return;
    db.collection("highway_messages").get().then(function(s){
      var docs=[]; s.forEach(function(d){ docs.push(d.ref); });
      function next(){
        if(!docs.length) return Promise.resolve();
        var b=db.batch();
        docs.splice(0,450).forEach(function(r){ b.delete(r); });
        return b.commit().then(next);
      }
      return next();
    }).then(function(){ sysLine("Chat cleared — fresh highway."); })
    .catch(function(e){ sysLine("Clear failed: "+(e.message||e)); });
  });
  msg.addEventListener("keydown", function(e){
    if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMsg(); }
  });
  msg.addEventListener("input", function(){
    // Auto-expand textarea as you type
    msg.style.height="auto";
    msg.style.height=Math.min(msg.scrollHeight,120)+"px";
    setTyping(true);
    clearTimeout(typingTimer);
    typingTimer=setTimeout(function(){ setTyping(false); }, 2000);
  });

  $("taskadd").addEventListener("click", function(){
    var t=$("taskin").value.trim(); if(!t||!db||!MY_NAME) return;
    $("taskin").value="";
    db.collection("highway_tasks").add({text:t.slice(0,300),done:false,createdBy:MY_NAME,
      ts:firebase.firestore.FieldValue.serverTimestamp()}).catch(warn);
    db.collection("highway_activity").add({text:"started quest: "+t.slice(0,200), by:MY_NAME,
      ts:firebase.firestore.FieldValue.serverTimestamp()}).catch(warn);
  });
  $("taskin").addEventListener("keydown", function(e){ if(e.key==="Enter") $("taskadd").click(); });

  $("notes").addEventListener("focus", function(){ notesFocused=true; });
  $("notes").addEventListener("blur", function(){ notesFocused=false; saveNotes(); });
  $("notes").addEventListener("input", function(){
    clearTimeout(notesTimer); notesTimer=setTimeout(saveNotes, 1000);
  });

  $("actadd").addEventListener("click", logActivity);
  $("actin").addEventListener("keydown", function(e){ if(e.key==="Enter") logActivity(); });

  nameIn.focus();
}

)();


/* Liquid Glass scroll morph: tab bar shrinks on scroll down, blooms on scroll up */
(function(){
  var tabs = document.querySelector('.tabs');
  if (!tabs) return;
  var lastY = 0, ticking = false;
  function onScroll(){
    var views = document.querySelectorAll('.view.active');
    var y = 0;
    views.forEach(function(v){ y = Math.max(y, v.scrollTop); });
    if (y > 60 && y > lastY + 4) tabs.classList.add('min');
    else if (y < lastY - 4 || y < 30) tabs.classList.remove('min');
    lastY = y;
    ticking = false;
  }
  document.querySelectorAll('.view').forEach(function(v){
    v.addEventListener('scroll', function(){
      if (!ticking){ requestAnimationFrame(onScroll); ticking = true; }
    }, { passive:true });
  });
  /* Ethereal embers: slow drifting particles */
  var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (!reduced){
    for (var i = 0; i < 14; i++){
      var e = document.createElement('div');
      e.className = 'ember';
      var sz = 3 + Math.random() * 5;
      e.style.width = sz + 'px'; e.style.height = sz + 'px';
      e.style.left = (Math.random() * 100) + 'vw';
      e.style.top = (60 + Math.random() * 40) + 'vh';
      e.style.animationDuration = (9 + Math.random() * 8) + 's';
      e.style.animationDelay = (Math.random() * 10) + 's';
      document.body.appendChild(e);
    }
  }
  /* Luminescent trail follows touch */
  var glow = document.createElement('div');
  glow.className = 'touch-glow';
  document.body.appendChild(glow);
  var glowTimer = null;
  function showGlow(x, y){
    glow.style.left = x + 'px';
    glow.style.top = y + 'px';
    glow.style.opacity = '1';
    clearTimeout(glowTimer);
    glowTimer = setTimeout(function(){ glow.style.opacity = '0'; }, 800);
  }
  document.addEventListener('touchstart', function(e){
    if (e.touches.length > 0) showGlow(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive:true });
  var _glowRaf=false, _glowX=0, _glowY=0;
  document.addEventListener('mousemove', function(e){
    _glowX=e.clientX; _glowY=e.clientY;
    if(!_glowRaf){ _glowRaf=true; requestAnimationFrame(function(){ _glowRaf=false; showGlow(_glowX,_glowY); }); }
  }, { passive:true });
})();


/* Highway Chat push notifications */
(function(){
  var VAPID_PUBLIC = "BEm8B9zNCKOVR7_nvgrVOrBiVUJTnWTdLkn23Wk---Y03oqTXMDjXwvTliytNJBN412Z8gU7O29YGPpTke0Papk";
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  function hashStr(s){ var h=5381; for(var i=0;i<s.length;i++){ h=((h<<5)+h+s.charCodeAt(i))|0; } return (h>>>0).toString(36); }
  function urlB64ToUint8(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    var raw = window.atob(base64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
    return out;
  }

  function addBell(){
    var header = document.querySelector('.head-top') || document.body;
    var btn = document.createElement('button');
    btn.id = 'pushbell';
    btn.title = 'Enable live notifications';
    btn.textContent = '\uD83D\uDD15';
    btn.style.cssText = 'background:none;border:1px solid #c1121f;color:#c1121f;border-radius:8px;padding:4px 10px;font-size:16px;cursor:pointer;margin-left:8px;';
    btn.onclick = enablePush;
    header.appendChild(btn);
    navigator.serviceWorker.ready.then(function(reg){
      reg.pushManager.getSubscription().then(function(sub){
        if (sub) { btn.textContent = '\uD83D\uDD14'; btn.title = 'Notifications on'; }
      });
    });
  }

  function enablePush(){
    if (Notification.permission === 'denied') { alert('Notifications blocked. Enable them in Settings > Highway Chat.'); return; }
    navigator.serviceWorker.ready.then(function(reg){
      return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(VAPID_PUBLIC) });
    }).then(function(sub){
      var btn = document.getElementById('pushbell');
      if (btn) { btn.textContent = '\uD83D\uDD14'; btn.title = 'Notifications on'; }
      var subJson = sub.toJSON();
      var pdb = (typeof window.HighwayDB === 'function') ? window.HighwayDB() : null;
      if (pdb) {
        var myName = 'anon';
        try { myName = sessionStorage.getItem('hw_name') || localStorage.getItem('hw_name') || 'anon'; } catch(e){ warn(e); }
        pdb.collection('highway_push_subs').doc('push_' + hashStr(sub.endpoint)).set({
          endpoint: sub.endpoint,
          keys: subJson.keys,
          name: myName,
          platform: navigator.platform || 'unknown',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(function(e){ warn('push save failed', e); });
      }
    }).catch(function(err){ console.warn('push subscribe failed', err); });
  }

  navigator.serviceWorker.register('sw.js').then(function(){ addBell(); }).catch(function(e){ console.warn('sw failed', e); });
})();


/* Highway ambient: procedural Web Audio (rain+pad+chords). */
(function(){
  var ctx = null, master = null, started = false, _activeChord = null;

  var CHORDS = [
    [220.00, 246.94, 329.63],  // Am(add9)
    [174.61, 220.00, 329.63],  // Fmaj9
    [196.00, 246.94, 293.66],  // Gm(add9)
    [164.81, 196.00, 293.66],  // Em(add9)
    [220.00, 277.18, 329.63],  // A(add9)
  ];
  var chordIdx = 0;

  function initAudio() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0.0; // start silent, fade in

    // Limiter: prevent clipping when rain+pad+chords+dove stack
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 8;
    master.connect(comp);  comp.connect(ctx.destination);

    var verb = ctx.createConvolver();
    verb.buffer = makeImpulse(3.5, 2.5);
    var wet = ctx.createGain(); wet.gain.value = 0.35;
    var dry = ctx.createGain(); dry.gain.value = 0.7;
    master.connect(dry); dry.connect(comp);
    master.connect(verb); verb.connect(wet); wet.connect(comp);

    startRain();
    startPad();
    scheduleChords();
    setTimeout(dove, 5000);

    master.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 3);
  }

  function makeImpulse(dur, decay) {
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay);
      }
    }
    return buf;
  }

  function startRain() {
    var len = ctx.sampleRate * 4;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random()*2-1;
    var src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 0.5;
    var g = ctx.createGain(); g.gain.value = 0.03;
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    var lfoG = ctx.createGain(); lfoG.gain.value = 0.015;
    lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start();
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start();
  }

  function startPad() {
    var o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = 110; // A2
    var o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = 165; // E3
    var f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 320; f.Q.value = 2;
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.025;
    var lfoG = ctx.createGain(); lfoG.gain.value = 200;
    lfo.connect(lfoG); lfoG.connect(f.frequency); lfo.start();
    var g = ctx.createGain(); g.gain.value = 0.06;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(master);
    o1.start(); o2.start();
  }

  function playChord(freqs) {
    var t = ctx.currentTime;
    // Fade out any still-ringing chord before starting the new one (no overlap glitch)
    if (_activeChord) { try { _activeChord.gain.gain.cancelScheduledValues(t); _activeChord.gain.gain.setValueAtTime(_activeChord.gain.gain.value, t); _activeChord.gain.gain.linearRampToValueAtTime(0.0001, t + 0.8); } catch(e){ warn(e); } }
    var chordGain = ctx.createGain();
    chordGain.gain.value = 1;
    chordGain.connect(master);
    _activeChord = { gain: chordGain };
    freqs.forEach(function(fr, i){
      var o = ctx.createOscillator();
      o.type = "sine"; o.frequency.value = fr;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.10, t + 0.6 + i*0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 8);
      var tr = ctx.createOscillator(); tr.frequency.value = 3;
      var trG = ctx.createGain(); trG.gain.value = 0.008;
      tr.connect(trG); trG.connect(g.gain); tr.start(t); tr.stop(t+8.5);
      o.connect(g); g.connect(chordGain);
      o.start(t); o.stop(t + 8.5);
    });
  }

  function scheduleChords() {
    // Skip when tab hidden or ctx suspended — prevents pileup glitch on resume
    if(!document.hidden && ctx && ctx.state==="running"){
      playChord(CHORDS[chordIdx]);
      chordIdx = (chordIdx + 1) % CHORDS.length;
    }
    setTimeout(scheduleChords, 9000 + Math.random()*3000);
  }

  function dove(){
    // Skip when tab hidden or ctx suspended — prevents pileup glitch on resume
    if(document.hidden || !ctx || ctx.state!=="running"){
      setTimeout(dove,15000+Math.random()*20000);
      return;
    }
    var t=ctx.currentTime;
    [520,640,540].forEach(function(f,i){
      var o=ctx.createOscillator(),g=ctx.createGain(),tt=t+i*0.55;
      o.frequency.value=f;
      g.gain.setValueAtTime(0,tt);
      g.gain.linearRampToValueAtTime(0.07,tt+0.1);
      g.gain.exponentialRampToValueAtTime(0.0001,tt+0.5);
      o.connect(g);g.connect(master);o.start(tt);o.stop(tt+0.55);
    });
    setTimeout(dove,15000+Math.random()*20000);
  }

  function unlock(){
     if(started)return;
    try{
      initAudio();
      if(!ctx)return;
      var st=ctx.state;
      if(st==="running"){
        started=true;
        ["touchstart","touchend","click"].forEach(function(e){window.removeEventListener(e,unlock)});
      }else{ ctx.resume(); }
    }catch(e){ if(window.console)console.warn("unlock:",e); }
  }
  window.addEventListener("touchstart", unlock, {passive: true});
  window.addEventListener("touchend", unlock, false);
  window.addEventListener("click", unlock, false);

  function tone(f,d,v){
    if(!ctx||!started)return;
    try{
      var t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
      o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(v,t+0.015);
      g.gain.exponentialRampToValueAtTime(0.0001,t+d);
      o.connect(g);g.connect(master);o.start(t);o.stop(t+d+0.05);
    }catch(e){ warn(e); }
  }
  function thock(){
    if(!ctx||!started)return;
    try{
      var t=ctx.currentTime,len=Math.floor(ctx.sampleRate*0.03),
          b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);
      for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
      var s=ctx.createBufferSource();s.buffer=b,
          f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=850,
          g=ctx.createGain();g.gain.value=0.16;
      s.connect(f);f.connect(g);g.connect(master);s.start(t);
      tone(175+Math.random()*45,0.09,0.12);
    }catch(e){ warn(e); }
  }
  function shimmer(){
    tone(523.25,1.4,0.045);
    setTimeout(function(){tone(784,1.8,0.035);},140);
  }
  function sendChime(){ tone(880,0.9,0.05); setTimeout(function(){tone(1174.66,1.2,0.04);},100); }
  document.addEventListener("keydown",function(e){
    var t=e.target;
    if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA")&&t.type!=="password"&&t.type!=="checkbox")thock();
  });

  document.addEventListener("visibilitychange", function(){
    if(!ctx) return;
    try{ if(document.hidden){ ctx.suspend(); } else if(started){ ctx.resume(); } }catch(e){ warn(e); }
  });
  window.HighwayAmbient = { init: function(){ unlock(); }, thock:thock, shimmer:shimmer, sendChime:sendChime, tone:tone };
})();


// ============ ROOM MOODS ============
// Time-based atmosphere
function applyMood(){
  var h = new Date().getHours();
  var b = document.body;
  b.classList.remove("mood-dawn","mood-day","mood-dusk","mood-night");
  if(h>=5 && h<8) b.classList.add("mood-dawn");
  else if(h>=8 && h<17) b.classList.add("mood-day");
  else if(h>=17 && h<20) b.classList.add("mood-dusk");
  else b.classList.add("mood-night");
}
applyMood();
setInterval(applyMood, 600000);

