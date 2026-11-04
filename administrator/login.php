<?php
require __DIR__ . '/includes/auth.php';
require __DIR__ . '/includes/config.php';
start_session();

if (!empty($_SESSION['user'])) { header('Location: dashboard.php'); exit; }

if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));

$error = '';
$email = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!hash_equals($_SESSION['csrf'], $_POST['csrf'] ?? '')) {
        $error = 'Your session expired. Please try again.';
    } elseif (($_SESSION['lock_until'] ?? 0) > time()) {
        $error = 'Too many attempts. Please wait a minute and try again.';
    } elseif ($email === '' || $password === '') {
        $error = 'Enter your email and password.';
    } else {
        try {
            $st = db()->prepare('SELECT id, name, email, password_hash FROM admin_users WHERE email = ? AND active = 1 LIMIT 1');
            $st->execute([$email]);
            $u = $st->fetch();
            // Same message for wrong email or wrong password
            if ($u && password_verify($password, $u['password_hash'])) {
                session_regenerate_id(true);
                $_SESSION['user'] = ['id' => $u['id'], 'name' => $u['name'], 'email' => $u['email']];
                unset($_SESSION['fails'], $_SESSION['lock_until']);
                header('Location: dashboard.php');
                exit;
            }
            $_SESSION['fails'] = ($_SESSION['fails'] ?? 0) + 1;
            if ($_SESSION['fails'] >= 5) { $_SESSION['lock_until'] = time() + 60; $_SESSION['fails'] = 0; }
            $error = 'Incorrect email or password.';
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $error = 'Sign-in is unavailable right now. Please contact IT.';
        }
    }
}
$h = fn($s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Log in · ICCBI Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
<style>
:root{--blue:#1f5eff;--blue-d:#1747c4;--ink:#0f1b3d;--soft:#667292;--line:#e3e8f3;--field:#f4f6fb;--bad:#b42318;--badbg:#fde4e1}
*{box-sizing:border-box;margin:0}
body{min-height:100vh;font:15px/1.5 Inter,system-ui,sans-serif;color:var(--ink);background:#fff;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:16px;padding:16px}
button,input{font:inherit;color:inherit}
:focus-visible{outline:2px solid var(--blue);outline-offset:2px}

/* left */
.left{display:grid;place-items:center;padding:24px}
.box{width:100%;max-width:420px}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:56px;font:600 15px Sora}
.logo{width:38px;height:38px;border-radius:50%;background:var(--blue);color:#fff;display:grid;place-items:center;font:700 12px Sora}
h1{font:600 28px/1.2 Sora;letter-spacing:-.02em}
.sub{color:var(--soft);margin:8px 0 28px}
.err{background:var(--badbg);color:var(--bad);border-radius:12px;padding:10px 14px;font-size:14px;margin-bottom:16px}
.field{position:relative;margin-bottom:14px}
.field>svg{position:absolute;left:16px;top:15px;width:20px;height:20px;color:var(--soft);fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.field input{width:100%;height:50px;border:1px solid transparent;background:var(--field);border-radius:14px;padding:0 48px 0 46px}
.field input:focus{background:#fff;border-color:var(--blue);outline:0}
.eye{position:absolute;right:8px;top:7px;width:36px;height:36px;border:0;background:none;border-radius:10px;color:var(--soft);cursor:pointer;display:grid;place-items:center}
.eye svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.forgot{display:block;text-align:right;color:var(--blue);font-weight:600;font-size:14px;text-decoration:none;margin:2px 0 22px}
.btn{width:100%;height:50px;border:0;border-radius:14px;background:var(--blue);color:#fff;font-weight:600;cursor:pointer}
.btn:hover{background:var(--blue-d)}
.note{text-align:center;color:var(--soft);font-size:13px;margin-top:28px}

/* right */
.right{position:relative;overflow:hidden;border-radius:24px;background:var(--blue);color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:44px;min-height:calc(100vh - 32px)}
.hex{position:absolute;background:rgba(255,255,255,.09);clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)}
.h1{width:110px;height:100px;top:-14px;left:-24px}.h2{width:150px;height:134px;top:-30px;right:-36px}
.h3{width:70px;height:62px;top:150px;left:34px}.h4{width:200px;height:178px;bottom:-60px;right:-50px}.h5{width:120px;height:106px;bottom:60px;left:-30px}
.stage{position:relative;flex:1;display:grid;place-items:center;margin-bottom:24px}
.mock{width:min(100%,440px);background:#fff;color:var(--ink);border-radius:16px;padding:16px;box-shadow:0 24px 60px rgba(8,30,110,.35);display:grid;grid-template-columns:54px 1fr;gap:14px}
.m-side{background:#12285e;border-radius:10px;display:grid;align-content:start;gap:8px;padding:10px 8px}
.m-side i{height:22px;border-radius:7px;background:rgba(255,255,255,.18)}.m-side i:first-child{background:#fff}
.m-main b{font:600 13px Sora;display:block;margin-bottom:8px}
.m-row{display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:11px;color:var(--soft)}
.m-row span{flex:1}.m-row em{font-style:normal;background:#e2f5e8;color:#17803d;border-radius:99px;padding:1px 8px;font-size:10px}
.m-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:12px}
.m-cal i{aspect-ratio:1;border-radius:5px;background:#eef2fb}.m-cal i.on{background:var(--blue)}.m-cal i.dot{background:#f2b632}
.float{position:absolute;left:0;bottom:-6px;background:#fff;color:var(--ink);border-radius:14px;padding:12px 16px;box-shadow:0 14px 34px rgba(8,30,110,.3);font-size:12px}
.float b{display:block;font:600 13px Sora}.float span{color:var(--soft)}
.tag{position:relative;text-align:center}
.tag h2{font:600 26px/1.25 Sora;letter-spacing:-.01em;max-width:18ch;margin:0 auto}
.tag p{opacity:.85;margin-top:8px;font-size:14px}

@media (max-width:900px){
  body{grid-template-columns:1fr;padding:0}
  .right{display:none}
  .brand{margin-bottom:36px}
}
</style>
</head>
<body>

<main class="left">
  <div class="box">
    <div class="brand"><div class="logo">ICC</div>ICCBI Admin</div>

    <h1>Log in to your account.</h1>
    <p class="sub">Enter your email address and password to log in.</p>

    <?php if ($error): ?><div class="err" role="alert"><?= $h($error) ?></div><?php endif; ?>

    <form method="post" autocomplete="on" novalidate>
      <input type="hidden" name="csrf" value="<?= $h($_SESSION['csrf']) ?>">

      <div class="field">
        <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 8l8 6 8-6"/></svg>
        <input type="email" name="email" placeholder="Email address" value="<?= $h($email) ?>" required autocomplete="username" aria-label="Email address" autofocus>
      </div>

      <div class="field">
        <svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
        <input type="password" name="password" id="pw" placeholder="Password" required autocomplete="current-password" aria-label="Password">
        <button type="button" class="eye" id="eye" aria-label="Show password">
          <svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>

      <a class="forgot" href="mailto:mail@iccbalayan.edu.ph?subject=Admin%20password%20reset">Forgot password?</a>
      <button class="btn" type="submit">Log in</button>
    </form>

    <p class="note">Accounts are created by the school IT office.</p>
  </div>
</main>

<aside class="right" aria-hidden="true">
  <span class="hex h1"></span><span class="hex h2"></span><span class="hex h3"></span><span class="hex h4"></span><span class="hex h5"></span>
  <div class="stage">
    <div class="mock">
      <div class="m-side"><i></i><i></i><i></i></div>
      <div class="m-main">
        <b>Activity log</b>
        <div class="m-row"><span>Registrar · Updated enrollment</span><em>Completed</em></div>
        <div class="m-row"><span>Guidance · Event submitted</span><em>Completed</em></div>
        <div class="m-cal"><i></i><i></i><i class="dot"></i><i></i><i class="on"></i><i></i><i></i><i></i><i></i><i></i><i class="dot"></i><i></i><i></i><i></i></div>
      </div>
    </div>
    <div class="float"><b>News Desk</b><span>Post to the school page</span></div>
  </div>
  <div class="tag">
    <h2>The easiest way to manage ICC news.</h2>
    <p>Announcements and the school calendar, all in one place.</p>
  </div>
</aside>

<script>
(function(){
  var pw=document.getElementById('pw'), eye=document.getElementById('eye');
  eye.addEventListener('click',function(){
    var show=pw.type==='password';
    pw.type=show?'text':'password';
    eye.setAttribute('aria-label',show?'Hide password':'Show password');
  });
})();
</script>
</body>
</html>
