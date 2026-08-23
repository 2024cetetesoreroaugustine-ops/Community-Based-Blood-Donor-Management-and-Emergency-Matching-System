// DATABASE SYSTEM STATE
const state = {
    currentRole: "1",
    currentUser: "admin",
    currentDonorUsername: null,
    latestRequestBloodTypeId: null,
    latestRequestBarangayId: null,

    accounts: [
        { UserID: 1, Username: "admin", Password: "123", ROLES_RoleID: "1", roleName: "City Health Office Admin", active: true },
        { UserID: 2, Username: "staff", Password: "123", ROLES_RoleID: "2", roleName: "Hospital Staff", active: true },
        { UserID: 3, Username: "bhw", Password: "123", ROLES_RoleID: "3", roleName: "Barangay Health Worker", active: true }
    ],

    donors: [],
    requests: [],
    drives: [],
    notifications: [],
    donations: [],
    donorMatches: [],
    donorVerifications: [],
    driveParticipation: []
};

const bloodTypeMap = { "1": "A+", "2": "A-", "3": "B+", "4": "B-", "5": "O+", "6": "O-", "7": "AB+", "8": "AB-" };
const barangayMap = { "1": "Apopong", "2": "Baluan", "3": "Bula", "4": "Calumpang", "5": "City Heights", "6": "Labangal", "7": "Lagao", "8": "San Isidro" };

const ICONS = {
    home: '<svg class="icon" viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5M5.5 10v9A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-9"/></svg>',
    donors: '<svg class="icon" viewBox="0 0 24 24"><path d="M8 2.5h8a1 1 0 0 1 1 1V5H7V3.5a1 1 0 0 1 1-1Z"/><rect x="5" y="5" width="14" height="16.5" rx="2"/><path d="M9 11h6M9 14.5h6M9 18h4"/></svg>',
    requests: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 3.5 2 20.5h20L12 3.5Z"/><path d="M12 10v4.2M12 17.2h.01"/></svg>',
    matched: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
    drives: '<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9.5h16M8 3v3.5M16 3v3.5"/></svg>',
    users: '<svg class="icon" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.7-3.4 3-5.3 5.5-5.3s4.8 1.9 5.5 5.3"/><circle cx="17" cy="8.5" r="2.6"/><path d="M15.5 14.9c2.2.3 3.9 2.1 4.5 5.1"/></svg>',
    reports: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M20 20H4"/></svg>',
    profile: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c1-4.2 3.8-6.5 7.5-6.5s6.5 2.3 7.5 6.5"/></svg>'
};

document.addEventListener("DOMContentLoaded", () => { initEvents(); });

function initEvents() {
    document.getElementById("linkOpenStaffRegister")?.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("staffRegisterModal").style.display = "flex";
    });

    document.getElementById("initialLoginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const role = document.getElementById("initialLoginRole").value;
        const user = document.getElementById("initialLoginUsername").value;
        const pass = document.getElementById("initialLoginPassword").value;

        const match = state.accounts.find(a => a.Username === user && a.Password === pass && a.ROLES_RoleID === role);

        if (!match) { alert("Invalid Credentials! Check username, password, or role."); return; }
        if (match.active === false) { alert("This account has been deactivated."); return; }

        state.currentRole = role;
        state.currentUser = match.Username;
        state.currentDonorUsername = (role === "4") ? user : null;

        document.getElementById("loginViewSection").style.display = "none";
        document.getElementById("mainDashboardView").style.display = "block";

        renderHeaderAndMenu();
        switchView("viewHome");
    });

    document.getElementById("btnLogoutNav").addEventListener("click", () => {
        document.getElementById("mainDashboardView").style.display = "none";
        document.getElementById("loginViewSection").style.display = "flex";
        document.getElementById("initialLoginForm").reset();
    });

    document.querySelectorAll(".close-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const modalId = btn.getAttribute("data-close");
            document.getElementById(modalId).style.display = "none";
        });
    });

    document.getElementById("btnBhwRegisterDonor")?.addEventListener("click", () => {
        document.getElementById("bhwDonorRegisterModal").style.display = "flex";
    });

    document.getElementById("btnReqModuleAdd")?.addEventListener("click", () => {
        document.getElementById("requestModal").style.display = "flex";
    });

    document.getElementById("btnDriveModuleAdd")?.addEventListener("click", () => {
        document.getElementById("driveModal").style.display = "flex";
    });

    document.getElementById("formStaffRegister").addEventListener("submit", handleStaffRegister);
    document.getElementById("formBhwRegisterDonor").addEventListener("submit", handleBhwRegister);
    document.getElementById("formEmergencyRequest").addEventListener("submit", handleEmergencyRequest);
    document.getElementById("formBloodDrive").addEventListener("submit", handleBloodDrive);
    document.getElementById("formEditUser").addEventListener("submit", handleEditUser);
    document.getElementById("formUpdateProfile")?.addEventListener("submit", handleUpdateProfile);

    document.getElementById("filterSameBarangay")?.addEventListener("change", renderMatchedDonorsTable);
}

function toggleRoleFormFields() {
    const role = document.getElementById("staffRegRole").value;
    document.getElementById("choFieldsGroup").style.display = (role === "1") ? "block" : "none";
    document.getElementById("hospitalFieldsGroup").style.display = (role === "2") ? "block" : "none";
    document.getElementById("bhwFieldsGroup").style.display = (role === "3") ? "block" : "none";
    document.getElementById("donorFieldsGroup").style.display = (role === "4") ? "block" : "none";
}

function handleStaffRegister(e) {
    e.preventDefault();
    const roleVal = document.getElementById("staffRegRole").value;
    const userVal = document.getElementById("staffRegUser").value;
    const passVal = document.getElementById("staffRegPass").value;

    const newUserId = state.accounts.length + 1;
    const roleNames = { "1": "CHO Admin", "2": "Hospital Staff", "3": "BHW", "4": "Volunteer Blood Donor" };

    if (roleVal === "4") {
        const donorObj = {
            donor_id: state.donors.length + 10,
            FIR_name: document.getElementById("selfDonorFirName").value,
            MID_NAME: document.getElementById("selfDonorMidName").value,
            LST_name: document.getElementById("selfDonorLstName").value,
            SEX: document.getElementById("selfDonorSex").value,
            BTH_DTE: document.getElementById("selfDonorBth").value,
            phone_number: document.getElementById("selfDonorPhone").value,
            email: document.getElementById("selfDonorEmail").value,
            ADD: document.getElementById("selfDonorAdd").value,
            AVB_STU: "Available",
            RGS_DTE: new Date().toISOString().split('T')[0],
            USERS_UserID: newUserId,
            BARANGAY_BarangayID: document.getElementById("selfDonorBarangay").value,
            BLOOD_TYPE_BloodTypeID: document.getElementById("selfDonorBloodType").value,
            verificationStatus: "Pending Verification",
            username: userVal
        };
        state.donors.push(donorObj);
    }

    state.accounts.push({ UserID: newUserId, Username: userVal, Password: passVal, ROLES_RoleID: roleVal, roleName: roleNames[roleVal], active: true });
    alert(`Account created successfully for ${userVal}!`);
    document.getElementById("staffRegisterModal").style.display = "none";
    document.getElementById("formStaffRegister").reset();
    renderUsersTable();
}

function renderHeaderAndMenu() {
    const roleBadge = document.getElementById("roleBadge");
    const welcomeMsg = document.getElementById("welcomeUserMsg");
    const sidebar = document.getElementById("sidebarMenu");

    let roleName = "", badgeClass = "";
    sidebar.innerHTML = "";

    const addMenuItem = (iconKey, label, viewId) => {
        const li = document.createElement("li");
        li.innerHTML = `${ICONS[iconKey] || ""}<span>${label}</span>`;
        li.dataset.viewId = viewId;
        li.onclick = () => {
            switchView(viewId);
            sidebar.querySelectorAll("li").forEach(item => item.classList.remove("active"));
            li.classList.add("active");
        };
        sidebar.appendChild(li);
    };

    addMenuItem("home", "Dashboard Home", "viewHome");

    if (state.currentRole === "1") {
        roleName = "CHO Admin"; badgeClass = "role-admin";
        addMenuItem("donors", "Verify Donor Records", "viewDonors");
        addMenuItem("requests", "View Emergency Requests", "viewRequests");
        addMenuItem("matched", "Matched Donors List", "viewMatchedDonors");
        addMenuItem("drives", "Manage Blood Drives", "viewDrives");
        addMenuItem("users", "Manage User Accounts", "viewUsers");
        addMenuItem("reports", "Generate Reports", "viewReports");
    } else if (state.currentRole === "2") {
        roleName = "Hospital Staff"; badgeClass = "role-hospital";
        addMenuItem("requests", "Emergency Requests", "viewRequests");
        addMenuItem("matched", "Matched Qualified Donors", "viewMatchedDonors");
    } else if (state.currentRole === "3") {
        roleName = "BHW"; badgeClass = "role-bhw";
        addMenuItem("donors", "Donor Status & Register", "viewDonors");
        addMenuItem("drives", "Blood Drive Schedule", "viewDrives");
    } else if (state.currentRole === "4") {
        roleName = "Volunteer Donor"; badgeClass = "role-donor";
        addMenuItem("profile", "My Profile & Alerts", "viewMyProfile");
        addMenuItem("drives", "Blood Drive Schedule", "viewDrives");
    }

    sidebar.querySelector("li")?.classList.add("active");
    roleBadge.className = `badge badge-role ${badgeClass}`;
    roleBadge.innerText = roleName;
    welcomeMsg.innerText = `Logged in: ${state.currentUser}`;
}

function switchView(viewId) {
    document.querySelectorAll(".module-view").forEach(v => v.style.display = "none");
    document.getElementById(viewId).style.display = "block";

    if (viewId === "viewDonors") renderDonorsTable();
    if (viewId === "viewRequests") renderRequestsTable();
    if (viewId === "viewMatchedDonors") renderMatchedDonorsTable();
    if (viewId === "viewDrives") renderDrivesTable();
    if (viewId === "viewUsers") renderUsersTable();
    if (viewId === "viewMyProfile") renderMyProfile();

    document.getElementById("btnBhwRegisterDonor").style.display = (state.currentRole === "3") ? "inline-flex" : "none";
    document.getElementById("btnReqModuleAdd").style.display = (state.currentRole === "2") ? "inline-flex" : "none";
    document.getElementById("btnDriveModuleAdd").style.display = (state.currentRole === "1" || state.currentRole === "3") ? "inline-flex" : "none";
}

function handleBhwRegister(e) {
    e.preventDefault();
    const newUserId = state.accounts.length + 1;
    const newDonorId = state.donors.length + 10;
    const username = document.getElementById("regDonorUsername").value;
    const pass = document.getElementById("regDonorPassword").value;

    const donor = {
        donor_id: newDonorId,
        FIR_name: document.getElementById("regFirstName").value,
        MID_NAME: document.getElementById("regMiddleName").value,
        LST_name: document.getElementById("regLastName").value,
        SEX: document.getElementById("regSex").value,
        BTH_DTE: document.getElementById("regBirthDate").value,
        phone_number: document.getElementById("regPhone").value,
        email: document.getElementById("regEmail").value,
        ADD: document.getElementById("regAdd").value,
        AVB_STU: "Available",
        RGS_DTE: new Date().toISOString().split('T')[0],
        USERS_UserID: newUserId,
        BARANGAY_BarangayID: document.getElementById("regBarangay").value,
        BLOOD_TYPE_BloodTypeID: document.getElementById("regBloodType").value,
        verificationStatus: "Pending Verification",
        username: username
    };

    state.donors.push(donor);
    state.accounts.push({ UserID: newUserId, Username: username, Password: pass, ROLES_RoleID: "4", roleName: "Volunteer Blood Donor", active: true });

    alert(`Donor Registered! Status: Pending Verification by City Health Office.`);
    document.getElementById("bhwDonorRegisterModal").style.display = "none";
    document.getElementById("formBhwRegisterDonor").reset();
    renderDonorsTable();
}

function handleEmergencyRequest(e) {
    e.preventDefault();
    const newReqId = state.requests.length + 100;
    const bloodTypeId = document.getElementById("reqBloodType").value;
    const barangayField = document.getElementById("reqBarangay");
    const barangayId = barangayField ? barangayField.value : "0";

    const req = {
        REQ_id: newReqId,
        patient_name: document.getElementById("reqPatient").value,
        QTY_NDD: document.getElementById("reqQty").value,
        REQ_DTE: document.getElementById("reqDate").value,
        REQ_STU: "Matching Active",
        BLOOD_TYPE_BloodTypeID: bloodTypeId,
        BARANGAY_BarangayID: barangayId,
        Hospital_STF_Hospital_id: 501
    };

    state.requests.push(req);
    state.latestRequestBloodTypeId = bloodTypeId;
    state.latestRequestBarangayId = (barangayId && barangayId !== "0") ? barangayId : null;

    alert(`Emergency Request Created for ${bloodTypeMap[bloodTypeId]}!`);
    document.getElementById("requestModal").style.display = "none";
    document.getElementById("formEmergencyRequest").reset();
    switchView("viewMatchedDonors");
}

function handleBloodDrive(e) {
    e.preventDefault();
    const drive = {
        Blood_Drive_id: state.drives.length + 300,
        EVT_name: document.getElementById("driveEvent").value,
        LOC: document.getElementById("driveVenue").value,
        SHD: document.getElementById("driveDate").value,
        BARANGAY_BarangayID: document.getElementById("driveBarangay").value
    };

    state.drives.push(drive);
    alert("Blood Drive Schedule Created!");
    document.getElementById("driveModal").style.display = "none";
    document.getElementById("formBloodDrive").reset();
    renderDrivesTable();
}

function renderDonorsTable() {
    const tbody = document.getElementById("donorTableBody");
    tbody.innerHTML = "";

    if (state.donors.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="11">No donor records found.</td></tr>`;
        return;
    }

    state.donors.forEach(d => {
        let actionBtn = "";
        if (state.currentRole === "1" && d.verificationStatus === "Pending Verification") {
            actionBtn = `<button onclick="verifyDonor(${d.donor_id})" class="btn-icon-sm btn-verify">
                <svg class="icon" viewBox="0 0 24 24" width="13" height="13" stroke="white"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg>
                Verify Donor
            </button>`;
        } else {
            const cls = d.verificationStatus === 'Verified' ? 'verified' : 'pending';
            actionBtn = `<span class="status-pill ${cls}">${d.verificationStatus}</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${d.donor_id}</td><td>${d.FIR_name}</td><td>${d.LST_name}</td><td>${d.SEX}</td>
                <td>${d.phone_number}</td><td>${d.email}</td><td>${barangayMap[d.BARANGAY_BarangayID] || 'Barangay ' + d.BARANGAY_BarangayID}</td>
                <td><span class="blood-type-tag">${bloodTypeMap[d.BLOOD_TYPE_BloodTypeID]}</span></td>
                <td><span class="badge ${d.verificationStatus === 'Verified' ? 'role-donor' : 'role-bhw'}">${d.verificationStatus}</span></td>
                <td>${d.AVB_STU}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
}

function verifyDonor(id) {
    const donor = state.donors.find(d => d.donor_id === id);
    if (donor) {
        donor.verificationStatus = "Verified";

        const admin = state.accounts.find(a => a.Username === state.currentUser);
        state.donorVerifications.push({
            VerificationID: state.donorVerifications.length + 1,
            VerificationStatus: "Verified",
            VerificationDate: new Date().toISOString().split('T')[0],
            CIT_Health_OFF_ADM_admin_id: admin ? admin.UserID : null,
            Volunteer_Blood_donor_donor_id: id
        });

        alert(`Donor ID: ${id} verification status updated to VERIFIED.`);
        renderDonorsTable();
    }
}

function renderRequestsTable() {
    const tbody = document.getElementById("requestTableBody");
    const container = document.getElementById("viewRequests");
    tbody.innerHTML = "";

    let hospNotifHTML = "";
    if (state.currentRole === "2") {
        const staffNotifs = state.notifications.filter(n => n.targetRole === "Hospital Staff");
        if (staffNotifs.length > 0) {
            hospNotifHTML = `
                <div style="margin-bottom: 20px;">
                    <h3 style="color:var(--teal); margin-bottom:10px; font-size:0.95rem; display:flex; align-items:center; gap:8px;">
                        <svg class="icon" viewBox="0 0 24 24" width="17" height="17"><path d="M18 8a6 6 0 0 0-12 0c0 5.5-2 7-2 7h16s-2-1.5-2-7"/><path d="M10.5 19a1.7 1.7 0 0 0 3 0"/></svg>
                        Hospital Notifications & System Alerts
                    </h3>
                    ${staffNotifs.map(n => `
                        <div class="notice ${n.status === 'No Match Found' ? 'notice-warning' : 'notice-success'}">
                            <svg class="icon" viewBox="0 0 24 24"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg>
                            <div>
                                <strong>${n.status === 'No Match Found' ? 'SYSTEM ALERT' : 'MATCH CONFIRMED'}:</strong> ${n.Message}
                                <small>Date: ${n.SentDate}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    let existingNotifBox = document.getElementById("hospNotifBox");
    if (!existingNotifBox) {
        existingNotifBox = document.createElement("div");
        existingNotifBox.id = "hospNotifBox";
        container.insertBefore(existingNotifBox, container.firstChild);
    }
    existingNotifBox.innerHTML = hospNotifHTML;

    if (state.requests.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">No emergency requests available.</td></tr>`;
    } else {
        state.requests.forEach(r => {
            const barangayLabel = (r.BARANGAY_BarangayID && r.BARANGAY_BarangayID !== "0")
                ? (barangayMap[r.BARANGAY_BarangayID] || 'Barangay ' + r.BARANGAY_BarangayID)
                : 'Any Barangay';
            tbody.innerHTML += `
                <tr>
                    <td>${r.REQ_id}</td><td>${r.patient_name}</td><td>${r.Hospital_STF_Hospital_id}</td>
                    <td><span class="blood-type-tag">${bloodTypeMap[r.BLOOD_TYPE_BloodTypeID]}</span></td>
                    <td>${barangayLabel}</td>
                    <td>${r.QTY_NDD} Bag(s)</td>
                    <td>${r.REQ_DTE}</td><td><span class="badge role-admin">${r.REQ_STU}</span></td>
                </tr>
            `;
        });
    }

    const donationCard = document.getElementById("donationConfirmCard");
    const pendingBody = document.getElementById("pendingDonationsBody");
    if (donationCard && pendingBody) {
        if (state.currentRole === "2") {
            donationCard.style.display = "block";
            const pending = state.donations.filter(dn => dn.status === "Pending Confirmation");
            if (pending.length === 0) {
                pendingBody.innerHTML = `<tr class="empty-row"><td colspan="7">No donations awaiting confirmation.</td></tr>`;
            } else {
                pendingBody.innerHTML = "";
                pending.forEach(dn => {
                    const donor = state.donors.find(d => d.donor_id === dn.donor_id);
                    pendingBody.innerHTML += `
                        <tr>
                            <td>${dn.donation_id}</td>
                            <td>${donor ? donor.FIR_name + ' ' + donor.LST_name : 'Unknown Donor'}</td>
                            <td>${donor ? `<span class="blood-type-tag">${bloodTypeMap[donor.BLOOD_TYPE_BloodTypeID]}</span>` : '-'}</td>
                            <td>${dn.REQ_id || '-'}</td>
                            <td>${dn.date}</td>
                            <td><span class="status-pill pending">${dn.status}</span></td>
                            <td>
                                <button onclick="confirmDonation(${dn.donation_id})" class="btn-icon-sm btn-confirm">
                                    <svg class="icon" viewBox="0 0 24 24" width="13" height="13" stroke="white"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg>
                                    Confirm Donation
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }
        } else {
            donationCard.style.display = "none";
        }
    }
}

// SYSTEM ENGINE MATCHING & DECISION NODE IMPLEMENTATION
function renderMatchedDonorsTable() {
    const tbody = document.getElementById("matchedDonorTableBody");
    const tag = document.getElementById("matchedFilterTag");
    const barangayFilterBox = document.getElementById("filterSameBarangay");
    tbody.innerHTML = "";

    let matched = state.donors.filter(d => d.verificationStatus === "Verified" && d.AVB_STU === "Available");
    let tagText = "All Active Verified & Available Donors";

    if (state.latestRequestBloodTypeId) {
        matched = matched.filter(d => d.BLOOD_TYPE_BloodTypeID === state.latestRequestBloodTypeId);
        tagText = `Filtered Blood Type: ${bloodTypeMap[state.latestRequestBloodTypeId]}`;
    }

    const useBarangayFilter = barangayFilterBox && barangayFilterBox.checked && state.latestRequestBarangayId;
    if (useBarangayFilter) {
        matched = matched.filter(d => d.BARANGAY_BarangayID === state.latestRequestBarangayId);
        tagText += ` · Same Barangay: ${barangayMap[state.latestRequestBarangayId]}`;
    } else if (state.latestRequestBarangayId) {
        tagText += ` · Preferred Barangay: ${barangayMap[state.latestRequestBarangayId]}`;
    }

    if (tag) tag.innerText = tagText;

    // ACTIVITY DIAGRAM: Decision Node [No Match] -> Send No Match Alert to Hospital Staff
    if (matched.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">No matched donors found. Check if donors are verified by CHO Admin.</td></tr>`;
        
        if (state.latestRequestBloodTypeId) {
            const latestReq = state.requests[state.requests.length - 1];
            const hasExistingNoMatchAlert = state.notifications.some(n => 
                n.status === "No Match Found" && n.Message.includes(`Request #${latestReq ? latestReq.REQ_id : ''}`)
            );

            if (!hasExistingNoMatchAlert && latestReq) {
                state.notifications.push({
                    NotificationID: state.notifications.length + 1000,
                    targetUser: "Hospital Staff",
                    targetRole: "Hospital Staff",
                    Message: `SYSTEM ALERT: No matching verified and available donors found for Emergency Request #${latestReq.REQ_id} (${bloodTypeMap[latestReq.BLOOD_TYPE_BloodTypeID]}).`,
                    SentDate: new Date().toISOString().split('T')[0],
                    status: "No Match Found"
                });
            }
        }
        return;
    }

    matched.forEach(d => {
        let actionBtn = "";
        if (state.currentRole === "2") {
            actionBtn = `<button onclick="sendNotificationToDonor(${d.donor_id}, '${d.username}', '${d.FIR_name}')" class="btn-icon-sm btn-dispatch">
                <svg class="icon" viewBox="0 0 24 24" width="13" height="13" stroke="white"><path d="M21 5 10.5 15.5M21 5l-7 16-3.5-7.5L3 10.5 21 5Z"/></svg>
                Dispatch Alert
            </button>`;
        } else {
            actionBtn = `<span class="status-pill verified">Qualified</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${d.donor_id}</td><td>${d.FIR_name} ${d.LST_name}</td><td>${d.SEX}</td>
                <td><span class="blood-type-tag">${bloodTypeMap[d.BLOOD_TYPE_BloodTypeID]}</span></td>
                <td>${barangayMap[d.BARANGAY_BarangayID] || 'Barangay ' + d.BARANGAY_BarangayID}</td>
                <td>${d.phone_number}</td><td>${d.AVB_STU}</td><td>${actionBtn}</td>
            </tr>
        `;
    });
}

function sendNotificationToDonor(donorId, donorUsername, donorName) {
    const latestReq = state.requests[state.requests.length - 1];
    if (!latestReq) return;

    state.notifications.push({
        NotificationID: state.notifications.length + 1000,
        targetUser: donorUsername,
        targetRole: "Volunteer Blood Donor",
        Message: `EMERGENCY ALERT: Patient ${latestReq.patient_name} requires ${bloodTypeMap[latestReq.BLOOD_TYPE_BloodTypeID]} blood urgently.`,
        SentDate: new Date().toISOString().split('T')[0],
        status: "Pending Response"
    });

    state.donorMatches.push({
        Match_id: state.donorMatches.length + 1,
        RSO: "Pending",
        RSO_DTE: null,
        donation_STU: "Pending",
        EMG_Blood_REQ_REQ_id: latestReq.REQ_id,
        Volunteer_Blood_donor_donor_id: donorId
    });

    alert(`Emergency notification sent to donor: ${donorName}!`);
}

function renderMyProfile() {
    const notifContainer = document.getElementById("donorNotificationsContainer");
    const profileContainer = document.getElementById("myProfileContent");

    const myNotifs = state.notifications.filter(n => n.targetUser === state.currentUser);

    if (myNotifs.length === 0) {
        notifContainer.innerHTML = `<p style="color:var(--ink-faint);">No pending emergency blood requests right now.</p>`;
    } else {
        notifContainer.innerHTML = "";
        myNotifs.forEach(n => {
            notifContainer.innerHTML += `
                <div class="notice notice-warning" style="flex-direction:column; align-items:stretch;">
                    <div style="display:flex; gap:10px; align-items:flex-start;">
                        <svg class="icon" viewBox="0 0 24 24"><path d="M12 3.5 2 20.5h20L12 3.5Z"/><path d="M12 10v4.2M12 17.2h.01"/></svg>
                        <div>
                            <strong>Emergency Request Alert ID: ${n.NotificationID}</strong>
                            <p style="margin-top:4px;">${n.Message}</p>
                            <p style="margin-top:6px;"><strong>Date Sent:</strong> ${n.SentDate} &nbsp;|&nbsp; <strong>Status:</strong> <span class="badge role-bhw">${n.status}</span></p>
                        </div>
                    </div>
                    ${n.status === 'Pending Response' ? `
                        <div style="margin-top:12px; display:flex; gap:10px;">
                            <button onclick="respondToRequest(${n.NotificationID}, 'Accepted')" class="btn-icon-sm btn-accept">
                                <svg class="icon" viewBox="0 0 24 24" width="13" height="13" stroke="white"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg>
                                Accept Request
                            </button>
                            <button onclick="respondToRequest(${n.NotificationID}, 'Declined')" class="btn-icon-sm btn-decline">
                                <svg class="icon" viewBox="0 0 24 24" width="13" height="13" stroke="white"><path d="M6 6l12 12M18 6 6 18"/></svg>
                                Decline Request
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    const myData = state.donors.find(d => d.username === state.currentUser);
    if (!myData) {
        profileContainer.innerHTML = `<p style="color:var(--ink-faint);">No active donor record connected to this username.</p>`;
        return;
    }

    const statusCls = myData.verificationStatus === 'Verified' ? 'verified' : 'pending';

    const myParticipation = state.driveParticipation.filter(p => p.Volunteer_Blood_donor_donor_id === myData.donor_id);
    let participationHTML = `<p style="color:var(--ink-faint); margin-top:14px; font-size:0.85rem;">You haven't joined any blood drives yet.</p>`;
    if (myParticipation.length > 0) {
        participationHTML = `<div style="margin-top:16px; display:flex; flex-direction:column; gap:8px;">` +
            myParticipation.map(p => {
                const drive = state.drives.find(dr => dr.Blood_Drive_id === p.Blood_Drive_id);
                return `<div class="profile-detail" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>${drive ? drive.EVT_name : 'Unknown Drive'} ${drive ? '(' + drive.SHD + ')' : ''}</span>
                    <span class="status-pill verified">${p.ParticipationStatus}</span>
                </div>`;
            }).join('') +
            `</div>`;
    }

    profileContainer.innerHTML = `
        <div class="profile-detail-grid">
            <div class="profile-detail"><div class="label">Donor ID</div><div class="value">${myData.donor_id}</div></div>
            <div class="profile-detail"><div class="label">Full Name</div><div class="value">${myData.FIR_name} ${myData.LST_name}</div></div>
            <div class="profile-detail"><div class="label">Blood Type</div><div class="value"><span class="blood-type-tag">${bloodTypeMap[myData.BLOOD_TYPE_BloodTypeID]}</span></div></div>
            <div class="profile-detail"><div class="label">Verification Status</div><div class="value"><span class="status-pill ${statusCls}">${myData.verificationStatus}</span></div></div>
            <div class="profile-detail"><div class="label">Availability Status</div><div class="value">${myData.AVB_STU}</div></div>
            <div class="profile-detail"><div class="label">Barangay</div><div class="value">${barangayMap[myData.BARANGAY_BarangayID] || 'Barangay ' + myData.BARANGAY_BarangayID}</div></div>
        </div>
        <div style="margin-top:15px;">
            <button onclick="openUpdateProfileModal()" class="btn-icon-sm btn-edit">Update Profile Details</button>
        </div>
        <h4 style="margin-top:20px; font-size:0.85rem; color:var(--ink-soft); text-transform:uppercase; letter-spacing:0.04em;">My Blood Drive Participation</h4>
        ${participationHTML}
    `;
}

function respondToRequest(notifId, choice) {
    const notif = state.notifications.find(n => n.NotificationID === notifId);
    if (notif) {
        notif.status = choice;

        const donor = state.donors.find(d => d.username === state.currentUser);

        const matchRecord = [...state.donorMatches].reverse().find(m =>
            donor && m.Volunteer_Blood_donor_donor_id === donor.donor_id && m.RSO === "Pending"
        );

        if (donor && choice === "Accepted") {
            donor.AVB_STU = "Reserved / Donating";

            if (matchRecord) {
                matchRecord.RSO = "Accepted";
                matchRecord.RSO_DTE = new Date().toISOString().split('T')[0];
                matchRecord.donation_STU = "Pending Confirmation";
            }

            state.donations.push({
                donation_id: state.donations.length + 1,
                donor_id: donor.donor_id,
                REQ_id: matchRecord ? matchRecord.EMG_Blood_REQ_REQ_id : null,
                date: new Date().toISOString().split('T')[0],
                status: "Pending Confirmation"
            });

            state.notifications.push({
                NotificationID: state.notifications.length + 1000,
                targetUser: "Hospital Staff",
                targetRole: "Hospital Staff",
                Message: `Donor ${donor.FIR_name} ${donor.LST_name} (${bloodTypeMap[donor.BLOOD_TYPE_BloodTypeID]}) has ACCEPTED the emergency blood request! Contact: ${donor.phone_number}`,
                SentDate: new Date().toISOString().split('T')[0],
                status: "Accepted Alert"
            });

            alert(`Thank you! Response submitted as ACCEPTED. Hospital Staff will confirm your donation once completed.`);
        } else {
            if (matchRecord) {
                matchRecord.RSO = "Declined";
                matchRecord.RSO_DTE = new Date().toISOString().split('T')[0];
                matchRecord.donation_STU = "Declined";
            }
            alert(`Response submitted as DECLINED.`);
        }

        renderMyProfile();
    }
}

function confirmDonation(donationId) {
    const donation = state.donations.find(dn => dn.donation_id === donationId);
    if (!donation) return;

    donation.status = "Confirmed";

    const donor = state.donors.find(d => d.donor_id === donation.donor_id);
    if (donor) {
        donor.AVB_STU = "Available";
    }

    const matchRecord = state.donorMatches.find(m =>
        m.Volunteer_Blood_donor_donor_id === donation.donor_id &&
        m.EMG_Blood_REQ_REQ_id === donation.REQ_id
    );
    if (matchRecord) matchRecord.donation_STU = "Completed";

    alert(`Donation #${donationId} confirmed. Donor availability has been updated.`);
    renderRequestsTable();
}

function joinBloodDrive(driveId) {
    const donor = state.donors.find(d => d.username === state.currentUser);
    if (!donor) {
        alert("No donor record connected to this account.");
        return;
    }

    const alreadyJoined = state.driveParticipation.find(p =>
        p.Blood_Drive_id === driveId && p.Volunteer_Blood_donor_donor_id === donor.donor_id
    );
    if (alreadyJoined) {
        alert("You already joined this blood drive.");
        return;
    }

    state.driveParticipation.push({
        ParticipationID: state.driveParticipation.length + 1,
        ParticipationStatus: "Registered",
        Blood_Drive_id: driveId,
        Volunteer_Blood_donor_donor_id: donor.donor_id
    });

    alert("You're registered for this blood drive!");
    renderDrivesTable();
}

function renderDrivesTable() {
    const tbody = document.getElementById("driveTableBody");
    tbody.innerHTML = "";
    if (state.drives.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No scheduled blood drives.</td></tr>`;
        return;
    }

    const donor = state.currentRole === "4" ? state.donors.find(d => d.username === state.currentUser) : null;

    state.drives.forEach(drv => {
        const participantCount = state.driveParticipation.filter(p => p.Blood_Drive_id === drv.Blood_Drive_id).length;
        let actionCell = `<span class="joined-tag">${participantCount} joined</span>`;

        if (state.currentRole === "4" && donor) {
            const joined = state.driveParticipation.find(p =>
                p.Blood_Drive_id === drv.Blood_Drive_id && p.Volunteer_Blood_donor_donor_id === donor.donor_id
            );
            actionCell = joined
                ? `<span class="status-pill verified">Joined</span>`
                : `<button onclick="joinBloodDrive(${drv.Blood_Drive_id})" class="btn-icon-sm btn-join">
                        <svg class="icon" viewBox="0 0 24 24" width="13" height="13" stroke="white"><path d="M12 5v14M5 12h14"/></svg>
                        Join Drive
                   </button>`;
        }

        tbody.innerHTML += `<tr>
            <td>${drv.Blood_Drive_id}</td><td>${drv.EVT_name}</td><td>${drv.LOC}</td><td>${drv.SHD}</td>
            <td>${barangayMap[drv.BARANGAY_BarangayID] || 'Barangay ' + drv.BARANGAY_BarangayID}</td>
            <td>${actionCell}</td>
        </tr>`;
    });
}

function renderUsersTable() {
    const tbody = document.getElementById("userAccountTableBody");
    tbody.innerHTML = "";

    state.accounts.forEach(acc => {
        const isActive = acc.active !== false;
        const isSelf = acc.Username === state.currentUser;
        const statusPill = `<span class="status-pill ${isActive ? 'active' : 'inactive'}">${isActive ? 'Active' : 'Deactivated'}</span>`;

        let actions = `<button onclick="openEditUser(${acc.UserID})" class="btn-icon-sm btn-edit">
            <svg class="icon" viewBox="0 0 24 24" width="13" height="13" stroke="white"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/></svg>
            Edit
        </button>`;

        if (!isSelf) {
            actions += ` <button onclick="toggleUserStatus(${acc.UserID})" class="btn-icon-sm ${isActive ? 'btn-toggle-off' : 'btn-toggle-on'}">
                <svg class="icon" viewBox="0 0 24 24" width="13" height="13" stroke="white"><path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/></svg>
                ${isActive ? 'Deactivate' : 'Activate'}
            </button>`;
        }

        tbody.innerHTML += `<tr>
            <td>${acc.UserID}</td><td>${acc.Username}</td><td>${acc.roleName}</td>
            <td>${statusPill}</td>
            <td style="white-space:normal;">${actions}</td>
        </tr>`;
    });
}

function openEditUser(userId) {
    const acc = state.accounts.find(a => a.UserID === userId);
    if (!acc) return;
    document.getElementById("editUserId").value = acc.UserID;
    document.getElementById("editUserUsername").value = acc.Username;
    document.getElementById("editUserModal").style.display = "flex";
}

function handleEditUser(e) {
    e.preventDefault();
    const userId = parseInt(document.getElementById("editUserId").value);
    const newUsername = document.getElementById("editUserUsername").value.trim();

    const acc = state.accounts.find(a => a.UserID === userId);
    if (!acc) return;

    if (!newUsername) {
        alert("Username cannot be empty.");
        return;
    }

    const oldUsername = acc.Username;
    acc.Username = newUsername;

    const donorRecord = state.donors.find(d => d.username === oldUsername);
    if (donorRecord) donorRecord.username = newUsername;

    state.notifications.forEach(n => {
        if (n.targetUser === oldUsername) n.targetUser = newUsername;
    });

    if (state.currentUser === oldUsername) state.currentUser = newUsername;

    alert(`Account updated. Username changed to "${newUsername}".`);
    document.getElementById("editUserModal").style.display = "none";
    renderUsersTable();

    const welcomeMsg = document.getElementById("welcomeUserMsg");
    if (welcomeMsg) welcomeMsg.innerText = `Logged in: ${state.currentUser}`;
}

function toggleUserStatus(userId) {
    const acc = state.accounts.find(a => a.UserID === userId);
    if (!acc) return;

    if (acc.Username === state.currentUser) {
        alert("You cannot deactivate the account you are currently logged in with.");
        return;
    }

    acc.active = acc.active === false ? true : false;
    alert(`Account "${acc.Username}" is now ${acc.active ? 'Active' : 'Deactivated'}.`);
    renderUsersTable();
}

function generateReport(type) {
    const out = document.getElementById("reportOutputContainer");
    const dateStr = new Date().toLocaleString();

    if (type === "Donor") {
        out.innerHTML = `
            <h4><svg class="icon" viewBox="0 0 24 24" width="17" height="17"><path d="M8 2.5h8a1 1 0 0 1 1 1V5H7V3.5a1 1 0 0 1 1-1Z"/><rect x="5" y="5" width="14" height="16.5" rx="2"/><path d="M9 11h6M9 14.5h6M9 18h4"/></svg> VOLUNTEER DONOR REPORT</h4>
            <p><small>Generated on: ${dateStr}</small></p>
            <p><strong>Total Registered Donors:</strong> ${state.donors.length}</p>
            <p><strong>Verified Donors:</strong> ${state.donors.filter(d => d.verificationStatus === 'Verified').length}</p>
            <p><strong>Available Donors:</strong> ${state.donors.filter(d => d.AVB_STU === 'Available').length}</p>
        `;
    } else if (type === "Emergency") {
        out.innerHTML = `
            <h4><svg class="icon" viewBox="0 0 24 24" width="17" height="17"><path d="M12 3.5 2 20.5h20L12 3.5Z"/><path d="M12 10v4.2M12 17.2h.01"/></svg> EMERGENCY BLOOD REQUESTS REPORT</h4>
            <p><small>Generated on: ${dateStr}</small></p>
            <p><strong>Total Requests Filed:</strong> ${state.requests.length}</p>
            <p><strong>Active Matching Requests:</strong> ${state.requests.filter(r => r.REQ_STU === 'Matching Active').length}</p>
        `;
    } else if (type === "Donation") {
        out.innerHTML = `
            <h4><svg class="icon" viewBox="0 0 24 24" width="17" height="17"><path d="M12 2.5c3.2 4.4 7 9.2 7 13.2a7 7 0 1 1-14 0c0-4 3.8-8.8 7-13.2Z"/></svg> DONATION SUMMARY REPORT</h4>
            <p><small>Generated on: ${dateStr}</small></p>
            <p><strong>Confirmed Donations:</strong> ${state.donations.filter(d => d.status === 'Confirmed').length}</p>
            <p><strong>Pending Confirmation:</strong> ${state.donations.filter(d => d.status === 'Pending Confirmation').length}</p>
            <p><strong>Dispatched Notifications:</strong> ${state.notifications.length}</p>
        `;
    }
}

function openUpdateProfileModal() {
    const donor = state.donors.find(d => d.username === state.currentUser);
    if (!donor) return;

    document.getElementById("editDonorPhone").value = donor.phone_number || "";
    document.getElementById("editDonorEmail").value = donor.email || "";
    document.getElementById("editDonorAdd").value = donor.ADD || "";
    document.getElementById("editDonorAvail").value = donor.AVB_STU || "Available";

    document.getElementById("updateProfileModal").style.display = "flex";
}

function handleUpdateProfile(e) {
    e.preventDefault();
    const donor = state.donors.find(d => d.username === state.currentUser);
    if (!donor) return;

    donor.phone_number = document.getElementById("editDonorPhone").value;
    donor.email = document.getElementById("editDonorEmail").value;
    donor.ADD = document.getElementById("editDonorAdd").value;
    donor.AVB_STU = document.getElementById("editDonorAvail").value;

    alert("Profile details and availability status updated successfully!");
    document.getElementById("updateProfileModal").style.display = "none";
    renderMyProfile();
}