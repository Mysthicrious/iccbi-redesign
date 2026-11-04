<?php
function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

// Put this at the very top of dashboard.php (and every protected page).
function require_login(): void {
    start_session();
    if (empty($_SESSION['user'])) {
        header('Location: login.php');
        exit;
    }
}
