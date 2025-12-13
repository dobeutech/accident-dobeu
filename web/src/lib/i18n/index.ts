import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'es' | 'fr';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // App
    'app.name': 'FleetGuard Accident Reporter',
    'app.tagline': 'Document accidents quickly and accurately',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.reports': 'Reports',
    'nav.users': 'Users',
    'nav.formBuilder': 'Form Builder',
    'nav.exports': 'Exports',
    'nav.settings': 'Settings',
    'nav.signOut': 'Sign Out',
    
    // Auth
    'auth.signIn': 'Sign In',
    'auth.signOut': 'Sign Out',
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.rememberMe': 'Remember me',
    'auth.welcome': 'Welcome back',
    'auth.contactAdmin': 'Contact your fleet administrator for account access',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Overview of your fleet\'s incident reports',
    'dashboard.totalReports': 'Total Reports',
    'dashboard.newSubmissions': 'New Submissions',
    'dashboard.underReview': 'Under Review',
    'dashboard.closed': 'Closed',
    'dashboard.recentReports': 'Recent Reports',
    'dashboard.viewAll': 'View all',
    'dashboard.livePhotoFeed': 'Live Photo Feed',
    'dashboard.noPhotos': 'No live photos yet. Photos will appear here as drivers capture them.',
    
    // Reports
    'reports.title': 'Reports',
    'reports.subtitle': 'View and manage all incident reports',
    'reports.search': 'Search reports...',
    'reports.export': 'Export Reports',
    'reports.noReports': 'No reports found',
    'reports.allStatuses': 'All Statuses',
    'reports.allTypes': 'All Types',
    
    // Incident Types
    'incident.accident': 'Vehicle Accident',
    'incident.incident': 'Injury/Incident',
    'incident.nearMiss': 'Near Miss',
    
    // Status
    'status.draft': 'Draft',
    'status.submitted': 'Submitted',
    'status.underReview': 'Under Review',
    'status.closed': 'Closed',
    
    // Form Builder
    'formBuilder.title': 'Form Builder',
    'formBuilder.subtitle': 'Customize the fields drivers fill out when reporting incidents',
    'formBuilder.addField': 'Add Field',
    'formBuilder.editField': 'Edit Field',
    'formBuilder.fieldKey': 'Field Key',
    'formBuilder.fieldType': 'Field Type',
    'formBuilder.label': 'Label',
    'formBuilder.required': 'Required',
    'formBuilder.save': 'Save Field',
    
    // Users
    'users.title': 'Users',
    'users.subtitle': 'Manage users and their access permissions',
    'users.addUser': 'Add User',
    'users.allRoles': 'All Roles',
    'users.active': 'Active',
    'users.inactive': 'Inactive',
    
    // Roles
    'role.superAdmin': 'Super Admin',
    'role.fleetAdmin': 'Fleet Admin',
    'role.fleetManager': 'Manager',
    'role.fleetViewer': 'Viewer',
    'role.driver': 'Driver',
    
    // Exports
    'exports.title': 'Export Reports',
    'exports.subtitle': 'Export incident reports in various formats for analysis or RMIS integration',
    'exports.format': 'Export Format',
    'exports.selectReports': 'Select Reports',
    'exports.selected': '{count} of {total} selected',
    'exports.export': 'Export {count} Report(s)',
    'exports.rmisIntegration': 'RMIS Integration',
    'exports.rmisDescription': 'Connect to Risk Management Information Systems to automatically push report data.',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your fleet and account settings',
    'settings.fleet': 'Fleet Settings',
    'settings.profile': 'Profile',
    'settings.notifications': 'Notifications',
    'settings.security': 'Security',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.saveChanges': 'Save Changes',
    
    // Theme
    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    
    // Accessibility
    'a11y.skipToContent': 'Skip to main content',
    'a11y.openMenu': 'Open menu',
    'a11y.closeMenu': 'Close menu',
    'a11y.toggleTheme': 'Toggle theme',
    'a11y.selectLanguage': 'Select language',
  },
  
  es: {
    // App
    'app.name': 'FleetGuard Reportador de Accidentes',
    'app.tagline': 'Documente accidentes de forma rápida y precisa',
    
    // Navigation
    'nav.dashboard': 'Panel de Control',
    'nav.reports': 'Reportes',
    'nav.users': 'Usuarios',
    'nav.formBuilder': 'Constructor de Formularios',
    'nav.exports': 'Exportaciones',
    'nav.settings': 'Configuración',
    'nav.signOut': 'Cerrar Sesión',
    
    // Auth
    'auth.signIn': 'Iniciar Sesión',
    'auth.signOut': 'Cerrar Sesión',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.forgotPassword': '¿Olvidó su contraseña?',
    'auth.rememberMe': 'Recordarme',
    'auth.welcome': 'Bienvenido de nuevo',
    'auth.contactAdmin': 'Contacte a su administrador de flota para acceso a la cuenta',
    
    // Dashboard
    'dashboard.title': 'Panel de Control',
    'dashboard.subtitle': 'Resumen de los reportes de incidentes de su flota',
    'dashboard.totalReports': 'Reportes Totales',
    'dashboard.newSubmissions': 'Nuevos Envíos',
    'dashboard.underReview': 'En Revisión',
    'dashboard.closed': 'Cerrados',
    'dashboard.recentReports': 'Reportes Recientes',
    'dashboard.viewAll': 'Ver todos',
    'dashboard.livePhotoFeed': 'Fotos en Vivo',
    'dashboard.noPhotos': 'Sin fotos en vivo aún. Las fotos aparecerán aquí cuando los conductores las capturen.',
    
    // Reports
    'reports.title': 'Reportes',
    'reports.subtitle': 'Ver y gestionar todos los reportes de incidentes',
    'reports.search': 'Buscar reportes...',
    'reports.export': 'Exportar Reportes',
    'reports.noReports': 'No se encontraron reportes',
    'reports.allStatuses': 'Todos los Estados',
    'reports.allTypes': 'Todos los Tipos',
    
    // Incident Types
    'incident.accident': 'Accidente Vehicular',
    'incident.incident': 'Lesión/Incidente',
    'incident.nearMiss': 'Casi Accidente',
    
    // Status
    'status.draft': 'Borrador',
    'status.submitted': 'Enviado',
    'status.underReview': 'En Revisión',
    'status.closed': 'Cerrado',
    
    // Form Builder
    'formBuilder.title': 'Constructor de Formularios',
    'formBuilder.subtitle': 'Personalice los campos que los conductores completan al reportar incidentes',
    'formBuilder.addField': 'Agregar Campo',
    'formBuilder.editField': 'Editar Campo',
    'formBuilder.fieldKey': 'Clave del Campo',
    'formBuilder.fieldType': 'Tipo de Campo',
    'formBuilder.label': 'Etiqueta',
    'formBuilder.required': 'Requerido',
    'formBuilder.save': 'Guardar Campo',
    
    // Users
    'users.title': 'Usuarios',
    'users.subtitle': 'Gestionar usuarios y sus permisos de acceso',
    'users.addUser': 'Agregar Usuario',
    'users.allRoles': 'Todos los Roles',
    'users.active': 'Activo',
    'users.inactive': 'Inactivo',
    
    // Roles
    'role.superAdmin': 'Super Administrador',
    'role.fleetAdmin': 'Administrador de Flota',
    'role.fleetManager': 'Gerente',
    'role.fleetViewer': 'Visor',
    'role.driver': 'Conductor',
    
    // Exports
    'exports.title': 'Exportar Reportes',
    'exports.subtitle': 'Exporte reportes de incidentes en varios formatos para análisis o integración RMIS',
    'exports.format': 'Formato de Exportación',
    'exports.selectReports': 'Seleccionar Reportes',
    'exports.selected': '{count} de {total} seleccionados',
    'exports.export': 'Exportar {count} Reporte(s)',
    'exports.rmisIntegration': 'Integración RMIS',
    'exports.rmisDescription': 'Conecte a Sistemas de Información de Gestión de Riesgos para enviar datos automáticamente.',
    
    // Settings
    'settings.title': 'Configuración',
    'settings.subtitle': 'Gestione la configuración de su flota y cuenta',
    'settings.fleet': 'Configuración de Flota',
    'settings.profile': 'Perfil',
    'settings.notifications': 'Notificaciones',
    'settings.security': 'Seguridad',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.saveChanges': 'Guardar Cambios',
    
    // Theme
    'theme.system': 'Sistema',
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    
    // Common
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.add': 'Agregar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.confirm': 'Confirmar',
    'common.yes': 'Sí',
    'common.no': 'No',
    
    // Accessibility
    'a11y.skipToContent': 'Saltar al contenido principal',
    'a11y.openMenu': 'Abrir menú',
    'a11y.closeMenu': 'Cerrar menú',
    'a11y.toggleTheme': 'Cambiar tema',
    'a11y.selectLanguage': 'Seleccionar idioma',
  },
  
  fr: {
    // App
    'app.name': 'FleetGuard Rapporteur d\'Accidents',
    'app.tagline': 'Documentez les accidents rapidement et avec précision',
    
    // Navigation
    'nav.dashboard': 'Tableau de Bord',
    'nav.reports': 'Rapports',
    'nav.users': 'Utilisateurs',
    'nav.formBuilder': 'Constructeur de Formulaires',
    'nav.exports': 'Exportations',
    'nav.settings': 'Paramètres',
    'nav.signOut': 'Déconnexion',
    
    // Auth
    'auth.signIn': 'Se Connecter',
    'auth.signOut': 'Déconnexion',
    'auth.email': 'Adresse e-mail',
    'auth.password': 'Mot de passe',
    'auth.forgotPassword': 'Mot de passe oublié?',
    'auth.rememberMe': 'Se souvenir de moi',
    'auth.welcome': 'Bon retour',
    'auth.contactAdmin': 'Contactez votre administrateur de flotte pour accéder au compte',
    
    // Dashboard
    'dashboard.title': 'Tableau de Bord',
    'dashboard.subtitle': 'Aperçu des rapports d\'incidents de votre flotte',
    'dashboard.totalReports': 'Rapports Totaux',
    'dashboard.newSubmissions': 'Nouvelles Soumissions',
    'dashboard.underReview': 'En Cours d\'Examen',
    'dashboard.closed': 'Fermés',
    'dashboard.recentReports': 'Rapports Récents',
    'dashboard.viewAll': 'Voir tout',
    'dashboard.livePhotoFeed': 'Photos en Direct',
    'dashboard.noPhotos': 'Pas encore de photos en direct. Les photos apparaîtront ici lorsque les conducteurs les captureront.',
    
    // Reports
    'reports.title': 'Rapports',
    'reports.subtitle': 'Voir et gérer tous les rapports d\'incidents',
    'reports.search': 'Rechercher des rapports...',
    'reports.export': 'Exporter les Rapports',
    'reports.noReports': 'Aucun rapport trouvé',
    'reports.allStatuses': 'Tous les Statuts',
    'reports.allTypes': 'Tous les Types',
    
    // Incident Types
    'incident.accident': 'Accident de Véhicule',
    'incident.incident': 'Blessure/Incident',
    'incident.nearMiss': 'Quasi-Accident',
    
    // Status
    'status.draft': 'Brouillon',
    'status.submitted': 'Soumis',
    'status.underReview': 'En Cours d\'Examen',
    'status.closed': 'Fermé',
    
    // Form Builder
    'formBuilder.title': 'Constructeur de Formulaires',
    'formBuilder.subtitle': 'Personnalisez les champs que les conducteurs remplissent lors de la déclaration d\'incidents',
    'formBuilder.addField': 'Ajouter un Champ',
    'formBuilder.editField': 'Modifier le Champ',
    'formBuilder.fieldKey': 'Clé du Champ',
    'formBuilder.fieldType': 'Type de Champ',
    'formBuilder.label': 'Étiquette',
    'formBuilder.required': 'Requis',
    'formBuilder.save': 'Enregistrer le Champ',
    
    // Users
    'users.title': 'Utilisateurs',
    'users.subtitle': 'Gérer les utilisateurs et leurs autorisations d\'accès',
    'users.addUser': 'Ajouter un Utilisateur',
    'users.allRoles': 'Tous les Rôles',
    'users.active': 'Actif',
    'users.inactive': 'Inactif',
    
    // Roles
    'role.superAdmin': 'Super Administrateur',
    'role.fleetAdmin': 'Administrateur de Flotte',
    'role.fleetManager': 'Gestionnaire',
    'role.fleetViewer': 'Observateur',
    'role.driver': 'Conducteur',
    
    // Exports
    'exports.title': 'Exporter les Rapports',
    'exports.subtitle': 'Exportez les rapports d\'incidents dans différents formats pour l\'analyse ou l\'intégration RMIS',
    'exports.format': 'Format d\'Exportation',
    'exports.selectReports': 'Sélectionner les Rapports',
    'exports.selected': '{count} sur {total} sélectionnés',
    'exports.export': 'Exporter {count} Rapport(s)',
    'exports.rmisIntegration': 'Intégration RMIS',
    'exports.rmisDescription': 'Connectez-vous aux Systèmes d\'Information de Gestion des Risques pour transmettre automatiquement les données.',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.subtitle': 'Gérez les paramètres de votre flotte et de votre compte',
    'settings.fleet': 'Paramètres de Flotte',
    'settings.profile': 'Profil',
    'settings.notifications': 'Notifications',
    'settings.security': 'Sécurité',
    'settings.language': 'Langue',
    'settings.theme': 'Thème',
    'settings.saveChanges': 'Enregistrer les Modifications',
    
    // Theme
    'theme.system': 'Système',
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    
    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.confirm': 'Confirmer',
    'common.yes': 'Oui',
    'common.no': 'Non',
    
    // Accessibility
    'a11y.skipToContent': 'Passer au contenu principal',
    'a11y.openMenu': 'Ouvrir le menu',
    'a11y.closeMenu': 'Fermer le menu',
    'a11y.toggleTheme': 'Changer de thème',
    'a11y.selectLanguage': 'Sélectionner la langue',
  },
};

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'en',
      
      setLanguage: (lang: Language) => {
        set({ language: lang });
        document.documentElement.lang = lang;
      },
      
      t: (key: string, params?: Record<string, string | number>) => {
        const { language } = get();
        let text = translations[language][key] || translations['en'][key] || key;
        
        // Replace parameters like {count}
        if (params) {
          Object.entries(params).forEach(([param, value]) => {
            text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
          });
        }
        
        return text;
      },
    }),
    {
      name: 'fleetguard-language',
    }
  )
);

// Language labels for UI
export const languageLabels: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

// Helper to detect browser language
export function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'es' || browserLang === 'fr') {
    return browserLang as Language;
  }
  return 'en';
}
