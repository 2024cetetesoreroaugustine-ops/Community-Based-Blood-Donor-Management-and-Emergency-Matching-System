// Master Data Arrays
let sampleDonors = [
    { id: "DON-001", fname: "Juan", mname: "Santos", lname: "Dela Cruz", sex: "Male", bday: "1995-04-12", phone: "09171234567", email: "juan.delacruz@gmail.com", barangay: "Apopong", bloodType: "O+", status: "Verified" },
    { id: "DON-002", fname: "Maria", mname: "Clara", lname: "Lumbera", sex: "Female", bday: "1998-08-23", phone: "09189876543", email: "maria.lumbera@yahoo.com", barangay: "Labangal", bloodType: "A-", status: "Pending Verification" },
    { id: "DON-003", fname: "Rex", mname: "Joshua", lname: "Del Rosario", sex: "Male", bday: "2000-01-15", phone: "09223334444", email: "rex.delrosario@gmail.com", barangay: "Calumpang", bloodType: "B+", status: "Verified" },
    { id: "DON-004", fname: "Petnaryson", mname: "T.", lname: "Vallecera", sex: "Male", bday: "1997-11-30", phone: "09155556666", email: "pet.vallecera@gmail.com", barangay: "Apopong", bloodType: "AB+", status: "Verified" },
    { id: "DON-005", fname: "Augustine Raf", mname: "L.", lname: "Tesorero", sex: "Male", bday: "1999-06-05", phone: "09178889999", email: "raf.tesorero@gmail.com", barangay: "Labangal", bloodType: "O-", status: "Pending Verification" }
];

let sampleRequests = [
    { id: "REQ-101", patient: "Ana Ramirez", qty: 3, date: "2026-08-18", status: "Pending Match", bloodType: "O+", hospital: "Gensan Doctors Hospital" },
    { id: "REQ-102", patient: "Carlos Mendoza", qty: 2, date: "2026-08-17", status: "Fulfilled", bloodType: "A-", hospital: "St. Elizabeth Hospital" },
    { id: "REQ-103", patient: "Elena Torralba", qty: 4, date: "2026-08-16", status: "In Progress", bloodType: "B+", hospital: "General Santos City Hospital" },
    { id: "REQ-104", patient: "Roberto Garcia", qty: 1, date: "2026-08-15", status: "Fulfilled", bloodType: "O-", hospital: "Soccskargen General Hospital" },
    { id: "REQ-105", patient: "Liza Soberano", qty: 2, date: "2026-08-14", status: "Pending Match", bloodType: "AB+", hospital: "Gensan Doctors Hospital" }
];

let sampleDrives = [
    { id: "DRV-01", event: "Apopong Barangay Mass Donation", loc: "Apopong Gym", date: "2026-08-25", barangay: "Apopong", status: "Scheduled" },
    { id: "DRV-02", event: "Labangal Community Blood Drive", loc: "Labangal Health Center", date: "2026-09-02", barangay: "Labangal", status: "Scheduled" },
    { id: "DRV-03", event: "Calumpang Emergency Blood Line", loc: "Calumpang Covered Court", date: "2026-09-10", barangay: "Calumpang", status: "Planning" }
];

let sampleNotifications = [
    { id: "NOTIF-01", message: "Emergency Request REQ-101 requires urgent O+ donor match.", date: "2026-08-18", userId: "USR-004" },
    { id: "NOTIF-02", message: "Barangay Apopong Blood Drive scheduled for Aug 25.", date: "2026-08-17", userId: "USR-001" },
    { id: "NOTIF-03", message: "Donor Profile DON-002 pending CHO verification.", date: "2026-08-16", userId: "USR-002" },
    { id: "NOTIF-04", message: "Blood request REQ-102 status updated to Fulfilled.", date: "2026-08-15", userId: "USR-003" }
];

let currentRole = null;

// Table Rendering Functions
function renderAllTables() {
    renderDonorTable();
    renderRequestTable();
    renderDriveTable();
    renderNotificationTable();
}

function renderDonorTable() {
    const tbody = document.getElementById("donorTableBody");
    if (!tbody) return;
    tbody.innerHTML = sampleDonors.map(d => `
        <tr>
            <td><strong>${d.id}</strong></td>
            <td>${d.fname} ${d.lname}</td>
            <td>${d.sex}</td>
            <td>${d.bday}</td>
            <td>${d.phone}</td>
            <td>${d.email}</td>
            <td>${d.barangay}</td>
            <td><span class="badge badge-blood">${d.bloodType}</span></td>
            <td><span class="badge ${d.status === 'Verified' ? 'badge-fulfilled' : 'badge-pending'}">${d.status}</span></td>
            <td>
                ${currentRole === "1" && d.status !== "Verified" 
                    ? `<button class="btn-action btn-verify" onclick="verifyDonor('${d.id}')">Verify</button>` 
                    : `<span class="text-muted">N/A</span>`}
            </td>
        </tr>
    `).join('');
}

function renderRequestTable() {
    const tbody = document.getElementById("requestTableBody");
    if (!tbody) return;
    tbody.innerHTML = sampleRequests.map(r => {
        let statusClass = "badge-pending";
        if (r.status === "Fulfilled") statusClass = "badge-fulfilled";
        if (r.status === "In Progress") statusClass = "badge-progress";

        let actionCell = `<span class="text-muted">N/A</span>`;

        if (currentRole === "4" && r.status === "Pending Match") {
            actionCell = `
                <button class="btn-action btn-accept" onclick="respondMatch('${r.id}', 'Accepted')">Accept</button>
                <button class="btn-action btn-decline" onclick="respondMatch('${r.id}', 'Declined')">Decline</button>
            `;
        } else if (currentRole === "2" && r.status !== "Fulfilled") {
            actionCell = `<button class="btn-action btn-verify" onclick="confirmDonation('${r.id}')">Confirm Fulfillment</button>`;
        }

        return `
            <tr>
                <td><strong>${r.id}</strong></td>
                <td>${r.patient}</td>
                <td>${r.qty} Bag(s)</td>
                <td>${r.date}</td>
                <td><span class="badge ${statusClass}">${r.status}</span></td>
                <td><span class="badge badge-blood">${r.bloodType}</span></td>
                <td>${r.hospital}</td>
                <td>${actionCell}</td>
            </tr>
        `;
    }).join('');
}

function renderDriveTable() {
    const tbody = document.getElementById("driveTableBody");
    if (!tbody) return;
    tbody.innerHTML = sampleDrives.map(drv => `
        <tr>
            <td><strong>${drv.id}</strong></td>
            <td>${drv.event}</td>
            <td>${drv.loc}</td>
            <td>${drv.date}</td>
            <td>${drv.barangay}</td>
            <td><span class="badge badge-progress">${drv.status}</span></td>
            <td>
                ${currentRole === "4" ? `<button class="btn-action btn-accept" onclick="joinDrive('${drv.id}')">Register</button>` : `<span class="text-muted">N/A</span>`}
            </td>
        </tr>
    `).join('');
}

function renderNotificationTable() {
    const tbody = document.getElementById("notificationTableBody");
    if (!tbody) return;
    tbody.innerHTML = sampleNotifications.map(n => `
        <tr>
            <td><strong>${n.id}</strong></td>
            <td>${n.message}</td>
            <td>${n.date}</td>
            <td>${n.userId}</td>
        </tr>
    `).join('');
}

// Dynamic View Switcher per Role
function applyRoleUseCaseView(roleId, username) {
    currentRole = roleId;

    const cardDonors = document.getElementById("cardDonors");
    const cardRequests = document.getElementById("cardRequests");
    const cardBloodDrives = document.getElementById("cardBloodDrives");
    const cardNotifications = document.getElementById("cardNotifications");
    const toolbar = document.getElementById("roleActionToolbar");
    const roleBadge = document.getElementById("roleBadge");

    cardDonors.style.display = "none";
    cardRequests.style.display = "none";
    cardBloodDrives.style.display = "none";
    cardNotifications.style.display = "none";
    toolbar.innerHTML = "";

    renderAllTables();

    if (roleId === "1") {
        roleBadge.innerText = "CHO Administrator";
        roleBadge.className = "badge badge-role role-admin";

        toolbar.innerHTML = `
            <button class="btn-toolbar" onclick="triggerCreateDrive()">+ Schedule Blood Drive</button>
            <button class="btn-toolbar" onclick="triggerGenerateReport()">📊 Generate Reports</button>
            <button class="btn-toolbar" onclick="triggerUserManagement()">👤 Manage Accounts</button>
        `;

        cardDonors.style.display = "block";
        cardRequests.style.display = "block";
        cardBloodDrives.style.display = "block";
        cardNotifications.style.display = "block";
    } 
    else if (roleId === "2") {
        roleBadge.innerText = "Hospital Staff";
        roleBadge.className = "badge badge-role role-hospital";

        toolbar.innerHTML = `
            <button class="btn-toolbar btn-alert" onclick="triggerEmergencyRequest()">🚨 Submit Emergency Request</button>
            <button class="btn-toolbar" onclick="triggerMatchSearch()">🔍 Search Qualified Donors</button>
        `;

        cardRequests.style.display = "block";
        cardNotifications.style.display = "block";
    } 
    else if (roleId === "3") {
        roleBadge.innerText = "Barangay Health Worker";
        roleBadge.className = "badge badge-role role-bhw";

        toolbar.innerHTML = `
            <button class="btn-toolbar" onclick="openModal('unifiedRegisterModal')">➕ Assist Donor Registration</button>
            <button class="btn-toolbar" onclick="triggerManageBHWDrive()">📅 Coordinate Barangay Blood Drive</button>
        `;

        cardDonors.style.display = "block";
        cardBloodDrives.style.display = "block";
        cardNotifications.style.display = "block";
    } 
    else if (roleId === "4") {
        roleBadge.innerText = "Volunteer Donor";
        roleBadge.className = "badge badge-role role-donor";

        toolbar.innerHTML = `
            <button class="btn-toolbar" onclick="triggerProfileUpdate()">✏️ Update Profile & Availability</button>
        `;

        cardRequests.style.display = "block";
        cardBloodDrives.style.display = "block";
        cardNotifications.style.display = "block";
    }
}

// User Actions
function verifyDonor(donorId) {
    const donor = sampleDonors.find(d => d.id === donorId);
    if (donor) {
        donor.status = "Verified";
        alert(`Donor ${donorId} (${donor.fname} ${donor.lname}) has been successfully VERIFIED.`);
        renderAllTables();
    }
}

function respondMatch(reqId, action) {
    const req = sampleRequests.find(r => r.id === reqId);
    if (req) {
        if (action === 'Accepted') {
            req.status = "In Progress";
            alert(`You have ACCEPTED request ${reqId}. The hospital staff will be notified.`);
        } else {
            alert(`You DECLINED request ${reqId}.`);
        }
        renderAllTables();
    }
}

function confirmDonation(reqId) {
    const req = sampleRequests.find(r => r.id === reqId);
    if (req) {
        req.status = "Fulfilled";
        alert(`Request ${reqId} has been marked as FULFILLED.`);
        renderAllTables();
    }
}

function joinDrive(driveId) {
    alert(`Registration successful! You are signed up for Blood Drive ${driveId}.`);
}

function triggerEmergencyRequest() {
    const patient = prompt("Enter Patient Name:");
    const qty = prompt("Enter Quantity Needed (Bags):");
    const bloodType = prompt("Enter Blood Type Needed (O+, A-, B+, etc.):");

    if (patient && qty && bloodType) {
        const newReq = {
            id: `REQ-${100 + sampleRequests.length + 1}`,
            patient: patient,
            qty: parseInt(qty),
            date: new Date().toISOString().split('T')[0],
            status: "Pending Match",
            bloodType: bloodType.toUpperCase(),
            hospital: "City Hospital Facility"
        };
        sampleRequests.unshift(newReq);
        alert(`Emergency Request ${newReq.id} created successfully!`);
        renderAllTables();
    }
}

function triggerCreateDrive() {
    const eventName = prompt("Enter Blood Drive Event Name:");
    const loc = prompt("Enter Event Location:");
    const barangay = prompt("Enter Barangay Name:");

    if (eventName && loc && barangay) {
        const newDrive = {
            id: `DRV-0${sampleDrives.length + 1}`,
            event: eventName,
            loc: loc,
            date: new Date().toISOString().split('T')[0],
            barangay: barangay,
            status: "Scheduled"
        };
        sampleDrives.unshift(newDrive);
        alert(`Blood Drive ${newDrive.id} scheduled successfully!`);
        renderAllTables();
    }
}

function triggerGenerateReport() {
    alert("CHO System Report: Total Donors = " + sampleDonors.length + " | Active Emergency Requests = " + sampleRequests.filter(r => r.status !== 'Fulfilled').length);
}

function triggerUserManagement() {
    alert("Opening CHO User Management Panel...");
}

function triggerMatchSearch() {
    alert("Running emergency matching algorithm based on Blood Type and Barangay Proximity...");
}

function triggerManageBHWDrive() {
    alert("Opening Barangay Blood Drive Management Portal...");
}

function triggerProfileUpdate() {
    alert("Opening Profile Update window...");
}

// Authentication
function handleLogin(event) {
    event.preventDefault();
    const roleSelect = document.getElementById('loginRole');
    const roleId = roleSelect.value;
    const roleText = roleSelect.options[roleSelect.selectedIndex].text;
    const username = document.getElementById('loginUsername').value;

    closeModal('loginModal');
    document.getElementById('landingCards').style.display = "none";
    document.getElementById('dashboardSection').style.display = "block";
    document.getElementById('welcomeUserMsg').innerText = `Welcome, ${username}`;

    applyRoleUseCaseView(roleId, username);
    event.target.reset();
}

function handleLogout() {
    document.getElementById('dashboardSection').style.display = "none";
    document.getElementById('landingCards').style.display = "flex";
    currentRole = null;
}

// Modals
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const unifiedModal = document.getElementById('unifiedRegisterModal');
    if (event.target === loginModal) loginModal.style.display = "none";
    if (event.target === unifiedModal) unifiedModal.style.display = "none";
};

function toggleRoleFields() {
    const selectedRole = document.getElementById('userRoleSelect').value;

    document.getElementById('donorFields').style.display = "none";
    document.getElementById('hospitalFields').style.display = "none";
    document.getElementById('bhwFields').style.display = "none";
    document.getElementById('choFields').style.display = "none";

    if (selectedRole === "4") document.getElementById('donorFields').style.display = "block";
    else if (selectedRole === "2") document.getElementById('hospitalFields').style.display = "block";
    else if (selectedRole === "3") document.getElementById('bhwFields').style.display = "block";
    else if (selectedRole === "1") document.getElementById('choFields').style.display = "block";
}

function handleUnifiedRegister(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value;
    alert(`Registration Successful!\nAccount created for: ${username}`);
    closeModal('unifiedRegisterModal');
    event.target.reset();
    toggleRoleFields();
}