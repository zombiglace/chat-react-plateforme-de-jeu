import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";

// 🧩 Presets d'injection prêts à l'emploi
const PRESETS = [
  {
    id: "rickroll",
    name: "🎵 Rick Roll",
    desc: "Vidéo plein écran sur tous les écrans",
    code: `(() => {
  document.getElementById("__rickroll")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "__rickroll";
  overlay.style.cssText = "position:fixed;inset:0;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;";
  const iframe = document.createElement("iframe");
  iframe.src = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&playsinline=1";
  iframe.allow = "autoplay; encrypted-media; fullscreen";
  iframe.allowFullscreen = true;
  iframe.style.cssText = "width:100vw;height:100vh;border:0;";
  overlay.appendChild(iframe);
  const close = document.createElement("button");
  close.textContent = "✕ Fermer";
  close.style.cssText = "position:fixed;top:20px;right:20px;z-index:1000000;padding:12px 20px;background:#dc2626;color:#fff;border:0;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;";
  close.onclick = () => { overlay.remove(); close.remove(); };
  overlay.appendChild(close);
  document.body.appendChild(overlay);
})();`,
  },
  {
    id: "alert",
    name: "💬 Alerte simple",
    desc: "Message popup personnalisé",
    code: `alert("📢 Message de l'admin : Bonjour !");`,
  },
  {
    id: "confetti",
    name: "🎉 Confettis",
    desc: "Pluie de confettis emoji",
    code: `(() => {
  const emojis = ["🎉","🎊","✨","⭐","🎈","💫","🌟"];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.cssText = \`position:fixed;top:-50px;left:\${Math.random()*100}vw;font-size:\${20+Math.random()*30}px;z-index:999999;pointer-events:none;transition:transform 3s linear, opacity 3s;\`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = \`translateY(110vh) rotate(\${Math.random()*720}deg)\`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 3200);
  }
})();`,
  },
  {
    id: "matrix",
    name: "💚 Pluie Matrix",
    desc: "Effet hacker vert",
    code: `(() => {
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;inset:0;z-index:999999;pointer-events:none;background:rgba(0,0,0,0.7)";
  c.width = innerWidth; c.height = innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext("2d");
  const cols = Math.floor(c.width / 16);
  const drops = Array(cols).fill(1);
  const chars = "アカサタナハマヤラワ0123456789ABCDEF";
  const iv = setInterval(() => {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#0f0";
    ctx.font = "15px monospace";
    drops.forEach((y, i) => {
      ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*16, y*16);
      drops[i] = y*16 > c.height && Math.random() > 0.975 ? 0 : y + 1;
    });
  }, 40);
  setTimeout(() => { clearInterval(iv); c.remove(); }, 5000);
})();`,
  },
  {
    id: "redirect",
    name: "🚀 Redirection",
    desc: "Redirige vers une URL",
    code: `window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";`,
  },
  {
    id: "message",
    name: "📨 Message flottant",
    desc: "Notification personnalisée",
    code: `(() => {
  const el = document.createElement("div");
  el.textContent = "📢 Message de l'admin !";
  el.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#3b82f6;color:#fff;padding:16px 32px;border-radius:12px;font-size:18px;font-weight:bold;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.5);";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
})();`,
  },
  {
    id: "block",
    name: "🚫 Bloquer la page",
    desc: "Overlay rouge avec message",
    code: `(() => {
  const el = document.createElement("div");
  el.innerHTML = "<h1 style='color:#fff;font-size:4rem;text-align:center'>🚫 BLOQUÉ PAR L'ADMIN</h1>";
  el.style.cssText = "position:fixed;inset:0;background:rgba(127,29,29,0.95);z-index:999999;display:grid;place-items:center;";
  const close = document.createElement("button");
  close.textContent = "Fermer";
  close.style.cssText = "position:fixed;bottom:40px;left:50%;transform:translateX(-50%);padding:12px 24px;background:#fff;color:#000;border:0;border-radius:8px;font-weight:bold;cursor:pointer;";
  close.onclick = () => el.remove();
  el.appendChild(close);
  document.body.appendChild(el);
})();`,
  },
    {
    id: "securityPopup",
    name: "🔒 Informations sécurité",
    desc: "Affiche les informations importantes sur les permissions et la sécurité",
    code: `(() => {
  const overlay = document.createElement("div");

  overlay.style.cssText = \`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: Arial, sans-serif;
    padding: 20px;
    box-sizing: border-box;
  \`;

  const popup = document.createElement("div");

  popup.style.cssText = \`
    width: min(560px, 95%);
    max-height: 85vh;
    overflow-y: auto;
    background: #18181b;
    color: white;
    border-radius: 16px;
    padding: 28px;
    box-sizing: border-box;
    box-shadow: 0 20px 60px rgba(0,0,0,.5);
    border: 1px solid #333;
  \`;

  popup.innerHTML = \`
    <h2 style="margin-top:0;color:#60a5fa;">
      🔒 Informations importantes
    </h2>

    <p style="line-height:1.6;color:#d4d4d8;">
      Pour assurer la sécurité et le bon fonctionnement du service,
      certaines fonctionnalités sont réservées aux administrateurs
      disposant des permissions nécessaires.
    </p>

    <h3 style="color:#fbbf24;">
      🛡️ Droits des administrateurs
    </h3>

    <ul style="line-height:1.8;color:#e4e4e7;padding-left:25px;">
      <li>🔇 Mute temporaire d'un membre</li>
      <li>🔊 Retrait d'un mute</li>
      <li>🚫 Bannissement d'un membre</li>
      <li>♻️ Débannissement d'un membre</li>
      <li>👁️ Consultation des informations du compte</li>
      <li>📝 Consultation de l'activité</li>
      <li>🏷️ Gestion du grade et des permissions</li>
      <li>💬 Accès aux messages privés dans le cadre autorisé</li>
    </ul>

    <h3 style="color:#34d399;">
      🔐 Sécurité
    </h3>

    <ul style="line-height:1.8;color:#e4e4e7;padding-left:25px;">
      <li>🔑 Mots de passe stockés sous forme de hash</li>
      <li>🎫 Sessions sécurisées</li>
      <li>🛡️ Permissions vérifiées côté serveur</li>
      <li>🚫 Contrôle des utilisateurs bannis</li>
      <li>🧹 Validation des messages</li>
      <li>🧪 Validation des fichiers envoyés</li>
      <li>🔒 Protection des routes administrateur</li>
      <li>📝 Journalisation des actions sensibles</li>
      <li>🛑 Protection contre l'injection de code</li>
      <li>🧱 Isolation des fonctions sensibles</li>
    </ul>

    <div style="
      margin-top:20px;
      padding:14px;
      background:#27272a;
      border:1px solid #3f3f46;
      border-radius:10px;
      color:#d4d4d8;
      font-size:14px;
      line-height:1.6;
    ">
      ⚠️ <strong style="color:#60a5fa;">Important :</strong>
      Les permissions ne sont jamais contrôlées uniquement dans
      l'interface. Le serveur doit systématiquement vérifier les droits
      de l'utilisateur avant toute action sensible.
    </div>

    <p style="
      color:#a1a1aa;
      font-size:13px;
      line-height:1.5;
      margin-top:18px;
    ">
      Veuillez prendre connaissance de ces informations avant de
      continuer.
    </p>

    <button
      id="closeSecurityPopup"
      disabled
      style="
        width:100%;
        padding:12px;
        margin-top:10px;
        border:0;
        border-radius:10px;
        background:#3f3f46;
        color:#a1a1aa;
        font-size:16px;
        font-weight:bold;
        cursor:not-allowed;
        transition:all .3s ease;
      "
    >
      Veuillez patienter (10s)
    </button>
  \`;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  const button = popup.querySelector("#closeSecurityPopup");

  let secondesRestantes = 10;

  const timer = setInterval(() => {
    secondesRestantes--;

    if (secondesRestantes > 0) {
      button.textContent =
        \`Veuillez patienter (\${secondesRestantes}s)\`;
    } else {
      clearInterval(timer);

      button.disabled = false;
      button.textContent = "J’ai compris";

      button.style.background = "#2563eb";
      button.style.color = "white";
      button.style.cursor = "pointer";

      button.addEventListener("click", () => {
        overlay.remove();
      });
    }
  }, 1000);
})();`,
  },{
    id: "ghosts",
    name: "👻 Invasion de fantômes",
    desc: "Des fantômes traversent l'écran",
    code: `(() => {
  const emojis = ["👻", "👻", "💀", "🎃"];
  const ghosts = [];

  for (let i = 0; i < 20; i++) {
    const el = document.createElement("div");
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    el.style.cssText = \`
      position: fixed;
      left: -80px;
      top: \${Math.random() * 90}vh;
      font-size: \${30 + Math.random() * 35}px;
      z-index: 999999;
      pointer-events: none;
      transition: transform \${4 + Math.random() * 4}s linear;
    \`;

    document.body.appendChild(el);
    ghosts.push(el);

    requestAnimationFrame(() => {
      el.style.transform =
        \`translateX(\${innerWidth + 200}px)\`;
    });

    setTimeout(() => el.remove(), 9000);
  }
})();`,
  },

  {
    id: "terminal",
    name: "🖥️ Faux terminal",
    desc: "Affiche un terminal animé façon hacker",
    code: `(() => {
  document.getElementById("__terminal")?.remove();

  const terminal = document.createElement("div");
  terminal.id = "__terminal";

  terminal.style.cssText = \`
    position: fixed;
    inset: 0;
    background: #050505;
    color: #00ff66;
    z-index: 999999;
    padding: 30px;
    box-sizing: border-box;
    font-family: monospace;
    font-size: 16px;
    overflow: hidden;
  \`;

  terminal.innerHTML = \`
    <div style="color:#fff;margin-bottom:20px;">
      root@admin:~$ security-console
    </div>
    <div id="__terminalText"></div>
    <span style="color:#00ff66;">█</span>
  \`;

  document.body.appendChild(terminal);

  const lines = [
    "[INFO] Initialisation du système...",
    "[OK] Connexion sécurisée",
    "[INFO] Vérification des permissions...",
    "[OK] Permissions administrateur détectées",
    "[INFO] Analyse de la session...",
    "[OK] Session valide",
    "[INFO] Chargement des modules...",
    "[OK] Tous les modules chargés",
    "",
    "root@admin:~$ _"
  ];

  const text = terminal.querySelector("#__terminalText");
  let i = 0;

  const interval = setInterval(() => {
    if (i >= lines.length) {
      clearInterval(interval);
      return;
    }

    const line = document.createElement("div");
    line.textContent = lines[i++];
    text.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }, 500);

  setTimeout(() => {
    clearInterval(interval);
    terminal.remove();
  }, 9000);
})();`,
  },

  {
    id: "aquarium",
    name: "🐠 Aquarium",
    desc: "Transforme l'écran en aquarium animé",
    code: `(() => {
  document.getElementById("__aquarium")?.remove();

  const aquarium = document.createElement("div");
  aquarium.id = "__aquarium";

  aquarium.style.cssText = \`
    position: fixed;
    inset: 0;
    background: linear-gradient(#006994, #001f3f);
    z-index: 999999;
    overflow: hidden;
    pointer-events: none;
  \`;

  aquarium.innerHTML = \`
    <div style="
      position:absolute;
      bottom:0;
      width:100%;
      height:18%;
      background:linear-gradient(#c2b280,#806b3f);
    "></div>
  \`;

  const fish = ["🐠","🐟","🐡","🦈","🐬","🐳"];

  for (let i = 0; i < 18; i++) {
    const el = document.createElement("div");
    el.textContent = fish[Math.floor(Math.random() * fish.length)];

    const size = 25 + Math.random() * 35;
    const duration = 6 + Math.random() * 8;

    el.style.cssText = \`
      position:absolute;
      left:-100px;
      top:\${10 + Math.random() * 70}%;
      font-size:\${size}px;
      transition:transform \${duration}s linear;
    \`;

    aquarium.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform =
        \`translateX(\${innerWidth + 300}px)\`;
    });

    setInterval(() => {
      if (document.body.contains(el)) {
        el.style.top = \`\${10 + Math.random() * 70}%\`;
      }
    }, duration * 1000);
  }

  for (let i = 0; i < 30; i++) {
    const bubble = document.createElement("div");

    bubble.textContent = "○";
    bubble.style.cssText = \`
      position:absolute;
      bottom:-30px;
      left:\${Math.random() * 100}%;
      color:rgba(255,255,255,.6);
      font-size:\${10 + Math.random() * 20}px;
      animation:__bubble \${3 + Math.random() * 5}s linear infinite;
    \`;

    aquarium.appendChild(bubble);
  }

  const style = document.createElement("style");
  style.id = "__aquariumStyle";
  style.textContent = \`
    @keyframes __bubble {
      from { transform:translateY(0); opacity:.7; }
      to { transform:translateY(-110vh); opacity:0; }
    }
  \`;

  document.head.appendChild(style);
  document.body.appendChild(aquarium);

  setTimeout(() => {
    aquarium.remove();
    style.remove();
  }, 12000);
})();`,
  },

  {
    id: "coinflip",
    name: "🪙 Pile ou face",
    desc: "Lance une pièce avec une animation",
    code: `(() => {
  document.getElementById("__coinflip")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "__coinflip";

  overlay.style.cssText = \`
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.85);
    z-index:999999;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    color:white;
    font-family:Arial,sans-serif;
  \`;

  overlay.innerHTML = \`
    <div id="__coin" style="
      width:150px;
      height:150px;
      border-radius:50%;
      background:linear-gradient(135deg,#ffd700,#b8860b);
      border:8px solid #fff3a3;
      display:grid;
      place-items:center;
      font-size:70px;
      box-shadow:0 0 40px rgba(255,215,0,.6);
      transform-style:preserve-3d;
    ">🪙</div>

    <h2 id="__coinResult" style="
      margin-top:30px;
      font-size:30px;
    ">Lancement...</h2>

    <button id="__coinClose" style="
      display:none;
      margin-top:20px;
      padding:12px 25px;
      border:0;
      border-radius:10px;
      background:#2563eb;
      color:white;
      font-weight:bold;
      cursor:pointer;
    ">Fermer</button>
  \`;

  document.body.appendChild(overlay);

  const coin = overlay.querySelector("#__coin");
  const result = overlay.querySelector("#__coinResult");
  const close = overlay.querySelector("#__coinClose");

  const isHeads = Math.random() < 0.5;

  coin.style.transition =
    "transform 2s cubic-bezier(.2,.8,.2,1)";

  requestAnimationFrame(() => {
    coin.style.transform =
      \`rotateY(\${isHeads ? 1800 : 1980}deg) rotateX(10deg)\`;
  });

  setTimeout(() => {
    result.textContent = isHeads ? "🪙 PILE !" : "🪙 FACE !";
    close.style.display = "block";
  }, 2200);

  close.onclick = () => overlay.remove();
})();`,
  },  {
    id: "blackhole",
    name: "🕳️ Trou noir",
    desc: "Effet visuel donnant l'impression que l'écran est aspiré",
    code: `(() => {
  document.getElementById("__blackhole")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "__blackhole";

  overlay.style.cssText = \`
    position:fixed;
    inset:0;
    z-index:999999;
    pointer-events:none;
    overflow:hidden;
    background:radial-gradient(
      circle at center,
      #000 0 7%,
      #241044 9%,
      #000 22%,
      transparent 55%
    );
    animation:__blackholePulse 4s ease-in-out forwards;
  \`;

  const style = document.createElement("style");
  style.id = "__blackholeStyle";
  style.textContent = \`
    @keyframes __blackholePulse {
      0% {
        transform:scale(0);
        opacity:0;
      }
      25% {
        transform:scale(.8);
        opacity:1;
      }
      70% {
        transform:scale(1.15);
        opacity:1;
      }
      100% {
        transform:scale(1.8);
        opacity:0;
      }
    }

    @keyframes __blackholeSpin {
      from { transform:rotate(0deg); }
      to { transform:rotate(360deg); }
    }
  \`;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  for (let i = 0; i < 80; i++) {
    const star = document.createElement("div");

    star.textContent = Math.random() > .7 ? "✦" : "•";

    star.style.cssText = \`
      position:absolute;
      left:\${Math.random()*100}%;
      top:\${Math.random()*100}%;
      color:#fff;
      font-size:\${5+Math.random()*12}px;
      animation:__blackholeSpin \${1+Math.random()*3}s linear infinite;
    \`;

    overlay.appendChild(star);
  }

  setTimeout(() => {
    overlay.remove();
    style.remove();
  }, 4200);
})();`,
  },

  


  {
    id: "bruteforce",
    name: "🔐 Brute Force Simulator",
    desc: "Simulation graphique d'une recherche de caractères",
    code: `(() => {
  document.getElementById("__bruteforce")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "__bruteforce";

  overlay.style.cssText = \`
    position:fixed;
    inset:0;
    z-index:999999;
    background:#030712;
    color:#60a5fa;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    font-family:monospace;
  \`;

  overlay.innerHTML = \`
    <h1 style="color:#fff;">🔐 BRUTE FORCE SIMULATION</h1>

    <div id="__bfValue"
      style="font-size:40px;letter-spacing:8px;margin:25px;">
      XXXXXXXX
    </div>

    <div style="
      width:min(600px,80%);
      height:18px;
      background:#1f2937;
      border-radius:20px;
      overflow:hidden;
    ">
      <div id="__bfBar" style="
        width:0%;
        height:100%;
        background:#3b82f6;
        transition:width .1s;
      "></div>
    </div>

    <p id="__bfStatus">Simulation en cours...</p>
  \`;

  document.body.appendChild(overlay);

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const value = overlay.querySelector("#__bfValue");
  const bar = overlay.querySelector("#__bfBar");
  const status = overlay.querySelector("#__bfStatus");

  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 5;

    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);

      value.textContent = "DEMO_OK";
      status.textContent =
        "Simulation terminée — aucune tentative réelle.";
    } else {
      let fake = "";

      for (let i = 0; i < 8; i++) {
        fake += chars[Math.floor(Math.random()*chars.length)];
      }

      value.textContent = fake;
      status.textContent =
        \`Analyse simulée : \${Math.floor(progress)}%\`;
    }

    bar.style.width = progress + "%";
  }, 150);

  setTimeout(() => {
    clearInterval(interval);
    overlay.remove();
  }, 5500);
})();`,
  },

  {
    id: "satellite",
    name: "📡 Satellite Scan",
    desc: "Radar satellite animé",
    code: `(() => {
  document.getElementById("__satellite")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "__satellite";

  overlay.style.cssText = \`
    position:fixed;
    inset:0;
    z-index:999999;
    background:#020617;
    display:grid;
    place-items:center;
    overflow:hidden;
  \`;

  overlay.innerHTML = \`
    <div style="
      width:min(70vw,500px);
      aspect-ratio:1;
      border:2px solid #22c55e;
      border-radius:50%;
      position:relative;
      background:
        radial-gradient(circle, transparent 0 20%,
        rgba(34,197,94,.15) 21% 22%,
        transparent 23% 40%,
        rgba(34,197,94,.15) 41% 42%,
        transparent 43%);
      box-shadow:0 0 40px rgba(34,197,94,.3);
    ">
      <div style="
        position:absolute;
        width:50%;
        height:2px;
        background:#22c55e;
        top:50%;
        left:50%;
        transform-origin:left center;
        animation:__radarSpin 2s linear infinite;
        box-shadow:0 0 12px #22c55e;
      "></div>

      <div style="
        position:absolute;
        width:12px;
        height:12px;
        border-radius:50%;
        background:#ef4444;
        left:65%;
        top:30%;
        box-shadow:0 0 15px red;
      "></div>

      <div style="
        position:absolute;
        width:10px;
        height:10px;
        border-radius:50%;
        background:#facc15;
        left:25%;
        top:65%;
        box-shadow:0 0 15px #facc15;
      "></div>
    </div>

    <div style="
      position:absolute;
      bottom:30px;
      color:#22c55e;
      font:16px monospace;
    ">
      SATELLITE SCAN // SIGNAL ACTIVE
    </div>
  \`;

  const style = document.createElement("style");
  style.textContent = \`
    @keyframes __radarSpin {
      from { transform:rotate(0deg); }
      to { transform:rotate(360deg); }
    }
  \`;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
    style.remove();
  }, 8000);
})();`,
  },



];

export default function AdminPanel() {
  const socket = useSocket();
  const [tab, setTab] = useState("users");

  const [users, setUsers] = useState([]);
  const [bans, setBans] = useState([]);
  const [convs, setConvs] = useState([]);
  const [unoRooms, setUnoRooms] = useState([]);
  const [chessRooms, setChessRooms] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);

  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const [u, b, c] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/bans"),
        api.get("/admin/conversations"),
      ]);
      setUsers(u.data);
      setBans(b.data);
      setConvs(c.data);
    } catch (e) {
      console.error("[admin] load failed", e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onUno = (list) => setUnoRooms(list);
    const onChess = (list) => setChessRooms(list);
    socket.on("uno:rooms", onUno);
    socket.on("chess:rooms", onChess);
    socket.emit("uno:list");
    socket.emit("chess:list");
    return () => {
      socket.off("uno:rooms", onUno);
      socket.off("chess:rooms", onChess);
    };
  }, [socket]);

  const openConv = async (c) => {
    setSelectedConv(c);
    const { data } = await api.get(
      `/admin/messages/${c.userA.id}/${c.userB.id}`,
    );
    setConvMessages(data);
  };

  const setRole = async (id, role) => {
    await api.put(`/admin/users/${id}/role`, { role });
    load();
  };

  const mute = async (u) => {
    const dur = prompt("Durée en minutes (5, 60, 1440) ou 'perm'", "60");
    if (dur === null) return;
    const durationMinutes =
      dur.toLowerCase() === "perm" ? null : parseInt(dur, 10);
    const reason = prompt("Raison ?", "") || "";
    await api.post(`/admin/mute/${u.id}`, { durationMinutes, reason });
    load();
  };
  const unmute = async (u) => {
    await api.post(`/admin/unmute/${u.id}`);
    load();
  };
  const ban = async (u) => {
    const reason = prompt("Raison ?", "") || "";
    if (!window.confirm(`Bannir ${u.username} ?`)) return;
    await api.post(`/admin/ban/${u.id}`, { reason });
    load();
  };
  const unban = async (u) => {
    await api.post(`/admin/unban/${u.id}`);
    load();
  };
  const del = async (u) => {
    if (!window.confirm(`Supprimer ${u.username} ?`)) return;
    await api.delete(`/admin/users/${u.id}`);
    load();
  };
  const removeBan = async (id) => {
    if (!window.confirm("Retirer ce ban ?")) return;
    await api.delete(`/admin/bans/${id}`);
    load();
  };
  const deleteUnoRoom = async (roomId) => {
    if (!window.confirm("Supprimer ce salon UNO ?")) return;
    await api.delete(`/admin/uno/rooms/${roomId}`);
  };
  const deleteChessGame = async (gameId) => {
    if (!window.confirm("Supprimer cette partie d'échecs ?")) return;
    await api.delete(`/admin/chess/games/${gameId}`);
  };

  const inject = () => {
    if (!socket) return setMsg("❌ Socket non connecté");
    if (!code.trim()) return setMsg("❌ Code vide");
    socket.emit("chat:inject", { code });
    setMsg("✅ Code envoyé à TOUS les clients connectés");
    setTimeout(() => setMsg(""), 4000);
  };

  const applyPreset = (preset) => {
    setCode(preset.code);
    setMsg(`📋 Preset « ${preset.name} » chargé`);
    setTimeout(() => setMsg(""), 2500);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  // 📊 Stats
  const stats = {
    total: users.length,
    online: users.filter((u) => u.online).length,
    admins: users.filter((u) => u.role === "admin").length,
    muted: users.filter((u) => u.muted).length,
    banned: users.filter((u) => u.banned).length,
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>🧑‍💼 Administration</h1>
          <p className="admin-subtitle">
            Gérez les utilisateurs, jeux et injections en direct
          </p>
        </div>
        <Link to="/" className="admin-back">
          ← Retour au chat
        </Link>
      </div>

      {/* 📊 STATS */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Utilisateurs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-value">{stats.online}</div>
          <div className="stat-label">En ligne</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-value">{stats.admins}</div>
          <div className="stat-label">Admins</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-icon">🔇</div>
          <div className="stat-value">{stats.muted}</div>
          <div className="stat-label">Mute</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">🚫</div>
          <div className="stat-value">{stats.banned}</div>
          <div className="stat-label">Bannis</div>
        </div>
      </div>

      {/* 🗂️ TABS */}
      <div className="admin-tabs">
        <button
          className={tab === "users" ? "active" : ""}
          onClick={() => setTab("users")}
        >
          👥 Utilisateurs <span className="tab-count">{users.length}</span>
        </button>
        <button
          className={tab === "inject" ? "active" : ""}
          onClick={() => setTab("inject")}
        >
          🧩 Injection
        </button>
        <button
          className={tab === "messages" ? "active" : ""}
          onClick={() => setTab("messages")}
        >
          💬 Messages privés <span className="tab-count">{convs.length}</span>
        </button>
        <button
          className={tab === "games" ? "active" : ""}
          onClick={() => setTab("games")}
        >
          🎮 Parties{" "}
          <span className="tab-count">
            {unoRooms.length + chessRooms.length}
          </span>
        </button>
        <button
          className={tab === "bans" ? "active" : ""}
          onClick={() => setTab("bans")}
        >
          📋 Bannissements <span className="tab-count">{bans.length}</span>
        </button>
      </div>

      {/* ═══ TAB USERS ═══ */}
      {tab === "users" && (
        <div className="admin-panel">
          <input
            className="admin-search"
            placeholder="🔍 Rechercher un utilisateur (pseudo ou email)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="user-grid">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className={`user-card ${u.banned ? "banned" : ""}`}
              >
                <div className="user-card-header">
                  <div
                    className="user-avatar"
                    style={{ background: colorFromName(u.username) }}
                  >
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="user-meta">
                    <div className="user-name">
                      {u.username}
                      {u.online && <span className="online-badge">●</span>}
                    </div>
                    <div className="user-email">{u.email}</div>
                  </div>
                  <span className={`user-role role-${u.role}`}>{u.role}</span>
                </div>

                <div className="user-scores">
                  <span>
                    🎴 <strong>{u.unoWins || 0}</strong>
                  </span>
                  <span>
                    ♟️ <strong>{u.chessWins || 0}</strong>
                  </span>
                </div>

                <div className="user-status">
                  {u.banned && <span className="badge ban">🚫 Banni</span>}
                  {!u.banned && u.muted && (
                    <span className="badge mute">
                      🔇 Mute{" "}
                      {u.mutedUntil
                        ? `→ ${new Date(u.mutedUntil).toLocaleString()}`
                        : "perm"}
                    </span>
                  )}
                  {!u.banned && !u.muted && (
                    <span className="badge ok">✅ OK</span>
                  )}
                </div>

                <div className="user-actions">
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value)}
                  >
                    <option value="membre">Membre</option>
                    <option value="admin">Admin</option>
                  </select>
                  {!u.muted ? (
                    <button
                      className="btn-sm"
                      onClick={() => mute(u)}
                      title="Mute"
                    >
                      🔇
                    </button>
                  ) : (
                    <button
                      className="btn-sm ok"
                      onClick={() => unmute(u)}
                      title="Unmute"
                    >
                      🔊
                    </button>
                  )}
                  {!u.banned ? (
                    <button
                      className="btn-sm danger"
                      onClick={() => ban(u)}
                      title="Ban"
                    >
                      🚫
                    </button>
                  ) : (
                    <button
                      className="btn-sm ok"
                      onClick={() => unban(u)}
                      title="Unban"
                    >
                      ✅
                    </button>
                  )}
                  <button
                    className="btn-sm danger"
                    onClick={() => del(u)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <p className="admin-empty">Aucun utilisateur trouvé.</p>
          )}
        </div>
      )}

      {/* ═══ TAB INJECT ═══ */}
      {tab === "inject" && (
        <div className="admin-panel">
          <h2>🧩 Presets rapides</h2>
          <p className="admin-hint">
            Clique sur un preset pour le charger dans la zone d'injection
            ci-dessous.
          </p>
          <div className="preset-grid">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className="preset-card"
                onClick={() => applyPreset(p)}
                title={p.desc}
              >
                <div className="preset-name">{p.name}</div>
                <div className="preset-desc">{p.desc}</div>
              </button>
            ))}
          </div>

          <h2>✍️ Zone d'injection</h2>
          <p className="admin-hint">
            Le code JS ci-dessous sera <strong>exécuté immédiatement</strong>{" "}
            chez tous les utilisateurs connectés.
          </p>
          <textarea
            className="inject-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            placeholder="// Colle ton code JavaScript ici (pas de balises <script>)"
            spellCheck={false}
          />
          <div className="inject-actions">
            <button className="btn-inject" onClick={inject}>
              🚀 Injecter à tous les utilisateurs
            </button>
            <button className="btn-clear" onClick={() => setCode("")}>
              🗑️ Effacer
            </button>
          </div>
          {msg && <div className="inject-msg">{msg}</div>}
        </div>
      )}

      {/* ═══ TAB MESSAGES ═══ */}
      {tab === "messages" && (
        <div className="admin-panel">
          <h2>💬 Conversations privées ({convs.length})</h2>
          {convs.length === 0 && (
            <p className="admin-empty">Aucune conversation privée.</p>
          )}
          <div className="conv-list">
            {convs.map((c, i) => (
              <button
                key={i}
                className={`conv-chip ${selectedConv === c ? "active" : ""}`}
                onClick={() => openConv(c)}
              >
                <span
                  className="conv-avatar"
                  style={{ background: colorFromName(c.userA.username) }}
                >
                  {c.userA.username[0].toUpperCase()}
                </span>
                <span>{c.userA.username}</span>
                <span className="conv-arrow">↔</span>
                <span>{c.userB.username}</span>
                <span
                  className="conv-avatar"
                  style={{ background: colorFromName(c.userB.username) }}
                >
                  {c.userB.username[0].toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          {selectedConv && (
            <div className="conv-viewer">
              <div className="conv-header">
                <h3>
                  {selectedConv.userA.username} ↔ {selectedConv.userB.username}
                </h3>
                <button
                  className="btn-close"
                  onClick={() => setSelectedConv(null)}
                >
                  ✕
                </button>
              </div>
              <div className="conv-messages">
                {convMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`conv-msg ${
                      m.sender.id === selectedConv.userA.id
                        ? "from-a"
                        : "from-b"
                    }`}
                  >
                    <div className="conv-msg-head">
                      <strong>{m.sender.username}</strong>
                      <small>{new Date(m.createdAt).toLocaleString()}</small>
                    </div>
                    <div className="conv-msg-body">{m.content}</div>
                  </div>
                ))}
                {convMessages.length === 0 && (
                  <p className="admin-empty">Aucun message.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB GAMES ═══ */}
      {tab === "games" && (
        <div className="admin-panel">
          <h2>🎴 Salons UNO ({unoRooms.length})</h2>
          {unoRooms.length === 0 && (
            <p className="admin-empty">Aucun salon UNO actif.</p>
          )}
          {unoRooms.map((r) => (
            <div key={r.id} className="game-row">
              <div className="game-info">
                <span className="game-icon">🎴</span>
                <div>
                  <div className="game-name">{r.name}</div>
                  <div className="game-meta">
                    {r.players.length}/6 joueurs ·{" "}
                    {r.status === "waiting" ? "En attente" : "En cours"}
                  </div>
                </div>
              </div>
              <button
                className="btn-sm danger"
                onClick={() => deleteUnoRoom(r.id)}
              >
                🗑️ Supprimer
              </button>
            </div>
          ))}

          <h2>♟️ Parties d'échecs ({chessRooms.length})</h2>
          {chessRooms.length === 0 && (
            <p className="admin-empty">Aucune partie d'échecs active.</p>
          )}
          {chessRooms.map((g) => (
            <div key={g.id} className="game-row">
              <div className="game-info">
                <span className="game-icon">♟️</span>
                <div>
                  <div className="game-name">{g.name}</div>
                  <div className="game-meta">
                    {g.white?.username || "?"}{" "}
                    {g.black ? `vs ${g.black.username}` : "(en attente)"} ·{" "}
                    {g.status}
                  </div>
                </div>
              </div>
              <button
                className="btn-sm danger"
                onClick={() => deleteChessGame(g.id)}
              >
                🗑️ Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TAB BANS ═══ */}
      {tab === "bans" && (
        <div className="admin-panel">
          <h2>📋 Bannissements actifs ({bans.length})</h2>
          {bans.length === 0 && <p className="admin-empty">Aucun ban actif.</p>}
          {bans.map((b) => (
            <div key={b.id} className="ban-row">
              <div className="ban-info">
                <div className="ban-email">📧 {b.email || "—"}</div>
                <div className="ban-reason">
                  Raison : {b.reason || "Non spécifiée"}
                </div>
              </div>
              <button className="btn-sm ok" onClick={() => removeBan(b.id)}>
                ✅ Débannir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 🎨 Couleur déterministe depuis un nom
function colorFromName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}
