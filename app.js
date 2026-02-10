document.getElementById('loginForm').addEventListener('submit', function(e) {
    // If the payment phone number input exists, this is the payment form.
    // Return early and let pay.js handle the submission.
    if (document.getElementById('phoneNumber')) {
        return;
    }
    e.preventDefault(); // Prevent default form submission
    var voucher = document.getElementById('username').value;
    window.location.href = "http://192.168.88.1/login?username=" + encodeURIComponent(voucher) + "&password=" + encodeURIComponent(voucher);
});

var payButtons = document.querySelectorAll('.payMobile');
payButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        var amount = button.getAttribute('data-amount');
        var duration = button.getAttribute('data-duration');
        var datalimit = button.getAttribute('data-datalimit');
        var speedlimit = button.getAttribute('data-speedlimit');
        var url = 'pay.html?amount=' + encodeURIComponent(amount) + '&duration=' + encodeURIComponent(duration) + '&datalimit=' + encodeURIComponent(datalimit) + '&speedlimit=' + encodeURIComponent(speedlimit);
        window.location.href = url;
    });
});