// DATABASE SYSTEM STATE (MATCHED TO DIAGRAM ENTITIES)
const state = {
    currentRole: "1",
    currentUser: "admin",
    currentDonorUsername: null,
    latestRequestBloodTypeId: null,
    latestRequestBarangayId: null,

    // USERS Entity
    accounts: [
        { UserID: 1, Username: "admin", Password: "123", ROLES_RoleID: "1", roleName: "City Health Office Admin", active: true,
          entityData: { admin_id: 100, FIR_name: "System", LST_name: "Administrator", USERS_UserID: 1 } },
        { UserID: 2, Username: "staff", Password: "123", ROLES_RoleID: "2", roleName: "Hospital Staff", active: true,
          entityData: { Hospital_id: 501, Hospital_name: "General Santos City Hospital", ADD: "National Highway", CTT_number: "0830000000", USERS_UserID: 2, BARANGAY_BarangayID: "7" } },
        { UserID: 3, Username: "bhw", Password: "123", ROLES_RoleID: "3", roleName: "Barangay Health Worker", active: true,
          entityData: { Worker_id: 800, FIR_name: "Sample", LST_name: "Worker", CTT_number: "0830000001", USERS_UserID: 3, BARANGAY_BarangayID: "1" } }
    ],

    // Relational Tables
    donors: [],
    requests: [],
    drives: [],
    notifications: [],
    donorMatches: [],          // ER: donor_Match — one record per dispatched match/response
    donations: [],             // ER: Blood_Drive_PAR-adjacent donation records
    donorVerifications: [],    // ER: DONOR_VERIFICATION — audit trail of verification actions
    driveParticipation: []     // ER: BLOOD_DRIVE_PAR — donor sign-ups for scheduled drives
};

// Blood Type ID mapping
const bloodTypeMap = {
    "1": "A+", "2": "A-", "3": "B+", "4": "B-",
    "5": "O+", "6": "O-", "7": "AB+", "8": "AB-"
};

// Barangay ID mapping (ER: BARANGAY)
const barangayMap = {
    "1": "Apopong", "2": "Baluan", "3": "Bula", "4": "Calumpang",
    "5": "City Heights", "6": "Labangal", "7": "Lagao", "8": "San Isidro"
};

// ── ERD-ALIGNED LOOKUP HELPERS ──────────────────────────────────────────
// These read FK relationships exactly as drawn in the ER Diagram, instead of
// relying on hardcoded IDs or plain-text role labels.

// USERS.UserID -> account (and its role-specific entity record: CIT_Health_OFF_ADM / Hospital_STF / Barangay_Health_Worker)
function getAccountByUserId(userId) {
    return state.accounts.find(a => a.UserID === userId);
}

// Currently logged-in account's own USERS row
function getCurrentAccount() {
    return state.accounts.find(a => a.Username === state.currentUser);
}

// Hospital_STF.Hospital_id -> owning account (via entityData.Hospital_id), used to resolve
// EMG_Blood_REQ.Hospital_STF_Hospital_id back to a USERS_UserID for NOTIFICATION targeting
function getAccountByHospitalId(hospitalId) {
    return state.accounts.find(a => a.entityData && a.entityData.Hospital_id === hospitalId);
}

// Icon set (presentation only — inline SVG markup keyed by sidebar module)
const ICONS = {
    home: '<svg class="icon" viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5M5.5 10v9A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-9"/></svg>',
    donors: '<svg class="icon" viewBox="0 0 24 24"><path d="M8 2.5h8a1 1 0 0 1 1 1V5H7V3.5a1 1 0 0 1 1-1Z"/><rect x="5" y="5" width="14" height="16.5" rx="2"/><path d="M9 11h6M9 14.5h6M9 18h4"/></svg>',
    requests: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 3.5 2 20.5h20L12 3.5Z"/><path d="M12 10v4.2M12 17.2h.01"/></svg>',
    matched: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
    drives: '<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9.5h16M8 3v3.5M16 3v3.5"/></svg>',
    users: '<svg class="icon" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.7-3.4 3-5.3 5.5-5.3s4.8 1.9 5.5 5.3"/><circle cx="17" cy="8.5" r="2.6"/><path d="M15.5 14.9c2.2.3 3.9 2.1 4.5 5.1"/></svg>',
    reports: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M20 20H4"/></svg>',
    profile: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c1-4.2 3.8-6.5 7.5-6.5s6.5 2.3 7.5 6.5"/></svg>',
    bell: '<svg class="icon" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 5.5-2 7-2 7h16s-2-1.5-2-7"/><path d="M10.5 19a1.7 1.7 0 0 0 3 0"/></svg>'
};

document.addEventListener("DOMContentLoaded", () => {
    initEvents();
});

function initEvents() {
    document.getElementById("linkOpenStaffRegister").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("staffRegisterModal").style.display = "flex";
    });

    document.getElementById("initialLoginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const role = document.getElementById("initialLoginRole").value;
        const user = document.getElementById("initialLoginUsername").value;
        const pass = document.getElementById("initialLoginPassword").value;

        const match = state.accounts.find(a => a.Username === user && a.Password === pass && a.ROLES_RoleID === role);

        if (!match) {
            alert("Invalid Credentials! Check your username, password, or account role.");
            return;
        }

        if (match.active === false) {
            alert("This account has been deactivated by the City Health Office Admin. Please contact your administrator.");
            return;
        }

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

    document.getElementById("btnBhwRegisterDonor").addEventListener("click", () => {
        document.getElementById("bhwDonorRegisterModal").style.display = "flex";
    });

    document.getElementById("btnReqModuleAdd").addEventListener("click", () => {
        document.getElementById("requestModal").style.display = "flex";
    });

    document.getElementById("btnDriveModuleAdd").addEventListener("click", () => {
        document.getElementById("driveModal").style.display = "flex";
    });

    document.getElementById("btnEditDonorProfile").addEventListener("click", openEditDonorProfile);

    document.getElementById("btnAdminCreateAccount").addEventListener("click", () => {
        document.getElementById("staffRegisterModal").style.display = "flex";
    });

    document.getElementById("formStaffRegister").addEventListener("submit", handleStaffRegister);
    document.getElementById("formBhwRegisterDonor").addEventListener("submit", handleBhwRegister);
    document.getElementById("formEmergencyRequest").addEventListener("submit", handleEmergencyRequest);
    document.getElementById("formBloodDrive").addEventListener("submit", handleBloodDrive);
    document.getElementById("formEditUser").addEventListener("submit", handleEditUser);
    document.getElementById("formEditDonorProfile").addEventListener("submit", handleEditDonorProfile);
    document.getElementById("formEditDrive").addEventListener("submit", handleEditDrive);

    const barangayFilter = document.getElementById("filterSameBarangay");
    if (barangayFilter) {
        barangayFilter.addEventListener("change", renderMatchedDonorsTable);
    }
}

// TOGGLE FIELDS IN REGISTRATION FORM
function toggleRoleFormFields() {
    const role = document.getElementById("staffRegRole").value;
    const choGroup = document.getElementById("choFieldsGroup");
    const hospGroup = document.getElementById("hospitalFieldsGroup");
    const bhwGroup = document.getElementById("bhwFieldsGroup");
    const donorGroup = document.getElementById("donorFieldsGroup");

    choGroup.style.display = "none";
    hospGroup.style.display = "none";
    bhwGroup.style.display = "none";
    donorGroup.style.display = "none";

    if (role === "1") choGroup.style.display = "block";
    else if (role === "2") hospGroup.style.display = "block";
    else if (role === "3") bhwGroup.style.display = "block";
    else if (role === "4") donorGroup.style.display = "block";
}

// REGISTER ACCOUNT HANDLER
function handleStaffRegister(e) {
    e.preventDefault();
    const roleVal = document.getElementById("staffRegRole").value;
    const userVal = document.getElementById("staffRegUser").value;
    const passVal = document.getElementById("staffRegPass").value;

    const newUserId = state.accounts.length + 1;
    let profileRecord = {};

    if (roleVal === "1") {
        profileRecord = {
            admin_id: state.accounts.length + 100,
            FIR_name: document.getElementById("choFirName").value,
            LST_name: document.getElementById("choLstName").value,
            USERS_UserID: newUserId
        };
    } else if (roleVal === "2") {
        profileRecord = {
            Hospital_id: state.accounts.length + 500,
            Hospital_name: document.getElementById("hospName").value,
            ADD: document.getElementById("hospAdd").value,
            CTT_number: document.getElementById("hospCttNumber").value,
            USERS_UserID: newUserId,
            BARANGAY_BarangayID: parseInt(document.getElementById("hospBarangayId").value)
        };
    } else if (roleVal === "3") {
        profileRecord = {
            bhw_id: state.accounts.length + 800,
            FIR_name: document.getElementById("bhwFirName").value,
            LST_name: document.getElementById("bhwLstName").value,
            CTT_number: document.getElementById("bhwCttNumber").value,
            USERS_UserID: newUserId,
            BARANGAY_BarangayID: parseInt(document.getElementById("bhwBarangayId").value)
        };
    } else if (roleVal === "4") {
        const newDonorId = state.donors.length + 10;
        const donorObj = {
            donor_id: newDonorId,
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
        profileRecord = donorObj;
    }

    const roleNames = {
        "1": "City Health Office Admin",
        "2": "Hospital Staff",
        "3": "Barangay Health Worker",
        "4": "Volunteer Blood Donor"
    };

    state.accounts.push({
        UserID: newUserId,
        Username: userVal,
        Password: passVal,
        ROLES_RoleID: roleVal,
        roleName: roleNames[roleVal],
        entityData: profileRecord,
        active: true
    });

    alert(`Account created successfully for ${userVal}!`);
    document.getElementById("staffRegisterModal").style.display = "none";
    document.getElementById("formStaffRegister").reset();
    toggleRoleFormFields();
    renderUsersTable();
}

// DASHBOARD MENU BUILDER
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
        addMenuItem("bell", "Manage Notifications", "viewManageNotifications");
        addMenuItem("reports", "Generate Reports", "viewReports");
    } else if (state.currentRole === "2") {
        roleName = "Hospital Staff"; badgeClass = "role-hospital";
        addMenuItem("requests", "Emergency Requests", "viewRequests");
        addMenuItem("matched", "Matched Qualified Donors", "viewMatchedDonors");
    } else if (state.currentRole === "3") {
        roleName = "BHW"; badgeClass = "role-bhw";
        addMenuItem("donors", "Donor Status & Register", "viewDonors");
        addMenuItem("matched", "View Qualified Donor List", "viewMatchedDonors");
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
    if (viewId === "viewManageNotifications") renderManageNotifications();

    document.getElementById("btnBhwRegisterDonor").style.display = (state.currentRole === "3") ? "inline-flex" : "none";
    document.getElementById("btnReqModuleAdd").style.display = (state.currentRole === "2") ? "inline-flex" : "none";
    document.getElementById("btnDriveModuleAdd").style.display = (state.currentRole === "1" || state.currentRole === "3") ? "inline-flex" : "none";
}

// BHW ASSISTED REGISTRATION
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

// EMERGENCY BLOOD REQUEST & SYSTEM MATCH ENGINE
function handleEmergencyRequest(e) {
    e.preventDefault();
    const newReqId = state.requests.length + 100;
    const bloodTypeId = document.getElementById("reqBloodType").value;

    // ERD: EMG_Blood_REQ has no barangay column — location context comes from the
    // requesting Hospital_STF record (Hospital_STF.BARANGAY_BarangayID), not a form field.
    const hospitalAccount = getCurrentAccount();
    const hospitalRecord = (hospitalAccount && hospitalAccount.entityData) ? hospitalAccount.entityData : null;
    const hospitalId = hospitalRecord ? hospitalRecord.Hospital_id : null;

    const req = {
        REQ_id: newReqId,
        patient_name: document.getElementById("reqPatient").value,
        QTY_NDD: document.getElementById("reqQty").value,
        REQ_DTE: document.getElementById("reqDate").value,
        REQ_STU: "Matching Active",
        BLOOD_TYPE_BloodTypeID: bloodTypeId,
        Hospital_STF_Hospital_id: hospitalId
    };

    state.requests.push(req);
    state.latestRequestBloodTypeId = bloodTypeId;
    state.latestRequestBarangayId = hospitalRecord ? String(hospitalRecord.BARANGAY_BarangayID) : null;

    // System Engine: Check Blood Type -> Check Donor Availability -> [Match Found] / [No Match]
    // Runs automatically the moment a request is filed, per the Activity Diagram's decision branch.
    const qualifiedCount = state.donors.filter(d =>
        d.verificationStatus === "Verified" && d.AVB_STU === "Available" && d.BLOOD_TYPE_BloodTypeID === bloodTypeId
    ).length;

    let barangayNote = state.latestRequestBarangayId ? ` near ${barangayMap[state.latestRequestBarangayId]}` : "";

    if (qualifiedCount === 0) {
        req.REQ_STU = "No Match Found";

        // Send No Match Alert — notifies the requesting Hospital Staff's own USERS row
        state.notifications.push({
            NotificationID: state.notifications.length + 1000,
            Message: `No qualified donors found for Blood Type ${bloodTypeMap[bloodTypeId]} at this time. The system will keep matching as new donors become verified or available.`,
            SentDate: new Date().toISOString().split('T')[0],
            USERS_UserID: hospitalAccount ? hospitalAccount.UserID : null
        });

        alert(`No Match Alert: No qualified donors found for Blood Type ${bloodTypeMap[bloodTypeId]}${barangayNote} right now. Request has been logged as "No Match Found".`);
    } else {
        alert(`Emergency Blood Request Saved! System Engine found ${qualifiedCount} qualified donor(s) for Blood Type: ${bloodTypeMap[bloodTypeId]}${barangayNote}`);
    }

    document.getElementById("requestModal").style.display = "none";
    document.getElementById("formEmergencyRequest").reset();

    switchView("viewMatchedDonors");
}

// BLOOD DRIVE CREATION
function handleBloodDrive(e) {
    e.preventDefault();

    // ERD: Blood_Drive.CIT_Health_OFF_ADM_admin_id (FK) -> CIT_Health_OFF_ADM.admin_id
    // Only populated when a CHO Admin schedules the drive (the entity this FK is tied to in the ERD)
    const actingAccount = getCurrentAccount();
    const adminId = (actingAccount && actingAccount.ROLES_RoleID === "1" && actingAccount.entityData)
        ? actingAccount.entityData.admin_id
        : null;

    const drive = {
        Blood_Drive_id: state.drives.length + 300,
        EVT_name: document.getElementById("driveEvent").value,
        LOC: document.getElementById("driveVenue").value,
        SHD: document.getElementById("driveDate").value,
        STU: "Scheduled",
        BARANGAY_BarangayID: document.getElementById("driveBarangay").value,
        CIT_Health_OFF_ADM_admin_id: adminId
    };

    state.drives.push(drive);
    alert("Blood Drive Schedule Created!");
    document.getElementById("driveModal").style.display = "none";
    document.getElementById("formBloodDrive").reset();
    renderDrivesTable();
}

// RENDER TABLES & VERIFICATION ACTION
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

// ER: DONOR_VERIFICATION — CHO Admin verifies a donor record; keeps an audit trail
function verifyDonor(id) {
    const donor = state.donors.find(d => d.donor_id === id);
    if (donor) {
        donor.verificationStatus = "Verified";

        // FK per ERD is DONOR_VERIFICATION.CIT_Health_OFF_ADM_admin_id -> CIT_Health_OFF_ADM.admin_id (not USERS.UserID)
        const admin = getCurrentAccount();
        const adminId = (admin && admin.entityData) ? admin.entityData.admin_id : null;
        state.donorVerifications.push({
            VerificationID: state.donorVerifications.length + 1,
            VerificationStatus: "Verified",
            VerificationDate: new Date().toISOString().split('T')[0],
            CIT_Health_OFF_ADM_admin_id: adminId,
            Volunteer_Blood_donor_donor_id: id
        });

        alert(`Donor ID: ${id} verification status updated to VERIFIED.`);
        renderDonorsTable();
    }
}

// RENDER EMERGENCY REQUESTS, HOSPITAL NOTIFICATIONS & PENDING DONATION CONFIRMATIONS
function renderRequestsTable() {
    const tbody = document.getElementById("requestTableBody");
    const container = document.getElementById("viewRequests");
    tbody.innerHTML = "";

    // Render Accept & No-Match Notifications for Hospital Staff — filtered via NOTIFICATION.USERS_UserID FK
    let hospNotifHTML = "";
    if (state.currentRole === "2") {
        const myAccount = getCurrentAccount();
        const staffNotifs = myAccount ? state.notifications.filter(n => n.USERS_UserID === myAccount.UserID) : [];
        if (staffNotifs.length > 0) {
            hospNotifHTML = `
                <div style="margin-bottom: 20px; display:flex; flex-direction:column; gap:8px;">
                    ${staffNotifs.map(n => {
                        const isNoMatch = n.Message.startsWith("No qualified donors found");
                        return isNoMatch
                            ? `<div class="notice notice-warning">
                                    <svg class="icon" viewBox="0 0 24 24"><path d="M12 3.5 2 20.5h20L12 3.5Z"/><path d="M12 10v4.2M12 17.2h.01"/></svg>
                                    <div><strong>NO MATCH ALERT:</strong> ${n.Message}<small>Date: ${n.SentDate}</small></div>
                               </div>`
                            : `<div class="notice notice-success">
                                    <svg class="icon" viewBox="0 0 24 24"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg>
                                    <div><strong>MATCH CONFIRMED:</strong> ${n.Message}<small>Date Accepted: ${n.SentDate}</small></div>
                               </div>`;
                    }).join('')}
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
            // Hospital Barangay is not a column on EMG_Blood_REQ — resolved via Hospital_STF_Hospital_id -> Hospital_STF.BARANGAY_BarangayID
            const hospitalAcc = getAccountByHospitalId(r.Hospital_STF_Hospital_id);
            const hospitalBarangayId = hospitalAcc && hospitalAcc.entityData ? hospitalAcc.entityData.BARANGAY_BarangayID : null;
            const barangayLabel = hospitalBarangayId ? (barangayMap[hospitalBarangayId] || 'Barangay ' + hospitalBarangayId) : 'Unknown';
            const statusBadgeClass = r.REQ_STU === "No Match Found" ? "role-bhw" : "role-admin";
            tbody.innerHTML += `
                <tr>
                    <td>${r.REQ_id}</td><td>${r.patient_name}</td><td>${r.Hospital_STF_Hospital_id ?? '-'}</td>
                    <td><span class="blood-type-tag">${bloodTypeMap[r.BLOOD_TYPE_BloodTypeID]}</span></td>
                    <td>${barangayLabel}</td>
                    <td>${r.QTY_NDD} Bag(s)</td>
                    <td>${r.REQ_DTE}</td><td><span class="badge ${statusBadgeClass}">${r.REQ_STU}</span></td>
                </tr>
            `;
        });
    }

    // Pending Donation Confirmations — Hospital Staff confirms a donor's completed donation
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
        tagText += ` · Hospital Barangay: ${barangayMap[state.latestRequestBarangayId]}`;
    }

    if (tag) tag.innerText = tagText;

    if (matched.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">No matched donors found. Check if donors are verified by CHO Admin.</td></tr>`;
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

// ER: donor_Match — a match record is created the moment an alert is dispatched to a donor
// ER: NOTIFICATION.USERS_UserID (FK) — notification targets the donor's USERS row, not a plain username string
function sendNotificationToDonor(donorId, donorUsername, donorName) {
    const latestReq = state.requests[state.requests.length - 1];
    if (!latestReq) return;

    const donor = state.donors.find(d => d.donor_id === donorId);
    if (!donor) return;

    state.notifications.push({
        NotificationID: state.notifications.length + 1000,
        Message: `EMERGENCY ALERT: Patient ${latestReq.patient_name} requires ${bloodTypeMap[latestReq.BLOOD_TYPE_BloodTypeID]} blood urgently.`,
        SentDate: new Date().toISOString().split('T')[0],
        USERS_UserID: donor.USERS_UserID,
        _linkedReqId: latestReq.REQ_id  // app-level helper only, not a NOTIFICATION column — used to locate the related donor_Match row
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

// DONOR PORTAL & DECISION RESPONSE (ACCEPT/DECLINE WITH HOSPITAL NOTIFICATION)
function renderMyProfile() {
    const notifContainer = document.getElementById("donorNotificationsContainer");
    const profileContainer = document.getElementById("myProfileContent");

    const myAccount = getCurrentAccount();
    const myDonorRecord = state.donors.find(d => d.username === state.currentUser);

    // ER: NOTIFICATION.USERS_UserID (FK) — this donor's own USERS row, not a plain username match
    const myNotifs = myAccount ? state.notifications.filter(n => n.USERS_UserID === myAccount.UserID) : [];

    if (myNotifs.length === 0) {
        notifContainer.innerHTML = `<p style="color:var(--ink-faint);">No pending emergency blood requests right now.</p>`;
    } else {
        notifContainer.innerHTML = "";
        myNotifs.forEach(n => {
            // NOTIFICATION has no status column per ERD — response state lives on the related donor_Match.RSO
            const relatedMatch = myDonorRecord ? state.donorMatches.find(m =>
                m.EMG_Blood_REQ_REQ_id === n._linkedReqId && m.Volunteer_Blood_donor_donor_id === myDonorRecord.donor_id
            ) : null;
            const rso = relatedMatch ? relatedMatch.RSO : "Pending";

            notifContainer.innerHTML += `
                <div class="notice notice-warning" style="flex-direction:column; align-items:stretch;">
                    <div style="display:flex; gap:10px; align-items:flex-start;">
                        <svg class="icon" viewBox="0 0 24 24"><path d="M12 3.5 2 20.5h20L12 3.5Z"/><path d="M12 10v4.2M12 17.2h.01"/></svg>
                        <div>
                            <strong>Emergency Request Alert ID: ${n.NotificationID}</strong>
                            <p style="margin-top:4px;">${n.Message}</p>
                            <p style="margin-top:6px;"><strong>Date Sent:</strong> ${n.SentDate} &nbsp;|&nbsp; <strong>Status:</strong> <span class="badge role-bhw">${rso}</span></p>
                        </div>
                    </div>
                    ${rso === 'Pending' ? `
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

    const myData = myDonorRecord;
    if (!myData) {
        profileContainer.innerHTML = `<p style="color:var(--ink-faint);">No active donor record connected to this username.</p>`;
        return;
    }

    const statusCls = myData.verificationStatus === 'Verified' ? 'verified' : 'pending';

    // ER: BLOOD_DRIVE_PAR — drives this donor has joined
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
            <div class="profile-detail">
                <div class="label">Availability Status</div>
                <div class="value" style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                    <span>${myData.AVB_STU}</span>
                    ${myData.AVB_STU === "Reserved / Donating"
                        ? `<span class="joined-tag">Locked during active match</span>`
                        : `<button onclick="toggleDonorAvailability()" class="btn-icon-sm ${myData.AVB_STU === 'Available' ? 'btn-toggle-off' : 'btn-toggle-on'}" style="font-size:0.7rem; padding:5px 10px;">
                                ${myData.AVB_STU === 'Available' ? 'Mark Unavailable' : 'Mark Available'}
                           </button>`
                    }
                </div>
            </div>
            <div class="profile-detail"><div class="label">Barangay</div><div class="value">${barangayMap[myData.BARANGAY_BarangayID] || 'Barangay ' + myData.BARANGAY_BarangayID}</div></div>
            <div class="profile-detail"><div class="label">Contact</div><div class="value" style="font-size:0.85rem;">${myData.phone_number}<br>${myData.email}</div></div>
        </div>
        <h4 style="margin-top:20px; font-size:0.85rem; color:var(--ink-soft); text-transform:uppercase; letter-spacing:0.04em;">My Blood Drive Participation</h4>
        ${participationHTML}
    `;
}

// Use Case: Donor Profile Update -> Update Personal Details — pre-fill and open the edit modal
function openEditDonorProfile() {
    const donor = state.donors.find(d => d.username === state.currentUser);
    if (!donor) {
        alert("No active donor record connected to this account.");
        return;
    }
    document.getElementById("editProfileFirName").value = donor.FIR_name || "";
    document.getElementById("editProfileMidName").value = donor.MID_NAME || "";
    document.getElementById("editProfileLstName").value = donor.LST_name || "";
    document.getElementById("editProfilePhone").value = donor.phone_number || "";
    document.getElementById("editProfileEmail").value = donor.email || "";
    document.getElementById("editProfileAdd").value = donor.ADD || "";
    document.getElementById("editProfileBarangay").value = donor.BARANGAY_BarangayID || "1";
    document.getElementById("editDonorProfileModal").style.display = "flex";
}

// Use Case: Donor Profile Update -> Update Personal Details — save changes to Volunteer_Blood_donor
function handleEditDonorProfile(e) {
    e.preventDefault();
    const donor = state.donors.find(d => d.username === state.currentUser);
    if (!donor) return;

    donor.FIR_name = document.getElementById("editProfileFirName").value;
    donor.MID_NAME = document.getElementById("editProfileMidName").value;
    donor.LST_name = document.getElementById("editProfileLstName").value;
    donor.phone_number = document.getElementById("editProfilePhone").value;
    donor.email = document.getElementById("editProfileEmail").value;
    donor.ADD = document.getElementById("editProfileAdd").value;
    donor.BARANGAY_BarangayID = document.getElementById("editProfileBarangay").value;

    alert("Personal details updated successfully!");
    document.getElementById("editDonorProfileModal").style.display = "none";
    renderMyProfile();
}

// Use Case: Donor Profile Update -> Update Availability Status
function toggleDonorAvailability() {
    const donor = state.donors.find(d => d.username === state.currentUser);
    if (!donor) return;

    if (donor.AVB_STU === "Reserved / Donating") {
        alert("Availability is locked while a donation match is in progress.");
        return;
    }

    donor.AVB_STU = donor.AVB_STU === "Available" ? "Not Available" : "Available";
    alert(`Availability status updated to: ${donor.AVB_STU}`);
    renderMyProfile();
}

function respondToRequest(notifId, choice) {
    const notif = state.notifications.find(n => n.NotificationID === notifId);
    if (notif) {
        // NOTIFICATION has no status column per ERD — the response itself lives on donor_Match.RSO instead

        const donor = state.donors.find(d => d.username === state.currentUser);

        // Update the matching donor_Match record (most recent Pending match for this donor)
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

            // Record Donation — awaits Hospital Staff confirmation
            state.donations.push({
                donation_id: state.donations.length + 1,
                donor_id: donor.donor_id,
                REQ_id: matchRecord ? matchRecord.EMG_Blood_REQ_REQ_id : null,
                date: new Date().toISOString().split('T')[0],
                status: "Pending Confirmation"
            });

            // DISPATCH NOTIFICATION TO HOSPITAL STAFF — resolved via EMG_Blood_REQ.Hospital_STF_Hospital_id -> Hospital_STF -> USERS_UserID
            const relatedReq = state.requests.find(r => r.REQ_id === (matchRecord ? matchRecord.EMG_Blood_REQ_REQ_id : null));
            const hospitalAcc = relatedReq ? getAccountByHospitalId(relatedReq.Hospital_STF_Hospital_id) : null;

            state.notifications.push({
                NotificationID: state.notifications.length + 1000,
                Message: `Donor ${donor.FIR_name} ${donor.LST_name} (${bloodTypeMap[donor.BLOOD_TYPE_BloodTypeID]}) has ACCEPTED the emergency blood request! Contact: ${donor.phone_number}`,
                SentDate: new Date().toISOString().split('T')[0],
                USERS_UserID: hospitalAcc ? hospitalAcc.UserID : null
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

// ER: Blood_Drive_PAR-linked confirmation — Hospital Staff confirms a donor's completed donation
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

    // Activity Diagram: Send Confirmation Notification -> Manage Notifications (CHO Admin)
    const adminAccount = state.accounts.find(a => a.ROLES_RoleID === "1");
    if (adminAccount && donor) {
        state.notifications.push({
            NotificationID: state.notifications.length + 1000,
            Message: `Donation #${donationId} by ${donor.FIR_name} ${donor.LST_name} (${bloodTypeMap[donor.BLOOD_TYPE_BloodTypeID]}) has been confirmed by Hospital Staff.`,
            SentDate: new Date().toISOString().split('T')[0],
            USERS_UserID: adminAccount.UserID
        });
    }

    alert(`Donation #${donationId} confirmed. Donor availability has been updated.`);
    renderRequestsTable();
}

// ER: Blood_Drive_PAR — donor signs up for a scheduled community blood drive
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
        } else if (state.currentRole === "1" || state.currentRole === "3") {
            // Use Case: Manage Blood Drive -> Update Blood Drive (CHO Admin & BHW)
            actionCell = `<div style="display:flex; align-items:center; gap:8px; white-space:nowrap;">
                <span class="joined-tag">${participantCount} joined</span>
                <button onclick="openEditDrive(${drv.Blood_Drive_id})" class="btn-icon-sm btn-edit">
                    <svg class="icon" viewBox="0 0 24 24" width="13" height="13" stroke="white"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/></svg>
                    Edit
                </button>
            </div>`;
        }

        tbody.innerHTML += `<tr>
            <td>${drv.Blood_Drive_id}</td>
            <td>${drv.EVT_name} <span class="status-pill verified" style="margin-left:6px;">${drv.STU || 'Scheduled'}</span></td>
            <td>${drv.LOC}</td><td>${drv.SHD}</td>
            <td>${barangayMap[drv.BARANGAY_BarangayID] || 'Barangay ' + drv.BARANGAY_BarangayID}</td>
            <td>${actionCell}</td>
        </tr>`;
    });
}

// USER ACCOUNT CRUD (Manage User Accounts — CHO Admin only)
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

    // Keep dependent records in sync — donor.username still mirrors USERS.Username for login lookup.
    // NOTIFICATION references USERS_UserID (not username), so it stays correct automatically.
    const donorRecord = state.donors.find(d => d.username === oldUsername);
    if (donorRecord) donorRecord.username = newUsername;

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

// Use Case: Manage Notifications (CHO Admin) — lists all NOTIFICATION rows targeted at the Admin's own USERS_UserID
function renderManageNotifications() {
    const container = document.getElementById("adminNotificationsContainer");
    const myAccount = getCurrentAccount();
    const myNotifs = myAccount ? state.notifications.filter(n => n.USERS_UserID === myAccount.UserID) : [];

    if (myNotifs.length === 0) {
        container.innerHTML = `<p style="color:var(--ink-faint);">No system notifications at this time.</p>`;
        return;
    }

    container.innerHTML = [...myNotifs].reverse().map(n => `
        <div class="notice notice-warning" style="align-items:center;">
            <svg class="icon" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 5.5-2 7-2 7h16s-2-1.5-2-7"/><path d="M10.5 19a1.7 1.7 0 0 0 3 0"/></svg>
            <div style="flex:1;">
                <strong>Notification #${n.NotificationID}</strong>
                <p style="margin-top:2px;">${n.Message}</p>
                <small>${n.SentDate}</small>
            </div>
            <button onclick="dismissAdminNotification(${n.NotificationID})" class="btn-icon-sm btn-decline">
                <svg class="icon" viewBox="0 0 24 24" width="13" height="13" stroke="white"><path d="M6 6l12 12M18 6 6 18"/></svg>
                Dismiss
            </button>
        </div>
    `).join('');
}

function dismissAdminNotification(notificationId) {
    state.notifications = state.notifications.filter(n => n.NotificationID !== notificationId);
    renderManageNotifications();
}

// Use Case: Manage Blood Drive -> Update Blood Drive
function openEditDrive(driveId) {
    const drive = state.drives.find(d => d.Blood_Drive_id === driveId);
    if (!drive) return;
    document.getElementById("editDriveId").value = drive.Blood_Drive_id;
    document.getElementById("editDriveEvent").value = drive.EVT_name;
    document.getElementById("editDriveVenue").value = drive.LOC;
    document.getElementById("editDriveDate").value = drive.SHD;
    document.getElementById("editDriveBarangay").value = drive.BARANGAY_BarangayID;
    document.getElementById("editDriveStatus").value = drive.STU || "Scheduled";
    document.getElementById("editDriveModal").style.display = "flex";
}

function handleEditDrive(e) {
    e.preventDefault();
    const driveId = parseInt(document.getElementById("editDriveId").value);
    const drive = state.drives.find(d => d.Blood_Drive_id === driveId);
    if (!drive) return;

    drive.EVT_name = document.getElementById("editDriveEvent").value;
    drive.LOC = document.getElementById("editDriveVenue").value;
    drive.SHD = document.getElementById("editDriveDate").value;
    drive.BARANGAY_BarangayID = document.getElementById("editDriveBarangay").value;
    drive.STU = document.getElementById("editDriveStatus").value;

    alert("Blood Drive updated successfully!");
    document.getElementById("editDriveModal").style.display = "none";
    renderDrivesTable();
}

// REPORT GENERATION ENGINE (DFD LEVEL 0 / USE CASE ALIGNED)
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