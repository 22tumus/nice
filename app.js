document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission
    var voucher = document.getElementById('username').value;
    window.location.href = "http://192.168.88.1/login?username=" + encodeURIComponent(voucher) + "&password=" + encodeURIComponent(voucher);
});