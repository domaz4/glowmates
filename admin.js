<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Glow Mates — Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css?v=8">
<style>
  .admin-page{min-height:100svh;padding:28px clamp(14px,4vw,40px) 60px}
  .admin-top{display:flex;justify-content:space-between;align-items:center;max-width:900px;margin:0 auto 22px}
  .admin-top a{font:400 1.7rem var(--serif);color:var(--ink);text-decoration:none}
  .admin-top span{font-weight:700;opacity:.6}
  .admin-page .card{margin:0 auto;transform:none}
  .admin-page .card h3{margin-bottom:6px}
  .stock-list{margin-bottom:22px}
  .srow{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border:1.5px solid #e3cdb9;border-radius:14px;padding:12px 16px;margin-bottom:10px}
  .srow.out{border-color:#d62828}
  .srow h4{font:400 1.4rem var(--serif);margin-right:auto}
  .badge.out{background:#d62828;color:#fff}
  .srow output{font:400 1.6rem var(--serif);min-width:2ch;text-align:center}
  .srow .set{display:flex;gap:6px;align-items:center}
  .srow .set input{width:90px;margin:0;padding:6px 10px;border-width:1.5px}
  .hint{background:#f5b9b4;border-radius:10px;padding:10px 14px;font-size:.9rem;margin-bottom:12px}
</style>
</head>
<body>
<div class="admin-page">
  <div class="admin-top"><a href="/">Glow Mates</a><span>Admin</span></div>

  <div class="card" id="loginCard">
    <form id="login">
      <h3>Log in</h3>
      <label>Password<input type="password" id="pw" required autocomplete="current-password"></label>
      <p id="loginErr" class="err" role="alert"></p>
      <button class="btn wide" type="submit">Log in</button>
    </form>
  </div>

  <div class="card wide-card" id="panel" hidden>
    <div class="p-head"><h3>Stock</h3><button id="refresh" class="mini">Refresh</button><button id="logout" class="mini">Log out</button></div>
    <p id="stockHint" class="hint" hidden>Stock isn't set up yet. Run stock.sql once in the Supabase SQL Editor, then press Refresh.</p>
    <div id="stock" class="stock-list"></div>
    <div class="p-head"><h3>Orders</h3></div>
    <div id="orders"></div>
  </div>
</div>
<div class="toast" id="toast" role="status"></div>
<script src="config.js?v=8"></script>
<script src="admin.js?v=9"></script>
</body>
</html>
