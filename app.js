document.getElementById('loginForm').addEventListener('submit', function(e) {
    // e.preventDefault(); // Allow form submission
    var voucher = document.getElementById('username').value;
    document.querySelector('input[name="password"]').value = voucher; // Set password to voucher
    // The form will now submit via POST to the action URL
});