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

function renderPackages(packages) {
    var packagesContainer = document.getElementById('packagesContainer');
    if (!packagesContainer) return;

    if (!Array.isArray(packages) || packages.length === 0) {
        packagesContainer.innerHTML = '<p style="color: black;">No packages available right now.</p>';
        return;
    }

    var activePackages = packages.filter(function(pkg) {
        return pkg && pkg.active === true;
    });

    var getPackageOrder = function(category) {
        var value = String(category || '').toLowerCase();
        if (value.indexOf('day') !== -1 || value.indexOf('daily') !== -1) return 1;
        if (value.indexOf('week') !== -1 || value.indexOf('weekly') !== -1) return 2;
        if (value.indexOf('month') !== -1 || value.indexOf('monthly') !== -1) return 3;
        return 99;
    };

    activePackages.sort(function(a, b) {
        return getPackageOrder(a.category) - getPackageOrder(b.category);
    });

    if (activePackages.length === 0) {
        packagesContainer.innerHTML = '<p style="color: black;">No active packages available right now.</p>';
        return;
    }

    packagesContainer.innerHTML = activePackages.map(function(pkg) {
        var category = pkg.category || 'Package';
        var amount = String(pkg.amount || '0').replace(/[^0-9]/g, '');
        var duration = pkg.duration || category;
        var datalimit = pkg.datalimit || 'Unlimited';
        var speedlimit = pkg.speedlimit || 'Unlimited';

        return (
            '<p style="margin-bottom: 0; color: black; font-weight: bold;">' + category + '</p>' +
            '<p style="margin-top: 0; display: flex; justify-content: space-between; align-items: center; color: black;">' +
                'shs ' + amount +
                ' <button type="button" class="payMobile" data-amount="' + amount + '" data-duration="' + duration + '" data-datalimit="' + datalimit + '" data-speedlimit="' + speedlimit + '" style="width: 100px;">Pay</button>' +
            '</p>'
        );
    }).join('');
}

async function loadPackages() {
    var packagesContainer = document.getElementById('packagesContainer');
    if (!packagesContainer) return;

    try {
        var response = await fetch('https://backend.tumusiimesadas.com/api/packages');
        if (!response.ok) {
            console.error('Packages API failed:', response.status, response.statusText);
            throw new Error('Unable to load packages right now.');
        }
        var data = await response.json();

        var packages = Array.isArray(data)
            ? data
            : (Array.isArray(data.packages) ? data.packages : (Array.isArray(data.data) ? data.data : []));
        renderPackages(packages);
    } catch (error) {
        packagesContainer.innerHTML = '<p style="color: red;">Failed to load packages: </p>';
        console.error(error);
    }
}

document.addEventListener('click', function(e) {
    var button = e.target.closest('.payMobile');
    if (!button) return;

    var amount = button.getAttribute('data-amount');
    var duration = button.getAttribute('data-duration');
    var datalimit = button.getAttribute('data-datalimit');
    var speedlimit = button.getAttribute('data-speedlimit');
    var url = 'pay.html?amount=' + encodeURIComponent(amount) + '&duration=' + encodeURIComponent(duration) + '&datalimit=' + encodeURIComponent(datalimit) + '&speedlimit=' + encodeURIComponent(speedlimit);
    window.location.href = url;
});

loadPackages();
