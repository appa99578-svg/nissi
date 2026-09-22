/* CHITTI/J.A.R.V.I.S EP06 — real browser tool layer.
 * Isolated from the original AI script. It intercepts tool-like commands before Gemini.
 */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const chat = () => $("chat");
  const input = () => $("msg");
  const status = () => $("tool-status");
  let timerId = null;
  let timerEnd = 0;
  let stopwatchStart = null;
  let stopwatchId = null;

  function add(text, type = "ai") {
    const c = chat();
    if (!c) return;
    const div = document.createElement("div");
    div.className = "msg " + type;
    div.textContent = text;
    c.appendChild(div);
    c.scrollTop = c.scrollHeight;
  }

  function setStatus(value, cls = "") {
    const s = status();
    if (!s) return;
    s.textContent = value;
    s.className = "tool-ready " + cls;
  }

  function result(text, error = false) {
    // Do not pretend a tool succeeded. Every tool returns either a real result or an error.
    add("J.A.R.V.I.S: " + text, "ai");
    const old = document.querySelector(".tool-result");
    if (old) old.remove();
    const panel = $("ep06-tools");
    if (panel) {
      const box = document.createElement("div");
      box.className = "tool-result" + (error ? " error" : "");
      box.textContent = text;
      panel.appendChild(box);
    }
  }

  function openUrl(url, label) {
    // A real browser navigation/open action. If a new tab is blocked, the link remains visible.
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = label;
    a.style.display = "none";
    document.body.appendChild(a);
    try { a.click(); } catch {}
    setTimeout(() => a.remove(), 1000);
    return label + ". If your browser blocked the new tab, use the link shown below.";
  }

  function showLink(url, label) {
    const c = chat();
    if (!c) return;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Open: " + label;
    a.className = "ep06-link";
    c.appendChild(a);
    c.scrollTop = c.scrollHeight;
  }

  function weatherLocation(text) {
    return text
      .replace(/\b(weather|temperature|temp)\b/gi, "")
      .replace(/\b(in|at|for)\b/gi, " ")
      .replace(/\b(cheppu|cheppava|chuddam|choodu|kavali|please)\b/gi, " ")
      .replace(/\s+/g, " ").trim();
  }

  async function weather(raw) {
    let place = weatherLocation(raw);
    if (!place || /^(current|now|here|location)$/i.test(place)) {
      if (!navigator.geolocation) throw new Error("Current location is not available. Say a city name, e.g. Hyderabad weather.");
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 }));
      return weatherByCoords(pos.coords.latitude, pos.coords.longitude, "Current location");
    }
    const geo = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(place) + "&count=1&language=en&format=json");
    if (!geo.ok) throw new Error("Weather location lookup failed.");
    const gd = await geo.json();
    const g = gd.results?.[0];
    if (!g) throw new Error("Location not found: " + place);
    return weatherByCoords(g.latitude, g.longitude, [g.name, g.country].filter(Boolean).join(", "));
  }

  async function weatherByCoords(lat, lon, label) {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`);
    if (!r.ok) throw new Error("Weather service failed.");
    const d = await r.json(), c = d.current;
    const codes = {0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Dense drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",71:"Light snow",73:"Snow",75:"Heavy snow",80:"Rain showers",81:"Rain showers",82:"Heavy rain showers",95:"Thunderstorm"};
    return `${label}: ${c.temperature_2m}°C, feels like ${c.apparent_temperature}°C, humidity ${c.relative_humidity_2m}%, wind ${c.wind_speed_10m} km/h, ${codes[c.weather_code] || "Unknown"}.`;
  }

  function timer(raw) {
    // Supports: timer 10 minutes, 10 minutes timer pettu, 10 min timer, 10 nimishala timer pettu.
    const m = raw.match(/(\d+(?:\.\d+)?)\s*(seconds?|secs?|sec|minutes?|mins?|min|hours?|hrs?|hour|minutes?\s*nimish(?:am|alu)?|nimish(?:am|alu)?)/i);
    if (!m) throw new Error("Timer duration ardham kaaledu. Example: 10 minutes timer pettu.");
    const n = parseFloat(m[1]);
    const u = m[2].toLowerCase();
    const ms = u.includes("hour") || u.includes("hr") ? n * 3600000 : u.includes("min") || u.includes("nimish") ? n * 60000 : n * 1000;
    if (ms <= 0) throw new Error("Timer duration must be greater than zero.");
    if (timerId) clearTimeout(timerId);
    timerEnd = Date.now() + ms;
    timerId = setTimeout(() => {
      timerId = null; timerEnd = 0;
      add("J.A.R.V.I.S: Timer finished.", "ai");
      try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance("Timer finished.")); } catch {}
    }, ms);
    return `Timer started for ${n} ${u}.`;
  }

  function stopwatch(raw) {
    if (/\b(stop|reset|aapu|apey|apandi)\b/i.test(raw)) {
      if (stopwatchId) clearInterval(stopwatchId);
      stopwatchId = null; stopwatchStart = null;
      return "Stopwatch stopped and reset.";
    }
    if (!stopwatchStart) {
      stopwatchStart = Date.now();
      if (stopwatchId) clearInterval(stopwatchId);
      stopwatchId = setInterval(() => {
        const s = document.querySelector("#ep06-tools .tool-result");
        if (s) {
          const sec = Math.floor((Date.now() - stopwatchStart) / 1000);
          s.textContent = `Stopwatch: ${Math.floor(sec / 60)}m ${sec % 60}s`;
        }
      }, 1000);
      return "Stopwatch started.";
    }
    const sec = Math.floor((Date.now() - stopwatchStart) / 1000);
    return `Stopwatch elapsed: ${Math.floor(sec / 60)}m ${sec % 60}s.`;
  }

  function calculator(raw) {
    let e = raw.replace(/\b(calculate|calculator|calc)\b/gi, "").replace(/\b(what is|what's|entha|calculate)\b/gi, "").trim();
    if (!e) throw new Error("Give a calculation, e.g. 27 + 68.");
    if (!/^[0-9+\-*/().%\s^]+$/.test(e)) throw new Error("Calculator accepts numbers and + - * / % ^ only.");
    e = e.replace(/\^/g, "**");
    const value = Function('"use strict"; return (' + e + ')')();
    if (!Number.isFinite(value)) throw new Error("Calculation is not finite.");
    return `${e} = ${value}`;
  }

  function datetime() { return new Date().toLocaleString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric", hour:"numeric", minute:"2-digit", second:"2-digit" }); }
  function dateOnly() { return new Date().toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric" }); }

  async function crypto(raw) {
    const coin = (raw.match(/bitcoin|btc|ethereum|eth|solana|sol|dogecoin|doge/i)?.[0] || "bitcoin").toLowerCase();
    const ids = { btc:"bitcoin",bitcoin:"bitcoin",eth:"ethereum",ethereum:"ethereum",sol:"solana",solana:"solana",doge:"dogecoin",dogecoin:"dogecoin" };
    const id = ids[coin] || coin;
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=" + encodeURIComponent(id) + "&vs_currencies=usd,inr");
    if (!r.ok) throw new Error("Crypto service failed or rate limit reached.");
    const d = await r.json();
    if (!d[id]) throw new Error("Coin not found.");
    return `${id}: $${d[id].usd} | ₹${d[id].inr}`;
  }

  const currencyNames = { dollar:"USD", dollars:"USD", usd:"USD", rupee:"INR", rupees:"INR", rs:"INR", inr:"INR", euro:"EUR", euros:"EUR", eur:"EUR", pound:"GBP", pounds:"GBP", gbp:"GBP", yen:"JPY", jpy:"JPY" };
  async function exchange(raw) {
    const cleaned = raw.toLowerCase();
    let from, to, amount = 1;
    const num = cleaned.match(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$)/);
    if (num) amount = Number(num[1]);
    const codes = [...cleaned.matchAll(/\b[a-z]{3}\b/g)].map(x => x[0].toUpperCase()).filter(x => /^[A-Z]{3}$/.test(x));
    if (codes.length >= 2) { from = codes[0]; to = codes[1]; }
    if (!from || !to) {
      for (const [name, code] of Object.entries(currencyNames)) {
        if (new RegExp(`\\b${name}\\b`, "i").test(cleaned)) { if (!from) from = code; else if (!to && code !== from) to = code; }
      }
    }
    if (!from || !to) throw new Error("Currency pair ardham kaaledu. Example: 100 USD to INR.");
    const r = await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    if (!r.ok) throw new Error("Currency service failed.");
    const d = await r.json();
    const rate = d.rates?.[to];
    if (typeof rate !== "number") throw new Error(`Currency pair ${from} to ${to} is not available.`);
    return `${amount} ${from} = ${(amount * rate).toFixed(2)} ${to}.`;
  }

  function news(raw) {
    const q = raw.replace(/\b(news|latest|today|cheppu|cheppu ra|kavali)\b/gi, "").trim() || "latest news";
    const url = "https://news.google.com/search?q=" + encodeURIComponent(q);
    const msg = openUrl(url, `Google News search opened for ${q}`);
    showLink(url, `Google News: ${q}`);
    return msg;
  }
  function web(raw) {
    const q = raw.replace(/\b(web search|search|google|cheppu|kavali)\b/gi, "").trim();
    if (!q) throw new Error("Search query kavali.");
    const url = "https://www.google.com/search?q=" + encodeURIComponent(q);
    const msg = openUrl(url, `Web search opened for ${q}`);
    showLink(url, `Google: ${q}`);
    return msg;
  }
  function songs(raw) {
    const q = raw.replace(/\b(play|songs?|music|youtube|paatu|paatalu|vinu|pettu)\b/gi, "").trim() || "music";
    const url = "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
    const msg = openUrl(url, `YouTube results opened for ${q}`);
    showLink(url, `YouTube: ${q}`);
    return msg;
  }
  function maps(raw) {
    const q = raw.replace(/\b(maps?|navigate|directions|route|vellali|ki|from|to)\b/gi, " ").replace(/\s+/g, " ").trim();
    if (!q) throw new Error("Map destination kavali. Example: maps Hyderabad to Vijayawada.");
    const url = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q);
    const msg = openUrl(url, `Google Maps opened for ${q}`);
    showLink(url, `Maps: ${q}`);
    return msg;
  }
  function wiki(raw) {
    const q = raw.replace(/\b(wikipedia|wiki|search|cheppu)\b/gi, "").trim();
    if (!q) throw new Error("Wikipedia topic kavali.");
    const url = "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(q);
    const msg = openUrl(url, `Wikipedia search opened for ${q}`);
    showLink(url, `Wikipedia: ${q}`);
    return msg;
  }
  function random(raw) {
    const m = raw.match(/(\d+)\s*(?:to|-|nundi)\s*(\d+)/i);
    if (!m) return `Random number: ${Math.floor(Math.random() * 100) + 1}`;
    const a = Number(m[1]), b = Number(m[2]);
    if (a > b) throw new Error("Start number must be less than end number.");
    return `Random number: ${Math.floor(Math.random() * (b - a + 1)) + a}`;
  }

  const unitNames = { kilometers:"km", kilometer:"km", km:"km", miles:"mi", mile:"mi", mi:"mi", meters:"m", meter:"m", m:"m", centimeters:"cm", centimeter:"cm", cm:"cm", millimeters:"mm", millimeter:"mm", mm:"mm", feet:"ft", foot:"ft", ft:"ft", inches:"in", inch:"in", in:"in", kilograms:"kg", kilogram:"kg", kg:"kg", grams:"g", gram:"g", g:"g", pounds:"lb", pound:"lb", lb:"lb", celsius:"c", celcius:"c", c:"c", fahrenheit:"f", f:"f" };
  function convert(raw) {
    const words = raw.toLowerCase().replace(/\b(convert|conversion|change|cheyyi|cheppu|lo|ki|into)\b/g, " ").replace(/\s+/g, " ").trim();
    const m = words.match(/(-?\d+(?:\.\d+)?)\s*([a-z]+)\s+(?:to|in|into)\s+([a-z]+)/i);
    if (!m) throw new Error("Conversion ardham kaaledu. Example: 10 km to miles.");
    const v = Number(m[1]), a = unitNames[m[2]], b = unitNames[m[3]];
    if (!a || !b) throw new Error("Unknown unit. Try km, miles, kg, lb, C or F.");
    const length = { mm:.001,cm:.01,m:1,km:1000,in:.0254,ft:.3048,mi:1609.344 };
    const mass = { g:.001,kg:1,lb:.45359237 };
    if (a in length && b in length) return `${v} ${a} = ${(v * length[a] / length[b]).toFixed(4).replace(/\.0000$/, "")} ${b}`;
    if (a in mass && b in mass) return `${v} ${a} = ${(v * mass[a] / mass[b]).toFixed(4).replace(/\.0000$/, "")} ${b}`;
    if (a === "c" && b === "f") return `${v} C = ${(v * 9 / 5 + 32).toFixed(2)} F`;
    if (a === "f" && b === "c") return `${v} F = ${((v - 32) * 5 / 9).toFixed(2)} C`;
    throw new Error("Incompatible units.");
  }

  function parseCommand(raw) {
    const t = raw.trim();
    const l = t.toLowerCase();
    if (!t) return null;
    if (/\b(weather|temperature|temp|weather report)\b/i.test(t)) return ["weather", t];
    if (/\b(timer|timer pettu|timer petu|timer set|set timer|minutes? timer|seconds? timer|nimish[a-z]* timer)\b/i.test(t) || /\d+(?:\.\d+)?\s*(?:min(?:ute)?s?|sec(?:ond)?s?|hours?|hrs?|nimish[a-z]*)\b/i.test(t)) return ["timer", t];
    if (/\b(stopwatch|stop watch)\b/i.test(t)) return ["stopwatch", t];
    if (/\b(calculate|calculator|calc|plus|minus|multiplied|divided)\b/i.test(t) && /\d/.test(t)) return ["calculator", t];
    if (/\b(date\s*(and|&)\s*time|what time|time now|current time)\b/i.test(t)) return ["datetime", t];
    if (/\b(today.?s date|what date|current date|date today)\b/i.test(t)) return ["date", t];
    if (/\b(crypto|bitcoin|btc|ethereum|eth|solana|dogecoin|doge)\b/i.test(t)) return ["crypto", t];
    if (/\b(exchange|currency|convert currency|forex)\b/i.test(t) || /\b(?:usd|inr|eur|gbp|jpy|dollar|dollars|rupee|rupees|euro|euros|pound|pounds)\b.*\b(?:to|in|into)\b.*\b(?:usd|inr|eur|gbp|jpy|dollar|dollars|rupee|rupees|euro|euros|pound|pounds)\b/i.test(t)) return ["exchange", t];
    if (/\b(news|latest news|breaking news|today.?s news)\b/i.test(t)) return ["news", t];
    if (/\b(web search|search google|google search|search for)\b/i.test(t)) return ["web", t];
    if (/\b(play|youtube|song|songs|music|paata|paatalu)\b/i.test(t)) return ["songs", t];
    if (/\b(maps?|navigate|navigation|directions|route|vellali)\b/i.test(t)) return ["maps", t];
    if (/\b(wiki|wikipedia)\b/i.test(t)) return ["wiki", t];
    if (/\b(random number|random)\b/i.test(t)) return ["random", t];
    if (/\b(convert|conversion)\b/i.test(t) && /\d/.test(t)) return ["convert", t];
    return null;
  }

  async function run(name, arg = "") {
    setStatus("RUNNING", "busy");
    try {
      let out;
      switch (name) {
        case "weather": out = await weather(arg); break;
        case "timer": out = timer(arg); break;
        case "stopwatch": out = stopwatch(arg); break;
        case "calculator": out = calculator(arg); break;
        case "datetime": out = datetime(); break;
        case "date": out = dateOnly(); break;
        case "crypto": out = await crypto(arg); break;
        case "exchange": out = await exchange(arg); break;
        case "news": out = news(arg); break;
        case "web": out = web(arg); break;
        case "songs": out = songs(arg); break;
        case "maps": out = maps(arg); break;
        case "wiki": out = wiki(arg); break;
        case "random": out = random(arg); break;
        case "convert": out = convert(arg); break;
        default: throw new Error("Unknown EP06 tool.");
      }
      setStatus("VERIFIED");
      result(out, false);
      return true;
    } catch (e) {
      setStatus("ERROR", "error");
      result(e?.message || String(e), true);
      return true;
    } finally {
      setTimeout(() => setStatus("READY"), 2500);
    }
  }

  function intercept(event) {
    if (event.type === "keydown" && event.key !== "Enter") return;
    const el = input();
    if (!el) return;
    const raw = el.value.trim();
    const parsed = parseCommand(raw);
    if (!parsed) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    el.value = "";
    add("YOU: " + raw, "user");
    run(parsed[0], parsed[1]);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-tool]").forEach(btn => {
      btn.addEventListener("click", () => {
        const tool = btn.dataset.tool;
        let arg = "";
        if (tool === "weather") arg = prompt("City (leave blank for current location):") || "current location";
        else if (tool === "timer") arg = prompt("Duration, e.g. 10 minutes:") || "";
        else if (["crypto","news","web","songs","maps","wiki"].includes(tool)) arg = prompt("Enter request:") || "";
        else if (tool === "calculator") arg = prompt("Calculation, e.g. 25*4:") || "";
        else if (tool === "exchange") arg = prompt("Currency pair, e.g. 100 USD to INR:") || "";
        else if (tool === "random") arg = prompt("Range, e.g. 1 to 100 (blank = 1-100):") || "";
        else if (tool === "convert") arg = prompt("Conversion, e.g. 10 km to miles:") || "";
        run(tool, arg);
      });
    });
    document.addEventListener("click", intercept, true);
    document.addEventListener("keydown", intercept, true);
  });
})();
