(function () {
  var THEME_KEY = 'drivequiz.theme';
  var ZOOM_KEY = 'drivequiz.zoom';
  var REMEMBER_USERNAME_KEY = 'drivequiz.rememberedUsername';

  var HERO_ANIM_EPOCH = performance.now();
  var HERO_BASE_DELAYS = { car: 0, bike: -6, motorbike: -11, bus: -3 };

  function syncHeroRoadIcon(el, key) {
    var duration = parseFloat(getComputedStyle(el).animationDuration) || 1;
    var base = HERO_BASE_DELAYS[key] || 0;
    var elapsed = (performance.now() - HERO_ANIM_EPOCH) / 1000;
    var phase = ((elapsed + base) % duration + duration) % duration;
    el.style.animationDelay = (-phase) + 's';
  }

  function syncHeroRoadAnimations() {
    document.querySelectorAll('.hero-car-icon').forEach(function (el) { syncHeroRoadIcon(el, 'car'); });
    document.querySelectorAll('.hero-bike-icon').forEach(function (el) { syncHeroRoadIcon(el, 'bike'); });
    document.querySelectorAll('.hero-motorbike-icon').forEach(function (el) { syncHeroRoadIcon(el, 'motorbike'); });
    document.querySelectorAll('.hero-bus-icon').forEach(function (el) { syncHeroRoadIcon(el, 'bus'); });
  }

  var SPRITE_FILES = {
    auto: 'assets/icons/category_sprite.png',
    moto: 'assets/icons/category_sprite_moto.png',
    truck: 'assets/icons/category_sprite_truck.png',
    bus: 'assets/icons/category_sprite_bus.png',
    peiforthgo: 'assets/icons/category_sprite_peiforthgo.png'
  };
  // Only these sprite sheets are flat single-tone silhouettes; recolor them to
  // match the app's accent. The others bake in signs with numbers/text (ABS,
  // weight limits, etc.) that a solid-color mask would flatten into illegible blobs.
  var MASKABLE_SPRITES = { auto: true, moto: true };

  var VEHICLE_LABELS = {
    auto: 'Αυτοκίνητο',
    moto: 'Μοτοσικλέτα',
    truck: 'Φορτηγό',
    bus: 'Λεωφορείο',
    peiforthgo: 'ΠΕΙ Φορτηγό'
  };

  var FALLBACK_SECTIONS_AUTO = [
    { id: 'all', label: 'Προσομοίωση Εξέτασης', count: 60, icon: null },
    { id: 'Όργανα', label: 'Όργανα', count: 14, icon: 17 },
    { id: 'Οδηγός', label: 'Οδηγός', count: 9, icon: 13 },
    { id: 'Σήμανση - Προτεραιότητας', label: 'Σήμανση - Προτεραιότητας', count: 9, icon: 28 },
    { id: 'Σήμανση - Πρόσθετες', label: 'Σήμανση - Πρόσθετες', count: 9, icon: 27 },
    { id: 'Σήμανση - Πληροφοριακές', label: 'Σήμανση - Πληροφοριακές', count: 63, icon: 26 },
    { id: 'Σήμανση - Διαγραμμίσεις', label: 'Σήμανση - Διαγραμμίσεις', count: 8, icon: 23 },
    { id: 'Σήμανση - Απαγόρευσης', label: 'Σήμανση - Απαγόρευσης', count: 45, icon: 21 },
    { id: 'Σήμανση - Αυτοκινητοδρόμου', label: 'Σήμανση - Αυτοκινητοδρόμου', count: 10, icon: 22 },
    { id: 'Σήμανση - Κινδύνου', label: 'Σήμανση - Κινδύνου', count: 45, icon: 25 },
    { id: 'Σήμανση - Υποχρέωσης', label: 'Σήμανση - Υποχρέωσης', count: 19, icon: 30 },
    { id: 'Σήμανση - Κατευθύνσεων', label: 'Σήμανση - Κατευθύνσεων', count: 15, icon: 24 },
    { id: 'Σήμανση - Σηματοδότης', label: 'Σήμανση - Σηματοδότης', count: 16, icon: 29 },
    { id: 'Σήμανση - Σιδηρόδρομος', label: 'Σήμανση - Σιδηρόδρομος', count: 2, icon: 8 },
    { id: 'Σήμανση - Τροχονόμος', label: 'Σήμανση - Τροχονόμος', count: 4, icon: 9 },
    { id: 'Διασταυρώσεις - Γενικά', label: 'Διασταυρώσεις - Γενικά', count: 22, icon: 5 },
    { id: 'Διασταυρώσεις - Δεξιά προτεραιότητα', label: 'Διασταυρώσεις - Δεξιά προτεραιότητα', count: 21, icon: 6 },
    { id: 'Διασταυρώσεις - Τροχονόμος', label: 'Διασταυρώσεις - Τροχονόμος', count: 13, icon: 9 },
    { id: 'Διασταυρώσεις - Πινακίδες', label: 'Διασταυρώσεις - Πινακίδες', count: 26, icon: 7 },
    { id: 'Διασταυρώσεις - Σιδηρόδρομος', label: 'Διασταυρώσεις - Σιδηρόδρομος', count: 9, icon: 8 },
    { id: 'Ταχύτητα', label: 'Ταχύτητα', count: 20, icon: 35 },
    { id: 'Οδόστρωμα', label: 'Οδόστρωμα', count: 22, icon: 14 },
    { id: 'Αποστάσεις', label: 'Αποστάσεις', count: 25, icon: 1 },
    { id: 'Στάση-Στάθμευση', label: 'Στάση-Στάθμευση', count: 41, icon: 31 },
    { id: 'Στάση-Στάθμευση - Πρόσθετες', label: 'Στάση-Στάθμευση - Πρόσθετες', count: 1, icon: 31 },
    { id: 'Προσπέραση', label: 'Προσπέραση', count: 38, icon: 19 },
    { id: 'Στροφές', label: 'Στροφές', count: 14, icon: 32 },
    { id: 'Στροφές - Πρόσθετες', label: 'Στροφές - Πρόσθετες', count: 1, icon: 32 },
    { id: 'Συνύπαρξη', label: 'Συνύπαρξη', count: 42, icon: 34 },
    { id: 'Διαδρομή', label: 'Διαδρομή', count: 28, icon: 4 },
    { id: 'Αλκοόλ', label: 'Αλκοόλ', count: 17, icon: 0 },
    { id: 'Είσοδος', label: 'Είσοδος', count: 7, icon: 10 },
    { id: 'Αυτοκινητόδρομος', label: 'Αυτοκινητόδρομος', count: 27, icon: 3 },
    { id: 'Ορατότητα', label: 'Ορατότητα', count: 20, icon: 16 },
    { id: 'Πρόσφυση', label: 'Πρόσφυση', count: 12, icon: 20 },
    { id: 'Οδηγός - Βουνό-κούραση', label: 'Οδηγός - Βουνό-κούραση', count: 10, icon: 13 },
    { id: 'Ατύχημα', label: 'Ατύχημα', count: 13, icon: 2 },
    { id: 'Συντήρηση', label: 'Συντήρηση', count: 56, icon: 33 },
    { id: 'Έκτακτα', label: 'Έκτακτα', count: 19, icon: 11 },
    { id: 'Κανόνες', label: 'Κανόνες', count: 15, icon: 12 },
    { id: 'Περιβάλλον', label: 'Περιβάλλον', count: 24, icon: 18 },
    { id: 'Οικολογία', label: 'Οικολογία', count: 13, icon: 15 }
  ];

  var FALLBACK_SECTIONS_MOTO = [
    { id: 'all', label: 'Προσομοίωση Εξέτασης', count: 60, icon: null },
    { id: 'Ασφάλεια', label: 'Ασφάλεια', count: 8, icon: 0 },
    { id: 'Εξαρτήματα', label: 'Εξαρτήματα', count: 17, icon: 1 },
    { id: 'Εξοπλισμός', label: 'Εξοπλισμός', count: 19, icon: 2 },
    { id: 'Ετοιμότητα', label: 'Ετοιμότητα', count: 15, icon: 3 },
    { id: 'Κανόνες', label: 'Κανόνες', count: 19, icon: 4 },
    { id: 'Οδήγηση', label: 'Οδήγηση', count: 26, icon: 5 },
    { id: 'Συντήρηση', label: 'Συντήρηση', count: 22, icon: 6 },
    { id: 'Ταχύτητα-Αποστάσεις', label: 'Ταχύτητα-Αποστάσεις', count: 14, icon: 7 }
  ];

  var FALLBACK_SECTIONS_TRUCK = [
    { id: 'all', label: 'Προσομοίωση Εξέτασης', count: 60, icon: null },
    { id: 'Αλκοόλ', label: 'Αλκοόλ', count: 21, icon: 0 },
    { id: 'Προσπέραση - Ολισθηρότητα', label: 'Προσπέραση - Ολισθηρότητα', count: 28, icon: 1 },
    { id: 'Θέση - Όρια Ταχύτητας', label: 'Θέση - Όρια Ταχύτητας', count: 20, icon: 2 },
    { id: 'Διαστάσεις - Βάρη', label: 'Διαστάσεις - Βάρη', count: 19, icon: 3 },
    { id: 'Εξοπλισμός', label: 'Εξοπλισμός', count: 18, icon: 4 },
    { id: 'Μηχανολογία', label: 'Μηχανολογία', count: 20, icon: 5 },
    { id: 'Σήμανση - Απαγόρευσης', label: 'Σήμανση - Απαγόρευσης', count: 14, icon: 6 },
    { id: 'Σήμανση - Αυτοκινητοδρόμου', label: 'Σήμανση - Αυτοκινητοδρόμου', count: 1, icon: 7 },
    { id: 'Σήμανση - Διαγραμμίσεις', label: 'Σήμανση - Διαγραμμίσεις', count: 3, icon: 7 },
    { id: 'Σήμανση - Κατευθύνσεων', label: 'Σήμανση - Κατευθύνσεων', count: 4, icon: 7 },
    { id: 'Σήμανση - Πληροφοριακές', label: 'Σήμανση - Πληροφοριακές', count: 1, icon: 7 },
    { id: 'Σήμανση - Πρόσθετες', label: 'Σήμανση - Πρόσθετες', count: 1, icon: 7 },
    { id: 'Συντήρηση', label: 'Συντήρηση', count: 19, icon: 8 },
    { id: 'Τεχνικά', label: 'Τεχνικά', count: 20, icon: 8 }
  ];

  var FALLBACK_SECTIONS_BUS = [
    { id: 'all', label: 'Προσομοίωση Εξέτασης', count: 30, icon: null },
    { id: 'Διαστάσεις', label: 'Διαστάσεις', count: 20, icon: 0 },
    { id: 'Κανόνες', label: 'Κανόνες', count: 20, icon: 1 },
    { id: 'Κυρώσεις', label: 'Κυρώσεις', count: 8, icon: 2 },
    { id: 'Μηχανολογία', label: 'Μηχανολογία', count: 40, icon: 3 },
    { id: 'Οδήγηση', label: 'Οδήγηση', count: 20, icon: 4 },
    { id: 'Σήμανση - Απαγόρευσης', label: 'Σήμανση - Απαγόρευσης', count: 1, icon: 5 },
    { id: 'Σήμανση - Αυτοκινητοδρόμου', label: 'Σήμανση - Αυτοκινητοδρόμου', count: 5, icon: 5 },
    { id: 'Σήμανση - Κατευθύνσεων', label: 'Σήμανση - Κατευθύνσεων', count: 2, icon: 5 },
    { id: 'Σήμανση - Κινδύνου', label: 'Σήμανση - Κινδύνου', count: 7, icon: 5 },
    { id: 'Σήμανση - Προτεραιότητας', label: 'Σήμανση - Προτεραιότητας', count: 5, icon: 5 },
    { id: 'Σήμανση - Υποχρέωσης', label: 'Σήμανση - Υποχρέωσης', count: 4, icon: 5 },
    { id: 'Σήμανση - Πληροφοριακές', label: 'Σήμανση - Πληροφοριακές', count: 9, icon: 6 },
    { id: 'Συντήρηση', label: 'Συντήρηση', count: 20, icon: 7 },
    { id: 'Ταχογράφοι', label: 'Ταχογράφοι', count: 16, icon: 8 },
    { id: 'Ταχύτητα', label: 'Ταχύτητα', count: 9, icon: 9 }
  ];

  var FALLBACK_SECTIONS_PEIFORTHGO = [
    { id: 'all', label: 'Προσομοίωση Εξέτασης', count: 30, icon: null },
    { id: 'Εισαγωγή', label: 'Εισαγωγή', count: 9, icon: 0 },
    { id: 'Ορθολογική Οδήγηση - Τυπολογία Φορτηγών', label: 'Ορθολογική Οδήγηση - Τυπολογία Φορτηγών', count: 7, icon: 1 },
    { id: 'Ορθολογική Οδήγηση - Μηχανολογικά', label: 'Ορθολογική Οδήγηση - Μηχανολογικά', count: 88, icon: 2 },
    { id: 'Ορθολογική Οδήγηση - Δυναμική Οχήματος', label: 'Ορθολογική Οδήγηση - Δυναμική Οχήματος', count: 61, icon: 3 },
    { id: 'Ορθολογική Οδήγηση - Κατανάλωση Καυσίμου', label: 'Ορθολογική Οδήγηση - Κατανάλωση Καυσίμου', count: 13, icon: 4 },
    { id: 'Ορθολογική Οδήγηση - Ασφάλιση Φορτίου', label: 'Ορθολογική Οδήγηση - Ασφάλιση Φορτίου', count: 27, icon: 5 },
    { id: 'Κανονιστικές Ρυθμίσεις - Κανονισμοί', label: 'Κανονιστικές Ρυθμίσεις - Κανονισμοί', count: 72, icon: 6 },
    { id: 'Κανονιστικές Ρυθμίσεις - Υποχρεώσεις Οδηγού', label: 'Κανονιστικές Ρυθμίσεις - Υποχρεώσεις Οδηγού', count: 44, icon: 7 },
    { id: 'Πρόληψη Κινδύνων', label: 'Πρόληψη Κινδύνων', count: 15, icon: 8 },
    { id: 'Πρόληψη Κινδύνων - Φυσικοί Κίνδυνοι', label: 'Πρόληψη Κινδύνων - Φυσικοί Κίνδυνοι', count: 18, icon: 9 },
    { id: 'Πρόληψη Κινδύνων - Ατυχήματα', label: 'Πρόληψη Κινδύνων - Ατυχήματα', count: 21, icon: 10 },
    { id: 'Καταστάσεις Έκτακτης Ανάγκης', label: 'Καταστάσεις Έκτακτης Ανάγκης', count: 44, icon: 11 },
    { id: 'Αρχές Υγιεινής', label: 'Αρχές Υγιεινής', count: 23, icon: 12 },
    { id: 'Οικονομικό Περιβάλλον', label: 'Οικονομικό Περιβάλλον', count: 48, icon: 13 }
  ];

  var ICON_ALL = '<svg viewBox="0 0 20 20" fill="none"><path d="M5 3V17" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M5 4H14L11.5 7L14 10H5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  var ICON_SIGN = '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2L18 10L10 18L2 10Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  var CHEV = '<svg viewBox="0 0 8 13" fill="none"><path d="M1 1L6 6.5L1 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_ENTER_FULLSCREEN = '<svg viewBox="0 0 16 16" fill="none"><path d="M2 6V2H6M10 2H14V6M14 10V14H10M6 14H2V10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_EXIT_FULLSCREEN = '<svg viewBox="0 0 16 16" fill="none"><path d="M2 2H6V6M14 6H10V2M10 14V10H14M6 10H2V14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_MISTAKES = '<svg viewBox="0 0 22 22" fill="none"><path d="M11 3L20 18H2L11 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M11 9V13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="11" cy="15.6" r="1" fill="currentColor"/></svg>';
  var ICON_LOCK = '<svg viewBox="0 0 16 16" fill="none"><rect x="3.5" y="7" width="9" height="7" rx="1.6" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 7V5C5.5 3.34 6.84 2 8.5 2C10.16 2 11.5 3.34 11.5 5V7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var ICON_TRASH = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 4.5H13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M6 4.5V3.2C6 2.6 6.5 2 7.2 2H8.8C9.5 2 10 2.6 10 3.2V4.5" stroke="currentColor" stroke-width="1.4"/><path d="M4.5 4.5L5 13C5 13.6 5.5 14 6 14H10C10.5 14 11 13.6 11 13L11.5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  var ICON_EDIT = '<svg viewBox="0 0 16 16" fill="none"><path d="M11.3 2.3a1.6 1.6 0 0 1 2.4 2.4L5.4 13 2 14l1-3.4 8.3-8.3Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/></svg>';

  var PAGE_SIZE = 10;

  var el = {
    screenLogin: document.getElementById('screen-login'),
    authForm: document.getElementById('authForm'),
    authUsername: document.getElementById('authUsername'),
    authPassword: document.getElementById('authPassword'),
    authError: document.getElementById('authError'),
    authNotice: document.getElementById('authNotice'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    authSubtitle: document.getElementById('authSubtitle'),
    rememberUsernameCheckbox: document.getElementById('rememberUsernameCheckbox'),
    accountUsername: document.getElementById('accountUsername'),
    signOutBtn: document.getElementById('signOutBtn'),
    profileBtn: document.getElementById('profileBtn'),
    profileOverlay: document.getElementById('profileOverlay'),
    closeProfileBtn: document.getElementById('closeProfileBtn'),
    showChangePasswordBtn: document.getElementById('showChangePasswordBtn'),
    changePasswordForm: document.getElementById('changePasswordForm'),
    newPasswordInput: document.getElementById('newPasswordInput'),
    newPasswordConfirmInput: document.getElementById('newPasswordConfirmInput'),
    changePasswordError: document.getElementById('changePasswordError'),
    cancelChangePasswordBtn: document.getElementById('cancelChangePasswordBtn'),
    changePasswordSubmitBtn: document.getElementById('changePasswordSubmitBtn'),
    closeAppFromProfileBtn: document.getElementById('closeAppFromProfileBtn'),
    analyticsBtn: document.getElementById('analyticsBtn'),
    analyticsOverlay: document.getElementById('analyticsOverlay'),
    closeAnalyticsBtn: document.getElementById('closeAnalyticsBtn'),
    analyticsOverallPercent: document.getElementById('analyticsOverallPercent'),
    analyticsOverallSub: document.getElementById('analyticsOverallSub'),
    analyticsUserCounts: document.getElementById('analyticsUserCounts'),
    analyticsVehicleLabel: document.getElementById('analyticsVehicleLabel'),
    analyticsByVehicle: document.getElementById('analyticsByVehicle'),
    analyticsSupervisorLabel: document.getElementById('analyticsSupervisorLabel'),
    analyticsBySupervisor: document.getElementById('analyticsBySupervisor'),
    analyticsRecentLabel: document.getElementById('analyticsRecentLabel'),
    analyticsRecentList: document.getElementById('analyticsRecentList'),
    manageUsersBtn: document.getElementById('manageUsersBtn'),
    manageUsersOverlay: document.getElementById('manageUsersOverlay'),
    closeManageUsersBtn: document.getElementById('closeManageUsersBtn'),
    usersListView: document.getElementById('usersListView'),
    showCreateUserBtn: document.getElementById('showCreateUserBtn'),
    createUserForm: document.getElementById('createUserForm'),
    userFormTitle: document.getElementById('userFormTitle'),
    newUserUsername: document.getElementById('newUserUsername'),
    newUserPasswordLabel: document.getElementById('newUserPasswordLabel'),
    newUserPassword: document.getElementById('newUserPassword'),
    newUserRoleRow: document.getElementById('newUserRoleRow'),
    newUserRoleUser: document.getElementById('newUserRoleUser'),
    newUserRoleSupervisor: document.getElementById('newUserRoleSupervisor'),
    newUserSupervisorField: document.getElementById('newUserSupervisorField'),
    newUserSupervisor: document.getElementById('newUserSupervisor'),
    createUserError: document.getElementById('createUserError'),
    cancelUserFormBtn: document.getElementById('cancelUserFormBtn'),
    createUserSubmitBtn: document.getElementById('createUserSubmitBtn'),
    usersListLabel: document.getElementById('usersListLabel'),
    usersList: document.getElementById('usersList'),
    deleteUserOverlay: document.getElementById('deleteUserOverlay'),
    deleteUserName: document.getElementById('deleteUserName'),
    deleteUserCancelBtn: document.getElementById('deleteUserCancelBtn'),
    deleteUserConfirmBtn: document.getElementById('deleteUserConfirmBtn'),
    menuPinned: document.getElementById('menuPinned'),
    menuList: document.getElementById('menuList'),
    menuPagination: document.getElementById('menuPagination'),
    pagePrevBtn: document.getElementById('pagePrevBtn'),
    pageNextBtn: document.getElementById('pageNextBtn'),
    pageIndicator: document.getElementById('pageIndicator'),
    screenVehicles: document.getElementById('screen-vehicles'),
    vehicleAutoBtn: document.getElementById('vehicleAutoBtn'),
    vehicleMotoBtn: document.getElementById('vehicleMotoBtn'),
    vehicleTruckBtn: document.getElementById('vehicleTruckBtn'),
    vehicleBusBtn: document.getElementById('vehicleBusBtn'),
    vehiclePeiforthgoBtn: document.getElementById('vehiclePeiforthgoBtn'),
    screenHome: document.getElementById('screen-home'),
    savedQuestionsBtn: document.getElementById('savedQuestionsBtn'),
    savedQuestionsCount: document.getElementById('savedQuestionsCount'),
    savedQuestionsOverlay: document.getElementById('savedQuestionsOverlay'),
    closeSavedQuestionsBtn: document.getElementById('closeSavedQuestionsBtn'),
    savedQuestionsEmpty: document.getElementById('savedQuestionsEmpty'),
    savedQuestionsList: document.getElementById('savedQuestionsList'),
    quizFlagBtn: document.getElementById('quizFlagBtn'),
    screenQuiz: document.getElementById('screen-quiz'),
    sectionBanner: document.getElementById('sectionBanner'),
    sectionBannerLabel: document.getElementById('sectionBannerLabel'),
    brandLogo: document.getElementById('brandLogo'),
    questionDetailOverlay: document.getElementById('questionDetailOverlay'),
    closeQuestionDetailBtn: document.getElementById('closeQuestionDetailBtn'),
    questionDetailTitle: document.getElementById('questionDetailTitle'),
    questionDetailImageFrame: document.getElementById('questionDetailImageFrame'),
    questionDetailImage: document.getElementById('questionDetailImage'),
    questionDetailMeta: document.getElementById('questionDetailMeta'),
    questionDetailText: document.getElementById('questionDetailText'),
    questionDetailAnswers: document.getElementById('questionDetailAnswers'),
    progressBtn: document.getElementById('progressBtn'),
    progressOverlay: document.getElementById('progressOverlay'),
    closeProgressBtn: document.getElementById('closeProgressBtn'),
    progressSummaryPercent: document.getElementById('progressSummaryPercent'),
    progressSummarySub: document.getElementById('progressSummarySub'),
    progressByVehicle: document.getElementById('progressByVehicle'),
    progressHistoryLabel: document.getElementById('progressHistoryLabel'),
    progressHistoryList: document.getElementById('progressHistoryList'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    themeSegmented: document.getElementById('themeSegmented'),
    zoomSlider: document.getElementById('zoomSlider'),
    zoomValue: document.getElementById('zoomValue'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    exitOverlay: document.getElementById('exitOverlay'),
    exitCancelBtn: document.getElementById('exitCancelBtn'),
    exitConfirmBtn: document.getElementById('exitConfirmBtn'),
    leaveQuizOverlay: document.getElementById('leaveQuizOverlay'),
    leaveQuizCancelBtn: document.getElementById('leaveQuizCancelBtn'),
    leaveQuizConfirmBtn: document.getElementById('leaveQuizConfirmBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    submitBtn: document.getElementById('submitBtn'),
    quizNavRow: document.getElementById('quizNavRow'),
    qIndex: document.getElementById('qIndex'),
    qTotal: document.getElementById('qTotal'),
    progressFill: document.getElementById('progressFill'),
    roadCar: document.getElementById('roadCar'),
    quizTimer: document.getElementById('quizTimer'),
    quizImageFrame: document.getElementById('quizImageFrame'),
    quizImage: document.getElementById('quizImage'),
    quizQuestionText: document.getElementById('quizQuestionText'),
    quizAnswers: document.getElementById('quizAnswers'),
    quizFeedback: document.getElementById('quizFeedback'),
    screenResults: document.getElementById('screen-results'),
    resultsPercent: document.getElementById('resultsPercent'),
    resultsFraction: document.getElementById('resultsFraction'),
    resultsMessage: document.getElementById('resultsMessage'),
    resultsReview: document.getElementById('resultsReview'),
    resultsHomeBtn: document.getElementById('resultsHomeBtn'),
    simSettingsOverlay: document.getElementById('simSettingsOverlay'),
    closeSimSettingsBtn: document.getElementById('closeSimSettingsBtn'),
    simQuestionCount: document.getElementById('simQuestionCount'),
    simTimerMode: document.getElementById('simTimerMode'),
    simTimerDurationRow: document.getElementById('simTimerDurationRow'),
    simTimerDuration: document.getElementById('simTimerDuration'),
    simTimerPerQuestionRow: document.getElementById('simTimerPerQuestionRow'),
    simTimerPerQuestion: document.getElementById('simTimerPerQuestion'),
    simSettingsCancelBtn: document.getElementById('simSettingsCancelBtn'),
    simSettingsStartBtn: document.getElementById('simSettingsStartBtn'),
    incompleteOverlay: document.getElementById('incompleteOverlay'),
    incompleteMessage: document.getElementById('incompleteMessage'),
    incompleteOkBtn: document.getElementById('incompleteOkBtn'),
    toast: document.getElementById('toast'),
    loadingIndicator: document.getElementById('loadingIndicator')
  };

  var state = {
    screen: 'login',
    username: null,
    role: null,
    vehicle: null,
    sectionId: '',
    sectionLabel: '',
    questions: [],
    selected: [],
    index: 0,
    categorySections: [],
    page: 0,
    pendingSimSection: null,
    simSettings: null,
    timerHandle: null,
    timerSecondsLeft: 0,
    wrongCount: 0,
    savedIds: new Set()
  };

  var toastTimer = null;
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.classList.remove('show');
    }, 2200);
  }

  // ---- Loading indicator ----
  // Shown for the duration of any backend call made through callApi() below.
  // A counter (rather than a single flag) means overlapping calls don't hide
  // it early when the first of several in-flight requests finishes.
  var pendingApiCalls = 0;
  function showLoading() {
    pendingApiCalls++;
    el.loadingIndicator.hidden = false;
  }
  function hideLoading() {
    pendingApiCalls = Math.max(0, pendingApiCalls - 1);
    if (pendingApiCalls === 0) el.loadingIndicator.hidden = true;
  }
  function callApi(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (!(window.pywebview && window.pywebview.api && window.pywebview.api[name])) {
      return Promise.reject(new Error('API not available: ' + name));
    }
    showLoading();
    return window.pywebview.api[name].apply(window.pywebview.api, args).finally(hideLoading);
  }

  function showScreen(name) {
    state.screen = name;
    el.screenLogin.classList.toggle('show', name === 'login');
    el.screenVehicles.classList.toggle('show', name === 'vehicles');
    el.screenHome.classList.toggle('show', name === 'home');
    el.screenQuiz.classList.toggle('show', name === 'quiz');
    el.screenResults.classList.toggle('show', name === 'results');
    el.sectionBanner.classList.toggle('show', name === 'quiz');
    el.progressBtn.style.display = name === 'login' ? 'none' : 'flex';
    el.settingsBtn.style.display = name === 'login' ? 'none' : 'flex';
    el.profileBtn.style.display = name === 'login' ? 'none' : 'flex';
    if (name === 'vehicles' || name === 'home') {
      syncHeroRoadAnimations();
    }
    if (name === 'home') {
      loadWrongCount();
      updateSavedQuestionsButton();
    }
  }

  // ---- Auth ----
  // Accounts are created by an admin or supervisor from the Manage Users
  // screen — there is no self-signup, so this login form only ever signs in.

  function updateManageUsersAccess() {
    el.manageUsersBtn.hidden = !(state.role === 'admin' || state.role === 'supervisor');
    el.analyticsBtn.hidden = state.role !== 'admin';
  }

  function prefillRememberedUsername() {
    var remembered = null;
    try {
      remembered = localStorage.getItem(REMEMBER_USERNAME_KEY);
    } catch (e) {}
    if (remembered) {
      el.authUsername.value = remembered;
      el.rememberUsernameCheckbox.checked = true;
    } else {
      el.rememberUsernameCheckbox.checked = false;
    }
  }

  function onAuthSuccess(username, role, remember) {
    state.username = username;
    state.role = role;
    el.accountUsername.textContent = username;
    updateManageUsersAccess();
    el.authForm.reset();
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_USERNAME_KEY, username);
      } else {
        localStorage.removeItem(REMEMBER_USERNAME_KEY);
      }
    } catch (e) {}
    showScreen('vehicles');
  }

  function handleAuthSubmit(e) {
    e.preventDefault();
    el.authError.hidden = true;
    el.authNotice.hidden = true;

    var username = el.authUsername.value.trim();
    var password = el.authPassword.value;
    var remember = el.rememberUsernameCheckbox.checked;
    if (!username || !password) return;

    el.authSubmitBtn.disabled = true;
    callApi('sign_in', username, password).then(function (res) {
      el.authSubmitBtn.disabled = false;
      if (!res.ok) {
        el.authError.textContent = res.error === 'invalid_credentials'
          ? 'Λάθος όνομα χρήστη ή κωδικός. Αν το πρόβλημα συνεχίζεται, επικοινώνησε με τον εκπαιδευτή σου.'
          : (res.error || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.');
        el.authError.hidden = false;
        return;
      }
      onAuthSuccess(res.username || username, res.role || 'user', remember);
    }).catch(function () {
      el.authSubmitBtn.disabled = false;
      el.authError.textContent = 'Δεν υπάρχει σύνδεση με τον διακομιστή αυτή τη στιγμή.';
      el.authError.hidden = false;
    });
  }

  el.authForm.addEventListener('submit', handleAuthSubmit);

  function signOut() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.sign_out) {
      window.pywebview.api.sign_out();
    }
    state.username = null;
    state.role = null;
    state.vehicle = null;
    el.accountUsername.textContent = '—';
    updateManageUsersAccess();
    closeProfile();
    prefillRememberedUsername();
    showScreen('login');
  }

  el.signOutBtn.addEventListener('click', signOut);

  // ---- Manage Users (admin / supervisor only) ----
  var userFormMode = 'create';
  var editingUserId = null;

  function getNewUserRole() {
    return el.newUserRoleSupervisor.checked ? 'supervisor' : 'user';
  }

  function showUsersListView() {
    el.usersListView.hidden = false;
    el.createUserForm.hidden = true;
  }

  function openManageUsers() {
    el.manageUsersOverlay.classList.add('show');
    showUsersListView();
    loadUsersList();
  }
  function closeManageUsers() {
    el.manageUsersOverlay.classList.remove('show');
  }

  function openCreateUserForm() {
    userFormMode = 'create';
    editingUserId = null;
    el.createUserForm.reset();
    el.createUserError.hidden = true;
    el.userFormTitle.textContent = 'Νέος χρήστης';
    el.newUserPasswordLabel.textContent = 'Κωδικός';
    el.newUserPassword.required = true;

    var isAdmin = state.role === 'admin';
    el.newUserRoleRow.hidden = !isAdmin;
    el.newUserRoleUser.checked = true;
    el.newUserRoleSupervisor.checked = false;
    el.newUserSupervisorField.hidden = !isAdmin;

    el.createUserSubmitBtn.textContent = 'Δημιουργία χρήστη';
    el.usersListView.hidden = true;
    el.createUserForm.hidden = false;
    el.newUserUsername.focus();
  }

  function openEditUserForm(u) {
    userFormMode = 'edit';
    editingUserId = u.id;
    el.createUserForm.reset();
    el.createUserError.hidden = true;
    el.userFormTitle.textContent = 'Επεξεργασία χρήστη';
    el.newUserPasswordLabel.textContent = 'Νέος κωδικός (προαιρετικό)';
    el.newUserPassword.required = false;
    el.newUserUsername.value = u.username;

    el.newUserRoleRow.hidden = true;
    el.newUserSupervisorField.hidden = true;

    el.createUserSubmitBtn.textContent = 'Αποθήκευση';
    el.usersListView.hidden = true;
    el.createUserForm.hidden = false;
    el.newUserUsername.focus();
  }

  function loadUsersList() {
    callApi('list_users').then(function (users) {
      renderUsersList(users);
      if (state.role === 'admin') renderSupervisorOptions(users);
    }).catch(function () {
      renderUsersList([]);
    });
  }

  function renderSupervisorOptions(users) {
    var supervisors = users.filter(function (u) { return u.role === 'supervisor'; });
    var current = el.newUserSupervisor.value;
    el.newUserSupervisor.innerHTML = '';
    var noneOpt = document.createElement('option');
    noneOpt.value = '';
    noneOpt.textContent = 'Απευθείας υπό Admin';
    el.newUserSupervisor.appendChild(noneOpt);
    supervisors.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.username;
      el.newUserSupervisor.appendChild(opt);
    });
    el.newUserSupervisor.value = current || '';
  }

  function roleLabel(role) {
    return role === 'admin' ? 'Admin' : role === 'supervisor' ? 'Επόπτης' : 'Χρήστης';
  }

  function buildUserRow(u, indented) {
    var row = document.createElement('div');
    row.className = 'user-row' + (indented ? ' indented' : '');

    var info = document.createElement('div');
    info.className = 'user-row-info';
    var name = document.createElement('p');
    name.className = 'user-row-name';
    name.textContent = u.username;
    var meta = document.createElement('p');
    meta.className = 'user-row-meta';
    meta.textContent = u.supervisorUsername ? ('Υπό: ' + u.supervisorUsername) : (u.role === 'user' ? 'Απευθείας υπό Admin' : '—');
    info.appendChild(name);
    info.appendChild(meta);

    var badge = document.createElement('span');
    badge.className = 'user-row-badge user-row-badge-' + u.role;
    badge.textContent = roleLabel(u.role);

    row.appendChild(info);
    row.appendChild(badge);

    var canManage = state.role === 'admin' || (state.role === 'supervisor' && u.role === 'user' && u.supervisorId);
    if (canManage) {
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'icon-btn user-row-edit';
      editBtn.setAttribute('aria-label', 'Επεξεργασία χρήστη');
      editBtn.innerHTML = ICON_EDIT;
      editBtn.addEventListener('click', function () { openEditUserForm(u); });
      row.appendChild(editBtn);
    }

    var isSelf = u.username === state.username;
    var canDelete = !isSelf && (state.role === 'admin' || (state.role === 'supervisor' && u.role === 'user' && u.supervisorId));
    if (canDelete) {
      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'icon-btn user-row-remove';
      removeBtn.setAttribute('aria-label', 'Διαγραφή χρήστη');
      removeBtn.innerHTML = ICON_TRASH;
      removeBtn.addEventListener('click', function () { openDeleteUserConfirm(u); });
      row.appendChild(removeBtn);
    }
    return row;
  }

  function buildGroupHeader(label) {
    var header = document.createElement('p');
    header.className = 'user-group-header';
    header.textContent = label;
    return header;
  }

  function renderUsersList(users) {
    el.usersList.innerHTML = '';
    var others = users.filter(function (u) { return u.username !== state.username; });

    if (state.role !== 'admin') {
      // Supervisors only ever see their own team anyway (RLS-scoped), flat is fine.
      el.usersListLabel.textContent = 'Οι χρήστες σου (' + others.length + '/10)';
      others.forEach(function (u) { el.usersList.appendChild(buildUserRow(u)); });
      return;
    }

    el.usersListLabel.textContent = 'Χρήστες (' + others.length + ')';
    var supervisors = others.filter(function (u) { return u.role === 'supervisor'; });
    var directUsers = others.filter(function (u) { return u.role === 'user' && !u.supervisorId; });

    supervisors.forEach(function (sup) {
      var team = others.filter(function (u) { return u.supervisorId === sup.id; });
      var headerRow = buildUserRow(sup);
      var headerMeta = headerRow.querySelector('.user-row-meta');
      headerMeta.textContent = team.length + '/10 χρήστες';
      el.usersList.appendChild(headerRow);
      team.forEach(function (u) { el.usersList.appendChild(buildUserRow(u, true)); });
    });

    if (directUsers.length > 0) {
      el.usersList.appendChild(buildGroupHeader('Απευθείας υπό Admin'));
      directUsers.forEach(function (u) { el.usersList.appendChild(buildUserRow(u, true)); });
    }
  }

  var pendingDeleteUser = null;

  function openDeleteUserConfirm(u) {
    pendingDeleteUser = u;
    el.deleteUserName.textContent = u.username;
    el.deleteUserOverlay.classList.add('show');
  }
  function closeDeleteUserConfirm() {
    pendingDeleteUser = null;
    el.deleteUserOverlay.classList.remove('show');
  }

  function confirmDeleteUser() {
    var userId = pendingDeleteUser && pendingDeleteUser.id;
    closeDeleteUserConfirm();
    if (!userId) return;
    callApi('delete_user', userId).then(function (res) {
      if (res && res.ok) {
        loadUsersList();
      } else {
        showToast((res && res.error) || 'Δεν ήταν δυνατή η διαγραφή.');
      }
    }).catch(function () {
      showToast('Δεν ήταν δυνατή η διαγραφή.');
    });
  }

  el.deleteUserCancelBtn.addEventListener('click', closeDeleteUserConfirm);
  el.deleteUserConfirmBtn.addEventListener('click', confirmDeleteUser);
  el.deleteUserOverlay.addEventListener('click', function (e) {
    if (e.target === el.deleteUserOverlay) closeDeleteUserConfirm();
  });

  function handleUserFormSubmit(e) {
    e.preventDefault();
    el.createUserError.hidden = true;

    var username = el.newUserUsername.value.trim();
    var password = el.newUserPassword.value;
    if (!username) return;
    if (userFormMode === 'create' && !password) return;

    el.createUserSubmitBtn.disabled = true;

    function onDone(res) {
      el.createUserSubmitBtn.disabled = false;
      if (!res || !res.ok) {
        el.createUserError.textContent = (res && res.error) || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
        el.createUserError.hidden = false;
        return;
      }
      showUsersListView();
      loadUsersList();
    }
    function onFail() {
      el.createUserSubmitBtn.disabled = false;
      el.createUserError.textContent = 'Δεν υπάρχει σύνδεση με τον διακομιστή αυτή τη στιγμή.';
      el.createUserError.hidden = false;
    }

    if (userFormMode === 'edit') {
      callApi('update_user', editingUserId, username, password || null).then(onDone).catch(onFail);
      return;
    }

    var role = state.role === 'admin' ? getNewUserRole() : 'user';
    var supervisorId = (state.role === 'admin' && role === 'user') ? (el.newUserSupervisor.value || null) : null;

    callApi('create_user', username, password, role, supervisorId).then(onDone).catch(onFail);
  }

  el.manageUsersBtn.addEventListener('click', openManageUsers);
  el.closeManageUsersBtn.addEventListener('click', closeManageUsers);
  el.manageUsersOverlay.addEventListener('click', function (e) {
    if (e.target === el.manageUsersOverlay) closeManageUsers();
  });
  el.showCreateUserBtn.addEventListener('click', openCreateUserForm);
  el.cancelUserFormBtn.addEventListener('click', showUsersListView);
  el.createUserForm.addEventListener('submit', handleUserFormSubmit);
  el.newUserRoleUser.addEventListener('change', function () {
    if (!el.newUserRoleUser.checked && !el.newUserRoleSupervisor.checked) {
      el.newUserRoleUser.checked = true;
    } else if (el.newUserRoleUser.checked) {
      el.newUserRoleSupervisor.checked = false;
    }
    el.newUserSupervisorField.hidden = getNewUserRole() !== 'user';
  });
  el.newUserRoleSupervisor.addEventListener('change', function () {
    if (!el.newUserRoleUser.checked && !el.newUserRoleSupervisor.checked) {
      el.newUserRoleSupervisor.checked = true;
    } else if (el.newUserRoleSupervisor.checked) {
      el.newUserRoleUser.checked = false;
    }
    el.newUserSupervisorField.hidden = getNewUserRole() !== 'user';
  });

  // ---- Home screen: section menu ----

  function buildMenuItem(section) {
    var item = document.createElement('button');
    item.className = 'menu-item';
    item.type = 'button';

    var badge = document.createElement('div');
    badge.className = 'menu-badge' + (section.id === 'all' ? ' all' : '');
    if (section.id === 'all') {
      badge.innerHTML = ICON_ALL;
    } else if (section.icon !== null && section.icon !== undefined) {
      var sprite = document.createElement('div');
      sprite.className = 'menu-icon-sprite';
      var spriteUrl = 'url(' + (SPRITE_FILES[state.vehicle] || SPRITE_FILES.auto) + ')';
      var spritePos = '0 -' + (section.icon * 40) + 'px';
      if (MASKABLE_SPRITES[state.vehicle]) {
        sprite.style.webkitMaskImage = spriteUrl;
        sprite.style.maskImage = spriteUrl;
        sprite.style.webkitMaskPosition = spritePos;
        sprite.style.maskPosition = spritePos;
      } else {
        sprite.classList.add('menu-icon-sprite-raw');
        sprite.style.backgroundImage = spriteUrl;
        sprite.style.backgroundPosition = spritePos;
      }
      badge.appendChild(sprite);
    } else {
      badge.innerHTML = ICON_SIGN;
    }

    var text = document.createElement('div');
    text.className = 'menu-text';
    var label = document.createElement('p');
    label.className = 'menu-label';
    label.textContent = section.label;
    var count = document.createElement('p');
    count.className = 'menu-count';
    count.textContent = section.count + (section.count === 1 ? ' ερώτηση' : ' ερωτήσεις');
    text.appendChild(label);
    text.appendChild(count);

    var chev = document.createElement('span');
    chev.className = 'menu-chev';
    chev.innerHTML = CHEV;

    item.appendChild(badge);
    item.appendChild(text);
    item.appendChild(chev);
    item.addEventListener('click', function () {
      if (section.id === 'all') {
        openSimSettings(section);
      } else {
        startQuiz(section);
      }
    });
    return item;
  }

  function renderSections(sections) {
    var allSection = sections.filter(function (s) { return s.id === 'all'; })[0];
    var categorySections = sections.filter(function (s) { return s.id !== 'all'; });

    el.menuPinned.innerHTML = '';
    if (allSection) {
      el.menuPinned.appendChild(buildMenuItem(allSection));
    }
    renderMistakesTile();

    state.categorySections = categorySections;
    state.page = 0;
    renderMenuPage();
  }

  var MISTAKES_THRESHOLD = 5;

  function buildMistakesTile(count) {
    var unlocked = count >= MISTAKES_THRESHOLD;
    var item = document.createElement('button');
    item.type = 'button';
    item.id = 'mistakesTile';
    item.className = 'menu-item mistakes-tile' + (unlocked ? '' : ' locked');

    var badge = document.createElement('div');
    badge.className = 'menu-badge mistakes';
    badge.innerHTML = ICON_MISTAKES;

    var text = document.createElement('div');
    text.className = 'menu-text';
    var label = document.createElement('p');
    label.className = 'menu-label';
    label.textContent = 'Εξάσκηση σε Λάθη';
    var sub = document.createElement('p');
    sub.className = 'menu-count';
    sub.textContent = unlocked
      ? (count + (count === 1 ? ' ερώτηση' : ' ερωτήσεις'))
      : ('Χρειάζεσαι τουλάχιστον ' + MISTAKES_THRESHOLD + ' λάθη (έχεις ' + count + ')');
    text.appendChild(label);
    text.appendChild(sub);

    var chev = document.createElement('span');
    chev.className = 'menu-chev';
    chev.innerHTML = unlocked ? CHEV : ICON_LOCK;

    item.appendChild(badge);
    item.appendChild(text);
    item.appendChild(chev);

    if (unlocked) {
      item.addEventListener('click', function () {
        startQuiz({ id: 'wrong', label: 'Εξάσκηση σε Λάθη' });
      });
    } else {
      item.disabled = true;
    }
    return item;
  }

  function renderMistakesTile() {
    var existing = document.getElementById('mistakesTile');
    if (existing) existing.remove();
    el.menuPinned.appendChild(buildMistakesTile(state.wrongCount || 0));
  }

  function loadWrongCount() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_wrong_count) {
      window.pywebview.api.get_wrong_count(state.vehicle).then(function (count) {
        state.wrongCount = count;
        renderMistakesTile();
      }).catch(function () {
        state.wrongCount = 0;
        renderMistakesTile();
      });
    } else {
      state.wrongCount = 0;
      renderMistakesTile();
    }
  }

  function updateSavedQuestionsButton() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_saved_questions) {
      window.pywebview.api.get_saved_questions(state.vehicle).then(function (list) {
        el.savedQuestionsCount.textContent = list.length;
      }).catch(function () {
        el.savedQuestionsCount.textContent = '0';
      });
    } else {
      el.savedQuestionsCount.textContent = '0';
    }
  }

  function renderMenuPage() {
    var total = state.categorySections.length;
    var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page >= totalPages) state.page = totalPages - 1;
    if (state.page < 0) state.page = 0;

    var start = state.page * PAGE_SIZE;
    var pageItems = state.categorySections.slice(start, start + PAGE_SIZE);

    el.menuList.innerHTML = '';
    pageItems.forEach(function (section) {
      el.menuList.appendChild(buildMenuItem(section));
    });

    el.pageIndicator.textContent = (state.page + 1) + ' / ' + totalPages;
    el.pagePrevBtn.disabled = state.page === 0;
    el.pageNextBtn.disabled = state.page >= totalPages - 1;
    el.menuPagination.style.display = totalPages > 1 ? 'flex' : 'none';
  }

  el.pagePrevBtn.addEventListener('click', function () {
    if (state.page > 0) {
      state.page -= 1;
      renderMenuPage();
    }
  });
  el.pageNextBtn.addEventListener('click', function () {
    var totalPages = Math.max(1, Math.ceil(state.categorySections.length / PAGE_SIZE));
    if (state.page < totalPages - 1) {
      state.page += 1;
      renderMenuPage();
    }
  });

  function loadSections() {
    var fallback = state.vehicle === 'moto' ? FALLBACK_SECTIONS_MOTO
      : state.vehicle === 'truck' ? FALLBACK_SECTIONS_TRUCK
      : state.vehicle === 'bus' ? FALLBACK_SECTIONS_BUS
      : state.vehicle === 'peiforthgo' ? FALLBACK_SECTIONS_PEIFORTHGO
      : FALLBACK_SECTIONS_AUTO;
    callApi('get_sections', state.vehicle).then(renderSections).catch(function () {
      renderSections(fallback);
    });
    loadWrongCount();
    updateSavedQuestionsButton();
  }

  function selectVehicle(vehicle) {
    state.vehicle = vehicle;
    showScreen('home');
    loadSections();
  }

  el.vehicleAutoBtn.addEventListener('click', function () { selectVehicle('auto'); });
  el.vehicleMotoBtn.addEventListener('click', function () { selectVehicle('moto'); });
  el.vehicleTruckBtn.addEventListener('click', function () { selectVehicle('truck'); });
  el.vehicleBusBtn.addEventListener('click', function () { selectVehicle('bus'); });
  el.vehiclePeiforthgoBtn.addEventListener('click', function () { selectVehicle('peiforthgo'); });

  // ---- Quiz screen ----

  function buildFallbackQuestions(section) {
    var questions = [];
    for (var i = 1; i <= section.count; i++) {
      questions.push({
        id: 'fallback-' + section.id + '-' + i,
        category: section.id,
        question: 'Placeholder ερώτηση ' + i + ' για την ενότητα «' + section.label + '».',
        image: 'placeholder',
        answers: ['Placeholder Α', 'Placeholder Β', 'Placeholder Γ', 'Placeholder Δ'],
        correctIndex: 0,
        explanation: 'Placeholder επεξήγηση για την ερώτηση ' + i + '.'
      });
    }
    return questions;
  }

  // ---- Simulation settings popup ----

  function wireSegmented(container, initial) {
    var value = initial;
    var segments = container.querySelectorAll('.segment');
    segments.forEach(function (seg) {
      if (seg.getAttribute('data-value') === initial) seg.classList.add('active');
      seg.addEventListener('click', function () {
        value = seg.getAttribute('data-value');
        segments.forEach(function (s) { s.classList.toggle('active', s === seg); });
        container.dispatchEvent(new CustomEvent('segmentchange', { detail: value }));
      });
    });
    return {
      get: function () { return value; }
    };
  }

  var simQuestionCountCtl = wireSegmented(el.simQuestionCount, '30');
  var simTimerModeCtl = wireSegmented(el.simTimerMode, 'off');
  var simTimerDurationCtl = wireSegmented(el.simTimerDuration, '20');
  var simTimerPerQuestionCtl = wireSegmented(el.simTimerPerQuestion, '30');

  el.simTimerMode.addEventListener('segmentchange', function (e) {
    el.simTimerDurationRow.hidden = e.detail !== 'exam';
    el.simTimerPerQuestionRow.hidden = e.detail !== 'question';
  });

  function openSimSettings(section) {
    state.pendingSimSection = section;
    el.simSettingsOverlay.classList.add('show');
  }
  function closeSimSettings() {
    el.simSettingsOverlay.classList.remove('show');
    state.pendingSimSection = null;
  }

  el.closeSimSettingsBtn.addEventListener('click', closeSimSettings);
  el.simSettingsCancelBtn.addEventListener('click', closeSimSettings);
  el.simSettingsOverlay.addEventListener('click', function (e) {
    if (e.target === el.simSettingsOverlay) closeSimSettings();
  });
  el.simSettingsStartBtn.addEventListener('click', function () {
    var section = state.pendingSimSection;
    if (!section) return;
    var timerMode = simTimerModeCtl.get();
    var settings = {
      questionCount: parseInt(simQuestionCountCtl.get(), 10),
      timerMode: timerMode,
      timerMinutes: timerMode === 'exam' ? parseInt(simTimerDurationCtl.get(), 10) : null,
      timerSecondsPerQuestion: timerMode === 'question' ? parseInt(simTimerPerQuestionCtl.get(), 10) : null,
      feedbackMode: 'hidden'
    };
    closeSimSettings();
    startQuiz(section, settings);
  });

  function startQuiz(section, simSettings) {
    state.simSettings = simSettings || null;

    if (section.id === 'wrong') {
      callApi('get_wrong_questions', state.vehicle).then(function (questions) {
        beginQuiz(section, questions);
      }).catch(function () {
        showToast('Δεν ήταν δυνατή η φόρτωση των λαθών.');
      });
      return;
    }

    var count = (simSettings && section.id === 'all') ? simSettings.questionCount : null;
    var fallbackSection = count ? Object.assign({}, section, { count: count }) : section;
    callApi('get_questions', state.vehicle, section.id, count).then(function (questions) {
      beginQuiz(section, questions);
    }).catch(function () {
      beginQuiz(section, buildFallbackQuestions(fallbackSection));
    });
  }

  function beginQuiz(section, questions) {
    if (!questions || questions.length === 0) {
      showToast('Δεν υπάρχουν ερωτήσεις σε αυτή την ενότητα ακόμα.');
      return;
    }
    state.sectionId = section.id;
    state.sectionLabel = section.label;
    state.questions = questions;
    state.selected = new Array(questions.length).fill(null);
    state.index = 0;
    state.savedIds = new Set();
    refreshSavedIds();
    var vehicleLabel = VEHICLE_LABELS[state.vehicle];
    el.sectionBannerLabel.textContent = vehicleLabel ? (vehicleLabel + ' - ' + section.label) : section.label;
    showScreen('quiz');
    stopTimer();
    var settings = state.simSettings;
    if (settings && settings.timerMode === 'exam') {
      setupExamTimer(settings.timerMinutes * 60);
    } else if (settings && settings.timerMode === 'question') {
      setupExamTimer(settings.timerSecondsPerQuestion * questions.length);
    } else {
      el.quizTimer.hidden = true;
    }
    renderQuizQuestion();
  }

  function refreshSavedIds() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.get_saved_questions) {
      window.pywebview.api.get_saved_questions(state.vehicle).then(function (list) {
        state.savedIds = new Set(list.map(function (q) { return q.id; }));
        updateFlagButton();
      }).catch(function () {});
    }
  }

  // ---- Simulation timer ----

  function stopTimer() {
    if (state.timerHandle) {
      clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
  }

  function formatTime(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function setupExamTimer(totalSeconds) {
    stopTimer();
    state.timerSecondsLeft = totalSeconds;
    el.quizTimer.hidden = false;
    el.quizTimer.classList.remove('warning');
    el.quizTimer.textContent = formatTime(state.timerSecondsLeft);
    state.timerHandle = setInterval(function () {
      state.timerSecondsLeft -= 1;
      if (state.timerSecondsLeft <= 0) {
        el.quizTimer.textContent = '0:00';
        stopTimer();
        finishQuiz();
        return;
      }
      el.quizTimer.textContent = formatTime(state.timerSecondsLeft);
      el.quizTimer.classList.toggle('warning', state.timerSecondsLeft <= 60);
    }, 1000);
  }

  function renderQuizQuestion() {
    el.screenQuiz.scrollTop = 0;

    var total = state.questions.length;
    var isLast = state.index === total - 1;
    var q = state.questions[state.index];

    el.qIndex.textContent = state.index + 1;
    el.qTotal.textContent = total;
    var progressPct = ((state.index + 1) / total) * 100;
    el.progressFill.style.width = progressPct + '%';
    el.roadCar.style.left = progressPct + '%';

    el.prevBtn.style.visibility = state.index === 0 ? 'hidden' : 'visible';
    el.nextBtn.style.display = isLast ? 'none' : 'flex';
    el.submitBtn.style.display = isLast ? 'flex' : 'none';

    if (q.image) {
      el.quizImageFrame.style.display = 'flex';
      el.quizImage.src = 'assets/signs/' + q.image;
    } else {
      el.quizImageFrame.style.display = 'none';
      el.quizImage.removeAttribute('src');
    }
    el.quizQuestionText.textContent = q.question;
    updateFlagButton();

    renderAnswers(q);
  }

  function updateFlagButton() {
    var q = state.questions[state.index];
    if (!q) return;
    var isSaved = state.savedIds.has(q.id);
    el.quizFlagBtn.classList.toggle('active', isSaved);
    el.quizFlagBtn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
  }

  function toggleSaveCurrentQuestion() {
    var q = state.questions[state.index];
    if (!q) return;
    var isSaved = state.savedIds.has(q.id);
    if (isSaved) {
      state.savedIds.delete(q.id);
      if (window.pywebview && window.pywebview.api && window.pywebview.api.unsave_question) {
        window.pywebview.api.unsave_question(state.vehicle, q.id);
      }
    } else {
      state.savedIds.add(q.id);
      if (window.pywebview && window.pywebview.api && window.pywebview.api.save_question) {
        window.pywebview.api.save_question(state.vehicle, q.id, q.category);
      }
    }
    updateFlagButton();
  }

  el.quizFlagBtn.addEventListener('click', toggleSaveCurrentQuestion);

  function renderAnswers(q) {
    el.quizFeedback.className = 'quiz-feedback';
    el.quizFeedback.textContent = '';
    el.quizAnswers.innerHTML = '';

    var selected = state.selected[state.index];
    var hideFeedback = !!(state.simSettings && state.simSettings.feedbackMode === 'hidden');

    q.answers.forEach(function (text, idx) {
      var btn = document.createElement('button');
      btn.className = 'quiz-answer';
      btn.type = 'button';
      btn.textContent = text;
      if (hideFeedback) {
        // Answer stays locked-in-place but changeable: no reveal until results,
        // so re-clicking to change your mind is always allowed here.
        if (idx === selected) btn.classList.add('selected');
        btn.addEventListener('click', function () { selectAnswer(idx); });
      } else if (selected === null) {
        btn.addEventListener('click', function () { selectAnswer(idx); });
      } else {
        btn.disabled = true;
        if (idx === q.correctIndex) {
          btn.classList.add('correct');
        } else if (idx === selected) {
          btn.classList.add('wrong');
        }
      }
      el.quizAnswers.appendChild(btn);
    });

    if (selected !== null && !hideFeedback) {
      showAnswerFeedback(q, selected);
    }
  }

  function showAnswerFeedback(q, selected) {
    var verdict = selected === q.correctIndex
      ? { cls: 'ok', label: 'Σωστά.' }
      : { cls: 'no', label: 'Λάθος.' };
    el.quizFeedback.className = 'quiz-feedback show ' + verdict.cls;
    el.quizFeedback.innerHTML = '<b>' + verdict.label + '</b>' + (q.explanation ? ' ' + q.explanation : '');
  }

  function selectAnswer(idx) {
    state.selected[state.index] = idx;
    renderAnswers(state.questions[state.index]);
    requestAnimationFrame(function () {
      el.quizNavRow.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
  }

  el.prevBtn.addEventListener('click', function () {
    if (state.index > 0) {
      state.index -= 1;
      renderQuizQuestion();
    }
  });
  el.nextBtn.addEventListener('click', function () {
    if (state.index < state.questions.length - 1) {
      state.index += 1;
      renderQuizQuestion();
    }
  });

  // ---- Submit & results ----

  function handleSubmit() {
    var unanswered = [];
    state.selected.forEach(function (sel, i) {
      if (sel === null) unanswered.push(i + 1);
    });
    if (unanswered.length > 0) {
      showIncompleteWarning(unanswered);
      return;
    }
    finishQuiz();
  }

  function showIncompleteWarning(unanswered) {
    var word = unanswered.length === 1 ? 'ερώτηση' : 'ερωτήσεις';
    el.incompleteMessage.textContent =
      'Δεν έχεις απαντήσει στις ' + word + ': ' + unanswered.join(', ') +
      '. Γύρνα πίσω και συμπλήρωσέ τις πριν την υποβολή.';
    el.incompleteOverlay.classList.add('show');
  }
  function closeIncompleteWarning() {
    el.incompleteOverlay.classList.remove('show');
  }

  function finishQuiz() {
    stopTimer();
    var total = state.questions.length;
    var correct = 0;
    var results = [];
    state.questions.forEach(function (q, i) {
      var isCorrect = state.selected[i] === q.correctIndex;
      if (isCorrect) correct += 1;
      results.push({ id: q.id, category: q.category, correct: isCorrect });
    });
    var pct = Math.round((correct / total) * 100);

    el.resultsPercent.textContent = pct + '%';
    el.resultsFraction.textContent = correct + ' από ' + total + ' σωστές';
    el.resultsMessage.textContent =
      pct === 100 ? 'Άριστα! Καθαρό μηδέν λαθών.' :
      pct >= 70 ? 'Πολύ καλή προσπάθεια! Λίγη ακόμα εξάσκηση και είσαι έτοιμος/η.' :
      pct >= 40 ? 'Καλή αρχή — χρειάζεσαι λίγη ακόμα εξάσκηση σε αυτή την ενότητα.' :
      'Χρειάζεσαι περισσότερη εξάσκηση σε αυτή την ενότητα πριν το τεστ.';

    renderResultsReview();
    showScreen('results');

    if (window.pywebview && window.pywebview.api && window.pywebview.api.save_attempt) {
      window.pywebview.api.save_attempt(state.vehicle, state.sectionId, state.sectionLabel, correct, total);
    }
    if (window.pywebview && window.pywebview.api && window.pywebview.api.record_quiz_results) {
      window.pywebview.api.record_quiz_results(state.vehicle, results);
    }
  }

  var categoryPositionCache = {};

  function loadQuestionDetailMeta(q) {
    var cacheKey = state.vehicle + '::' + q.category;
    var cached = categoryPositionCache[cacheKey];
    if (cached) {
      applyQuestionDetailMeta(q, cached);
      return;
    }
    if (!(window.pywebview && window.pywebview.api && window.pywebview.api.get_questions)) {
      return;
    }
    window.pywebview.api.get_questions(state.vehicle, q.category).then(function (categoryQuestions) {
      categoryPositionCache[cacheKey] = categoryQuestions;
      applyQuestionDetailMeta(q, categoryQuestions);
    }).catch(function () {});
  }

  function applyQuestionDetailMeta(q, categoryQuestions) {
    var pos = categoryQuestions.findIndex(function (cq) { return cq.id === q.id; });
    if (pos === -1) return;
    el.questionDetailMeta.textContent = q.category + ' - ' + (pos + 1);
  }

  function showQuestionDetail(q, options) {
    options = options || {};

    el.questionDetailTitle.textContent = options.title || 'Ερώτηση';

    if (q.image) {
      el.questionDetailImageFrame.hidden = false;
      el.questionDetailImage.src = 'assets/signs/' + q.image;
    } else {
      el.questionDetailImageFrame.hidden = true;
      el.questionDetailImage.removeAttribute('src');
    }

    el.questionDetailText.textContent = q.question;
    el.questionDetailMeta.textContent = q.category;
    loadQuestionDetailMeta(q);

    el.questionDetailAnswers.innerHTML = '';
    q.answers.forEach(function (text, idx) {
      var btn = document.createElement('button');
      btn.className = 'quiz-answer';
      btn.type = 'button';
      btn.disabled = true;
      btn.textContent = text;
      if (idx === q.correctIndex) {
        btn.classList.add('correct');
      } else if (options.selected !== undefined && idx === options.selected) {
        btn.classList.add('wrong');
      }
      el.questionDetailAnswers.appendChild(btn);
    });

    el.questionDetailOverlay.classList.add('show');
  }

  function openQuestionDetail(index) {
    var q = state.questions[index];
    showQuestionDetail(q, { title: 'Ερώτηση ' + (index + 1), selected: state.selected[index] });
  }

  function openSavedQuestionDetail(q) {
    showQuestionDetail(q, { title: 'Αποθηκευμένη Ερώτηση' });
  }

  function closeQuestionDetail() {
    el.questionDetailOverlay.classList.remove('show');
  }

  el.closeQuestionDetailBtn.addEventListener('click', closeQuestionDetail);
  el.questionDetailOverlay.addEventListener('click', function (e) {
    if (e.target === el.questionDetailOverlay) closeQuestionDetail();
  });

  // ---- Saved questions ----

  function openSavedQuestions() {
    el.savedQuestionsOverlay.classList.add('show');
    loadSavedQuestionsList();
  }
  function closeSavedQuestions() {
    el.savedQuestionsOverlay.classList.remove('show');
  }

  function loadSavedQuestionsList() {
    callApi('get_saved_questions', state.vehicle).then(renderSavedQuestionsList).catch(function () {
      renderSavedQuestionsList([]);
    });
  }

  function renderSavedQuestionsList(questions) {
    el.savedQuestionsList.innerHTML = '';
    el.savedQuestionsEmpty.hidden = questions.length > 0;

    questions.forEach(function (q) {
      var item = document.createElement('div');
      item.className = 'saved-item';

      var text = document.createElement('button');
      text.type = 'button';
      text.className = 'saved-item-text';
      var qText = document.createElement('p');
      qText.className = 'saved-item-question';
      qText.textContent = q.question;
      var qMeta = document.createElement('p');
      qMeta.className = 'saved-item-meta';
      qMeta.textContent = q.category;
      text.appendChild(qText);
      text.appendChild(qMeta);
      text.addEventListener('click', function () { openSavedQuestionDetail(q); });

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'icon-btn saved-item-remove';
      removeBtn.setAttribute('aria-label', 'Αφαίρεση από τις αποθηκευμένες');
      removeBtn.innerHTML = ICON_TRASH;
      removeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        state.savedIds.delete(q.id);
        if (window.pywebview && window.pywebview.api && window.pywebview.api.unsave_question) {
          window.pywebview.api.unsave_question(state.vehicle, q.id);
        }
        loadSavedQuestionsList();
        updateSavedQuestionsButton();
      });

      item.appendChild(text);
      item.appendChild(removeBtn);
      el.savedQuestionsList.appendChild(item);
    });
  }

  el.savedQuestionsBtn.addEventListener('click', openSavedQuestions);
  el.closeSavedQuestionsBtn.addEventListener('click', closeSavedQuestions);
  el.savedQuestionsOverlay.addEventListener('click', function (e) {
    if (e.target === el.savedQuestionsOverlay) closeSavedQuestions();
  });

  function renderResultsReview() {
    el.resultsReview.innerHTML = '';
    var showReview = !!(state.simSettings && state.simSettings.feedbackMode === 'hidden');
    el.resultsReview.hidden = !showReview;
    if (!showReview) return;

    state.questions.forEach(function (q, i) {
      var sel = state.selected[i];
      var isCorrect = sel === q.correctIndex;

      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'review-item ' + (isCorrect ? 'correct' : 'wrong');

      var qText = document.createElement('p');
      qText.className = 'review-q';
      qText.textContent = (i + 1) + '. ' + q.question;
      item.appendChild(qText);

      if (!isCorrect) {
        var yourAnswer = document.createElement('p');
        yourAnswer.className = 'review-answer your-wrong';
        yourAnswer.textContent = '✗ ' + (sel !== null ? q.answers[sel] : 'Δεν απαντήθηκε');
        item.appendChild(yourAnswer);
      }

      var correctAnswer = document.createElement('p');
      correctAnswer.className = 'review-answer correct-answer';
      correctAnswer.textContent = '✓ ' + q.answers[q.correctIndex];
      item.appendChild(correctAnswer);

      item.addEventListener('click', function () { openQuestionDetail(i); });

      el.resultsReview.appendChild(item);
    });
  }

  el.submitBtn.addEventListener('click', handleSubmit);
  el.incompleteOkBtn.addEventListener('click', closeIncompleteWarning);
  el.incompleteOverlay.addEventListener('click', function (e) {
    if (e.target === el.incompleteOverlay) closeIncompleteWarning();
  });
  el.resultsHomeBtn.addEventListener('click', function () {
    showScreen('home');
  });

  // ---- Theme ----

  var darkMql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function resolveIsDark() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark') return true;
    if (attr === 'light') return false;
    return !!(darkMql && darkMql.matches);
  }

  function syncTitlebarTheme() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.set_titlebar_theme) {
      window.pywebview.api.set_titlebar_theme(resolveIsDark());
    }
  }

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    var segments = el.themeSegmented.querySelectorAll('.segment');
    segments.forEach(function (segment) {
      segment.classList.toggle('active', segment.getAttribute('data-theme') === theme);
    });
    syncTitlebarTheme();
  }

  function initTheme() {
    var saved = 'system';
    try {
      saved = localStorage.getItem(THEME_KEY) || 'system';
    } catch (e) {}
    applyTheme(saved);
  }

  // ---- Text size (zoom) ----

  function applyZoom(percent) {
    document.documentElement.style.setProperty('--ui-scale', percent / 100);
    el.zoomValue.textContent = percent + '%';
  }

  function initZoom() {
    var saved = 100;
    try {
      var stored = localStorage.getItem(ZOOM_KEY);
      if (stored) saved = parseInt(stored, 10);
    } catch (e) {}
    el.zoomSlider.value = saved;
    applyZoom(saved);
  }

  el.zoomSlider.addEventListener('input', function () {
    var val = parseInt(el.zoomSlider.value, 10);
    applyZoom(val);
    try {
      localStorage.setItem(ZOOM_KEY, String(val));
    } catch (e) {}
  });

  if (darkMql) {
    darkMql.addEventListener('change', syncTitlebarTheme);
  }

  el.themeSegmented.addEventListener('click', function (e) {
    var target = e.target.closest('.segment');
    if (!target) return;
    var theme = target.getAttribute('data-theme');
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  });

  // ---- Progress / history ----

  function formatAttemptDate(iso) {
    var d = new Date(iso);
    return d.toLocaleString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function openProgress() {
    el.progressOverlay.classList.add('show');
    loadProgress();
  }
  function closeProgress() {
    el.progressOverlay.classList.remove('show');
  }

  function loadProgress() {
    callApi('get_stats').then(renderProgressSummary).catch(function () {
      el.progressSummaryPercent.textContent = '—';
      el.progressSummarySub.textContent = 'Διαθέσιμο μόνο μέσα στην εφαρμογή.';
      el.progressByVehicle.innerHTML = '';
    });
    callApi('get_history', 20).then(renderProgressHistory).catch(function () {
      el.progressHistoryLabel.hidden = true;
      el.progressHistoryList.innerHTML = '';
    });
  }

  function renderProgressSummary(stats) {
    el.progressByVehicle.innerHTML = '';
    if (!stats.attemptCount) {
      el.progressSummaryPercent.textContent = '—';
      el.progressSummarySub.textContent = 'Δεν έχεις κάνει ακόμα κανένα τεστ.';
      return;
    }
    var word = stats.attemptCount === 1 ? 'τεστ' : 'τεστ';
    el.progressSummaryPercent.textContent = stats.avgPercent + '%';
    el.progressSummarySub.textContent = 'Μέσος όρος σε ' + stats.attemptCount + ' ' + word;

    stats.perVehicle.forEach(function (v) {
      var row = document.createElement('div');
      row.className = 'progress-vehicle-row';
      var label = document.createElement('span');
      label.className = 'progress-vehicle-label';
      label.textContent = VEHICLE_LABELS[v.vehicle] || v.vehicle;
      var value = document.createElement('span');
      value.className = 'progress-vehicle-value';
      var vWord = v.attemptCount === 1 ? 'τεστ' : 'τεστ';
      value.textContent = (v.avgPercent !== null ? v.avgPercent + '%' : '—') + ' · ' + v.attemptCount + ' ' + vWord;
      row.appendChild(label);
      row.appendChild(value);
      el.progressByVehicle.appendChild(row);
    });
  }

  function renderProgressHistory(history) {
    el.progressHistoryList.innerHTML = '';
    el.progressHistoryLabel.hidden = history.length === 0;

    history.forEach(function (h) {
      var pct = Math.round((h.correct / h.total) * 100);
      var item = document.createElement('div');
      item.className = 'history-item';

      var top = document.createElement('div');
      top.className = 'history-item-top';
      var label = document.createElement('span');
      label.className = 'history-item-label';
      label.textContent = (VEHICLE_LABELS[h.vehicle] || h.vehicle) + ' - ' + h.sectionLabel;
      var pctEl = document.createElement('span');
      pctEl.className = 'history-item-pct ' + (pct >= 70 ? 'good' : pct >= 40 ? 'mid' : 'low');
      pctEl.textContent = pct + '%';
      top.appendChild(label);
      top.appendChild(pctEl);

      var bottom = document.createElement('div');
      bottom.className = 'history-item-bottom';
      bottom.textContent = h.correct + '/' + h.total + ' · ' + formatAttemptDate(h.completedAt);

      item.appendChild(top);
      item.appendChild(bottom);
      el.progressHistoryList.appendChild(item);
    });
  }

  el.progressBtn.addEventListener('click', openProgress);
  el.closeProgressBtn.addEventListener('click', closeProgress);
  el.progressOverlay.addEventListener('click', function (e) {
    if (e.target === el.progressOverlay) closeProgress();
  });

  // ---- Settings ----

  function openSettings() {
    el.settingsOverlay.classList.add('show');
  }
  function closeSettings() {
    el.settingsOverlay.classList.remove('show');
  }

  el.settingsBtn.addEventListener('click', openSettings);
  el.closeSettingsBtn.addEventListener('click', closeSettings);
  el.settingsOverlay.addEventListener('click', function (e) {
    if (e.target === el.settingsOverlay) closeSettings();
  });

  // ---- Admin analytics ----

  function openAnalytics() {
    el.analyticsOverlay.classList.add('show');
    loadAnalytics();
  }
  function closeAnalytics() {
    el.analyticsOverlay.classList.remove('show');
  }

  function loadAnalytics() {
    callApi('get_admin_analytics').then(renderAnalytics).catch(function () {
      el.analyticsOverallPercent.textContent = '—';
      el.analyticsOverallSub.textContent = 'Δεν ήταν δυνατή η φόρτωση.';
      el.analyticsUserCounts.textContent = '—';
      el.analyticsByVehicle.innerHTML = '';
      el.analyticsVehicleLabel.hidden = true;
      el.analyticsBySupervisor.innerHTML = '';
      el.analyticsSupervisorLabel.hidden = true;
      el.analyticsRecentList.innerHTML = '';
      el.analyticsRecentLabel.hidden = true;
    });
  }

  function buildStatRow(label, stats) {
    var row = document.createElement('div');
    row.className = 'progress-vehicle-row';
    var labelEl = document.createElement('span');
    labelEl.className = 'progress-vehicle-label';
    labelEl.textContent = label;
    var valueEl = document.createElement('span');
    valueEl.className = 'progress-vehicle-value';
    valueEl.textContent = (stats.avgPercent !== null ? stats.avgPercent + '%' : '—') + ' · ' + stats.attemptCount + ' τεστ';
    row.appendChild(labelEl);
    row.appendChild(valueEl);
    return row;
  }

  function renderAnalytics(data) {
    if (!data.attemptCount) {
      el.analyticsOverallPercent.textContent = '—';
      el.analyticsOverallSub.textContent = 'Δεν υπάρχουν ακόμα τεστ.';
    } else {
      el.analyticsOverallPercent.textContent = data.overallPercent + '%';
      el.analyticsOverallSub.textContent = 'Μέσος όρος σε ' + data.attemptCount + ' τεστ, όλων των χρηστών';
    }

    var counts = data.userCounts;
    el.analyticsUserCounts.textContent =
      (counts.admin || 0) + ' admin, ' + (counts.supervisor || 0) + ' επόπτες, ' + (counts.user || 0) + ' χρήστες';

    el.analyticsByVehicle.innerHTML = '';
    el.analyticsVehicleLabel.hidden = data.byVehicle.length === 0;
    data.byVehicle.forEach(function (v) {
      el.analyticsByVehicle.appendChild(buildStatRow(v.label, v));
    });

    el.analyticsBySupervisor.innerHTML = '';
    el.analyticsSupervisorLabel.hidden = data.bySupervisor.length === 0 && data.directUsers.userCount === 0;
    data.bySupervisor.forEach(function (sup) {
      el.analyticsBySupervisor.appendChild(buildStatRow(sup.username + ' (' + sup.userCount + '/10)', sup));
    });
    if (data.directUsers.userCount > 0) {
      el.analyticsBySupervisor.appendChild(buildStatRow('Απευθείας υπό Admin (' + data.directUsers.userCount + ')', data.directUsers));
    }

    el.analyticsRecentList.innerHTML = '';
    el.analyticsRecentLabel.hidden = data.recent.length === 0;
    data.recent.forEach(function (a) {
      var pct = Math.round((a.correct / a.total) * 100);
      var item = document.createElement('div');
      item.className = 'history-item';

      var top = document.createElement('div');
      top.className = 'history-item-top';
      var label = document.createElement('span');
      label.className = 'history-item-label';
      label.textContent = a.username + ' · ' + a.vehicle;
      var pctEl = document.createElement('span');
      pctEl.className = 'history-item-pct ' + (pct >= 70 ? 'good' : pct >= 40 ? 'mid' : 'low');
      pctEl.textContent = pct + '%';
      top.appendChild(label);
      top.appendChild(pctEl);

      var bottom = document.createElement('div');
      bottom.className = 'history-item-bottom';
      bottom.textContent = a.correct + '/' + a.total + ' · ' + formatAttemptDate(a.completedAt);

      item.appendChild(top);
      item.appendChild(bottom);
      el.analyticsRecentList.appendChild(item);
    });
  }

  el.analyticsBtn.addEventListener('click', openAnalytics);
  el.closeAnalyticsBtn.addEventListener('click', closeAnalytics);
  el.analyticsOverlay.addEventListener('click', function (e) {
    if (e.target === el.analyticsOverlay) closeAnalytics();
  });

  // ---- Profile (change password / sign out / exit) ----

  function hideChangePasswordForm() {
    el.showChangePasswordBtn.hidden = false;
    el.changePasswordForm.hidden = true;
  }
  function showChangePasswordForm() {
    el.changePasswordForm.reset();
    el.changePasswordError.hidden = true;
    el.showChangePasswordBtn.hidden = true;
    el.changePasswordForm.hidden = false;
    el.newPasswordInput.focus();
  }

  function openProfile() {
    hideChangePasswordForm();
    el.profileOverlay.classList.add('show');
  }
  function closeProfile() {
    el.profileOverlay.classList.remove('show');
  }

  function handleChangePasswordSubmit(e) {
    e.preventDefault();
    el.changePasswordError.hidden = true;

    var newPassword = el.newPasswordInput.value;
    var confirmPassword = el.newPasswordConfirmInput.value;
    if (!newPassword) return;

    if (newPassword !== confirmPassword) {
      el.changePasswordError.textContent = 'Οι κωδικοί δεν ταιριάζουν.';
      el.changePasswordError.hidden = false;
      return;
    }

    el.changePasswordSubmitBtn.disabled = true;
    callApi('change_password', newPassword).then(function (res) {
      el.changePasswordSubmitBtn.disabled = false;
      if (!res || !res.ok) {
        el.changePasswordError.textContent = (res && res.error) || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
        el.changePasswordError.hidden = false;
        return;
      }
      hideChangePasswordForm();
      showToast('Ο κωδικός άλλαξε επιτυχώς.');
    }).catch(function () {
      el.changePasswordSubmitBtn.disabled = false;
      el.changePasswordError.textContent = 'Δεν υπάρχει σύνδεση με τον διακομιστή αυτή τη στιγμή.';
      el.changePasswordError.hidden = false;
    });
  }

  el.profileBtn.addEventListener('click', openProfile);
  el.closeProfileBtn.addEventListener('click', closeProfile);
  el.showChangePasswordBtn.addEventListener('click', showChangePasswordForm);
  el.cancelChangePasswordBtn.addEventListener('click', hideChangePasswordForm);
  el.profileOverlay.addEventListener('click', function (e) {
    if (e.target === el.profileOverlay) closeProfile();
  });
  el.changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);

  // ---- Fullscreen toggle ----

  var isFullscreen = false;

  function renderFullscreenBtn() {
    el.fullscreenBtn.innerHTML = (isFullscreen ? ICON_EXIT_FULLSCREEN : ICON_ENTER_FULLSCREEN) +
      (isFullscreen ? 'Παράθυρο' : 'Πλήρης οθόνη');
  }

  function toggleFullscreen() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.toggle_fullscreen) {
      window.pywebview.api.toggle_fullscreen();
    }
    isFullscreen = !isFullscreen;
    renderFullscreenBtn();
  }

  el.fullscreenBtn.addEventListener('click', toggleFullscreen);
  renderFullscreenBtn();

  // ---- Exit app confirmation ----

  function openExitConfirm() {
    closeProfile();
    el.exitOverlay.classList.add('show');
  }
  function closeExitConfirm() {
    el.exitOverlay.classList.remove('show');
  }
  function confirmExit() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.close_app) {
      window.pywebview.api.close_app();
    } else {
      window.close();
    }
  }

  el.closeAppFromProfileBtn.addEventListener('click', openExitConfirm);
  el.exitCancelBtn.addEventListener('click', closeExitConfirm);
  el.exitConfirmBtn.addEventListener('click', confirmExit);
  el.exitOverlay.addEventListener('click', function (e) {
    if (e.target === el.exitOverlay) closeExitConfirm();
  });

  // ---- Logo click: leave quiz confirmation ----

  function openLeaveQuizConfirm() {
    el.leaveQuizOverlay.classList.add('show');
  }
  function closeLeaveQuizConfirm() {
    el.leaveQuizOverlay.classList.remove('show');
  }
  function confirmLeaveQuiz() {
    stopTimer();
    closeLeaveQuizConfirm();
    showScreen('vehicles');
  }

  el.brandLogo.addEventListener('click', function () {
    if (state.screen === 'quiz') {
      openLeaveQuizConfirm();
    } else if (state.screen === 'home') {
      showScreen('vehicles');
    }
  });
  el.leaveQuizCancelBtn.addEventListener('click', closeLeaveQuizConfirm);
  el.leaveQuizConfirmBtn.addEventListener('click', confirmLeaveQuiz);
  el.leaveQuizOverlay.addEventListener('click', function (e) {
    if (e.target === el.leaveQuizOverlay) closeLeaveQuizConfirm();
  });

  el.quizImage.addEventListener('error', function () {
    el.quizImageFrame.style.display = 'none';
  });

  initTheme();
  initZoom();
  prefillRememberedUsername();
  showScreen('login');

  window.addEventListener('pywebviewready', function () {
    syncTitlebarTheme();
  });
})();
